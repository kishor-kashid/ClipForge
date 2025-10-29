const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Export video with trim applied
 * @param {Object} params - Export parameters
 * @param {string} params.inputPath - Path to input video file
 * @param {string} params.outputPath - Path to output video file
 * @param {number} params.startTime - Start time in seconds (in-point)
 * @param {number} params.duration - Duration in seconds (out-point - in-point)
 * @param {string} params.resolution - Resolution preset (source, 720p, 1080p, 4k)
 * @param {string} params.quality - Quality preset (fast, medium, high)
 * @param {string} params.format - Format preset (mp4-h264, mp4-h265, webm)
 * @param {Function} onProgress - Progress callback (percent)
 * @returns {Promise<string>} - Path to exported file
 */
function exportVideo(params, onProgress) {
  return new Promise((resolve, reject) => {
    const { inputPath, outputPath, startTime, duration, resolution, quality, format } = params;

    try {
      let command = ffmpeg(inputPath);

      // Apply trim if startTime or duration is specified
      if (startTime !== undefined && startTime > 0) {
        command = command.setStartTime(startTime);
      }

      if (duration !== undefined && duration > 0) {
        command = command.setDuration(duration);
      }

      // Set resolution
      if (resolution && resolution !== 'source') {
        const resolutionMap = {
          '720p': '1280x720',
          '1080p': '1920x1080',
          '4k': '3840x2160'
        };
        const scale = resolutionMap[resolution];
        if (scale) {
          command = command.size(scale);
        }
      }

      // Set quality presets
      const qualityPresets = {
        fast: { preset: 'fast', crf: 28 },
        medium: { preset: 'medium', crf: 23 },
        high: { preset: 'slow', crf: 18 }
      };

      const qualitySettings = qualityPresets[quality] || qualityPresets.medium;

      // Set codec and format based on format preset
      let videoCodec, audioCodec, outputOptions;
      
      switch (format) {
        case 'mp4-h264':
          videoCodec = 'libx264';
          audioCodec = 'aac';
          outputOptions = [`-preset ${qualitySettings.preset}`, `-crf ${qualitySettings.crf}`];
          break;
        case 'mp4-h265':
          videoCodec = 'libx265';
          audioCodec = 'aac';
          outputOptions = [`-preset ${qualitySettings.preset}`, `-crf ${qualitySettings.crf}`];
          break;
        case 'webm':
          videoCodec = 'libvpx-vp9';
          audioCodec = 'libopus';
          outputOptions = [`-crf ${qualitySettings.crf}`, '-b:v 0'];
          break;
        default:
          videoCodec = 'libx264';
          audioCodec = 'aac';
          outputOptions = [`-preset ${qualitySettings.preset}`, `-crf ${qualitySettings.crf}`];
      }

      // Set output format and codec
      command
        .output(outputPath)
        .videoCodec(videoCodec)
        .audioCodec(audioCodec)
        .outputOptions(outputOptions)
        .on('start', (commandLine) => {
          console.log('FFmpeg command: ' + commandLine);
        })
        .on('progress', (progress) => {
          if (onProgress && progress.percent) {
            onProgress(progress.percent);
          }
        })
        .on('end', () => {
          console.log('Export completed successfully');
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err.message);
          reject(new Error(`Export failed: ${err.message}`));
        })
        .run();
    } catch (error) {
      reject(new Error(`FFmpeg setup failed: ${error.message}`));
    }
  });
}

/**
 * Export timeline with multiple tracks
 * @param {Object} params - Export parameters
 * @param {Array} params.tracks - Array of tracks with clips
 * @param {string} params.outputPath - Path to output video file
 * @param {Object} params.videos - Object mapping video paths to video objects
 * @param {Function} onProgress - Progress callback (percent)
 * @returns {Promise<string>} - Path to exported file
 */
function exportTimeline(params, onProgress) {
  return new Promise(async (resolve, reject) => {
    const { tracks, outputPath, videos } = params;

    try {
      // Collect all clips from all tracks sorted by start time
      const allClips = [];
      tracks.forEach((track) => {
        track.clips.forEach((clip) => {
          const video = videos[clip.videoPath];
          if (video) {
            allClips.push({
              ...clip,
              video,
              trackId: track.id,
            });
          }
        });
      });

      // Sort clips by start time
      allClips.sort((a, b) => a.startTime - b.startTime);

      if (allClips.length === 0) {
        return reject(new Error('No clips to export'));
      }

      // ULTRA-SIMPLE APPROACH - No filters, no complex operations
      // Just concatenate the clips directly using FFmpeg's most basic method
      
      if (allClips.length === 1) {
        // Single clip - use basic FFmpeg without any filter operations
        const clip = allClips[0];
        const inputPath = clip.video.originalPath || clip.video.path;
        
        let command = ffmpeg(inputPath);
        
        // Apply trim points using input options (no filters)
        if (clip.inPoint && clip.inPoint > 0) {
          command = command.inputOptions([`-ss ${clip.inPoint}`]);
        }
        if (clip.outPoint) {
          const duration = clip.outPoint - (clip.inPoint || 0);
          command = command.inputOptions([`-t ${duration}`]);
        } else if (clip.duration) {
          command = command.inputOptions([`-t ${clip.duration}`]);
        }
        
        command = command
          .videoCodec('libx264')
          .audioCodec('aac')
          .outputOptions(['-preset ultrafast', '-crf 23'])
          .output(outputPath);

        // Handle single clip
        command
          .on('start', (commandLine) => {
            console.log('FFmpeg timeline export command: ' + commandLine);
          })
          .on('progress', (progress) => {
            if (onProgress && progress.percent) {
              onProgress(progress.percent);
            }
          })
          .on('end', () => {
            console.log('Timeline export completed successfully');
            resolve(outputPath);
          })
          .on('error', (err) => {
            console.error('FFmpeg timeline export error:', err.message);
            reject(new Error(`Timeline export failed: ${err.message}`));
          })
          .run();
      } else {
        // Multiple clips - use the most reliable concatenation method
        // Create a simple concat file list
        const concatFile = path.join(path.dirname(outputPath), 'concat_list.txt');
        const concatLines = [];
        const tempFiles = [];

        // PARALLEL PROCESSING - Process all clips simultaneously for maximum speed
        const clipPromises = allClips.map(async (clip, i) => {
          const inputPath = clip.video.originalPath || clip.video.path;
          const tempFile = path.join(path.dirname(outputPath), `temp_clip_${i}.mp4`);
          tempFiles.push(tempFile);

          let clipCommand = ffmpeg(inputPath);

          // Apply trim points using input options (NO FILTERS - same reliable approach)
          if (clip.inPoint && clip.inPoint > 0) {
            clipCommand = clipCommand.inputOptions([`-ss ${clip.inPoint}`]);
          }
          if (clip.outPoint) {
            const duration = clip.outPoint - (clip.inPoint || 0);
            clipCommand = clipCommand.inputOptions([`-t ${duration}`]);
          } else if (clip.duration) {
            clipCommand = clipCommand.inputOptions([`-t ${clip.duration}`]);
          }

          // Normalize to consistent format (same as before)
          clipCommand = clipCommand
            .videoCodec('libx264')
            .audioCodec('aac')
            .outputOptions(['-preset ultrafast', '-crf 23'])
            .size('1280x720')
            .output(tempFile);

          // Process this clip
          await new Promise((resolve, reject) => {
            clipCommand
              .on('end', () => resolve())
              .on('error', (err) => reject(err))
              .run();
          });

          concatLines.push(`file '${tempFile.replace(/\\/g, '/')}'`);
        });

        // Wait for ALL clips to finish processing in parallel
        console.log(`Processing ${allClips.length} clips in parallel...`);
        await Promise.all(clipPromises);
        console.log('All clips processed successfully!');

        // Write concat file
        fs.writeFileSync(concatFile, concatLines.join('\n'));

        // Use concat demuxer - most reliable concatenation method
        const command = ffmpeg()
          .input(concatFile)
          .inputOptions(['-f', 'concat', '-safe', '0'])
          .videoCodec('copy')
          .audioCodec('copy')
          .output(outputPath);

        // Clean up function
        const cleanup = () => {
          tempFiles.forEach(tempFile => {
            try {
              if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
              }
            } catch (error) {
              console.warn('Failed to delete temp file:', tempFile, error.message);
            }
          });
          
          try {
            if (fs.existsSync(concatFile)) {
              fs.unlinkSync(concatFile);
            }
          } catch (error) {
            console.warn('Failed to delete concat file:', concatFile, error.message);
          }
        };

        command
          .on('start', (commandLine) => {
            console.log('FFmpeg timeline export command: ' + commandLine);
          })
          .on('progress', (progress) => {
            if (onProgress && progress.percent) {
              onProgress(progress.percent);
            }
          })
          .on('end', () => {
            console.log('Timeline export completed successfully');
            cleanup();
            resolve(outputPath);
          })
          .on('error', (err) => {
            console.error('FFmpeg timeline export error:', err.message);
            cleanup();
            reject(new Error(`Timeline export failed: ${err.message}`));
          })
          .run();
        
        return; // Exit early for multi-clip case
      }
    } catch (error) {
      reject(new Error(`FFmpeg timeline export setup failed: ${error.message}`));
    }
  });
}

module.exports = {
  exportVideo,
  exportTimeline,
};


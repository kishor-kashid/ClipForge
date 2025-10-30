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
    const { inputPath, outputPath, startTime, duration, resolution, quality, format, playbackSpeed } = params;

    try {
      let command = ffmpeg(inputPath);

      // Apply trim if startTime or duration is specified
      if (startTime !== undefined && startTime > 0) {
        command = command.setStartTime(startTime);
      }

      if (duration !== undefined && duration > 0) {
        command = command.setDuration(duration);
      }

      // Apply playback speed if specified (and not 1.0)
      const speed = playbackSpeed || 1.0;
      let videoFilter = null;
      let audioFilter = null;
      
      if (speed !== 1.0) {
        // Video speed: setpts=PTS/speed (faster = smaller PTS value)
        videoFilter = `setpts=${1.0 / speed}*PTS`;
        
        // Audio speed: atempo (supports 0.5 to 2.0, chain multiple for speeds > 2.0)
        if (speed > 2.0) {
          // Chain two atempo filters for speeds > 2.0
          audioFilter = `atempo=2.0,atempo=${speed / 2.0}`;
        } else if (speed < 0.5) {
          // Chain two atempo filters for speeds < 0.5
          audioFilter = `atempo=0.5,atempo=${speed / 0.5}`;
        } else {
          audioFilter = `atempo=${speed}`;
        }
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
          // Combine speed filter with scale if both are needed
          if (videoFilter) {
            videoFilter = `${videoFilter},scale=${scale}`;
          } else {
            command = command.size(scale);
          }
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

      // Build filter complex if speed is applied
      if (videoFilter || audioFilter) {
        let filterComplex = '';
        
        if (videoFilter && audioFilter) {
          // Both video and audio filters
          filterComplex = `[0:v]${videoFilter}[v];[0:a]${audioFilter}[a]`;
          command = command
            .complexFilter(filterComplex)
            .outputOptions(['-map', '[v]', '-map', '[a]']);
        } else if (videoFilter) {
          // Only video filter
          filterComplex = `[0:v]${videoFilter}[v]`;
          command = command
            .complexFilter(filterComplex)
            .outputOptions(['-map', '[v]', '-map', '0:a']);
        } else if (audioFilter) {
          // Only audio filter
          filterComplex = `[0:a]${audioFilter}[a]`;
          command = command
            .complexFilter(filterComplex)
            .outputOptions(['-map', '0:v', '-map', '[a]']);
        }
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
    const { tracks, outputPath, videos, getPlaybackSpeed } = params;

    try {
      // Collect all clips from all tracks sorted by start time
      const allClips = [];
      tracks.forEach((track) => {
        track.clips.forEach((clip) => {
          const video = videos[clip.videoPath];
          if (video) {
            // Get playback speed for this clip (stored in video's trim points)
            const playbackSpeed = getPlaybackSpeed ? getPlaybackSpeed(clip.videoPath) : 1.0;
            
            allClips.push({
              ...clip,
              video,
              trackId: track.id,
              playbackSpeed: playbackSpeed,
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
        // Single clip - use basic FFmpeg
        const clip = allClips[0];
        const inputPath = clip.video.originalPath || clip.video.path;
        
        let command = ffmpeg(inputPath);
        
        // Apply trim points using input options
        if (clip.inPoint && clip.inPoint > 0) {
          command = command.inputOptions([`-ss ${clip.inPoint}`]);
        }
        if (clip.outPoint) {
          const duration = clip.outPoint - (clip.inPoint || 0);
          command = command.inputOptions([`-t ${duration}`]);
        } else if (clip.duration) {
          command = command.inputOptions([`-t ${clip.duration}`]);
        }
        
        // Apply playback speed if specified
        const speed = clip.playbackSpeed || 1.0;
        let videoFilter = null;
        let audioFilter = null;
        
        if (speed !== 1.0) {
          videoFilter = `setpts=${1.0 / speed}*PTS`;
          if (speed > 2.0) {
            audioFilter = `atempo=2.0,atempo=${speed / 2.0}`;
          } else if (speed < 0.5) {
            audioFilter = `atempo=0.5,atempo=${speed / 0.5}`;
          } else {
            audioFilter = `atempo=${speed}`;
          }
        }
        
        // Build filter complex if speed is applied
        if (videoFilter || audioFilter) {
          let filterComplex = '';
          if (videoFilter && audioFilter) {
            filterComplex = `[0:v]${videoFilter}[v];[0:a]${audioFilter}[a]`;
            command = command
              .complexFilter(filterComplex)
              .outputOptions(['-map', '[v]', '-map', '[a]']);
          } else if (videoFilter) {
            filterComplex = `[0:v]${videoFilter}[v]`;
            command = command
              .complexFilter(filterComplex)
              .outputOptions(['-map', '[v]', '-map', '0:a']);
          } else if (audioFilter) {
            filterComplex = `[0:a]${audioFilter}[a]`;
            command = command
              .complexFilter(filterComplex)
              .outputOptions(['-map', '0:v', '-map', '[a]']);
          }
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

          // Apply trim points using input options
          if (clip.inPoint && clip.inPoint > 0) {
            clipCommand = clipCommand.inputOptions([`-ss ${clip.inPoint}`]);
          }
          if (clip.outPoint) {
            const duration = clip.outPoint - (clip.inPoint || 0);
            clipCommand = clipCommand.inputOptions([`-t ${duration}`]);
          } else if (clip.duration) {
            clipCommand = clipCommand.inputOptions([`-t ${clip.duration}`]);
          }

          // Apply playback speed if specified
          const speed = clip.playbackSpeed || 1.0;
          let videoFilter = null;
          let audioFilter = null;
          
          if (speed !== 1.0) {
            videoFilter = `setpts=${1.0 / speed}*PTS`;
            if (speed > 2.0) {
              audioFilter = `atempo=2.0,atempo=${speed / 2.0}`;
            } else if (speed < 0.5) {
              audioFilter = `atempo=0.5,atempo=${speed / 0.5}`;
            } else {
              audioFilter = `atempo=${speed}`;
            }
          }
          
          // Build filter complex if speed is applied
          if (videoFilter || audioFilter) {
            let filterComplex = '';
            if (videoFilter && audioFilter) {
              filterComplex = `[0:v]${videoFilter},scale=1280x720[v];[0:a]${audioFilter}[a]`;
              clipCommand = clipCommand
                .complexFilter(filterComplex)
                .outputOptions(['-map', '[v]', '-map', '[a]']);
            } else if (videoFilter) {
              filterComplex = `[0:v]${videoFilter},scale=1280x720[v]`;
              clipCommand = clipCommand
                .complexFilter(filterComplex)
                .outputOptions(['-map', '[v]', '-map', '0:a']);
            } else if (audioFilter) {
              filterComplex = `[0:a]${audioFilter}[a]`;
              clipCommand = clipCommand
                .complexFilter(filterComplex)
                .outputOptions(['-map', '0:v', '-map', '[a]'])
                .size('1280x720');
            }
          } else {
            // No speed filter, use size method directly
            clipCommand = clipCommand.size('1280x720');
          }

          // Normalize to consistent format
          clipCommand = clipCommand
            .videoCodec('libx264')
            .audioCodec('aac')
            .outputOptions(['-preset ultrafast', '-crf 23'])
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


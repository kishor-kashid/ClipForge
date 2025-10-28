const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Export video with trim applied
 * @param {Object} params - Export parameters
 * @param {string} params.inputPath - Path to input video file
 * @param {string} params.outputPath - Path to output video file
 * @param {number} params.startTime - Start time in seconds (in-point)
 * @param {number} params.duration - Duration in seconds (out-point - in-point)
 * @param {Function} onProgress - Progress callback (percent)
 * @returns {Promise<string>} - Path to exported file
 */
function exportVideo(params, onProgress) {
  return new Promise((resolve, reject) => {
    const { inputPath, outputPath, startTime, duration } = params;

    try {
      let command = ffmpeg(inputPath);

      // Apply trim if startTime or duration is specified
      if (startTime !== undefined && startTime > 0) {
        command = command.setStartTime(startTime);
      }

      if (duration !== undefined && duration > 0) {
        command = command.setDuration(duration);
      }

      // Set output format and codec
      command
        .output(outputPath)
        .videoCodec('libx264') // H.264 codec
        .audioCodec('aac')
        .outputOptions(['-preset fast', '-crf 23']) // Good quality balance
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
  return new Promise((resolve, reject) => {
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

      // For now, concatenate clips sequentially
      // TODO: Implement proper track overlaying/compositing for overlapping clips
      let command = ffmpeg();

      // Add all input files
      allClips.forEach((clip) => {
        const inputPath = clip.video.originalPath || clip.video.path;
        command = command.input(inputPath);
        
        // Apply trim points if specified
        if (clip.inPoint && clip.inPoint > 0) {
          command = command.inputOptions([`-ss ${clip.inPoint}`]);
        }
        if (clip.outPoint) {
          const duration = clip.outPoint - (clip.inPoint || 0);
          command = command.inputOptions([`-t ${duration}`]);
        } else if (clip.duration) {
          command = command.inputOptions([`-t ${clip.duration}`]);
        }
      });

      // Create filter complex for concatenation
      const filterInputs = allClips.map((_, i) => `[${i}:v][${i}:a]`).join('');
      const concatFilter = `${filterInputs}concat=n=${allClips.length}:v=1:a=1[outv][outa]`;

      command
        .complexFilter(concatFilter)
        .outputOptions(['-map [outv]', '-map [outa]'])
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions(['-preset fast', '-crf 23'])
        .output(outputPath)
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
    } catch (error) {
      reject(new Error(`FFmpeg timeline export setup failed: ${error.message}`));
    }
  });
}

module.exports = {
  exportVideo,
  exportTimeline,
};


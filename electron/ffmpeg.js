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

module.exports = {
  exportVideo,
};


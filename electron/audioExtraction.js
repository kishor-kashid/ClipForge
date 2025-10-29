const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Extract audio track from video file
 * @param {string} videoPath - Path to input video file
 * @param {string} outputFormat - Output audio format ('mp3' or 'wav')
 * @returns {Promise<string>} - Path to extracted audio file
 */
async function extractAudio(videoPath, outputFormat = 'mp3') {
  return new Promise((resolve, reject) => {
    // Create temporary output file in system temp directory
    const tempDir = os.tmpdir();
    const tempFileName = `clipforge-audio-${Date.now()}.${outputFormat}`;
    const outputPath = path.join(tempDir, tempFileName);

    // Extract audio using FFmpeg
    ffmpeg(videoPath)
      .noVideo() // Remove video stream
      .audioCodec(outputFormat === 'mp3' ? 'libmp3lame' : 'pcm_s16le') // Use appropriate codec
      .audioBitrate('128k') // Set bitrate
      .on('start', (commandLine) => {
        console.log('Extracting audio:', commandLine);
      })
      .on('error', (err, stdout, stderr) => {
        console.error('Audio extraction error:', err);
        console.error('FFmpeg stderr:', stderr);
        
        // Check if error is due to no audio track
        if (err.message.includes('no audio stream') || stderr.includes('no audio stream')) {
          reject(new Error('Video file has no audio track'));
        } else {
          reject(err);
        }
      })
      .on('end', () => {
        console.log('Audio extraction completed:', outputPath);
        resolve(outputPath);
      })
      .save(outputPath);
  });
}

/**
 * Clean up temporary audio file
 * @param {string} audioPath - Path to audio file to delete
 */
async function cleanupAudio(audioPath) {
  try {
    if (audioPath && audioPath.includes('clipforge-audio-')) {
      await fs.unlink(audioPath);
      console.log('Cleaned up temporary audio file:', audioPath);
    }
  } catch (error) {
    console.warn('Error cleaning up audio file:', error.message);
    // Don't throw - cleanup errors shouldn't break the flow
  }
}

module.exports = {
  extractAudio,
  cleanupAudio
};


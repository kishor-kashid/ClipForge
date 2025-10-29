const openai = require('./openaiClient');
const { extractAudio, cleanupAudio } = require('./audioExtraction');
const fs = require('fs');
const path = require('path');

/**
 * Transcribe video using OpenAI Whisper API
 * @param {string} videoPath - Path to video file
 * @returns {Promise<Object>} - Transcript data with segments and full text
 */
async function transcribeVideo(videoPath) {
  // Check if OpenAI client is available
  if (!openai) {
    throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file.');
  }

  let audioPath = null;

  try {
    // Step 1: Extract audio from video
    console.log('Extracting audio from video:', videoPath);
    audioPath = await extractAudio(videoPath, 'mp3');

    // Check file size (Whisper has 25MB limit)
    const stats = await fs.promises.stat(audioPath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    if (fileSizeMB > 25) {
      throw new Error(`Audio file is too large (${fileSizeMB.toFixed(2)}MB). Whisper API has a 25MB limit.`);
    }

    // Step 2: Send audio to Whisper API
    console.log('Sending audio to Whisper API...');
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: 'whisper-1',
      response_format: 'verbose_json' // Get timestamps
      // language omitted for auto-detect (don't pass null)
    });

    // Step 3: Process response and structure data
    const transcriptData = {
      segments: transcription.segments || [],
      fullText: transcription.text || '',
      duration: transcription.duration || 0,
      language: transcription.language || 'unknown',
      generatedAt: new Date().toISOString()
    };

    console.log('Transcription completed. Segments:', transcriptData.segments.length);

    return transcriptData;

  } catch (error) {
    console.error('Transcription error:', error);
    
    // Handle specific OpenAI API errors
    if (error.response) {
      const status = error.response.status;
      const statusText = error.response.statusText;
      
      if (status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY in .env file.');
      } else if (status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      } else if (status === 413) {
        throw new Error('Audio file is too large for Whisper API (25MB limit).');
      } else {
        throw new Error(`OpenAI API error: ${statusText} (${status})`);
      }
    }
    
    // Re-throw original error if not an API error
    throw error;

  } finally {
    // Step 4: Cleanup temporary audio file
    if (audioPath) {
      await cleanupAudio(audioPath);
    }
  }
}

module.exports = {
  transcribeVideo
};


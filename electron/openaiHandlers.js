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
    audioPath = await extractAudio(videoPath, 'mp3');

    // Check file size (Whisper has 25MB limit)
    const stats = await fs.promises.stat(audioPath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    if (fileSizeMB > 25) {
      throw new Error(`Audio file is too large (${fileSizeMB.toFixed(2)}MB). Whisper API has a 25MB limit.`);
    }

    // Step 2: Send audio to Whisper API
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

/**
 * Generate content summary from transcript using OpenAI GPT
 * @param {string} transcriptText - Full transcript text
 * @returns {Promise<Object>} - Summary data with short, detailed, and key topics
 */
async function generateSummary(transcriptText) {
  // Check if OpenAI client is available
  if (!openai) {
    throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file.');
  }

  if (!transcriptText || transcriptText.trim().length === 0) {
    throw new Error('Transcript text is required for summary generation');
  }

  try {
    // Use GPT to generate comprehensive summary
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use efficient model for summarization
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that creates concise, accurate summaries of video transcripts. Generate summaries that capture the main content, key topics, and important information.`
        },
        {
          role: 'user',
          content: `Please analyze this video transcript and provide:
1. A short summary (1-2 sentences)
2. A detailed summary (2-3 paragraphs)
3. Key topics (bullet points of main themes)

Transcript:
${transcriptText}

Format your response as JSON with the following structure:
{
  "short": "1-2 sentence summary",
  "detailed": "2-3 paragraph detailed summary",
  "keyTopics": ["topic 1", "topic 2", "topic 3"]
}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    // Extract summary from response
    const content = response.choices[0]?.message?.content || '';
    
    // Try to parse as JSON (GPT should return JSON but might have markdown)
    let summaryData;
    try {
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                       content.match(/(\{[\s\S]*\})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      summaryData = JSON.parse(jsonStr);
    } catch (parseError) {
      // If JSON parsing fails, create structured response from text
      console.warn('Failed to parse JSON, creating structured response from text');
      const lines = content.split('\n').filter(l => l.trim());
      summaryData = {
        short: lines.find(l => l.toLowerCase().includes('short') || lines[0])?.replace(/.*?:/, '').trim() || 'Summary generated',
        detailed: lines.join('\n\n'),
        keyTopics: lines.filter(l => l.startsWith('-') || l.startsWith('•')).map(l => l.replace(/^[-•]\s*/, '').trim()).slice(0, 5)
      };
    }

    // Ensure all fields exist
    const summary = {
      short: summaryData.short || 'Summary generated successfully',
      detailed: summaryData.detailed || content,
      keyTopics: Array.isArray(summaryData.keyTopics) ? summaryData.keyTopics : 
                 (summaryData.keyTopics ? [summaryData.keyTopics] : []),
      generatedAt: new Date().toISOString()
    };

    return summary;

  } catch (error) {
    console.error('Summary generation error:', error);
    
    // Handle specific OpenAI API errors
    if (error.response) {
      const status = error.response.status;
      const statusText = error.response.statusText;
      
      if (status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY in .env file.');
      } else if (status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`OpenAI API error: ${statusText} (${status})`);
      }
    }
    
    // Re-throw original error if not an API error
    throw error;
  }
}

module.exports = {
  transcribeVideo,
  generateSummary
};


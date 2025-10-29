const { OpenAI } = require('openai');

// Get API key from environment variable
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn('OPENAI_API_KEY is not set in environment variables. Transcription features will not work.');
}

// Initialize OpenAI client (will throw error if used without API key)
let openaiClient = null;

if (apiKey) {
  try {
    openaiClient = new OpenAI({
      apiKey: apiKey
    });
    console.log('OpenAI client initialized successfully');
  } catch (error) {
    console.error('Error initializing OpenAI client:', error);
  }
}

// Export client instance or null if not configured
module.exports = openaiClient;


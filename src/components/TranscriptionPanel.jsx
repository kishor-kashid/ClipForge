import React, { useState } from 'react';
import { useVideoStore } from '../store/videoStore';
import { formatTime } from '../utils/timeUtils';
import { useToast } from './ToastProvider';

export default function TranscriptionPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const {
    selectedVideo,
    videos,
    setTranscript,
    getTranscript,
    clearTranscript,
    setTranscriptGenerating,
  } = useVideoStore();
  const { addToast } = useToast();

  const selectedVideoObject = videos.find((v) => v.path === selectedVideo);
  const transcript = selectedVideoObject?.transcript;
  const isGenerating = transcript?.isGenerating || false;
  const hasTranscript = transcript && transcript.fullText && transcript.segments.length > 0;

  const handleGenerateTranscript = async () => {
    if (!selectedVideo) {
      addToast('Please select a video first', 'error');
      return;
    }

    if (!window.electronAPI?.aiTranscribe) {
      addToast('Transcription API not available', 'error');
      return;
    }

    try {
      // Set generating state
      setTranscriptGenerating(selectedVideo, true);
      addToast('Starting transcription...', 'info');

      // Call transcription API
      const result = await window.electronAPI.aiTranscribe(selectedVideo);

      if (result.success && result.transcript) {
        // Store transcript in videoStore
        setTranscript(selectedVideo, result.transcript);
        addToast('Transcript generated successfully!', 'success');
      } else {
        // Handle error
        const errorMessage = result.error || 'Failed to generate transcript';
        setTranscriptGenerating(selectedVideo, false);
        addToast(errorMessage, 'error');

        // Provide helpful error messages
        if (errorMessage.includes('API key')) {
          addToast('Please configure OPENAI_API_KEY in your .env file', 'error');
        } else if (errorMessage.includes('no audio track')) {
          addToast('Video has no audio track', 'error');
        } else if (errorMessage.includes('too large')) {
          addToast('Audio file is too large for transcription', 'error');
        }
      }
    } catch (error) {
      console.error('Transcription error:', error);
      setTranscriptGenerating(selectedVideo, false);
      addToast(error.message || 'Failed to generate transcript', 'error');
    }
  };

  const handleRegenerateTranscript = async () => {
    // Clear existing transcript and regenerate
    clearTranscript(selectedVideo);
    await handleGenerateTranscript();
  };

  const handleCopyTranscript = () => {
    if (!transcript?.fullText) {
      addToast('No transcript to copy', 'error');
      return;
    }

    navigator.clipboard.writeText(transcript.fullText).then(() => {
      addToast('Transcript copied to clipboard', 'success');
    }).catch(() => {
      addToast('Failed to copy transcript', 'error');
    });
  };

  return (
    <div className="bg-[#252525] rounded-lg border border-[#404040] overflow-hidden">
      {/* Transcription Panel Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-[#2d2d2d] hover:bg-[#333] transition-colors flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-[#4a9eff]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
          <span className="text-white font-semibold">Transcription</span>
        </div>
        <svg 
          className={`w-5 h-5 text-[#b3b3b3] transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      
      {/* Transcription Panel Content */}
      {isOpen && (
        <div className="p-4">
          {!selectedVideo ? (
            <p className="text-gray-400 text-sm">Select a video to generate a transcript</p>
          ) : (
            <>
              {/* Header with Copy Button */}
              <div className="flex items-center justify-between mb-4">
                {hasTranscript && (
                  <button
                    onClick={handleCopyTranscript}
                    className="px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                  >
                    Copy Text
                  </button>
                )}
              </div>

              {/* Status and Actions */}
              <div className="mb-4 space-y-2">
                {!hasTranscript && !isGenerating && (
                  <button
                    onClick={handleGenerateTranscript}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Generate Transcript
                  </button>
                )}

                {hasTranscript && !isGenerating && (
                  <button
                    onClick={handleRegenerateTranscript}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                  >
                    Regenerate Transcript
                  </button>
                )}

                {isGenerating && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-400">Generating transcript...</span>
                  </div>
                )}
              </div>

              {/* Error State */}
              {transcript && !hasTranscript && !isGenerating && transcript.error && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-300 text-sm">
                  {transcript.error}
                </div>
              )}

              {/* Transcript Display */}
              {hasTranscript && (
                <div className="space-y-4">
                  {/* Metadata */}
                  <div className="text-sm text-gray-400">
                    {transcript.segments.length} segments • {formatTime(transcript.duration)} duration
                    {transcript.generatedAt && (
                      <span className="ml-2">
                        • Generated {new Date(transcript.generatedAt).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Full Transcript Text */}
                  <div className="bg-gray-900 rounded p-3 max-h-60 overflow-y-auto">
                    <p className="text-white text-sm whitespace-pre-wrap">{transcript.fullText}</p>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!hasTranscript && !isGenerating && !transcript?.error && (
                <p className="text-gray-400 text-sm text-center py-4">
                  Click "Generate Transcript" to transcribe the audio from this video
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}


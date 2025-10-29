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
    <div className="bg-[#252525] rounded-lg border border-[#404040] overflow-hidden shadow-lg shadow-black/20">
      {/* Transcription Panel Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-3.5 bg-[#2d2d2d] hover:bg-[#333] transition-colors flex items-center justify-between text-left border-b border-[#404040]"
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-[#4a9eff]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
          <span className="text-white font-semibold text-sm">Transcription</span>
        </div>
        <svg 
          className={`w-5 h-5 text-[#b3b3b3] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      
      {/* Transcription Panel Content */}
      {isOpen && (
        <div className="p-5 space-y-4">
          {!selectedVideo ? (
            <p className="text-[#b3b3b3] text-sm text-center py-4">Select a video to generate a transcript</p>
          ) : (
            <>
              {/* Status and Actions */}
              <div className="space-y-3">
                {!hasTranscript && !isGenerating && (
                  <button
                    onClick={handleGenerateTranscript}
                    className="btn btn-primary w-full"
                  >
                    Generate Transcript
                  </button>
                )}

                {hasTranscript && !isGenerating && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyTranscript}
                      className="btn btn-secondary flex-1"
                    >
                      Copy Text
                    </button>
                    <button
                      onClick={handleRegenerateTranscript}
                      className="btn btn-secondary flex-1"
                    >
                      Regenerate
                    </button>
                  </div>
                )}

                {isGenerating && (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#4a9eff] border-t-transparent"></div>
                    <span className="ml-3 text-[#b3b3b3] text-sm">Generating transcript...</span>
                  </div>
                )}
              </div>

              {/* Error State */}
              {transcript && !hasTranscript && !isGenerating && transcript.error && (
                <div className="p-4 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg text-[#ef4444] text-sm">
                  {transcript.error}
                </div>
              )}

              {/* Transcript Display */}
              {hasTranscript && (
                <div className="space-y-3">
                  {/* Metadata */}
                  <div className="text-xs text-[#888888] flex items-center gap-2">
                    <span>{transcript.segments.length} segments</span>
                    <span>•</span>
                    <span>{formatTime(transcript.duration)} duration</span>
                    {transcript.generatedAt && (
                      <>
                        <span>•</span>
                        <span>Generated {new Date(transcript.generatedAt).toLocaleString()}</span>
                      </>
                    )}
                  </div>

                  {/* Full Transcript Text */}
                  <div className="bg-[#1a1a1a] rounded-lg p-4 max-h-64 overflow-y-auto border border-[#404040]">
                    <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">{transcript.fullText}</p>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!hasTranscript && !isGenerating && !transcript?.error && (
                <p className="text-[#b3b3b3] text-sm text-center py-6">
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


import React, { useState, useEffect } from 'react';
import { useVideoStore } from '../store/videoStore';
import { formatTime } from '../utils/timeUtils';
import { useToast } from './ToastProvider';

export default function TranscriptionPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeView, setActiveView] = useState('transcript'); // Tab state: 'transcript' or 'summary'
  const {
    selectedVideo,
    videos,
    setTranscript,
    getTranscript,
    clearTranscript,
    setTranscriptGenerating,
    setSummary,
    getSummary,
    setSummaryGenerating,
  } = useVideoStore();
  const { addToast } = useToast();

  const selectedVideoObject = videos.find((v) => v.path === selectedVideo);
  const transcript = selectedVideoObject?.transcript;
  const summary = selectedVideoObject?.summary;
  const isGenerating = transcript?.isGenerating || false;
  const isGeneratingSummary = summary?.isGenerating || false;
  const hasTranscript = transcript && transcript.fullText && transcript.segments.length > 0;
  const hasSummary = summary && summary.short && !isGeneratingSummary;

  // Reset to transcript view when video changes
  useEffect(() => {
    setActiveView('transcript');
  }, [selectedVideo]);

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

  const handleGenerateSummary = async () => {
    if (!selectedVideo) {
      addToast('Please select a video first', 'error');
      return;
    }

    if (!hasTranscript) {
      addToast('Please generate a transcript first', 'error');
      return;
    }

    if (!window.electronAPI?.aiSummarize) {
      addToast('Summarization API not available', 'error');
      return;
    }

    try {
      // Set generating state
      setSummaryGenerating(selectedVideo, true);
      addToast('Generating summary...', 'info');

      // Get transcript text
      const transcriptText = transcript.fullText;

      // Call summarization API
      const result = await window.electronAPI.aiSummarize(transcriptText);

      if (result.success && result.summary) {
        // Store summary in videoStore
        setSummary(selectedVideo, result.summary);
        // Auto-switch to summary view when generated
        setActiveView('summary');
        addToast('Summary generated successfully!', 'success');
      } else {
        // Handle error
        const errorMessage = result.error || 'Failed to generate summary';
        setSummaryGenerating(selectedVideo, false);
        addToast(errorMessage, 'error');

        // Provide helpful error messages
        if (errorMessage.includes('API key')) {
          addToast('Please configure OPENAI_API_KEY in your .env file', 'error');
        }
      }
    } catch (error) {
      console.error('Summarization error:', error);
      setSummaryGenerating(selectedVideo, false);
      addToast(error.message || 'Failed to generate summary', 'error');
    }
  };

  const handleCopySummary = (type = 'short') => {
    if (!summary) {
      addToast('No summary to copy', 'error');
      return;
    }

    let textToCopy = '';
    if (type === 'short') {
      textToCopy = summary.short || '';
    } else if (type === 'detailed') {
      textToCopy = summary.detailed || '';
    } else {
      // Copy all
      textToCopy = `Short Summary:\n${summary.short}\n\nDetailed Summary:\n${summary.detailed}\n\nKey Topics:\n${summary.keyTopics?.join('\n') || ''}`;
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
      addToast(`${type === 'all' ? 'Full summary' : type === 'detailed' ? 'Detailed summary' : 'Short summary'} copied to clipboard`, 'success');
    }).catch(() => {
      addToast('Failed to copy summary', 'error');
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
                      onClick={handleGenerateSummary}
                      className="btn btn-primary flex-1"
                      disabled={isGeneratingSummary}
                    >
                      {isGeneratingSummary ? 'Generating...' : hasSummary ? 'Regenerate Summary' : 'Generate Summary'}
                    </button>
                  </div>
                )}

                {(isGenerating || isGeneratingSummary) && (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#4a9eff] border-t-transparent"></div>
                    <span className="ml-3 text-[#b3b3b3] text-sm">
                      {isGenerating ? 'Generating transcript...' : 'Generating summary...'}
                    </span>
                  </div>
                )}
              </div>

              {/* Error State */}
              {transcript && !hasTranscript && !isGenerating && transcript.error && (
                <div className="p-4 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-lg text-[#ef4444] text-sm">
                  {transcript.error}
                </div>
              )}

              {/* Tab Navigation - Show when both transcript and summary exist */}
              {hasTranscript && hasSummary && (
                <div className="flex gap-2 border-b border-[#404040] -mx-5 px-5">
                  <button
                    onClick={() => setActiveView('transcript')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                      activeView === 'transcript'
                        ? 'border-[#4a9eff] text-[#4a9eff]'
                        : 'border-transparent text-[#888888] hover:text-[#b3b3b3]'
                    }`}
                  >
                    Transcript
                  </button>
                  <button
                    onClick={() => setActiveView('summary')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                      activeView === 'summary'
                        ? 'border-[#4a9eff] text-[#4a9eff]'
                        : 'border-transparent text-[#888888] hover:text-[#b3b3b3]'
                    }`}
                  >
                    Summary
                  </button>
                </div>
              )}

              {/* Summary Display - Only show when activeView is 'summary' */}
              {hasSummary && activeView === 'summary' && (
                <div className="space-y-4">
                  {/* Short Summary */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-[#888888] font-semibold uppercase tracking-wide">Summary</label>
                      <button
                        onClick={handleCopySummary.bind(null, 'short')}
                        className="text-xs text-[#4a9eff] hover:text-[#6bb6ff] transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#404040]">
                      <p className="text-white text-sm leading-relaxed">{summary.short}</p>
                    </div>
                  </div>

                  {/* Detailed Summary */}
                  {summary.detailed && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs text-[#888888] font-semibold uppercase tracking-wide">Detailed</label>
                        <button
                          onClick={handleCopySummary.bind(null, 'detailed')}
                          className="text-xs text-[#4a9eff] hover:text-[#6bb6ff] transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                      <div className="bg-[#1a1a1a] rounded-lg p-3 max-h-48 overflow-y-auto border border-[#404040]">
                        <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">{summary.detailed}</p>
                      </div>
                    </div>
                  )}

                  {/* Key Topics */}
                  {summary.keyTopics && summary.keyTopics.length > 0 && (
                    <div>
                      <label className="text-xs text-[#888888] font-semibold uppercase tracking-wide mb-2 block">Key Topics</label>
                      <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#404040]">
                        <ul className="space-y-1">
                          {summary.keyTopics.map((topic, index) => (
                            <li key={index} className="text-white text-sm flex items-start gap-2">
                              <span className="text-[#4a9eff] mt-1">•</span>
                              <span>{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Transcript Display - Only show when activeView is 'transcript' or when no summary exists */}
              {hasTranscript && (activeView === 'transcript' || !hasSummary) && (
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


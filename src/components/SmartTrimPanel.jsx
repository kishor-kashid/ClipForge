import React, { useState } from 'react';
import { useVideoStore } from '../store/videoStore';
import { formatTime } from '../utils/timeUtils';
import { useToast } from './ToastProvider';

export default function SmartTrimPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [minConfidence, setMinConfidence] = useState(0.5);
  const {
    selectedVideo,
    videos,
    generateTrimSuggestions,
    getTrimSuggestions,
    clearSuggestions,
    applySuggestion,
    getVideoElement,
  } = useVideoStore();
  const { addToast } = useToast();

  const selectedVideoObject = videos.find((v) => v.path === selectedVideo);
  const transcript = selectedVideoObject?.transcript;
  const hasTranscript = transcript && transcript.fullText && transcript.segments.length > 0;
  const suggestions = selectedVideo ? getTrimSuggestions(selectedVideo) : [];
  const suggestionsGenerated = selectedVideoObject?.suggestionsGenerated || false;

  // Filter suggestions: only show highlights (best parts of video)
  const highlightSuggestions = suggestions
    .filter(s => s.type === 'create_highlight' && s.confidence >= minConfidence);

  const handleGenerateSuggestions = async () => {
    if (!selectedVideo) {
      addToast('Please select a video first', 'error');
      return;
    }

    if (!hasTranscript) {
      addToast('Please generate a transcript first', 'error');
      return;
    }

    try {
      addToast('Finding highlights...', 'info');
      const suggestions = await generateTrimSuggestions(selectedVideo, {
        minSilenceDuration: 2, // Keep for backend analysis
        minConfidence,
      });
      
      // Filter to only highlights
      const highlights = suggestions.filter(s => s.type === 'create_highlight');
      if (highlights.length > 0) {
        addToast(`Found ${highlights.length} highlight${highlights.length > 1 ? 's' : ''}`, 'success');
      } else {
        addToast('No highlights found in this transcript', 'info');
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      addToast('Failed to generate suggestions', 'error');
    }
  };

  const handleApplySuggestion = (suggestion) => {
    if (!selectedVideo) return;

    try {
      applySuggestion(selectedVideo, suggestion);
      addToast(`Applied ${suggestion.type} suggestion`, 'success');
    } catch (error) {
      console.error('Error applying suggestion:', error);
      addToast('Failed to apply suggestion', 'error');
    }
  };

  const handlePreviewSuggestion = (suggestion) => {
    const videoElement = getVideoElement();
    if (videoElement) {
      videoElement.currentTime = suggestion.startTime;
      if (videoElement.paused) {
        videoElement.play();
      }
      addToast(`Previewing suggestion at ${formatTime(suggestion.startTime)}`, 'info');
    } else {
      addToast('Video player not ready', 'warning');
    }
  };

  const handleApplyAll = () => {
    if (!selectedVideo || highlightSuggestions.length === 0) return;

    const confirmed = window.confirm(
      `Apply highlight suggestion? This will set trim points to the best part of the video.`
    );

    if (!confirmed) return;

    try {
      // Apply the first (best) highlight
      if (highlightSuggestions.length > 0) {
        applySuggestion(selectedVideo, highlightSuggestions[0]);
        addToast('Applied highlight suggestion', 'success');
      }
    } catch (error) {
      console.error('Error applying suggestion:', error);
      addToast('Failed to apply suggestion', 'error');
    }
  };

  const getConfidenceIndicator = (confidence) => {
    const percentage = Math.round(confidence * 100);
    let color = 'bg-red-500';
    if (confidence >= 0.7) color = 'bg-green-500';
    else if (confidence >= 0.5) color = 'bg-yellow-500';

    return (
      <div className="flex items-center gap-1">
        <div className="w-16 bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className={`${color} h-full transition-all`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-gray-400">{percentage}%</span>
      </div>
    );
  };


  return (
    <div className="bg-[#252525] rounded-lg border border-[#404040] overflow-hidden">
      {/* Smart Trim Panel Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-[#2d2d2d] hover:bg-[#333] transition-colors flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-[#4a9eff]" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-white font-semibold">Highlights</span>
          {highlightSuggestions.length > 0 && (
            <span className="text-xs text-[#4a9eff] bg-[#4a9eff]/20 px-2 py-0.5 rounded">
              {highlightSuggestions.length}
            </span>
          )}
        </div>
        <svg 
          className={`w-5 h-5 text-[#b3b3b3] transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Smart Trim Panel Content */}
      {isOpen && (
        <div className="p-4">
          {!selectedVideo ? (
            <p className="text-[#b3b3b3] text-sm text-center py-4">Select a video to find highlights</p>
          ) : !hasTranscript ? (
            <div className="text-center py-4">
              <p className="text-[#b3b3b3] text-sm mb-2">Generate a transcript first to find highlights</p>
            </div>
          ) : (
            <>
              {/* Configuration */}
              <div className="mb-4 bg-[#1a1a1a] rounded p-3 border border-[#404040]">
                <div>
                  <label className="text-xs text-[#b3b3b3] mb-1 block">
                    Min Confidence: {Math.round(minConfidence * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={minConfidence}
                    onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="mb-4 space-y-2">
                {!suggestionsGenerated && (
                  <button
                    onClick={handleGenerateSuggestions}
                    className="w-full px-4 py-2 bg-[#4a9eff] text-white rounded hover:bg-[#3080df] transition-colors font-medium text-sm"
                  >
                    Find Highlights
                  </button>
                )}

                {suggestionsGenerated && highlightSuggestions.length > 0 && (
                  <>
                    <button
                      onClick={handleApplyAll}
                      className="w-full px-4 py-2 bg-[#16a34a] text-white rounded hover:bg-[#15803d] transition-colors font-medium text-sm mb-2"
                    >
                      Apply Best Highlight
                    </button>
                    <button
                      onClick={() => {
                        clearSuggestions(selectedVideo);
                        addToast('Suggestions cleared', 'info');
                      }}
                      className="w-full px-4 py-2 bg-[#404040] text-white rounded hover:bg-[#525252] transition-colors font-medium text-sm"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>

              {/* Highlights List */}
              {suggestionsGenerated && (
                <div className="space-y-4">
                  {highlightSuggestions.length === 0 ? (
                    <p className="text-[#b3b3b3] text-sm text-center py-4">
                      No highlights found (try lowering confidence threshold)
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {highlightSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="bg-[#1a1a1a] rounded p-3 border border-[#404040]"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-[#4a9eff] font-mono">
                                {formatTime(suggestion.startTime)} - {formatTime(suggestion.endTime)}
                              </span>
                              <span className="text-xs text-[#b3b3b3]">
                                ({formatTime(suggestion.duration)})
                              </span>
                            </div>
                            {getConfidenceIndicator(suggestion.confidence)}
                          </div>
                          <p className="text-xs text-[#b3b3b3] mb-2">{suggestion.reason}</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePreviewSuggestion(suggestion)}
                              className="px-3 py-1 text-xs bg-[#404040] hover:bg-[#505050] text-white rounded transition-colors"
                            >
                              Preview
                            </button>
                            <button
                              onClick={() => handleApplySuggestion(suggestion)}
                              className="px-3 py-1 text-xs bg-[#16a34a] hover:bg-[#15803d] text-white rounded transition-colors"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}


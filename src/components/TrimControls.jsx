import React, { useState, useRef } from 'react';
import { useVideoStore } from '../store/videoStore';
import { formatTime } from '../utils/timeUtils';

export default function TrimControls() {
  const [isOpen, setIsOpen] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { 
    selectedVideo, 
    getSelectedVideoObject, 
    setInPoint, 
    setOutPoint, 
    getTrimPoints, 
    getVideoElement,
    getTrimSuggestions,
    applySuggestion,
  } = useVideoStore();
  const [error, setError] = useState(null);
  const videoPlayerRef = useRef(null);

  // Get the selected video object
  const selectedVideoObject = getSelectedVideoObject();
  
  // Get trim points for the selected video
  const trimData = selectedVideo ? getTrimPoints(selectedVideo) : { inPoint: 0, outPoint: null };
  const { inPoint, outPoint } = trimData;

  // Get suggestions if enabled
  const suggestions = showSuggestions && selectedVideo ? getTrimSuggestions(selectedVideo) : [];
  const filteredSuggestions = suggestions
    .filter(s => s.confidence >= 0.5)
    .slice(0, 3); // Show top 3 suggestions

  // Calculate trimmed duration
  const trimDuration = outPoint !== null && outPoint !== undefined 
    ? outPoint - inPoint 
    : null;

  // Handle setting in-point
  const handleSetInPoint = () => {
    if (!selectedVideoObject) {
      setError('No video selected');
      return;
    }

    // Get video element from store
    const videoElement = getVideoElement();
    if (!videoElement) {
      setError('Video player not ready');
      return;
    }

    const currentTime = videoElement.currentTime;
    const duration = selectedVideoObject.duration || videoElement.duration;

    // Validation: in-point must be before out-point if set
    if (outPoint !== null && currentTime >= outPoint) {
      setError(`In-point must be before out-point (${formatTime(outPoint)})`);
      return;
    }

    setInPoint(selectedVideo, currentTime);
    setError(null);
  };

  // Handle setting out-point
  const handleSetOutPoint = () => {
    if (!selectedVideoObject) {
      setError('No video selected');
      return;
    }

    // Get video element from store
    const videoElement = getVideoElement();
    if (!videoElement) {
      setError('Video player not ready');
      return;
    }

    const currentTime = videoElement.currentTime;
    const duration = selectedVideoObject.duration || videoElement.duration;

    // Validation: out-point must be after in-point
    if (currentTime <= inPoint) {
      setError(`Out-point must be after in-point (${formatTime(inPoint)})`);
      return;
    }

    // Validation: out-point must be within video duration
    if (duration && currentTime > duration) {
      setError(`Out-point exceeds video duration (${formatTime(duration)})`);
      return;
    }

    setOutPoint(selectedVideo, currentTime);
    setError(null);
  };

  // Handle clearing trim points
  const handleClearTrim = () => {
    if (!selectedVideo) return;
    
    setInPoint(selectedVideo, 0);
    setOutPoint(selectedVideo, null);
    setError(null);
  };

  // Handle applying suggestion
  const handleApplySuggestion = (suggestion) => {
    if (!selectedVideo) return;
    applySuggestion(selectedVideo, suggestion);
    setError(null);
  };

  return (
    <div className="bg-[#252525] rounded-lg border border-[#404040] overflow-hidden">
      {/* Trim Controls Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-[#2d2d2d] hover:bg-[#333] transition-colors flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-[#4a9eff]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span className="text-white font-semibold">Trim Controls</span>
          {selectedVideoObject && (
            <span className="text-xs text-[#b3b3b3] truncate max-w-[140px] ml-2">
              {selectedVideoObject.name}
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

      {/* Trim Controls Content */}
      {isOpen && (
        <div className="p-4">
          {!selectedVideoObject ? (
            <p className="text-[#b3b3b3] text-sm text-center py-4">Select a video to set trim points</p>
          ) : (
            <>
              {/* Current Trim Points */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-[#1e3a5f] rounded p-3 border border-[#2563eb]">
                  <p className="text-xs font-semibold text-[#60a5fa] mb-1">In-Point</p>
                  <p className="text-lg font-bold text-[#93c5fd]">
                    {formatTime(inPoint)}
                  </p>
                </div>
                
                <div className="bg-[#1a3a2e] rounded p-3 border border-[#16a34a]">
                  <p className="text-xs font-semibold text-[#4ade80] mb-1">Out-Point</p>
                  <p className="text-lg font-bold text-[#86efac]">
                    {outPoint !== null && outPoint !== undefined ? formatTime(outPoint) : '--:--'}
                  </p>
                </div>
                
                <div className="bg-[#2d1b4e] rounded p-3 border border-[#9333ea]">
                  <p className="text-xs font-semibold text-[#a78bfa] mb-1">Duration</p>
                  <p className="text-lg font-bold text-[#c4b5fd]">
                    {trimDuration !== null ? formatTime(trimDuration) : '--:--'}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-2 mb-3">
                <button
                  onClick={handleSetInPoint}
                  className="w-full px-4 py-2 bg-[#2563eb] text-white rounded hover:bg-[#1d4ed8] transition-colors font-medium text-sm"
                >
                  Set In Point
                </button>
                
                <button
                  onClick={handleSetOutPoint}
                  className="w-full px-4 py-2 bg-[#16a34a] text-white rounded hover:bg-[#15803d] transition-colors font-medium text-sm"
                >
                  Set Out Point
                </button>
                
                <button
                  onClick={handleClearTrim}
                  className="w-full px-4 py-2 bg-[#404040] text-white rounded hover:bg-[#525252] transition-colors font-medium text-sm"
                >
                  Clear Trim
                </button>
              </div>

              {/* AI Suggestions Toggle */}
              <div className="mb-3 flex items-center justify-between">
                <label className="text-xs text-[#b3b3b3]">Show AI Suggestions</label>
                <button
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    showSuggestions ? 'bg-[#4a9eff]' : 'bg-[#404040]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showSuggestions ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* AI Suggestions */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="mb-3 bg-[#1a1a1a] rounded border border-[#404040] p-2">
                  <h5 className="text-xs font-semibold text-[#4a9eff] mb-2">AI Suggestions</h5>
                  <div className="space-y-1">
                    {filteredSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-1.5 bg-[#2d2d2d] rounded text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-[#b3b3b3] truncate">
                            {suggestion.type === 'remove_silence' && '🔇 Remove silence'}
                            {suggestion.type === 'remove_filler' && '🗣️ Remove filler'}
                            {suggestion.type === 'create_highlight' && '⭐ Create highlight'}
                          </div>
                          <div className="text-[#666] text-[10px]">
                            {formatTime(suggestion.startTime)} - {formatTime(suggestion.endTime)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleApplySuggestion(suggestion)}
                          className="ml-2 px-2 py-0.5 bg-[#16a34a] hover:bg-[#15803d] text-white rounded text-[10px] transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="text-xs text-[#b3b3b3] bg-[#2d2d2d] rounded p-2">
                <p>Play video to mark start and end points</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-3 bg-red-900 bg-opacity-20 border border-red-500 text-red-300 px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}


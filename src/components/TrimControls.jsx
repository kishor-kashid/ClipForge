import React, { useState, useRef } from 'react';
import { useVideoStore } from '../store/videoStore';
import { formatTime } from '../utils/timeUtils';

export default function TrimControls() {
  const { selectedVideo, getSelectedVideoObject, setInPoint, setOutPoint, getTrimPoints, getVideoElement } = useVideoStore();
  const [error, setError] = useState(null);
  const videoPlayerRef = useRef(null);

  // Get the selected video object
  const selectedVideoObject = getSelectedVideoObject();
  
  // Get trim points for the selected video
  const trimData = selectedVideo ? getTrimPoints(selectedVideo) : { inPoint: 0, outPoint: null };
  const { inPoint, outPoint } = trimData;

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

  // No video selected
  if (!selectedVideoObject) {
    return (
      <div className="bg-[#252525] rounded-lg border border-[#404040] p-6 text-center">
        <p className="text-[#b3b3b3]">Select a video to set trim points</p>
      </div>
    );
  }

  return (
    <div className="bg-[#252525] rounded-lg border border-[#404040] p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Trim Controls</h2>
        <span className="text-xs text-[#b3b3b3] truncate max-w-[140px]">
          {selectedVideoObject.name}
        </span>
      </div>

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
    </div>
  );
}


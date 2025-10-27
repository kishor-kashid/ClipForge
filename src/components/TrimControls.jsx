import React, { useState, useRef } from 'react';
import { useVideoStore } from '../store/videoStore';
import { formatTime } from '../utils/timeUtils';

export default function TrimControls() {
  const { selectedVideo, getSelectedVideoObject, setInPoint, setOutPoint, getTrimPoints } = useVideoStore();
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

    // Try to get video element from page
    const videoElement = document.querySelector('video');
    if (!videoElement) {
      setError('Video player not found');
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

    // Try to get video element from page
    const videoElement = document.querySelector('video');
    if (!videoElement) {
      setError('Video player not found');
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
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <p className="text-gray-600">Select a video to set trim points</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Trim Controls</h2>
        <span className="text-sm text-gray-600">
          {selectedVideoObject.name}
        </span>
      </div>

      {/* Current Trim Points */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm font-semibold text-blue-700 mb-1">In-Point</p>
          <p className="text-2xl font-bold text-blue-900">
            {formatTime(inPoint)}
          </p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm font-semibold text-green-700 mb-1">Out-Point</p>
          <p className="text-2xl font-bold text-green-900">
            {outPoint !== null && outPoint !== undefined ? formatTime(outPoint) : '--:--'}
          </p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <p className="text-sm font-semibold text-purple-700 mb-1">Duration</p>
          <p className="text-2xl font-bold text-purple-900">
            {trimDuration !== null ? formatTime(trimDuration) : '--:--'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={handleSetInPoint}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Set In Point
        </button>
        
        <button
          onClick={handleSetOutPoint}
          className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
        >
          Set Out Point
        </button>
        
        <button
          onClick={handleClearTrim}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
        >
          Clear
        </button>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mb-4">
        <p>
          💡 Play the video to find where you want to start (in-point) and end (out-point), then click the buttons.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
}


import React, { useState, useRef, useEffect } from 'react';
import { useVideoStore } from '../store/videoStore';
import { formatTime } from '../utils/timeUtils';

export default function VideoPlayer() {
  const { selectedVideo, videos, updateVideo } = useVideoStore();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);

  // Get the selected video object
  const selectedVideoObject = videos.find(v => v.path === selectedVideo);

  // Load video when selection changes
  useEffect(() => {
    if (selectedVideoObject && videoRef.current) {
      let videoSrc = null;
      let needsCleanup = false;
      
      // In Electron, we can use file paths directly without file:// protocol
      // In browser, we need blob URLs
      if (selectedVideoObject.file) {
        videoSrc = URL.createObjectURL(selectedVideoObject.file);
        needsCleanup = true;
      } else if (selectedVideoObject.path) {
        // Electron will handle the local file path
        // No need for file:// protocol prefix
        videoSrc = selectedVideoObject.path;
      }
      
      if (videoSrc && videoRef.current) {
        videoRef.current.src = videoSrc;
        setError(null);
      }
      
      // Clean up object URL when component unmounts or video changes
      return () => {
        if (needsCleanup && videoSrc && videoSrc.startsWith('blob:')) {
          URL.revokeObjectURL(videoSrc);
        }
      };
    }
  }, [selectedVideoObject]);

  // Event handlers
  const handlePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration;
      setDuration(videoDuration || 0);
      
      // Update duration in store
      if (selectedVideoObject && selectedVideoObject.path && (!selectedVideoObject.duration || selectedVideoObject.duration === 0)) {
        updateVideo(selectedVideoObject.path, { duration: videoDuration || 0 });
      }
    }
  };

  const handleError = () => {
    setError('Failed to load video. Please try another file.');
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      setCurrentTime(0);
      videoRef.current.currentTime = 0;
    }
  };

  // No video selected - show placeholder
  if (!selectedVideoObject) {
    return (
      <div className="bg-gray-200 rounded-lg p-8 text-center">
        <svg
          className="w-24 h-24 mx-auto text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <p className="text-xl text-gray-600">No video selected</p>
        <p className="text-sm text-gray-500 mt-2">Select a video from the timeline to preview</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Video Element */}
      <div className="relative bg-black">
        <video
          ref={videoRef}
          className="w-full h-auto max-h-[500px]"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleError}
          onEnded={handleEnded}
          controls={false}
        />
        
        {/* Error Message */}
        {error && (
          <div className="absolute inset-0 bg-red-100 bg-opacity-90 flex items-center justify-center">
            <div className="text-center p-8">
              <p className="text-red-700 font-semibold">{error}</p>
              <p className="text-sm text-red-600 mt-2">Selected: {selectedVideoObject.name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 truncate">
          {selectedVideoObject.name}
        </h3>
      </div>

      {/* Controls */}
      <div className="p-4">
        {/* Play/Pause Button */}
        <div className="flex items-center justify-center mb-4">
          <button
            onClick={handlePlayPause}
            disabled={!!error}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isPlaying ? (
              <>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Pause</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>Play</span>
              </>
            )}
          </button>
        </div>

        {/* Time Display */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}


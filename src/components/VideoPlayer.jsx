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
  const [isLoading, setIsLoading] = useState(false);

  // Get the selected video object
  const selectedVideoObject = videos.find(v => v.path === selectedVideo);

  // Load video when selection changes
  useEffect(() => {
    if (selectedVideoObject && videoRef.current) {
      setIsLoading(true);
      setError(null);
      
      let videoSrc = null;
      let needsCleanup = false;
      
      if (selectedVideoObject.file) {
        videoSrc = URL.createObjectURL(selectedVideoObject.file);
        needsCleanup = true;
      } else if (selectedVideoObject.path) {
        videoSrc = selectedVideoObject.path;
      }
      
      if (videoSrc && videoRef.current) {
        videoRef.current.src = videoSrc;
      }
      
      return () => {
        if (needsCleanup && videoSrc && videoSrc.startsWith('blob:')) {
          URL.revokeObjectURL(videoSrc);
        }
      };
    }
  }, [selectedVideoObject]);

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
      setIsLoading(false);
      
      if (selectedVideoObject && selectedVideoObject.path && (!selectedVideoObject.duration || selectedVideoObject.duration === 0)) {
        updateVideo(selectedVideoObject.path, { duration: videoDuration || 0 });
      }
    }
  };

  const handleError = () => {
    setIsLoading(false);
    setError('Failed to load video. Please try another file.');
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      setCurrentTime(0);
      videoRef.current.currentTime = 0;
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  // No video selected
  if (!selectedVideoObject) {
    return (
      <div className="bg-[#252525] rounded-lg border border-[#404040] h-full flex items-center justify-center">
        <div className="text-center">
          <svg className="w-24 h-24 mx-auto text-[#404040] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-[#b3b3b3] text-lg">No video selected</p>
          <p className="text-[#666] text-sm mt-2">Select a video from the timeline to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#252525] rounded-lg border border-[#404040] overflow-hidden h-full flex flex-col">
      {/* Video Element */}
      <div className="relative bg-black flex-1 flex items-center justify-center min-h-[300px]">
        <video
          ref={videoRef}
          className="w-full h-auto max-h-[60vh]"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleError}
          onEnded={handleEnded}
          controls={false}
        />
        
        {/* Loading Overlay */}
        {isLoading && !error && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center">
            <div className="text-center">
              <svg className="animate-spin h-12 w-12 text-[#4a9eff] mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-white font-semibold">Loading video...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="absolute inset-0 bg-red-900 bg-opacity-90 flex items-center justify-center">
            <div className="text-center p-8">
              <p className="text-red-200 font-semibold text-lg">{error}</p>
              <p className="text-red-400 text-sm mt-2">{selectedVideoObject.name}</p>
            </div>
          </div>
        )}

        {/* Centered Play Button - Only show when video is paused */}
        {!isPlaying && !isLoading && !error && (
          <button
            onClick={handlePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 hover:bg-opacity-30 transition-all z-10 pointer-events-auto"
          >
            <div className="bg-white bg-opacity-90 rounded-full p-6 hover:bg-opacity-100 transition-all transform hover:scale-110 pointer-events-auto">
              <svg className="w-16 h-16 text-[#1a1a1a]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </button>
        )}
      </div>

      {/* Controls Bar */}
      <div className="bg-[#2d2d2d] p-4 space-y-3">
        {/* Video Info */}
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold truncate flex-1">
            {selectedVideoObject.name}
          </h3>
          <div className="flex items-center gap-2 text-xs text-[#b3b3b3]">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Seek Bar */}
        <div>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            step="0.1"
            onChange={handleSeek}
            disabled={!!error || !duration}
            className="w-full h-2"
            style={{
              background: `linear-gradient(to right, #4a9eff 0%, #4a9eff ${(currentTime / (duration || 1)) * 100}%, #2d2d2d ${(currentTime / (duration || 1)) * 100}%, #2d2d2d 100%)`
            }}
          />
        </div>

        {/* Play Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayPause}
            disabled={!!error}
            className="flex items-center gap-2 px-6 py-2 bg-[#4a9eff] text-white rounded hover:bg-[#3a8eef] transition-all disabled:bg-[#404040] disabled:text-[#666] disabled:cursor-not-allowed"
          >
            {isPlaying ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Pause</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>Play</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

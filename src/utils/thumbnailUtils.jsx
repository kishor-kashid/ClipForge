import React, { useState, useEffect } from 'react';

// Global thumbnail cache to share thumbnails between components
const thumbnailCache = new Map();

/**
 * Hook to generate video thumbnails with caching
 * @param {string} videoPath - Path to video file
 * @param {number} timeOffset - Time in seconds to capture thumbnail
 * @returns {string|null} - Data URL of thumbnail or null
 */
export const useVideoThumbnail = (videoPath, timeOffset = 0) => {
  const cacheKey = `${videoPath}-${timeOffset}`;
  const [thumbnail, setThumbnail] = useState(thumbnailCache.get(cacheKey) || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!videoPath) {
      setThumbnail(null);
      return;
    }

    // Check cache first
    const cachedThumbnail = thumbnailCache.get(cacheKey);
    if (cachedThumbnail) {
      setThumbnail(cachedThumbnail);
      return;
    }

    const generateThumbnail = async () => {
      setLoading(true);
      try {
        // Create a video element to capture frame
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.preload = 'metadata';
        video.muted = true; // Ensure video is muted to avoid autoplay issues
        
        return new Promise((resolve) => {
          video.onloadedmetadata = () => {
            video.currentTime = Math.min(timeOffset, video.duration || 0);
          };
          
          video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 160; // Thumbnail width
            canvas.height = 90; // Thumbnail height (16:9 aspect ratio)
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const dataURL = canvas.toDataURL('image/jpeg', 0.8);
            
            // Cache the thumbnail
            thumbnailCache.set(cacheKey, dataURL);
            resolve(dataURL);
          };
          
          video.onerror = (e) => {
            console.warn('Failed to load video for thumbnail:', videoPath, e);
            resolve(null);
          };
          
          video.src = videoPath;
        });
      } catch (error) {
        console.error('Error generating thumbnail:', error);
        return null;
      } finally {
        setLoading(false);
      }
    };

    generateThumbnail().then(setThumbnail);
  }, [videoPath, timeOffset, cacheKey]);

  return { thumbnail, loading };
};

/**
 * Component to display video thumbnail
 */
export const VideoThumbnail = ({ videoPath, timeOffset = 0, className = '', width = 40, height = 24 }) => {
  const { thumbnail, loading } = useVideoThumbnail(videoPath, timeOffset);

  if (loading) {
    return (
      <div 
        className={`bg-[#404040] flex items-center justify-center ${className}`}
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <svg className="w-4 h-4 text-[#666] animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (!thumbnail) {
    return (
      <div 
        className={`bg-[#404040] flex items-center justify-center ${className}`}
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="text-center">
          <svg className="w-6 h-6 text-[#666] mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
          <div className="text-[10px] text-[#666]">No Preview</div>
        </div>
      </div>
    );
  }

  return (
    <img 
      src={thumbnail} 
      alt="Video thumbnail"
      className={`object-cover ${className}`}
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        display: 'block'
      }}
      onError={(e) => {
        console.error('Thumbnail image failed to load:', videoPath, e);
      }}
    />
  );
};

/**
 * Component to display time markers on timeline
 */
export const TimeMarker = ({ time, pixelsPerSecond, className = '' }) => {
  const left = time * pixelsPerSecond;
  
  return (
    <div
      className={`absolute top-0 bottom-0 w-px bg-yellow-400 z-10 pointer-events-none ${className}`}
      style={{ left: `${left}px` }}
    >
      <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
        <div className="w-2 h-2 bg-yellow-600 rounded-full" />
      </div>
    </div>
  );
};

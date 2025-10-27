import React, { createContext, useContext, useState, useEffect } from 'react';

// Video store context
const VideoContext = createContext();

/**
 * Video store provider component
 */
export function VideoProvider({ children }) {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const selectedVideoRef = React.useRef(null);
  
  // Keep ref in sync with state
  React.useEffect(() => {
    selectedVideoRef.current = selectedVideo;
  }, [selectedVideo]);

  /**
   * Add a new video to the store
   * @param {Object} video - Video object with path, name, duration, etc.
   */
  const addVideo = (video) => {
    if (!video || !video.path) {
      console.error('Invalid video object:', video);
      return;
    }

    // Check if video already exists and add to store
    setVideos((prevVideos) => {
      const exists = prevVideos.some((v) => v.path === video.path);
      if (exists) {
        console.warn('Video already exists:', video.path);
        return prevVideos;
      }
      return [...prevVideos, { ...video, id: Date.now().toString() }];
    });
    
    // Auto-select if this is the first video
    setSelectedVideo((currentSelected) => {
      if (currentSelected === null) {
        return video.path;
      }
      return currentSelected;
    });
  };

  /**
   * Remove a video from the store
   * @param {string} videoPath - Path of the video to remove
   */
  const removeVideo = (videoPath) => {
    // Remove the video and handle selection
    setVideos((prevVideos) => {
      const remaining = prevVideos.filter((v) => v.path !== videoPath);
      
      // If the removed video was selected, update selection
      if (selectedVideoRef.current === videoPath) {
        if (remaining.length > 0) {
          // Select the first remaining video
          setSelectedVideo(remaining[0].path);
        } else {
          // No videos left, deselect
          setSelectedVideo(null);
        }
      }
      
      return remaining;
    });
  };

  /**
   * Update video metadata
   * @param {string} videoPath - Path of the video to update
   * @param {Object} updates - Object with fields to update
   */
  const updateVideo = (videoPath, updates) => {
    setVideos((prevVideos) =>
      prevVideos.map((video) =>
        video.path === videoPath ? { ...video, ...updates } : video
      )
    );
  };

  /**
   * Select a video
   * @param {string} videoPath - Path of the video to select
   */
  const selectVideo = (videoPath) => {
    setSelectedVideo(videoPath);
  };

  /**
   * Get the currently selected video object
   * @returns {Object|null} - The selected video object or null
   */
  const getSelectedVideoObject = () => {
    return videos.find((v) => v.path === selectedVideo) || null;
  };

  const value = {
    videos,
    selectedVideo,
    addVideo,
    removeVideo,
    updateVideo,
    selectVideo,
    getSelectedVideoObject,
  };

  return <VideoContext.Provider value={value}>{children}</VideoContext.Provider>;
}

/**
 * Hook to use the video store
 * @returns {Object} - Video store context value
 */
export function useVideoStore() {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error('useVideoStore must be used within a VideoProvider');
  }
  return context;
}


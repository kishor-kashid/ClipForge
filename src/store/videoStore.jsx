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
  const [trimPoints, setTrimPoints] = useState({});
  
  // Timeline and track state
  const [tracks, setTracks] = useState([
    { id: 'track-1', name: 'Track 1', clips: [] },
    { id: 'track-2', name: 'Track 2', clips: [] },
  ]);
  const [activeTrack, setActiveTrack] = useState('track-1');
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  // Keep ref in sync with state
  React.useEffect(() => {
    selectedVideoRef.current = selectedVideo;
  }, [selectedVideo]);
  
  // Recording timer effect
  React.useEffect(() => {
    let interval = null;
    if (isRecording && recordingStartTime) {
      interval = setInterval(() => {
        const elapsed = (Date.now() - recordingStartTime) / 1000;
        setRecordingDuration(elapsed);
      }, 100);
    } else if (!isRecording) {
      setRecordingDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, recordingStartTime]);

  /**
   * Add a new video to the store
   * @param {Object} video - Video object with path, name, duration, etc.
   * @param {boolean} autoSelect - Whether to auto-select this video (default: true for recordings)
   */
  const addVideo = (video, autoSelect = false) => {
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
      return [...prevVideos, { 
        ...video, 
        id: Date.now().toString(),
        addedAt: new Date().toISOString(),
        isRecording: video.isRecording || false,
      }];
    });
    
    // Auto-select if this is the first video OR if autoSelect is true (for recordings)
    setSelectedVideo((currentSelected) => {
      if (currentSelected === null || autoSelect) {
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

  /**
   * Set in-point (start time) for a video
   * @param {string} videoPath - Path of the video
   * @param {number} inPoint - Start time in seconds
   */
  const setInPoint = (videoPath, inPoint) => {
    setTrimPoints((prev) => ({
      ...prev,
      [videoPath]: { ...prev[videoPath], inPoint },
    }));
  };

  /**
   * Set out-point (end time) for a video
   * @param {string} videoPath - Path of the video
   * @param {number} outPoint - End time in seconds
   */
  const setOutPoint = (videoPath, outPoint) => {
    setTrimPoints((prev) => ({
      ...prev,
      [videoPath]: { ...prev[videoPath], outPoint },
    }));
  };

  /**
   * Get trim points for a video
   * @param {string} videoPath - Path of the video
   * @returns {Object} - Object with inPoint and outPoint
   */
  const getTrimPoints = (videoPath) => {
    return trimPoints[videoPath] || { inPoint: 0, outPoint: null };
  };

  /**
   * Start recording
   */
  const startRecording = () => {
    setIsRecording(true);
    setRecordingStartTime(Date.now());
    setRecordingDuration(0);
  };

  /**
   * Stop recording
   */
  const stopRecording = () => {
    setIsRecording(false);
    setRecordingStartTime(null);
    setRecordingDuration(0);
  };

  /**
   * Add clip to a track
   * @param {string} trackId - ID of the track
   * @param {Object} clip - Clip object with videoPath, startTime, etc.
   */
  const addClipToTrack = (trackId, clip) => {
    setTracks((prevTracks) =>
      prevTracks.map((track) => {
        if (track.id === trackId) {
          const newClip = {
            id: `clip-${Date.now()}-${Math.random()}`,
            videoPath: clip.videoPath,
            startTime: clip.startTime || 0,
            duration: clip.duration,
            inPoint: clip.inPoint || 0,
            outPoint: clip.outPoint || null,
            ...clip,
          };
          return { ...track, clips: [...track.clips, newClip] };
        }
        return track;
      })
    );
  };

  /**
   * Remove clip from track
   * @param {string} trackId - ID of the track
   * @param {string} clipId - ID of the clip to remove
   */
  const removeClipFromTrack = (trackId, clipId) => {
    setTracks((prevTracks) =>
      prevTracks.map((track) => {
        if (track.id === trackId) {
          return { ...track, clips: track.clips.filter((c) => c.id !== clipId) };
        }
        return track;
      })
    );
  };

  /**
   * Split a clip at a specific time
   * @param {string} videoPath - Path of the video to split
   * @param {number} splitTime - Time in seconds to split at
   * @returns {Object} - Object with two new video objects
   */
  const splitClip = (videoPath, splitTime) => {
    const video = videos.find((v) => v.path === videoPath);
    if (!video) {
      console.error('Video not found for splitting:', videoPath);
      return null;
    }

    const trim = getTrimPoints(videoPath);
    const effectiveStart = trim.inPoint || 0;
    const effectiveEnd = trim.outPoint || video.duration;

    // Validate split time
    if (splitTime <= effectiveStart || splitTime >= effectiveEnd) {
      console.error('Split time out of bounds');
      return null;
    }

    // Create two new clips
    const clip1Id = `${videoPath}-split1-${Date.now()}`;
    const clip2Id = `${videoPath}-split2-${Date.now()}`;

    const clip1 = {
      ...video,
      id: clip1Id,
      path: clip1Id,
      name: `${video.name} (Part 1)`,
      originalPath: video.originalPath || videoPath,
      isSplit: true,
      splitIndex: 1,
    };

    const clip2 = {
      ...video,
      id: clip2Id,
      path: clip2Id,
      name: `${video.name} (Part 2)`,
      originalPath: video.originalPath || videoPath,
      isSplit: true,
      splitIndex: 2,
    };

    // Add the new clips
    setVideos((prevVideos) => [...prevVideos, clip1, clip2]);

    // Set trim points for the splits
    setTrimPoints((prev) => ({
      ...prev,
      [clip1Id]: { inPoint: effectiveStart, outPoint: splitTime },
      [clip2Id]: { inPoint: splitTime, outPoint: effectiveEnd },
    }));

    // Remove original from timeline (keep in library)
    return { clip1, clip2, splitTime };
  };

  /**
   * Add a new track
   */
  const addTrack = () => {
    const newTrackId = `track-${Date.now()}`;
    setTracks((prevTracks) => [
      ...prevTracks,
      { id: newTrackId, name: `Track ${prevTracks.length + 1}`, clips: [] },
    ]);
  };

  /**
   * Remove a track
   * @param {string} trackId - ID of the track to remove
   */
  const removeTrack = (trackId) => {
    if (tracks.length <= 1) {
      console.warn('Cannot remove last track');
      return;
    }
    setTracks((prevTracks) => prevTracks.filter((t) => t.id !== trackId));
    // If removing active track, switch to first remaining track
    if (activeTrack === trackId) {
      const remaining = tracks.filter((t) => t.id !== trackId);
      if (remaining.length > 0) {
        setActiveTrack(remaining[0].id);
      }
    }
  };

  /**
   * Update clip position on timeline
   * @param {string} trackId - ID of the track
   * @param {string} clipId - ID of the clip
   * @param {number} newStartTime - New start time in seconds
   */
  const updateClipPosition = (trackId, clipId, newStartTime) => {
    setTracks((prevTracks) =>
      prevTracks.map((track) => {
        if (track.id === trackId) {
          return {
            ...track,
            clips: track.clips.map((clip) =>
              clip.id === clipId ? { ...clip, startTime: newStartTime } : clip
            ),
          };
        }
        return track;
      })
    );
  };

  const value = {
    videos,
    selectedVideo,
    addVideo,
    removeVideo,
    updateVideo,
    selectVideo,
    getSelectedVideoObject,
    trimPoints,
    setInPoint,
    setOutPoint,
    getTrimPoints,
    // Recording state
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    // Timeline and tracks
    tracks,
    activeTrack,
    setActiveTrack,
    addTrack,
    removeTrack,
    addClipToTrack,
    removeClipFromTrack,
    updateClipPosition,
    splitClip,
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


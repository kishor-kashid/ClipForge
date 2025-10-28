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
  
  // Timeline zoom and snap state
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100%, 0.5 = 50%, 2 = 200%
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapInterval, setSnapInterval] = useState(1); // Snap to 1 second intervals
  
  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedClip, setSelectedClip] = useState(null);
  
  // Undo/Redo state
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoRedoAction, setIsUndoRedoAction] = useState(false);
  
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
    
    // Save to history
    saveToHistory('addVideo', `Added video: ${video.name}`);
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
    
    // Save to history
    const video = videos.find(v => v.path === videoPath);
    saveToHistory('removeVideo', `Removed video: ${video?.name || videoPath}`);
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
    
    // Save to history
    const video = videos.find(v => v.path === clip.videoPath);
    saveToHistory('addClipToTrack', `Added clip to track: ${video?.name || clip.videoPath}`);
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
    
    // Save to history
    const track = tracks.find(t => t.id === trackId);
    const clip = track?.clips.find(c => c.id === clipId);
    const video = videos.find(v => v.path === clip?.videoPath);
    saveToHistory('removeClipFromTrack', `Removed clip from track: ${video?.name || clipId}`);
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
    
    // Save to history
    saveToHistory('splitClip', `Split video: ${video.name} at ${splitTime}s`);
    
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

  /**
   * Zoom in on timeline
   */
  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 4)); // Max 400%
  };

  /**
   * Zoom out on timeline
   */
  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.25)); // Min 25%
  };

  /**
   * Set zoom level directly
   * @param {number} level - Zoom level (0.25 to 4)
   */
  const setZoom = (level) => {
    setZoomLevel(Math.max(0.25, Math.min(4, level)));
  };

  /**
   * Reset zoom to 100%
   */
  const resetZoom = () => {
    setZoomLevel(1);
  };

  /**
   * Toggle snap to grid
   */
  const toggleSnap = () => {
    setSnapEnabled((prev) => !prev);
  };

  /**
   * Snap a time value to the grid
   * @param {number} time - Time in seconds
   * @returns {number} - Snapped time
   */
  const snapToGrid = (time) => {
    if (!snapEnabled) return time;
    return Math.round(time / snapInterval) * snapInterval;
  };

  /**
   * Find the nearest clip edge for snapping
   * @param {number} time - Time in seconds
   * @param {string} trackId - Track ID to check
   * @param {string} excludeClipId - Clip ID to exclude from snap detection
   * @returns {number|null} - Snapped time or null if no edge nearby
   */
  const snapToEdge = (time, trackId, excludeClipId = null) => {
    if (!snapEnabled) return null;
    
    const track = tracks.find((t) => t.id === trackId);
    if (!track) return null;

    const snapThreshold = 0.5; // 0.5 seconds threshold for edge snapping
    let nearestEdge = null;
    let minDistance = snapThreshold;

    track.clips.forEach((clip) => {
      if (clip.id === excludeClipId) return;

      const clipStart = clip.startTime || 0;
      const clipEnd = clipStart + (clip.duration || 0);

      // Check distance to clip edges
      const distToStart = Math.abs(time - clipStart);
      const distToEnd = Math.abs(time - clipEnd);

      if (distToStart < minDistance) {
        minDistance = distToStart;
        nearestEdge = clipStart;
      }
      if (distToEnd < minDistance) {
        minDistance = distToEnd;
        nearestEdge = clipEnd;
      }
    });

    return nearestEdge;
  };

  /**
   * Play video
   */
  const playVideo = () => {
    setIsPlaying(true);
  };

  /**
   * Pause video
   */
  const pauseVideo = () => {
    setIsPlaying(false);
  };

  /**
   * Set current time
   * @param {number} time - Time in seconds
   */
  const updateCurrentTime = (time) => {
    setCurrentTime(time);
  };

  /**
   * Export video (placeholder)
   */
  const exportVideo = () => {
    console.log('Export video triggered');
    // This will be implemented in the ExportButton component
  };

  /**
   * Save current state to history
   */
  const saveToHistory = (action, description) => {
    if (isUndoRedoAction) return; // Don't save undo/redo actions to history
    
    const stateSnapshot = {
      videos: [...videos],
      tracks: tracks.map(track => ({
        ...track,
        clips: [...track.clips]
      })),
      trimPoints: { ...trimPoints },
      selectedVideo,
      selectedClip,
      action,
      description,
      timestamp: Date.now()
    };

    setHistory(prevHistory => {
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      newHistory.push(stateSnapshot);
      
      // Limit history to 50 actions
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      }
      
      return newHistory;
    });
    
    setHistoryIndex(prevIndex => {
      const newIndex = Math.min(prevIndex + 1, 49);
      return newIndex;
    });
  };

  /**
   * Undo last action
   */
  const undo = () => {
    if (historyIndex > 0) {
      setIsUndoRedoAction(true);
      const previousState = history[historyIndex - 1];
      
      setVideos(previousState.videos);
      setTracks(previousState.tracks);
      setTrimPoints(previousState.trimPoints);
      setSelectedVideo(previousState.selectedVideo);
      setSelectedClip(previousState.selectedClip);
      setHistoryIndex(prevIndex => prevIndex - 1);
      
      setTimeout(() => setIsUndoRedoAction(false), 100);
      return true;
    }
    return false;
  };

  /**
   * Redo last undone action
   */
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setIsUndoRedoAction(true);
      const nextState = history[historyIndex + 1];
      
      setVideos(nextState.videos);
      setTracks(nextState.tracks);
      setTrimPoints(nextState.trimPoints);
      setSelectedVideo(nextState.selectedVideo);
      setSelectedClip(nextState.selectedClip);
      setHistoryIndex(prevIndex => prevIndex + 1);
      
      setTimeout(() => setIsUndoRedoAction(false), 100);
      return true;
    }
    return false;
  };

  /**
   * Check if undo is available
   */
  const canUndo = () => historyIndex > 0;

  /**
   * Check if redo is available
   */
  const canRedo = () => historyIndex < history.length - 1;

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
    // Zoom and snap
    zoomLevel,
    setZoomLevel: setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    snapEnabled,
    snapInterval,
    toggleSnap,
    snapToGrid,
    snapToEdge,
    // Video player state
    isPlaying,
    currentTime,
    selectedClip,
    playVideo,
    pauseVideo,
    updateCurrentTime,
    setSelectedClip,
    exportVideo,
    // Undo/Redo
    undo,
    redo,
    canUndo,
    canRedo,
    saveToHistory,
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


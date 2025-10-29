import React, { useState, useEffect } from 'react';
import { useVideoStore } from '../store/videoStore';
import { formatTime } from '../utils/timeUtils';
import { useToast } from './ToastProvider';
import { VideoThumbnail } from '../utils/thumbnailUtils.jsx';

export default function Timeline() {
  const { 
    tracks, 
    activeTrack, 
    setActiveTrack,
    addTrack, 
    removeTrack,
    addClipToTrack,
    removeClipFromTrack,
    updateClipPosition,
    videos,
    selectedVideo,
    selectVideo,
    getTrimPoints,
    getTrimSuggestions,
    // Zoom and snap
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    snapEnabled,
    toggleSnap,
    snapToGrid,
    snapToEdge,
    // Clip selection
    selectedClip,
    setSelectedClip,
  } = useVideoStore();
  const { addToast } = useToast();

  const [draggedClip, setDraggedClip] = useState(null);
  const [draggedFromLibrary, setDraggedFromLibrary] = useState(null);
  const [dropIndicatorPosition, setDropIndicatorPosition] = useState(null);
  const [dropIndicatorTrack, setDropIndicatorTrack] = useState(null);

  // Timeline export state
  const [isExportingTimeline, setIsExportingTimeline] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('idle'); // idle, exporting, success, error
  const [exportError, setExportError] = useState(null);

  const handleDragStart = (e, clip, fromLibrary = false, trackId = null) => {
    if (fromLibrary) {
      setDraggedFromLibrary(clip);
      e.dataTransfer.effectAllowed = 'copy';
    } else {
      setDraggedClip({ ...clip, trackId });
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e, trackId) => {
    e.preventDefault();
    
    // Check if this is a drag from VideoGrid (external drag)
    // Note: getData() is not available during dragover, so we check types instead
    if (e.dataTransfer.types.includes('text/plain')) {
      e.dataTransfer.dropEffect = 'copy';
    } else {
      // Handle internal timeline drags
      e.dataTransfer.dropEffect = draggedFromLibrary ? 'copy' : 'move';
    }
    
    // Calculate and show drop indicator
    const trackElement = e.currentTarget;
    const rect = trackElement.getBoundingClientRect();
    const x = e.clientX - rect.left + trackElement.scrollLeft;
    const dropTime = Math.max(0, Math.round((x / pixelsPerSecond) * 10) / 10);
    
    setDropIndicatorPosition(dropTime);
    setDropIndicatorTrack(trackId);
  };

  const handleDropOnTrack = (e, trackId) => {
    e.preventDefault();
    
    // Clear drop indicator
    setDropIndicatorPosition(null);
    setDropIndicatorTrack(null);
    
    // Calculate drop position on timeline
    const trackElement = e.currentTarget;
    const rect = trackElement.getBoundingClientRect();
    const x = e.clientX - rect.left + trackElement.scrollLeft;
    let dropTime = Math.max(0, x / pixelsPerSecond);
    
    // Apply snapping
    const edgeSnap = snapToEdge(dropTime, trackId, draggedClip?.id);
    if (edgeSnap !== null) {
      dropTime = edgeSnap;
    } else {
      dropTime = snapToGrid(dropTime);
    }
    
    // Check for drag data from VideoGrid (external drag)
    const dragData = e.dataTransfer.getData('text/plain');
    if (dragData) {
      try {
        const parsedData = JSON.parse(dragData);
        if (parsedData.type === 'video' && parsedData.video) {
          const video = parsedData.video;
          // Calculate effective duration based on trim points
          const trim = getTrimPoints(video.path);
          let effectiveDuration = video.duration;
          if (trim.inPoint !== undefined || trim.outPoint !== undefined) {
            const inPoint = trim.inPoint || 0;
            const outPoint = trim.outPoint || video.duration || 0;
            effectiveDuration = outPoint - inPoint;
          }
          
          addClipToTrack(trackId, {
            videoPath: video.path,
            duration: effectiveDuration,
            startTime: dropTime,
          });
          return; // Exit early since we handled the external drag
        }
      } catch (error) {
        console.error('Error parsing drag data:', error);
      }
    }
    
    if (draggedFromLibrary) {
      // Adding from timeline library
      const video = videos.find(v => v.path === draggedFromLibrary.path);
      if (video) {
        // Calculate effective duration based on trim points
        const trim = getTrimPoints(video.path);
        let effectiveDuration = video.duration;
        if (trim.inPoint !== undefined || trim.outPoint !== undefined) {
          const inPoint = trim.inPoint || 0;
          const outPoint = trim.outPoint || video.duration || 0;
          effectiveDuration = outPoint - inPoint;
        }
        
        addClipToTrack(trackId, {
          videoPath: video.path,
          duration: effectiveDuration,
          startTime: dropTime,
        });
      }
      setDraggedFromLibrary(null);
    } else if (draggedClip) {
      // Moving/repositioning existing clip
      const video = videos.find(v => v.path === draggedClip.videoPath);
      if (video) {
        // Calculate effective duration based on trim points
        const trim = getTrimPoints(video.path);
        let effectiveDuration = video.duration;
        if (trim.inPoint !== undefined || trim.outPoint !== undefined) {
          const inPoint = trim.inPoint || 0;
          const outPoint = trim.outPoint || video.duration || 0;
          effectiveDuration = outPoint - inPoint;
        }
        
        // Remove from original position if moving within same track or to different track
        removeClipFromTrack(draggedClip.trackId, draggedClip.id);
        
        // Add to new position
        addClipToTrack(trackId, {
          videoPath: video.path,
          duration: effectiveDuration,
          startTime: dropTime,
        });
      }
      setDraggedClip(null);
    }
  };

  const handleDragLeave = () => {
    setDropIndicatorPosition(null);
    setDropIndicatorTrack(null);
  };


  const getTotalDuration = () => {
    let maxEnd = 0;
    tracks.forEach(track => {
      track.clips.forEach(clip => {
        const video = videos.find(v => v.path === clip.videoPath);
        
        // Calculate effective duration based on trim points
        let effectiveDuration = clip.duration || 0;
        if (video) {
          const trim = getTrimPoints(video.path);
          if (trim.inPoint !== undefined || trim.outPoint !== undefined) {
            const inPoint = trim.inPoint || 0;
            const outPoint = trim.outPoint || video.duration || 0;
            effectiveDuration = outPoint - inPoint;
          }
        }
        
        const clipEnd = (clip.startTime || 0) + effectiveDuration;
        if (clipEnd > maxEnd) maxEnd = clipEnd;
      });
    });
    return Math.max(maxEnd, 60); // Minimum 60 seconds
  };

  const totalDuration = getTotalDuration();
  const basePixelsPerSecond = 10; // Base scale factor
  const pixelsPerSecond = basePixelsPerSecond * zoomLevel; // Apply zoom

  // Get videos that are currently used in timeline tracks
  // Setup progress listener for timeline export
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onExportProgress) {
      window.electronAPI.onExportProgress((percent) => {
        setExportProgress(percent);
      });
    }

    return () => {
      if (window.electronAPI && window.electronAPI.removeExportProgressListener) {
        window.electronAPI.removeExportProgressListener();
      }
    };
  }, []);

  // Timeline export functionality
  const handleTimelineExport = async () => {
    // Check if there are any clips to export
    const hasClips = tracks.some(track => track.clips.length > 0);
    if (!hasClips) {
      addToast('No clips to export. Add videos to timeline first.', 'warning');
      return;
    }

    if (!window.electronAPI) {
      setExportError('Export API not available');
      setExportStatus('error');
      return;
    }

    try {
      setIsExportingTimeline(true);
      setExportStatus('exporting');
      setExportProgress(0);
      setExportError(null);

      // Step 1: Show save dialog
      const saveResult = await window.electronAPI.saveVideoFile();
      
      if (saveResult.canceled) {
        setIsExportingTimeline(false);
        setExportStatus('idle');
        return;
      }

      const outputPath = saveResult.filePath;
      
      // Step 2: Prepare videos object for export
      const videosObject = {};
      videos.forEach(video => {
        videosObject[video.path] = video;
      });

      // Step 3: Export timeline
      const exportResult = await window.electronAPI.exportTimeline({
        tracks: tracks,
        outputPath: outputPath,
        videos: videosObject,
      });

      if (exportResult.success) {
        setExportStatus('success');
        setExportProgress(100);
        addToast('Timeline exported successfully!', 'success');
        // Reset after 3 seconds
        setTimeout(() => {
          setExportStatus('idle');
          setExportProgress(0);
        }, 3000);
      } else {
        setExportError(exportResult.error || 'Export failed');
        setExportStatus('error');
        addToast('Timeline export failed: ' + (exportResult.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      setExportError(error.message || 'Export failed');
      setExportStatus('error');
      addToast('Timeline export failed: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setIsExportingTimeline(false);
    }
  };

  const getVideosInTimeline = () => {
    const usedVideoPaths = new Set();
    
    // Collect all video paths that are used in any track
    tracks.forEach(track => {
      track.clips.forEach(clip => {
        usedVideoPaths.add(clip.videoPath);
      });
    });
    
    // Filter videos to only include those used in tracks
    return videos.filter(video => usedVideoPaths.has(video.path));
  };

  const videosInTimeline = getVideosInTimeline();

  return (
    <div className="bg-[#252525] rounded-lg border border-[#404040] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-[#4a9eff]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
          <h2 className="text-xl font-bold text-white">Timeline</h2>
        </div>
        
        {/* Zoom and Track controls */}
        <div className="flex gap-4 items-center">
          {/* Zoom controls */}
          <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-lg px-3 py-1.5 border border-[#404040]">
            <button
              onClick={zoomOut}
              className="text-[#b3b3b3] hover:text-white transition-colors"
              title="Zoom Out (25%)"
              disabled={zoomLevel <= 0.25}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M5 8a1 1 0 011-1h4a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="text-xs text-[#b3b3b3] min-w-[45px] text-center font-mono">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="text-[#b3b3b3] hover:text-white transition-colors"
              title="Zoom In (400%)"
              disabled={zoomLevel >= 4}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M8 5a1 1 0 011 1v1h1a1 1 0 110 2H9v1a1 1 0 11-2 0V9H6a1 1 0 110-2h1V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={resetZoom}
              className="ml-1 text-[#666] hover:text-[#4a9eff] transition-colors text-xs"
              title="Reset to 100%"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Snap toggle */}
          <button
            onClick={toggleSnap}
            className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-colors ${
              snapEnabled 
                ? 'bg-[#4a9eff] hover:bg-[#3080df] text-white' 
                : 'bg-[#404040] hover:bg-[#505050] text-[#b3b3b3]'
            }`}
            title={snapEnabled ? 'Snap Enabled' : 'Snap Disabled'}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM13 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z" />
            </svg>
            Snap
          </button>

          {/* Track controls */}
          <button
            onClick={addTrack}
            className="px-3 py-1.5 bg-[#404040] hover:bg-[#505050] text-white rounded text-sm flex items-center gap-1 transition-colors"
            title="Add Track"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Track
          </button>

          {/* Timeline Export */}
          <button
            onClick={handleTimelineExport}
            disabled={isExportingTimeline || !tracks.some(track => track.clips.length > 0)}
            className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 transition-colors ${
              isExportingTimeline || !tracks.some(track => track.clips.length > 0)
                ? 'bg-[#404040] text-[#666] cursor-not-allowed'
                : 'bg-[#16a34a] hover:bg-[#15803d] text-white'
            }`}
            title={tracks.some(track => track.clips.length > 0) ? 'Export Timeline' : 'No clips to export'}
          >
            {isExportingTimeline ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Export Timeline
              </>
            )}
          </button>
        </div>
      </div>

      {/* Export Status Messages */}
      {exportStatus === 'success' && (
        <div className="mb-4 p-3 bg-green-900 bg-opacity-20 border border-green-500 text-green-300 rounded text-sm">
          ✓ Timeline exported successfully!
        </div>
      )}

      {exportStatus === 'error' && exportError && (
        <div className="mb-4 p-3 bg-red-900 bg-opacity-20 border border-red-500 text-red-300 rounded text-sm">
          ✗ {exportError}
        </div>
      )}

      {/* Export Progress Bar */}
      {isExportingTimeline && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[#b3b3b3]">Exporting Timeline...</span>
            <span className="text-sm text-[#b3b3b3]">{Math.round(exportProgress)}%</span>
          </div>
          <div className="w-full bg-[#2d2d2d] rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#16a34a] h-full transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Video Library (shows only videos used in timeline) */}
      <div className="mb-4 bg-[#1a1a1a] rounded-lg p-3">
        <div className="text-sm text-[#b3b3b3] mb-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
          Timeline Videos ({videosInTimeline.length})
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {videosInTimeline.length === 0 ? (
            <div className="text-[#666] text-xs py-2">No videos in timeline yet - drag from left library</div>
          ) : (
            videosInTimeline.map((video) => {
              // Calculate effective duration for this video
              const trim = getTrimPoints(video.path);
              let effectiveDuration = video.duration || 0;
              if (trim.inPoint !== undefined || trim.outPoint !== undefined) {
                const inPoint = trim.inPoint || 0;
                const outPoint = trim.outPoint || video.duration || 0;
                effectiveDuration = outPoint - inPoint;
              }
              
              const isSplit = video.isSplit || false;
              
              // Debug logging for split clips
              if (isSplit) {
                console.log('Split video in timeline library:', {
                  name: video.name,
                  path: video.path,
                  originalDuration: video.duration,
                  trim,
                  effectiveDuration,
                  isSplit
                });
              }
              
              return (
                <div
                  key={video.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, video, true)}
                  onClick={() => selectVideo(video.path)}
                  className={`
                    cursor-move rounded p-2 min-w-[140px] transition-all relative
                    ${isSplit 
                      ? 'bg-[#6b21a8] border-2 border-[#9d4edd] hover:border-[#c77dff]'
                      : 'bg-[#2d2d2d] border border-[#404040] hover:border-[#4a9eff]'
                    }
                    ${selectedVideo === video.path ? 'border-[#4a9eff] bg-[#323232]' : ''}
                  `}
                >
                  {isSplit && (
                    <div className="absolute -top-1 -left-1 bg-purple-500 text-white text-[8px] px-1.5 py-0.5 rounded font-bold">
                      SPLIT
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-[#666]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                    {video.isRecording && (
                      <div className="bg-red-500 text-white text-[10px] px-1 rounded">REC</div>
                    )}
                  </div>
                  <div className="text-xs text-white truncate mb-1">{video.name}</div>
                  <div className={`text-[10px] ${isSplit ? 'text-purple-300' : 'text-[#888]'}`}>
                    {formatTime(effectiveDuration)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Tracks */}
      <div className="space-y-2">
        {tracks.map((track, trackIndex) => (
          <div key={track.id} className="bg-[#1a1a1a] rounded-lg border border-[#404040]">
            {/* Track header */}
            <div className={`flex items-center justify-between p-2 border-b border-[#404040] ${activeTrack === track.id ? 'bg-[#2d2d2d]' : ''}`}>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTrack(track.id)}
                  className={`text-sm font-semibold ${activeTrack === track.id ? 'text-[#4a9eff]' : 'text-[#b3b3b3]'}`}
                >
                  {track.name}
                </button>
                <span className="text-xs text-[#666]">({track.clips.length} clips)</span>
              </div>
              {tracks.length > 1 && (
                <button
                  onClick={() => removeTrack(track.id)}
                  className="text-[#666] hover:text-red-500 transition-colors"
                  title="Remove Track"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>

            {/* Track timeline */}
            <div
              className="relative h-16 overflow-x-auto"
              onDragOver={(e) => handleDragOver(e, track.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDropOnTrack(e, track.id)}
              onClick={() => setSelectedClip(null)}
            >
              {/* Scrollable content wrapper */}
              <div
                className="relative h-full"
                style={{ width: `${totalDuration * pixelsPerSecond}px`, minWidth: '100%' }}
              >
              {/* Time ruler (background) */}
              <div className="absolute inset-0 flex">
                {Array.from({ length: Math.ceil(totalDuration / 10) }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 border-r border-[#404040]"
                    style={{ width: `${10 * pixelsPerSecond}px` }}
                  >
                    <div className="text-[10px] text-[#666] px-1">{i * 10}s</div>
                  </div>
                ))}
              </div>

              {/* Grid lines (shown when zoomed or snap enabled) */}
              {(zoomLevel > 1 || snapEnabled) && (
                <div className="absolute inset-0 flex pointer-events-none">
                  {Array.from({ length: Math.ceil(totalDuration) }).map((_, i) => (
                    <div
                      key={`grid-${i}`}
                      className="flex-shrink-0 border-r border-[#2a2a2a]"
                      style={{ width: `${pixelsPerSecond}px` }}
                    />
                  ))}
                </div>
              )}

              {/* Highlight Markers - Show for selected video */}
              {selectedVideo && (() => {
                const suggestions = getTrimSuggestions(selectedVideo);
                // Only show highlight suggestions
                const highlights = suggestions.filter(s => s.type === 'create_highlight');
                return highlights.map((suggestion, index) => {
                  // Only show markers that fall within the timeline duration
                  if (suggestion.startTime > totalDuration) return null;

                  const markerLeft = suggestion.startTime * pixelsPerSecond;
                  const markerWidth = Math.max((suggestion.endTime - suggestion.startTime) * pixelsPerSecond, 4);

                  return (
                    <div
                      key={`highlight-${index}`}
                      className="absolute top-0 h-4 bg-blue-500 border border-blue-400 border-opacity-50 rounded cursor-pointer opacity-70 hover:opacity-100 transition-opacity z-10"
                      style={{
                        left: `${markerLeft}px`,
                        width: `${markerWidth}px`,
                      }}
                      title={`Highlight: ${suggestion.reason} (${Math.round(suggestion.confidence * 100)}%)`}
                    />
                  );
                });
              })()}

              {/* Clips */}
              {track.clips.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-[#666] text-xs">
                  Drop clips here
                </div>
              ) : (
                track.clips.map((clip) => {
                  const video = videos.find(v => v.path === clip.videoPath);
                  
                  // Calculate effective duration based on trim points
                  let effectiveDuration = clip.duration || 0;
                  if (video) {
                    const trim = getTrimPoints(video.path);
                    if (trim.inPoint !== undefined || trim.outPoint !== undefined) {
                      const inPoint = trim.inPoint || 0;
                      const outPoint = trim.outPoint || video.duration || 0;
                      effectiveDuration = outPoint - inPoint;
                    }
                  }
                  
                  const width = effectiveDuration * pixelsPerSecond;
                  const left = (clip.startTime || 0) * pixelsPerSecond;

                  // Check if this is a split clip
                  const isSplit = video?.isSplit || false;
                  
                  // Debug logging for clips on track
                  if (video && isSplit) {
                    console.log('Split clip on track:', {
                      clipVideoPath: clip.videoPath,
                      videoName: video.name,
                      videoPath: video.path,
                      clipDuration: clip.duration,
                      videoDuration: video.duration,
                      effectiveDuration,
                      isSplit,
                      trim: getTrimPoints(video.path)
                    });
                  }
                  
                  return (
                    <div
                      key={clip.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, clip, false, track.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (video) {
                          selectVideo(video.path);
                          setSelectedClip(clip);
                        }
                      }}
                      className={`absolute top-6 hover:bg-[#5aaaff] border-2 rounded cursor-move transition-colors flex items-center ${
                        selectedClip?.id === clip.id 
                          ? 'ring-2 ring-yellow-400 ring-opacity-75' 
                          : ''
                      } ${
                        isSplit 
                          ? 'bg-[#9d4edd] border-[#7b2cbf]' 
                          : 'bg-[#4a9eff] border-[#3080df]'
                      }`}
                      style={{
                        left: `${left}px`,
                        width: `${width}px`,
                        height: '36px',
                      }}
                    >
                      {isSplit && (
                        <div className="absolute -top-1 -left-1 bg-purple-500 text-white text-[8px] px-1 rounded-tl rounded-br">
                          SPLIT
                        </div>
                      )}
                      
                      {/* Thumbnail */}
                      <div className="flex-shrink-0 ml-1">
                        <VideoThumbnail 
                          videoPath={video?.path} 
                          timeOffset={0}
                          width={32}
                          height={20}
                          className="rounded"
                        />
                      </div>
                      
                      {/* Clip info */}
                      <div className="px-2 py-1 flex-1 flex flex-col justify-center overflow-hidden min-w-0">
                        <div className="text-xs text-white font-semibold truncate">
                          {video?.name || 'Unknown'}
                        </div>
                        <div className="text-[10px] text-blue-100">
                          {formatTime(effectiveDuration)}
                        </div>
                      </div>

                      {/* Remove clip button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeClipFromTrack(track.id, clip.id);
                        }}
                        className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  );
                })
              )}

              {/* Drop indicator */}
              {dropIndicatorTrack === track.id && dropIndicatorPosition !== null && (
                <div
                  className="absolute top-0 bottom-0 w-1 bg-green-500 z-20 pointer-events-none"
                  style={{
                    left: `${dropIndicatorPosition * pixelsPerSecond}px`,
                  }}
                >
                  <div className="absolute -top-2 -left-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="absolute -bottom-6 -left-8 bg-green-500 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                    {formatTime(dropIndicatorPosition)}
                  </div>
                </div>
              )}
              </div> {/* End scrollable content wrapper */}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {tracks.every(t => t.clips.length === 0) && videos.length === 0 && (
        <div className="mt-4 text-center text-[#666] text-sm py-8">
        <svg
          className="w-16 h-16 mx-auto text-[#404040] mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
          />
        </svg>
          <p>Import or record videos, then drag them to the timeline</p>
                  </div>
                )}
    </div>
  );
}

import React from 'react';
import { useVideoStore } from '../store/videoStore';
import { VideoThumbnail } from '../utils/thumbnailUtils.jsx';

export default function VideoGrid() {
  const { videos, selectVideo, selectedVideo } = useVideoStore();

  // Handle drag start for timeline integration
  const handleDragStart = (e, video) => {
    // Set drag data for timeline compatibility
    e.dataTransfer.effectAllowed = 'copy';
    const dragData = JSON.stringify({
      type: 'video',
      video: video
    });
    e.dataTransfer.setData('text/plain', dragData);
    
    // Add visual feedback
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    // Reset visual feedback
    e.target.style.opacity = '1';
  };

  if (videos.length === 0) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg border border-[#404040] p-4">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#4a9eff]" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 10a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2h10z" />
          </svg>
          Video Library
        </h3>
        <div className="flex items-center justify-center h-32 bg-[#2d2d2d] rounded border border-[#404040] border-dashed">
          <div className="text-center text-[#666]">
            <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 10a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2h10z" />
            </svg>
            <p className="text-sm">No videos imported yet</p>
            <p className="text-xs text-[#555]">Import videos or start recording</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#404040] p-4 flex flex-col h-[400px]">
      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2 flex-shrink-0">
        <svg className="w-5 h-5 text-[#4a9eff]" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 10a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2h10z" />
        </svg>
        Video Library ({videos.length})
      </h3>
      
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          {videos.map((video) => {
            const isSelected = selectedVideo === video.path;
            const isSplit = video.isSplit || false;
            
            return (
              <div
                key={video.id}
                draggable
                onDragStart={(e) => handleDragStart(e, video)}
                onDragEnd={handleDragEnd}
                onClick={() => selectVideo(video.path)}
                className={`
                  cursor-move rounded-lg p-3 transition-all relative group
                  ${isSelected 
                    ? 'ring-2 ring-[#4a9eff] bg-[#2d2d2d]' 
                    : 'bg-[#2d2d2d] hover:bg-[#333] border border-[#404040] hover:border-[#4a9eff]'
                  }
                  ${isSplit 
                    ? 'border-purple-500' 
                    : ''
                  }
                `}
              >
                {/* Split indicator */}
                {isSplit && (
                  <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-[8px] px-1.5 py-0.5 rounded-tl rounded-br z-10">
                    SPLIT
                  </div>
                )}
                
                {/* Video thumbnail */}
                <div className="bg-black rounded mb-2 overflow-hidden relative" style={{ width: '100%', height: '112px' }}>
                  <div className="absolute inset-0 z-0">
                    <VideoThumbnail 
                      videoPath={video.path} 
                      timeOffset={0}
                      width={200}
                      height={112}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Play button overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center z-10 pointer-events-none">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white bg-opacity-90 rounded-full p-2">
                        <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Duration overlay */}
                  {video.duration && (
                    <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded z-20">
                      {Math.round(video.duration)}s
                    </div>
                  )}
                </div>
                
                {/* Video info */}
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-white truncate">
                    {video.name}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-[#b3b3b3]">
                    <span>{video.duration ? `${Math.round(video.duration)}s` : 'Unknown'}</span>
                    {video.isRecording && (
                      <span className="text-red-400 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                        Recording
                      </span>
                    )}
                  </div>
                  
                  {/* Recording type indicator */}
                  {video.recordingType && (
                    <div className="text-xs text-[#4a9eff] capitalize">
                      {video.recordingType} recording
                    </div>
                  )}
                </div>
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-[#4a9eff] bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 5a1 1 0 011 1v1h1a1 1 0 110 2H9v1a1 1 0 11-2 0V9H6a1 1 0 110-2h1V6a1 1 0 011-1z" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Grid info */}
      <div className="mt-3 text-xs text-[#666] text-center flex-shrink-0">
        Drag videos to timeline • Click to preview
      </div>
    </div>
  );
}

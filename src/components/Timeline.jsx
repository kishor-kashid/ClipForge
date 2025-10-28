import React from 'react';
import { useVideoStore } from '../store/videoStore';
import { formatTime } from '../utils/timeUtils';

export default function Timeline() {
  const { videos, selectedVideo, selectVideo } = useVideoStore();

  // No videos imported yet
  if (videos.length === 0) {
    return (
      <div className="bg-[#252525] rounded-lg border border-[#404040] p-8 text-center">
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
        <p className="text-[#b3b3b3] text-lg">No videos in timeline</p>
        <p className="text-[#666] text-sm mt-2">Import videos to see them here</p>
      </div>
    );
  }

  return (
    <div className="bg-[#252525] rounded-lg border border-[#404040] p-4">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-[#4a9eff]" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
        </svg>
        <h2 className="text-xl font-bold text-white">Timeline</h2>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2">
        {videos.map((video) => {
          const isSelected = selectedVideo === video.path;
          
          return (
            <div
              key={video.id}
              onClick={() => selectVideo(video.path)}
              className={`
                cursor-pointer transform transition-all duration-200
                ${isSelected 
                  ? 'ring-2 ring-[#4a9eff] bg-[#2d2d2d]' 
                  : 'hover:bg-[#323232] bg-[#2d2d2d] border border-[#404040]'
                }
                rounded-lg p-4 min-w-[180px] flex flex-col
              `}
            >
              {/* Video Icon */}
              <div className="flex items-start justify-between mb-2">
                <svg
                  className={`w-8 h-8 ${isSelected ? 'text-[#4a9eff]' : 'text-[#666]'}`}
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
                {isSelected && (
                  <div className="bg-[#4a9eff] text-white rounded-full p-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Video Name */}
              <h3 className={`font-semibold truncate mb-2 ${isSelected ? 'text-white' : 'text-[#b3b3b3]'}`}>
                {video.name}
              </h3>
              
              {/* Duration */}
              <div className="flex items-center gap-1 text-xs">
                <svg className="w-4 h-4 text-[#666]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className={`${isSelected ? 'text-[#4a9eff]' : 'text-[#666]'}`}>
                  {formatTime(video.duration)}
                </span>
              </div>
              
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#4a9eff] rounded-b-lg"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

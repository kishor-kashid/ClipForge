import React from 'react';
import { useVideoStore } from '../store/videoStore';
import { formatTime } from '../utils/timeUtils';

export default function Timeline() {
  const { videos, selectedVideo, selectVideo } = useVideoStore();

  // No videos imported yet
  if (videos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <svg
          className="w-16 h-16 mx-auto text-gray-400 mb-4"
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
        <p className="text-gray-600 text-lg">No videos in timeline</p>
        <p className="text-gray-500 text-sm mt-2">Import videos to see them here</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Timeline</h2>
      
      <div className="flex flex-wrap gap-4">
        {videos.map((video) => {
          const isSelected = selectedVideo === video.path;
          
          return (
            <div
              key={video.id}
              onClick={() => selectVideo(video.path)}
              className={`
                relative cursor-pointer transform transition-all duration-200
                ${isSelected 
                  ? 'ring-4 ring-blue-500 bg-blue-100' 
                  : 'hover:bg-gray-50 ring-2 ring-gray-200'
                }
                rounded-lg p-4 min-w-[200px] flex flex-col
              `}
            >
              {/* Video Icon */}
              <div className="flex items-center gap-3 mb-2">
                <svg
                  className="w-8 h-8 text-blue-600"
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
                  <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Video Name */}
              <h3 className="font-semibold text-gray-800 truncate mb-1">
                {video.name}
              </h3>
              
              {/* Duration */}
              <p className="text-sm text-gray-600">
                Duration: {formatTime(video.duration)}
              </p>
              
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-b-lg"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


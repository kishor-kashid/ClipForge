import React, { useState, useCallback } from 'react';
import { useVideoStore } from '../store/videoStore';
import { isValidVideoFile } from '../utils/fileUtils';

export default function VideoImport() {
  const { addVideo } = useVideoStore();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);

    const files = Array.from(e.dataTransfer.files);
    
    if (files.length === 0) {
      return;
    }

    // Process each dropped file
    files.forEach((file) => {
      if (!isValidVideoFile(file.name)) {
        setError(`Invalid file format: ${file.name}. Supported formats: MP4, MOV, WebM`);
        return;
      }

      // Create video object (for now, we'll use the file object as-is)
      // In PR #3, we'll add file picker and proper path handling
      const video = {
        path: file.path || file.name, // Fallback to name if path not available
        name: file.name,
        duration: 0, // Will be populated later
        file: file, // Store the file object
      };

      addVideo(video);
    });
  }, [addVideo]);

  const handleFileInput = useCallback((e) => {
    const files = Array.from(e.target.files);
    setError(null);

    files.forEach((file) => {
      if (!isValidVideoFile(file.name)) {
        setError(`Invalid file format: ${file.name}. Supported formats: MP4, MOV, WebM`);
        return;
      }

      const video = {
        path: file.path || file.name,
        name: file.name,
        duration: 0,
        file: file,
      };

      addVideo(video);
    });

    // Reset input
    e.target.value = '';
  }, [addVideo]);

  const handleSelectFiles = useCallback(async () => {
    // Check if running in Electron
    if (window.electronAPI && window.electronAPI.selectVideoFiles) {
      try {
        const result = await window.electronAPI.selectVideoFiles();
        
        if (result.canceled) {
          return;
        }

        setError(null);

        // Process selected file paths
        result.filePaths.forEach((filePath) => {
          const fileName = filePath.split(/[\\/]/).pop(); // Get filename from path
          
          if (!isValidVideoFile(fileName)) {
            setError(`Invalid file format: ${fileName}. Supported formats: MP4, MOV, WebM`);
            return;
          }

          const video = {
            path: filePath,
            name: fileName,
            duration: 0,
          };

          addVideo(video);
        });
      } catch (err) {
        setError(`Failed to select files: ${err.message}`);
      }
    } else {
      // Fallback to HTML file input in browser mode
      document.getElementById('file-input-fallback')?.click();
    }
  }, [addVideo]);

  const dropZoneClasses = `
    flex flex-col items-center justify-center
    min-h-[150px] border-2 border-dashed rounded-lg
    transition-colors duration-200
    ${isDragging
      ? 'border-[#4a9eff] bg-[#1e3a5f]' 
      : 'border-[#404040] hover:border-[#4a9eff] bg-[#252525]'
    }
    ${error ? 'border-red-500' : ''}
  `;

  return (
    <div className="w-full">
      <div
        className={dropZoneClasses}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <svg
          className="w-12 h-12 text-[#666] mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        
        {isDragging ? (
          <p className="text-lg font-semibold text-[#4a9eff]">
            Drop your video files here
          </p>
        ) : (
          <>
            <p className="text-sm font-semibold text-[#b3b3b3] mb-1">
              Drag & drop video files here
            </p>
            <p className="text-xs text-[#666] mb-3">
              MP4, MOV, WebM
            </p>
            <button
              onClick={handleSelectFiles}
              className="px-6 py-2 bg-[#4a9eff] text-white rounded hover:bg-[#3a8eef] cursor-pointer transition-colors font-medium text-sm"
            >
              Select Files
            </button>
            {/* Hidden file input as fallback for browser mode */}
            <input
              id="file-input-fallback"
              type="file"
              multiple
              accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
              onChange={handleFileInput}
              className="hidden"
            />
          </>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-900 bg-opacity-20 border border-red-500 text-red-300 rounded text-sm">
          {error}
        </div>
      )}
    </div>
  );
}


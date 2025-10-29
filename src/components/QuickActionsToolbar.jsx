import React from 'react';
import { useVideoStore } from '../store/videoStore';
import { useToast } from './ToastProvider';

export default function QuickActionsToolbar() {
  const {
    selectedClip,
    setSelectedClip,
    removeVideo,
    tracks,
    removeClipFromTrack,
    zoomLevel,
    setZoomLevel,
    resetZoom,
    zoomIn,
    zoomOut,
    videos,
    addClipToTrack,
    activeTrack,
    undo,
    redo,
    canUndo,
    canRedo
  } = useVideoStore();
  const { addToast } = useToast();

  const handleUndo = () => {
    if (canUndo()) {
      const success = undo();
      if (success) {
        addToast('Undo completed', 'info');
      }
    }
  };

  const handleRedo = () => {
    if (canRedo()) {
      const success = redo();
      if (success) {
        addToast('Redo completed', 'info');
      }
    }
  };

  const handleDeleteClip = () => {
    if (selectedClip) {
      // Find which track contains this clip
      const track = tracks.find(t => t.clips.some(c => c.id === selectedClip.id));
      if (track) {
        removeClipFromTrack(track.id, selectedClip.id);
        setSelectedClip(null);
        addToast('Clip deleted', 'info');
      }
    }
  };

  const handleDuplicateClip = () => {
    if (selectedClip) {
      const track = tracks.find(t => t.clips.some(c => c.id === selectedClip.id));
      if (track) {
        const video = videos.find(v => v.path === selectedClip.videoPath);
        if (video) {
          const newClip = {
            ...selectedClip,
            id: `${selectedClip.id}-duplicate-${Date.now()}`,
            startTime: (selectedClip.startTime || 0) + (selectedClip.duration || 0) + 0.1 // Place after original
          };
          addClipToTrack(track.id, newClip);
          addToast('Clip duplicated', 'success');
        }
      }
    }
  };

  const handleZoomPreset = (preset) => {
    switch (preset) {
      case 'fit':
        // Calculate zoom to fit all clips
        let maxEnd = 0;
        tracks.forEach(track => {
          track.clips.forEach(clip => {
            const end = (clip.startTime || 0) + (clip.duration || 0);
            maxEnd = Math.max(maxEnd, end);
          });
        });
        if (maxEnd > 0) {
          // Fit to show all content with some padding
          const targetZoom = Math.max(0.25, Math.min(4, 800 / (maxEnd * 10)));
          setZoomLevel(targetZoom);
        }
        break;
      case '50':
        setZoomLevel(0.5);
        break;
      case '100':
        setZoomLevel(1);
        break;
      case '200':
        setZoomLevel(2);
        break;
      default:
        break;
    }
  };

  const canDelete = selectedClip !== null;
  const canDuplicate = selectedClip !== null;

  return (
    <div className="bg-[#1a1a1a] border-b border-[#404040] px-4 py-2 flex items-center gap-3">
      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleUndo}
          disabled={!canUndo()}
          className={`px-2 py-1 rounded text-sm flex items-center gap-1 transition-colors ${
            canUndo() 
              ? 'bg-[#404040] hover:bg-[#505050] text-white' 
              : 'bg-[#404040] text-[#666] cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Undo
        </button>
        <button
          onClick={handleRedo}
          disabled={!canRedo()}
          className={`px-2 py-1 rounded text-sm flex items-center gap-1 transition-colors ${
            canRedo() 
              ? 'bg-[#404040] hover:bg-[#505050] text-white' 
              : 'bg-[#404040] text-[#666] cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Y)"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Redo
        </button>
      </div>

      <div className="w-px h-6 bg-[#404040]" />

      {/* Delete */}
      <button
        onClick={handleDeleteClip}
        disabled={!canDelete}
        className={`px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors ${
          canDelete
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-[#404040] text-[#666] cursor-not-allowed'
        }`}
        title="Delete selected clip"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        Delete
      </button>

      {/* Duplicate */}
      <button
        onClick={handleDuplicateClip}
        disabled={!canDuplicate}
        className={`px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors ${
          canDuplicate
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-[#404040] text-[#666] cursor-not-allowed'
        }`}
        title="Duplicate selected clip"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
          <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a2 2 0 012-2 3 3 0 003-3h2a2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
        </svg>
        Duplicate
      </button>

      <div className="w-px h-6 bg-[#404040]" />

      {/* Zoom presets */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-[#b3b3b3] mr-1">Zoom:</span>
        <button
          onClick={() => handleZoomPreset('fit')}
          className="px-2 py-1 bg-[#404040] hover:bg-[#505050] text-white rounded text-xs transition-colors"
          title="Fit to content"
        >
          Fit
        </button>
        <button
          onClick={() => handleZoomPreset('50')}
          className={`px-2 py-1 rounded text-xs transition-colors ${
            zoomLevel === 0.5 ? 'bg-[#4a9eff] text-white' : 'bg-[#404040] hover:bg-[#505050] text-white'
          }`}
          title="50% zoom"
        >
          50%
        </button>
        <button
          onClick={() => handleZoomPreset('100')}
          className={`px-2 py-1 rounded text-xs transition-colors ${
            zoomLevel === 1 ? 'bg-[#4a9eff] text-white' : 'bg-[#404040] hover:bg-[#505050] text-white'
          }`}
          title="100% zoom"
        >
          100%
        </button>
        <button
          onClick={() => handleZoomPreset('200')}
          className={`px-2 py-1 rounded text-xs transition-colors ${
            zoomLevel === 2 ? 'bg-[#4a9eff] text-white' : 'bg-[#404040] hover:bg-[#505050] text-white'
          }`}
          title="200% zoom"
        >
          200%
        </button>
      </div>

      <div className="w-px h-6 bg-[#404040]" />

      {/* Current zoom level */}
      <div className="text-xs text-[#b3b3b3]">
        {Math.round(zoomLevel * 100)}%
      </div>
    </div>
  );
}

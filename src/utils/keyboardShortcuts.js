import React from 'react';
import { useVideoStore } from '../store/videoStore';

/**
 * Keyboard shortcuts for video editing
 * Space: Play/Pause
 * I: Set In Point
 * O: Set Out Point
 * S: Split at playhead
 * Delete: Remove selected clip
 * Ctrl+Z: Undo
 * Ctrl+Y: Redo
 * Ctrl+S: Quick export
 */
export const useKeyboardShortcuts = () => {
  const {
    isPlaying,
    currentTime,
    selectedVideo,
    playVideo,
    pauseVideo,
    setTrimIn,
    setTrimOut,
    addVideo,
    removeVideo,
    selectedClip,
    setSelectedClip,
    tracks,
    splitClip,
    exportVideo,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useVideoStore();

  const handleKeyDown = (event) => {
    // Don't trigger shortcuts when typing in inputs
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.contentEditable === 'true') {
      return;
    }

    const { key, ctrlKey, metaKey } = event;
    const isCtrlOrCmd = ctrlKey || metaKey;

    switch (key) {
      case ' ':
        // Space: Play/Pause
        event.preventDefault();
        if (isPlaying) {
          pauseVideo();
        } else {
          playVideo();
        }
        break;

      case 'i':
      case 'I':
        // I: Set In Point
        event.preventDefault();
        if (selectedVideo && currentTime !== null) {
          setInPoint(selectedVideo, currentTime);
          console.log(`In point set to ${currentTime}s`);
        }
        break;

      case 'o':
      case 'O':
        // O: Set Out Point
        event.preventDefault();
        if (selectedVideo && currentTime !== null) {
          setOutPoint(selectedVideo, currentTime);
          console.log(`Out point set to ${currentTime}s`);
        }
        break;

      case 's':
      case 'S':
        // S: Split at playhead (if not Ctrl+S)
        if (!isCtrlOrCmd) {
          event.preventDefault();
          if (selectedClip && currentTime !== null) {
            const track = tracks.find(t => t.clips.some(c => c.id === selectedClip.id));
            if (track) {
              splitClip(selectedClip.videoPath, currentTime);
              console.log(`Clip split at ${currentTime}s`);
            }
          }
        }
        // Ctrl+S: Quick export
        else {
          event.preventDefault();
          if (selectedVideo) {
            exportVideo();
            console.log('Quick export triggered');
          }
        }
        break;

      case 'Delete':
      case 'Backspace':
        // Delete: Remove selected clip
        event.preventDefault();
        if (selectedClip) {
          removeVideo(selectedClip.videoPath);
          setSelectedClip(null);
          console.log('Selected clip removed');
        }
        break;

      case 'z':
      case 'Z':
        // Ctrl+Z: Undo
        if (isCtrlOrCmd) {
          event.preventDefault();
          if (canUndo()) {
            undo();
            console.log('Undo executed');
          }
        }
        break;

      case 'y':
      case 'Y':
        // Ctrl+Y: Redo
        if (isCtrlOrCmd) {
          event.preventDefault();
          if (canRedo()) {
            redo();
            console.log('Redo executed');
          }
        }
        break;

      default:
        break;
    }
  };

  return { handleKeyDown };
};

/**
 * Hook to add keyboard shortcuts to a component
 */
export const useKeyboardShortcutsEffect = () => {
  const { handleKeyDown } = useKeyboardShortcuts();

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

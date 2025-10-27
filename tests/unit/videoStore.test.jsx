import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { VideoProvider, useVideoStore } from '../../src/store/videoStore';

// Wrapper component for testing
const wrapper = ({ children }) => <VideoProvider>{children}</VideoProvider>;

describe('videoStore', () => {
  describe('addVideo', () => {
    it('should add a video to the store', () => {
      const { result } = renderHook(() => useVideoStore(), { wrapper });

      act(() => {
        result.current.addVideo({
          path: '/path/to/video.mp4',
          name: 'test-video.mp4',
          duration: 120,
        });
      });

      expect(result.current.videos).toHaveLength(1);
      expect(result.current.videos[0].name).toBe('test-video.mp4');
      expect(result.current.videos[0].duration).toBe(120);
    });

    it('should not add duplicate videos', () => {
      const { result } = renderHook(() => useVideoStore(), { wrapper });

      act(() => {
        result.current.addVideo({
          path: '/path/to/video.mp4',
          name: 'test-video.mp4',
          duration: 120,
        });
        
        result.current.addVideo({
          path: '/path/to/video.mp4',
          name: 'test-video.mp4',
          duration: 120,
        });
      });

      expect(result.current.videos).toHaveLength(1);
    });

    it('should auto-select first video', () => {
      const { result } = renderHook(() => useVideoStore(), { wrapper });

      act(() => {
        result.current.addVideo({
          path: '/path/to/video.mp4',
          name: 'test-video.mp4',
          duration: 120,
        });
      });

      expect(result.current.selectedVideo).toBe('/path/to/video.mp4');
    });

    it('should not add video with invalid data', () => {
      const { result } = renderHook(() => useVideoStore(), { wrapper });

      act(() => {
        result.current.addVideo(null);
        result.current.addVideo({});
        result.current.addVideo({ name: 'test.mp4' });
      });

      expect(result.current.videos).toHaveLength(0);
    });
  });

  describe('removeVideo', () => {
    it('should remove a video from the store', () => {
      const { result } = renderHook(() => useVideoStore(), { wrapper });

      act(() => {
        result.current.addVideo({ path: '/path/to/video1.mp4', name: 'video1.mp4' });
        result.current.addVideo({ path: '/path/to/video2.mp4', name: 'video2.mp4' });
      });

      act(() => {
        result.current.removeVideo('/path/to/video1.mp4');
      });

      expect(result.current.videos).toHaveLength(1);
      expect(result.current.videos[0].path).toBe('/path/to/video2.mp4');
    });

    it('should select another video when removing selected video', () => {
      const { result } = renderHook(() => useVideoStore(), { wrapper });

      act(() => {
        result.current.addVideo({ path: '/path/to/video1.mp4', name: 'video1.mp4' });
        result.current.addVideo({ path: '/path/to/video2.mp4', name: 'video2.mp4' });
        result.current.selectVideo('/path/to/video1.mp4');
      });

      expect(result.current.selectedVideo).toBe('/path/to/video1.mp4');

      act(() => {
        result.current.removeVideo('/path/to/video1.mp4');
      });

      expect(result.current.selectedVideo).toBe('/path/to/video2.mp4');
    });

    it('should set selected video to null when removing last video', () => {
      const { result } = renderHook(() => useVideoStore(), { wrapper });

      act(() => {
        result.current.addVideo({ path: '/path/to/video1.mp4', name: 'video1.mp4' });
      });

      act(() => {
        result.current.removeVideo('/path/to/video1.mp4');
      });

      expect(result.current.selectedVideo).toBe(null);
      expect(result.current.videos).toHaveLength(0);
    });
  });

  describe('updateVideo', () => {
    it('should update video metadata', () => {
      const { result } = renderHook(() => useVideoStore(), { wrapper });

      act(() => {
        result.current.addVideo({
          path: '/path/to/video.mp4',
          name: 'video.mp4',
          duration: 100,
        });
      });

      act(() => {
        result.current.updateVideo('/path/to/video.mp4', { duration: 200 });
      });

      expect(result.current.videos[0].duration).toBe(200);
      expect(result.current.videos[0].name).toBe('video.mp4');
    });

    it('should not update non-existent video', () => {
      const { result } = renderHook(() => useVideoStore(), { wrapper });

      act(() => {
        result.current.updateVideo('/nonexistent.mp4', { duration: 200 });
      });

      expect(result.current.videos).toHaveLength(0);
    });
  });

  describe('selectVideo', () => {
    it('should select a video', () => {
      const { result } = renderHook(() => useVideoStore(), { wrapper });

      act(() => {
        result.current.addVideo({ path: '/path/to/video1.mp4', name: 'video1.mp4' });
        result.current.addVideo({ path: '/path/to/video2.mp4', name: 'video2.mp4' });
        result.current.selectVideo('/path/to/video2.mp4');
      });

      expect(result.current.selectedVideo).toBe('/path/to/video2.mp4');
    });
  });

  describe('getSelectedVideoObject', () => {
    it('should return the selected video object', () => {
      const { result } = renderHook(() => useVideoStore(), { wrapper });

      act(() => {
        result.current.addVideo({
          path: '/path/to/video.mp4',
          name: 'video.mp4',
          duration: 120,
        });
      });

      const selected = result.current.getSelectedVideoObject();
      expect(selected).not.toBeNull();
      expect(selected.path).toBe('/path/to/video.mp4');
      expect(selected.name).toBe('video.mp4');
    });

    it('should return null when no video is selected', () => {
      const { result } = renderHook(() => useVideoStore(), { wrapper });

      const selected = result.current.getSelectedVideoObject();
      expect(selected).toBeNull();
    });
  });
});


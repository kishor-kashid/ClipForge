import { describe, it, expect } from 'vitest';
import {
  isValidVideoFile,
  getFileExtension,
  getFileNameWithoutExtension,
  SUPPORTED_VIDEO_EXTENSIONS,
} from '../../src/utils/fileUtils';

describe('fileUtils', () => {
  describe('isValidVideoFile', () => {
    it('should return true for MP4 files', () => {
      expect(isValidVideoFile('video.mp4')).toBe(true);
      expect(isValidVideoFile('VIDEO.MP4')).toBe(true);
      expect(isValidVideoFile('my-video.mp4')).toBe(true);
    });

    it('should return true for MOV files', () => {
      expect(isValidVideoFile('video.mov')).toBe(true);
      expect(isValidVideoFile('video.MOV')).toBe(true);
    });

    it('should return true for WebM files', () => {
      expect(isValidVideoFile('video.webm')).toBe(true);
      expect(isValidVideoFile('video.WEBM')).toBe(true);
    });

    it('should return false for unsupported formats', () => {
      expect(isValidVideoFile('video.avi')).toBe(false);
      expect(isValidVideoFile('video.mkv')).toBe(false);
      expect(isValidVideoFile('video.txt')).toBe(false);
      expect(isValidVideoFile('video.pdf')).toBe(false);
    });

    it('should return false for invalid input', () => {
      expect(isValidVideoFile(null)).toBe(false);
      expect(isValidVideoFile(undefined)).toBe(false);
      expect(isValidVideoFile('')).toBe(false);
      expect(isValidVideoFile(123)).toBe(false);
    });

    it('should handle files with multiple dots', () => {
      expect(isValidVideoFile('my.video.file.mp4')).toBe(true);
      expect(isValidVideoFile('my-video.backup.mov')).toBe(true);
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extension with dot', () => {
      expect(getFileExtension('video.mp4')).toBe('.mp4');
      expect(getFileExtension('video.mov')).toBe('.mov');
      expect(getFileExtension('video.webm')).toBe('.webm');
    });

    it('should handle uppercase extensions', () => {
      expect(getFileExtension('video.MP4')).toBe('.MP4');
      expect(getFileExtension('VIDEO.MOV')).toBe('.MOV');
    });

    it('should return empty string for files without extension', () => {
      expect(getFileExtension('video')).toBe('');
    });

    it('should handle filenames with multiple dots', () => {
      expect(getFileExtension('my.video.mp4')).toBe('.mp4');
      expect(getFileExtension('backup.copy.2024.webm')).toBe('.webm');
    });

    it('should return empty string for invalid input', () => {
      expect(getFileExtension(null)).toBe('');
      expect(getFileExtension(undefined)).toBe('');
      expect(getFileExtension('')).toBe('');
      expect(getFileExtension(123)).toBe('');
    });
  });

  describe('getFileNameWithoutExtension', () => {
    it('should remove file extension', () => {
      expect(getFileNameWithoutExtension('video.mp4')).toBe('video');
      expect(getFileNameWithoutExtension('my-video.mov')).toBe('my-video');
      expect(getFileNameWithoutExtension('file.webm')).toBe('file');
    });

    it('should handle filenames with multiple dots', () => {
      expect(getFileNameWithoutExtension('my.video.mp4')).toBe('my.video');
      expect(getFileNameWithoutExtension('backup.copy.webm')).toBe('backup.copy');
    });

    it('should return filename as-is when no extension', () => {
      expect(getFileNameWithoutExtension('video')).toBe('video');
      expect(getFileNameWithoutExtension('my-file')).toBe('my-file');
    });

    it('should return empty string for invalid input', () => {
      expect(getFileNameWithoutExtension(null)).toBe('');
      expect(getFileNameWithoutExtension(undefined)).toBe('');
      expect(getFileNameWithoutExtension('')).toBe('');
      expect(getFileNameWithoutExtension(123)).toBe('');
    });
  });

  describe('SUPPORTED_VIDEO_EXTENSIONS', () => {
    it('should contain expected extensions', () => {
      expect(SUPPORTED_VIDEO_EXTENSIONS).toContain('.mp4');
      expect(SUPPORTED_VIDEO_EXTENSIONS).toContain('.mov');
      expect(SUPPORTED_VIDEO_EXTENSIONS).toContain('.webm');
    });
  });
});


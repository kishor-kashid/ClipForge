import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VideoProvider } from '../../src/store/videoStore';
import VideoImport from '../../src/components/VideoImport';

const TestWrapper = ({ children }) => <VideoProvider>{children}</VideoProvider>;

describe('VideoImport - Integration Tests', () => {
  describe('drag and drop', () => {
    it('should handle drag over event', () => {
      render(<VideoImport />, { wrapper: TestWrapper });
      
      const dropZone = screen.getByText(/drag & drop video files here/i).closest('div');
      
      fireEvent.dragOver(dropZone, {
        dataTransfer: {
          files: [new File([''], 'test.mp4', { type: 'video/mp4' })],
        },
      });
      
      expect(screen.getByText(/drop your video files here/i)).toBeInTheDocument();
    });

    it('should handle drag leave event', () => {
      render(<VideoImport />, { wrapper: TestWrapper });
      
      const dropZone = screen.getByText(/drag & drop video files here/i).closest('div');
      
      fireEvent.dragOver(dropZone);
      expect(screen.getByText(/drop your video files here/i)).toBeInTheDocument();
      
      fireEvent.dragLeave(dropZone);
      expect(screen.getByText(/drag & drop video files here/i)).toBeInTheDocument();
    });

    it('should accept valid MP4 file', () => {
      const mockVideo = {
        path: 'test.mp4',
        name: 'test.mp4',
        duration: 0,
      };
      
      render(<VideoImport />, { wrapper: TestWrapper });
      
      const dropZone = screen.getByText(/drag & drop video files here/i).closest('div');
      const file = new File([''], 'test.mp4', { type: 'video/mp4' });
      
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      });
      
      // File should be processed (no error message means success)
      expect(screen.queryByText(/invalid file format/i)).not.toBeInTheDocument();
    });

    it('should accept valid MOV file', () => {
      render(<VideoImport />, { wrapper: TestWrapper });
      
      const dropZone = screen.getByText(/drag & drop video files here/i).closest('div');
      const file = new File([''], 'test.mov', { type: 'video/quicktime' });
      
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      });
      
      expect(screen.queryByText(/invalid file format/i)).not.toBeInTheDocument();
    });

    it('should accept valid WebM file', () => {
      render(<VideoImport />, { wrapper: TestWrapper });
      
      const dropZone = screen.getByText(/drag & drop video files here/i).closest('div');
      const file = new File([''], 'test.webm', { type: 'video/webm' });
      
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      });
      
      expect(screen.queryByText(/invalid file format/i)).not.toBeInTheDocument();
    });

    it('should reject invalid file format', () => {
      render(<VideoImport />, { wrapper: TestWrapper });
      
      const dropZone = screen.getByText(/drag & drop video files here/i).closest('div');
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      });
      
      expect(screen.getByText(/invalid file format/i)).toBeInTheDocument();
    });

    it('should reject invalid video format', () => {
      render(<VideoImport />, { wrapper: TestWrapper });
      
      const dropZone = screen.getByText(/drag & drop video files here/i).closest('div');
      const file = new File([''], 'test.avi', { type: 'video/x-msvideo' });
      
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      });
      
      expect(screen.getByText(/invalid file format/i)).toBeInTheDocument();
    });
  });

  describe('file input', () => {
    it('should handle file selection via input', () => {
      render(<VideoImport />, { wrapper: TestWrapper });
      
      const input = document.getElementById('file-input-fallback');
      const file = new File([''], 'test.mp4', { type: 'video/mp4' });
      
      fireEvent.change(input, {
        target: { files: [file] },
      });
      
      expect(screen.queryByText(/invalid file format/i)).not.toBeInTheDocument();
    });

    it('should accept multiple files', () => {
      render(<VideoImport />, { wrapper: TestWrapper });
      
      const input = document.getElementById('file-input-fallback');
      const files = [
        new File([''], 'test1.mp4', { type: 'video/mp4' }),
        new File([''], 'test2.mov', { type: 'video/quicktime' }),
      ];
      
      fireEvent.change(input, {
        target: { files: files },
      });
      
      expect(screen.queryByText(/invalid file format/i)).not.toBeInTheDocument();
    });
  });
});


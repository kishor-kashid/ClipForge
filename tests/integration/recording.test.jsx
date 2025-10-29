import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VideoProvider } from '../../src/store/videoStore';
import { ToastProvider } from '../../src/components/ToastProvider';
import RecordingPanel from '../../src/components/RecordingPanel';

const TestWrapper = ({ children }) => (
  <VideoProvider>
    <ToastProvider>
      {children}
    </ToastProvider>
  </VideoProvider>
);

describe('RecordingPanel - Basic Functionality', () => {
  it('should render recording panel component', () => {
    render(<RecordingPanel />, { wrapper: TestWrapper });
    
    // Should show the recording interface - be more specific about which "Recording" text
    expect(screen.getByRole('heading', { name: /recording/i })).toBeInTheDocument();
  });

  it('should show recording mode buttons', () => {
    render(<RecordingPanel />, { wrapper: TestWrapper });
    
    // Should show mode selection buttons
    expect(screen.getByRole('button', { name: /screen/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /webcam/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pip/i })).toBeInTheDocument();
  });

  it('should show start recording button', () => {
    render(<RecordingPanel />, { wrapper: TestWrapper });
    
    // Should show the main recording button
    expect(screen.getByRole('button', { name: /start recording/i })).toBeInTheDocument();
  });
});

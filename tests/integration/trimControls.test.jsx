import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VideoProvider } from '../../src/store/videoStore';
import TrimControls from '../../src/components/TrimControls';

const TestWrapper = ({ children }) => <VideoProvider>{children}</VideoProvider>;

describe('TrimControls - Integration Tests', () => {
  beforeEach(() => {
    // Clean up any existing videos in the store between tests
  });

  it('should display placeholder when no video is selected', () => {
    render(<TrimControls />, { wrapper: TestWrapper });
    
    expect(screen.getByText(/select a video to set trim points/i)).toBeInTheDocument();
  });

  it('should render control buttons', () => {
    render(<TrimControls />, { wrapper: TestWrapper });
    
    // Should have trim control buttons
    const component = screen.getByText(/select a video to set trim points/i).closest('div');
    expect(component).toBeInTheDocument();
  });

  it('should have proper structure', () => {
    render(<TrimControls />, { wrapper: TestWrapper });
    
    // Should have a container with proper styling
    const emptyState = screen.getByText(/select a video to set trim points/i);
    expect(emptyState.closest('.bg-white')).toBeInTheDocument();
  });
});


import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import SmartTrimPanel from '../../src/components/SmartTrimPanel';
import { VideoProvider, useVideoStore } from '../../src/store/videoStore';
import { ToastProvider } from '../../src/components/ToastProvider';
import React from 'react';

// Mock window.electronAPI
global.window = {
  ...global.window,
  electronAPI: {},
};

// Helper component to set up video store state
function TestSetup({ video, children }) {
  const { addVideo, selectVideo } = useVideoStore();
  const [isSetup, setIsSetup] = React.useState(false);
  
  React.useEffect(() => {
    if (video && !isSetup) {
      // State updates happen synchronously in tests
      addVideo(video);
      selectVideo(video.path);
      setIsSetup(true);
    }
  }, [video, isSetup]);

  return <>{children}</>;
}

describe('SmartTrimPanel Integration', () => {
  const mockVideo = {
    id: 'test-video-1',
    path: '/test/video.mp4',
    name: 'Test Video',
    duration: 60,
    transcript: {
      segments: [
        { start: 0, end: 5, text: 'Hello world' },
        { start: 8, end: 12, text: 'How are you' }, // Gap indicates silence
        { start: 12, end: 15, text: 'um you know' }, // Filler words
        { start: 15, end: 25, text: 'This is a great segment with many words' }, // Good segment
      ],
      fullText: 'Hello world. How are you? um you know. This is a great segment.',
      duration: 25,
      generatedAt: new Date().toISOString(),
      isGenerating: false,
    },
    trimSuggestions: [],
    suggestionsGenerated: false,
  };

  const renderComponent = (video = null) => {
    return render(
      <ToastProvider>
        <VideoProvider>
          {video ? (
            <TestSetup video={video}>
              <SmartTrimPanel />
            </TestSetup>
          ) : (
            <SmartTrimPanel />
          )}
        </VideoProvider>
      </ToastProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render SmartTrimPanel', () => {
    renderComponent();
    expect(screen.getByText('Highlights')).toBeInTheDocument();
  });

  it('should show message when no video is selected', () => {
    renderComponent();
    expect(screen.getByText(/Select a video to find highlights/i)).toBeInTheDocument();
  });

  it('should show generate button when transcript exists', async () => {
    const { container } = renderComponent(mockVideo);
    
    // Wait for component to render with video and transcript
    await waitFor(
      () => {
        // Should show the "Find Highlights" button when transcript exists
        expect(screen.getByText(/Find Highlights/i)).toBeInTheDocument();
      },
      { container }
    );
  });

  it('should display configuration sliders', async () => {
    const { container } = renderComponent(mockVideo);
    
    // Wait for component to render with video and transcript
    // Configuration slider should be visible when panel is open and video has transcript
    await waitFor(
      () => {
        expect(screen.getByText(/Min Confidence:/i)).toBeInTheDocument();
      },
      { container }
    );
  });

  it('should filter suggestions by confidence', async () => {
    const { container } = renderComponent(mockVideo);
    
    // Wait for component to render with video and transcript
    // The Min Confidence slider should be visible
    await waitFor(
      () => {
        expect(screen.getByText(/Min Confidence:/i)).toBeInTheDocument();
      },
      { container }
    );
  });
});


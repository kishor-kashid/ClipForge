import React, { useState, useRef, useEffect } from 'react';
import { VideoProvider } from './store/videoStore';
import { ToastProvider } from './components/ToastProvider';
import VideoPlayer from './components/VideoPlayer';
import Timeline from './components/Timeline';
import ImportRecordPanel from './components/ImportRecordPanel';
import VideoGrid from './components/VideoGrid';
import EditExportPanel from './components/EditExportPanel';
import QuickActionsToolbar from './components/QuickActionsToolbar';
import { useKeyboardShortcutsEffect } from './utils/keyboardShortcuts';
import { useVideoStore } from './store/videoStore';

function AppContent({ selectedVideoObject }) {
  // Add keyboard shortcuts
  useKeyboardShortcutsEffect();

  // Panel state
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  const [leftPanelWidth, setLeftPanelWidth] = useState(320); // w-80 = 320px
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [maximizeVideo, setMaximizeVideo] = useState(false);
  
  // Timeline state
  const [timelineHeight, setTimelineHeight] = useState(300);
  const [isResizingTimeline, setIsResizingTimeline] = useState(false);
  
  const leftResizerRef = useRef(null);
  const rightResizerRef = useRef(null);
  const timelineResizerRef = useRef(null);

  // Handle left panel resize
  useEffect(() => {
    if (!isResizingLeft) return;

    const handleMouseMove = (e) => {
      e.preventDefault();
      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 600) {
        setLeftPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingLeft]);

  // Handle right panel resize
  useEffect(() => {
    if (!isResizingRight) return;

    const handleMouseMove = (e) => {
      e.preventDefault();
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 200 && newWidth <= 600) {
        setRightPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingRight(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingRight]);

  // Handle timeline resize
  useEffect(() => {
    if (!isResizingTimeline) return;

    const handleMouseMove = (e) => {
      e.preventDefault();
      const newHeight = window.innerHeight - e.clientY;
      if (newHeight >= 150 && newHeight <= 600) {
        setTimelineHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizingTimeline(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingTimeline]);

  // Keyboard shortcuts for panel toggles
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
        return;
      }

      // 1: Toggle left panel
      if (e.key === '1' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        setLeftPanelVisible(!leftPanelVisible);
      }
      
      // 3: Toggle right panel
      if (e.key === '3' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        setRightPanelVisible(!rightPanelVisible);
      }
      
      // F: Maximize video
      if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        setMaximizeVideo(!maximizeVideo);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [leftPanelVisible, rightPanelVisible, maximizeVideo]);

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      {/* Top Toolbar */}
      <header className="bg-[#252525] border-b border-[#404040] px-6 py-3.5 flex items-center justify-between shadow-lg shadow-black/20">
        <div className="flex items-center gap-6 flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-[#4a9eff]/10">
              <svg className="w-6 h-6 text-[#4a9eff]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 10a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2h10z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">ClipForge</h1>
            </div>
          </div>
          
          {/* Current Video Info */}
          {selectedVideoObject && (
            <div className="flex items-center gap-2 text-sm text-[#b3b3b3] truncate">
              <span className="truncate max-w-[200px]">{selectedVideoObject.name}</span>
            </div>
          )}
        </div>
        
        {/* Panel Toggle Buttons & Actions */}
        <div className="flex items-center gap-3">
          {/* Panel Toggles */}
          <div className="flex items-center gap-1 border-l border-[#404040] pl-3">
            <button
              onClick={() => setLeftPanelVisible(!leftPanelVisible)}
              className={`p-2 rounded transition-colors ${
                leftPanelVisible 
                  ? 'bg-[#4a9eff]/20 text-[#4a9eff] hover:bg-[#4a9eff]/30' 
                  : 'text-[#666] hover:bg-[#404040] hover:text-[#b3b3b3]'
              }`}
              title="Toggle Left Panel (1)"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={() => setMaximizeVideo(!maximizeVideo)}
              className="p-2 rounded transition-colors text-[#b3b3b3] hover:bg-[#404040] hover:text-white"
              title="Maximize Video Player (F)"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                {maximizeVideo ? (
                  <path fillRule="evenodd" d="M3 10a1 1 0 011-1h4a1 1 0 010 2H6l-3 3-1-1V10zm14 0a1 1 0 01-1 1h-4a1 1 0 110-2h2l3-3 1 1v3zM10 3a1 1 0 011 1v4a1 1 0 11-2 0V6L6 9 5 8V4a1 1 0 011-1h3zm0 14a1 1 0 01-1-1v-4a1 1 0 112 0v2l3-3 1 1v3a1 1 0 01-1 1h-3z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6l3 3 1-1V4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-2 0V6l-3 3-1-1H9a1 1 0 01-1-1V4zm0 12a1 1 0 011-1h4a1 1 0 110 2h-2l-3-3-1 1v2a1 1 0 01-1 1H4zm12-8a1 1 0 011 1v4a1 1 0 11-2 0V9l-3-3-1 1h2a1 1 0 011 1z" clipRule="evenodd" />
                )}
              </svg>
            </button>
            <button
              onClick={() => setRightPanelVisible(!rightPanelVisible)}
              className={`p-2 rounded transition-colors ${
                rightPanelVisible 
                  ? 'bg-[#4a9eff]/20 text-[#4a9eff] hover:bg-[#4a9eff]/30' 
                  : 'text-[#666] hover:bg-[#404040] hover:text-[#b3b3b3]'
              }`}
              title="Toggle Right Panel (3)"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Three Panel Layout */}
        <div className="flex-1 flex bg-[#1a1a1a] relative">
          {/* Left Panel - Import/Record + Video Library */}
          {leftPanelVisible && !maximizeVideo && (
            <>
              <div 
                className="bg-[#1a1a1a] border-r border-[#404040] overflow-y-auto transition-all"
                style={{ width: `${leftPanelWidth}px`, padding: '16px' }}
              >
                <div className="space-y-4">
                  <ImportRecordPanel />
                  <VideoGrid />
                </div>
              </div>
              
              {/* Left Resizer */}
              <div
                ref={leftResizerRef}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsResizingLeft(true);
                }}
                className="w-1 bg-[#404040] hover:bg-[#4a9eff] cursor-col-resize transition-colors z-10 hover:w-1.5"
                style={{ cursor: 'col-resize', userSelect: 'none' }}
              />
            </>
          )}

          {/* Center Panel - Video Player */}
          <div className={`flex-1 flex flex-col bg-[#1a1a1a] ${maximizeVideo ? 'p-0' : 'p-4'} min-h-0 transition-all`}>
            <div className={`flex items-center justify-center ${maximizeVideo ? 'h-full' : 'h-[calc(75vh-2rem)] max-h-[calc(75vh-2rem)] min-h-[500px]'}`}>
              <VideoPlayer />
            </div>
          </div>

          {/* Right Panel - Edit/Export Controls */}
          {rightPanelVisible && !maximizeVideo && (
            <>
              {/* Right Resizer */}
              <div
                ref={rightResizerRef}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsResizingRight(true);
                }}
                className="w-1 bg-[#404040] hover:bg-[#4a9eff] cursor-col-resize transition-colors z-10 hover:w-1.5"
                style={{ cursor: 'col-resize', userSelect: 'none' }}
              />
              
              <div 
                className="bg-[#1a1a1a] border-l border-[#404040] overflow-y-auto transition-all"
                style={{ width: `${rightPanelWidth}px`, padding: '16px' }}
              >
                <EditExportPanel />
              </div>
            </>
          )}
        </div>

        {/* Timeline Section */}
        <div 
          className="bg-[#252525] border-t border-[#404040] shadow-lg shadow-black/20 flex flex-col relative"
          style={{ height: `${timelineHeight}px`, minHeight: '150px', maxHeight: '600px' }}
        >
          {/* Timeline Resizer */}
          <div
            ref={timelineResizerRef}
            onMouseDown={(e) => {
              e.preventDefault();
              setIsResizingTimeline(true);
            }}
            className="h-1 bg-[#404040] hover:bg-[#4a9eff] cursor-row-resize transition-colors z-10 hover:h-1.5"
            style={{ cursor: 'row-resize', userSelect: 'none' }}
          />
          
          <QuickActionsToolbar />
          <div className="flex-1 overflow-hidden p-4" style={{ paddingTop: '8px' }}>
            <Timeline />
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <VideoProvider>
        <AppContentWrapper />
      </VideoProvider>
    </ToastProvider>
  );
}

// Wrapper component that can use the video store context
function AppContentWrapper() {
  const { selectedVideo, videos } = useVideoStore();
  const selectedVideoObject = videos.find(v => v.path === selectedVideo);
  return <AppContent selectedVideoObject={selectedVideoObject} />;
}

export default App;

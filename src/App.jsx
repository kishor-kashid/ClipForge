import React from 'react';
import { VideoProvider } from './store/videoStore';
import VideoImport from './components/VideoImport';
import VideoPlayer from './components/VideoPlayer';
import TrimControls from './components/TrimControls';
import ExportButton from './components/ExportButton';
import Timeline from './components/Timeline';
import RecordingPanel from './components/RecordingPanel';
import PipRecorder from './components/PipRecorder';

function App() {
  return (
    <VideoProvider>
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
        {/* Top Toolbar */}
        <header className="bg-[#252525] border-b border-[#404040] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <svg className="w-8 h-8 text-[#4a9eff]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 10a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2h10z" />
              </svg>
              <h1 className="text-2xl font-bold text-white">ClipForge</h1>
            </div>
            <span className="text-sm text-[#b3b3b3] px-3 py-1 bg-[#2d2d2d] rounded">
              Professional Video Editor
            </span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Preview Section */}
          <div className="flex-1 flex flex-col md:flex-row bg-[#1a1a1a]">
            {/* Left Panel - Preview */}
            <div className="flex-1 flex flex-col bg-[#1a1a1a] p-4">
              <VideoImport />
              <div className="mt-4 flex-1">
                <VideoPlayer />
              </div>
            </div>

            {/* Right Panel - Controls */}
            <div className="w-full md:w-96 bg-[#1a1a1a] border-t md:border-t-0 md:border-l border-[#404040] p-4 space-y-4 overflow-y-auto">
              <RecordingPanel />
              <PipRecorder />
              <TrimControls />
              <ExportButton />
            </div>
          </div>

          {/* Timeline Section */}
          <div className="bg-[#252525] border-t border-[#404040] p-4">
            <Timeline />
          </div>
        </main>
      </div>
    </VideoProvider>
  );
}

export default App;

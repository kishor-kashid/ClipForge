import React, { useState } from 'react';
import VideoImport from './VideoImport';
import RecordingPanel from './RecordingPanel';

export default function ImportRecordPanel() {
  const [isRecordingPanelOpen, setIsRecordingPanelOpen] = useState(true);

  return (
    <div className="space-y-4">
      <VideoImport />
      
      {/* Collapsible Recording Panel */}
      <div className="bg-[#252525] rounded-lg border border-[#404040] overflow-hidden shadow-lg shadow-black/20">
        {/* Recording Panel Header */}
        <button
          onClick={() => setIsRecordingPanelOpen(!isRecordingPanelOpen)}
          className="w-full px-5 py-3.5 bg-[#2d2d2d] hover:bg-[#333] transition-colors flex items-center justify-between text-left border-b border-[#404040]"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[#4a9eff]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14 10a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2h10z" />
            </svg>
            <span className="text-white font-semibold text-sm">Recording</span>
          </div>
          <svg 
            className={`w-5 h-5 text-[#b3b3b3] transition-transform duration-200 ${isRecordingPanelOpen ? 'rotate-180' : ''}`} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        
        {/* Recording Panel Content */}
        {isRecordingPanelOpen && (
          <div className="p-5">
            <RecordingPanel />
          </div>
        )}
      </div>
    </div>
  );
}

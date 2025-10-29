import React, { useState } from 'react';
import VideoImport from './VideoImport';
import RecordingPanel from './RecordingPanel';
import TrimControls from './TrimControls';
import ExportButton from './ExportButton';

function ControlPanel() {
  const [activeTab, setActiveTab] = useState('import');

  const tabs = [
    { id: 'import', label: 'Import & Record', icon: '📁' },
    { id: 'edit', label: 'Edit', icon: '✂️' },
    { id: 'export', label: 'Export', icon: '📤' }
  ];

  return (
    <div className="bg-[#2d2d2d] rounded-lg border border-[#404040] overflow-hidden">
      {/* Tab Headers */}
      <div className="flex border-b border-[#404040]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === tab.id
                ? 'bg-[#4a9eff] text-white'
                : 'bg-[#1a1a1a] text-[#b3b3b3] hover:bg-[#2d2d2d] hover:text-white'
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'import' && (
          <div className="space-y-4">
            <VideoImport />
            <RecordingPanel />
          </div>
        )}
        
        {activeTab === 'edit' && (
          <div className="space-y-4">
            <TrimControls />
          </div>
        )}
        
        {activeTab === 'export' && (
          <div className="space-y-4">
            <ExportButton />
          </div>
        )}
      </div>
    </div>
  );
}

export default ControlPanel;

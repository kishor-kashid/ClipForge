import React from 'react';
import TrimControls from './TrimControls';
import ExportButton from './ExportButton';
import TranscriptionPanel from './TranscriptionPanel';

export default function EditExportPanel() {
  return (
    <div className="space-y-4">
      <TranscriptionPanel />
      <TrimControls />
      <ExportButton />
    </div>
  );
}

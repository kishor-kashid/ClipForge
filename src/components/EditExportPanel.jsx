import React from 'react';
import TrimControls from './TrimControls';
import ExportButton from './ExportButton';
import TranscriptionPanel from './TranscriptionPanel';
import SmartTrimPanel from './SmartTrimPanel';

export default function EditExportPanel() {
  return (
    <div className="space-y-5">
      <TranscriptionPanel />
      <SmartTrimPanel />
      <TrimControls />
      <ExportButton />
    </div>
  );
}

import React from 'react';
import TrimControls from './TrimControls';
import ExportButton from './ExportButton';

export default function EditExportPanel() {
  return (
    <div className="space-y-4">
      <TrimControls />
      <ExportButton />
    </div>
  );
}

import React from 'react';
import VideoImport from './VideoImport';
import RecordingPanel from './RecordingPanel';

export default function ImportRecordPanel() {
  return (
    <div className="space-y-4">
      <VideoImport />
      <RecordingPanel />
    </div>
  );
}

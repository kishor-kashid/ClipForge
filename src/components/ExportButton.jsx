import React, { useState, useEffect } from 'react';
import { useVideoStore } from '../store/videoStore';

export default function ExportButton() {
  const { selectedVideo, getSelectedVideoObject, getTrimPoints } = useVideoStore();
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, exporting, success, error
  const [errorMessage, setErrorMessage] = useState(null);

  // Get the selected video object
  const selectedVideoObject = getSelectedVideoObject();

  // Setup progress listener
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onExportProgress) {
      window.electronAPI.onExportProgress((percent) => {
        setProgress(percent);
      });
    }

    return () => {
      if (window.electronAPI && window.electronAPI.removeExportProgressListener) {
        window.electronAPI.removeExportProgressListener();
      }
    };
  }, []);

  const handleExport = async () => {
    if (!selectedVideoObject) {
      setErrorMessage('No video selected');
      setStatus('error');
      return;
    }

    if (!window.electronAPI) {
      setErrorMessage('Export API not available');
      setStatus('error');
      return;
    }

    try {
      setIsExporting(true);
      setStatus('exporting');
      setProgress(0);
      setErrorMessage(null);

      // Step 1: Show save dialog
      const saveResult = await window.electronAPI.saveVideoFile();
      
      if (saveResult.canceled) {
        setIsExporting(false);
        setStatus('idle');
        return;
      }

      const outputPath = saveResult.filePath;

      // Step 2: Get trim points
      const trimData = getTrimPoints(selectedVideo);
      const { inPoint, outPoint } = trimData;
      
      // Calculate duration
      let duration = null;
      if (outPoint !== null && outPoint !== undefined) {
        duration = outPoint - inPoint;
      }

      // Step 3: Export video
      const exportResult = await window.electronAPI.exportVideo({
        inputPath: selectedVideoObject.path,
        outputPath: outputPath,
        startTime: inPoint || 0,
        duration: duration,
      });

      if (exportResult.success) {
        setStatus('success');
        setProgress(100);
        // Reset after 3 seconds
        setTimeout(() => {
          setStatus('idle');
          setProgress(0);
        }, 3000);
      } else {
        setErrorMessage(exportResult.error || 'Export failed');
        setStatus('error');
      }
    } catch (error) {
      setErrorMessage(error.message || 'Export failed');
      setStatus('error');
    } finally {
      setIsExporting(false);
    }
  };

  // No video selected
  if (!selectedVideoObject) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <p className="text-gray-600">Select a video to export</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Export</h2>

      {/* Status Message */}
      {status === 'success' && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          ✓ Export completed successfully!
        </div>
      )}

      {status === 'error' && errorMessage && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          ✗ {errorMessage}
        </div>
      )}

      {/* Progress Bar */}
      {isExporting && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Exporting...</span>
            <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={`w-full px-6 py-4 rounded-lg font-semibold text-lg transition-all ${
          isExporting
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {isExporting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Exporting...
          </span>
        ) : (
          'Export to MP4'
        )}
      </button>

      {/* Info */}
      <div className="mt-4 text-sm text-gray-600">
        <p>Exports the selected video with trim points applied (if set)</p>
      </div>
    </div>
  );
}


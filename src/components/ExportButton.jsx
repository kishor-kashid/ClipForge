import React, { useState, useEffect } from 'react';
import { useVideoStore } from '../store/videoStore';
import { formatTime } from '../utils/timeUtils';

export default function ExportButton() {
  const { selectedVideo, getSelectedVideoObject, getTrimPoints } = useVideoStore();
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, exporting, success, error
  const [errorMessage, setErrorMessage] = useState(null);

  // Get the selected video object
  const selectedVideoObject = getSelectedVideoObject();

  // Get trim points for validation
  const trimData = selectedVideo ? getTrimPoints(selectedVideo) : { inPoint: 0, outPoint: null };
  const { inPoint, outPoint } = trimData;

  // Calculate if trim points are valid
  // If no trim points set (inPoint=0, outPoint=null), allow export
  // If trim points are set, outPoint must be greater than inPoint
  const hasValidTrim = outPoint === null || (outPoint !== null && outPoint > inPoint);
  const shouldDisable = !selectedVideoObject || !hasValidTrim;

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

    // Get trim points and validate
    const trimData = getTrimPoints(selectedVideo);
    const { inPoint, outPoint } = trimData;

    // Validate trim points
    if (outPoint !== null && outPoint !== undefined) {
      if (outPoint <= inPoint) {
        setErrorMessage('Invalid trim points: out-point must be greater than in-point');
        setStatus('error');
        return;
      }
      
      if (selectedVideoObject.duration && outPoint > selectedVideoObject.duration) {
        setErrorMessage(`Invalid trim points: out-point (${formatTime(outPoint)}) exceeds video duration (${formatTime(selectedVideoObject.duration)})`);
        setStatus('error');
        return;
      }
      
      if (inPoint < 0) {
        setErrorMessage('Invalid trim points: in-point cannot be negative');
        setStatus('error');
        return;
      }
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
      <div className="bg-[#252525] rounded-lg border border-[#404040] p-6 text-center">
        <p className="text-[#b3b3b3]">Select a video to export</p>
      </div>
    );
  }

  return (
    <div className="bg-[#252525] rounded-lg border border-[#404040] p-4">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-[#4ade80]" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        <h2 className="text-lg font-bold text-white">Export</h2>
      </div>

      {/* Status Message */}
      {status === 'success' && (
        <div className="mb-4 p-3 bg-green-900 bg-opacity-20 border border-green-500 text-green-300 rounded text-sm">
          ✓ Export completed successfully!
        </div>
      )}

      {status === 'error' && errorMessage && (
        <div className="mb-4 p-3 bg-red-900 bg-opacity-20 border border-red-500 text-red-300 rounded text-sm">
          ✗ {errorMessage}
        </div>
      )}

      {/* Progress Bar */}
      {isExporting && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[#b3b3b3]">Exporting...</span>
            <span className="text-sm text-[#b3b3b3]">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-[#2d2d2d] rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#4a9eff] h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isExporting || shouldDisable}
        className={`w-full px-4 py-3 rounded-lg font-semibold text-base transition-all ${
          isExporting || shouldDisable
            ? 'bg-[#404040] text-[#666] cursor-not-allowed'
            : 'bg-[#16a34a] text-white hover:bg-[#15803d]'
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
      <div className="mt-3 text-xs text-[#b3b3b3]">
        <p>Exports selected video with trim points</p>
      </div>
    </div>
  );
}


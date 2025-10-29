import React, { useState, useEffect } from 'react';
import { useVideoStore } from '../store/videoStore';
import { formatTime } from '../utils/timeUtils';
import { useToast } from './ToastProvider';

export default function ExportButton() {
  const [isOpen, setIsOpen] = useState(true);
  const { selectedVideo, getSelectedVideoObject, getTrimPoints } = useVideoStore();
  const { addToast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, exporting, success, error
  const [errorMessage, setErrorMessage] = useState(null);
  
  // Export settings
  const [resolution, setResolution] = useState('source');
  const [quality, setQuality] = useState('medium');
  const [format, setFormat] = useState('mp4-h264');

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

  // Calculate estimated file size
  const getEstimatedFileSize = () => {
    if (!selectedVideoObject) return 'Unknown';
    
    const duration = outPoint !== null ? outPoint - inPoint : selectedVideoObject.duration;
    if (!duration) return 'Unknown';
    
    // Base bitrate estimates (Mbps)
    const qualityBitrates = {
      fast: { '720p': 2, '1080p': 4, '4k': 8, 'source': 4 },
      medium: { '720p': 4, '1080p': 8, '4k': 16, 'source': 8 },
      high: { '720p': 8, '1080p': 16, '4k': 32, 'source': 16 }
    };
    
    const bitrate = qualityBitrates[quality]?.[resolution] || 8;
    const sizeInMB = (bitrate * duration) / 8; // Convert Mbps to MB
    
    if (sizeInMB < 1) return `${Math.round(sizeInMB * 1024)} KB`;
    if (sizeInMB < 1024) return `${Math.round(sizeInMB)} MB`;
    return `${Math.round(sizeInMB / 1024)} GB`;
  };

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
        resolution: resolution,
        quality: quality,
        format: format,
      });

      if (exportResult.success) {
        setStatus('success');
        setProgress(100);
        addToast('Video exported successfully!', 'success');
        // Reset after 3 seconds
        setTimeout(() => {
          setStatus('idle');
          setProgress(0);
        }, 3000);
      } else {
        setErrorMessage(exportResult.error || 'Export failed');
        setStatus('error');
        addToast('Export failed: ' + (exportResult.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      setErrorMessage(error.message || 'Export failed');
      setStatus('error');
      addToast('Export failed: ' + (error.message || 'Unknown error'), 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-[#252525] rounded-lg border border-[#404040] overflow-hidden">
      {/* Export Panel Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-[#2d2d2d] hover:bg-[#333] transition-colors flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-[#4ade80]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span className="text-white font-semibold">Export</span>
        </div>
        <svg 
          className={`w-5 h-5 text-[#b3b3b3] transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Export Panel Content */}
      {isOpen && (
        <div className="p-4">
          {!selectedVideoObject ? (
            <p className="text-[#b3b3b3] text-sm text-center py-4">Select a video to export</p>
          ) : (
            <>
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

              {/* Export Settings */}
              {!isExporting && (
                <div className="mb-4 space-y-3">
                  {/* Resolution */}
                  <div>
                    <label className="block text-sm text-[#b3b3b3] mb-1">Resolution:</label>
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#404040] text-white px-3 py-2 rounded text-sm"
                    >
                      <option value="source">Source (Original)</option>
                      <option value="720p">720p (1280x720)</option>
                      <option value="1080p">1080p (1920x1080)</option>
                      <option value="4k">4K (3840x2160)</option>
                    </select>
                  </div>

                  {/* Quality */}
                  <div>
                    <label className="block text-sm text-[#b3b3b3] mb-1">Quality:</label>
                    <select
                      value={quality}
                      onChange={(e) => setQuality(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#404040] text-white px-3 py-2 rounded text-sm"
                    >
                      <option value="fast">Fast (Lower quality, smaller file)</option>
                      <option value="medium">Medium (Balanced)</option>
                      <option value="high">High (Best quality, larger file)</option>
                    </select>
                  </div>

                  {/* Format */}
                  <div>
                    <label className="block text-sm text-[#b3b3b3] mb-1">Format:</label>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#404040] text-white px-3 py-2 rounded text-sm"
                    >
                      <option value="mp4-h264">MP4 (H.264)</option>
                      <option value="mp4-h265">MP4 (H.265)</option>
                      <option value="webm">WebM</option>
                    </select>
                  </div>

                  {/* File size estimate */}
                  <div className="text-xs text-[#b3b3b3] bg-[#1a1a1a] p-2 rounded">
                    <p>Estimated file size: {getEstimatedFileSize()}</p>
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
                  `Export to ${format.toUpperCase()}`
                )}
              </button>

              {/* Info */}
              <div className="mt-3 text-xs text-[#b3b3b3]">
                <p>Exports selected video with trim points</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}


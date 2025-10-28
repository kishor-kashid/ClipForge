import React, { useState, useRef, useEffect } from 'react';
import { useVideoStore } from '../store/videoStore';
import { formatTime } from '../utils/timeUtils';

function RecordingPanel() {
  const { isRecording, recordingDuration, startRecording, stopRecording, addVideo } = useVideoStore();
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [previewStream, setPreviewStream] = useState(null);
  const videoRef = useRef(null);

  // Handle cleanup when component unmounts or recording stops
  useEffect(() => {
    if (!isRecording && previewStream) {
      previewStream.getTracks().forEach(track => track.stop());
      setPreviewStream(null);
    }
    return () => {
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isRecording, previewStream]);

  const handleStartRecording = async () => {
    try {
      // Get screen sources using Electron API
      const sources = await window.electronAPI.getScreenSources();
      
      if (!sources || sources.length === 0) {
        alert('No screen sources available');
        return;
      }

      // Select the first available source (usually main screen)
      const source = sources[0];

      // Request screen capture stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false, // Screen capture doesn't include audio by default
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: source.id,
          },
        },
      });

      setPreviewStream(stream);

      // Show preview in video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Create MediaRecorder
      const options = {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000,
      };

      // Fallback for browsers that don't support vp9
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm;codecs=vp8';
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'video/webm';
        }
      }

      const recorder = new MediaRecorder(stream, options);
      const chunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordedChunks([]);

        // Convert blob to Uint8Array and save via Electron
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const result = await window.electronAPI.saveRecording(Array.from(uint8Array), 'webm');
        
        if (result.success) {
          // Add recording to video store
          addVideo({
            path: result.path,
            name: `Recording ${new Date().toLocaleTimeString()}`,
            duration: recordingDuration,
          });

          alert('Recording saved successfully!');
        } else {
          alert('Failed to save recording: ' + result.error);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      startRecording();
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to start recording: ' + error.message);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setMediaRecorder(null);
      stopRecording();

      // Stop preview stream
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
        setPreviewStream(null);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  return (
    <div className="bg-[#2d2d2d] rounded-lg border border-[#404040] p-4">
      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 012 0v2a1 1 0 01-2 0V9z" />
        </svg>
        Screen Recording
      </h3>

      {/* Preview */}
      <div className="mb-3">
        <video
          ref={videoRef}
          autoPlay
          muted
          className="w-full h-40 bg-black rounded border border-[#404040] object-contain"
        />
        {!previewStream && (
          <div className="flex items-center justify-center h-40 bg-black rounded border border-[#404040] text-[#b3b3b3] text-sm">
            Click "Start Recording" to begin
          </div>
        )}
      </div>

      {/* Recording Status */}
      {isRecording && (
        <div className="mb-3 flex items-center justify-center gap-2 bg-[#1a1a1a] rounded p-2 border border-red-500/30">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-white font-mono text-lg">
            {formatTime(Math.floor(recordingDuration))}
          </span>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        {!isRecording ? (
          <button
            onClick={handleStartRecording}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="3" />
            </svg>
            Start Recording
          </button>
        ) : (
          <button
            onClick={handleStopRecording}
            className="flex-1 bg-[#404040] hover:bg-[#505050] text-white font-semibold py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <rect x="6" y="6" width="8" height="8" rx="1" />
            </svg>
            Stop Recording
          </button>
        )}
      </div>
    </div>
  );
}

export default RecordingPanel;
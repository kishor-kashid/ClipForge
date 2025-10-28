import React, { useState, useRef, useEffect } from 'react';
import { useVideoStore } from '../store/videoStore';
import { formatTime } from '../utils/timeUtils';

function RecordingPanel() {
  const { isRecording, recordingDuration, startRecording, stopRecording, addVideo } = useVideoStore();
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [previewStream, setPreviewStream] = useState(null);
  const [recordingMode, setRecordingMode] = useState('screen');
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [availableMicrophones, setAvailableMicrophones] = useState([]);
  const [selectedMicrophone, setSelectedMicrophone] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioStream, setAudioStream] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        const microphones = devices.filter(device => device.kind === 'audioinput');
        setAvailableCameras(cameras);
        setAvailableMicrophones(microphones);
        if (cameras.length > 0) {
          setSelectedCamera(cameras[0].deviceId);
        }
        if (microphones.length > 0) {
          setSelectedMicrophone(microphones[0].deviceId);
        }
      } catch (error) {
        console.error('Error enumerating devices:', error);
      }
    };
    getDevices();
  }, []);

  useEffect(() => {
    if (!isRecording) {
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
        setPreviewStream(null);
      }
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      }
    }
    return () => {
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
      }
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isRecording, previewStream, audioStream]);

  const getStreamForRecording = async () => {
    let videoStream = null;
    let micStream = null;

    if (recordingMode === 'screen') {
      const sources = await window.electronAPI.getScreenSources();
      if (!sources || sources.length === 0) {
        throw new Error('No screen sources available');
      }
      
      // Prefer actual screen sources over window sources
      const screenSources = sources.filter(s => s.type === 'screen');
      const source = screenSources.length > 0 ? screenSources[0] : sources[0];
      
      console.log('Screen recording - Selected source:', { id: source.id, name: source.name, type: source.type });
      videoStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: source.id,
          },
        },
      });
    } else {
      try {
        videoStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true,
        });
      } catch (error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          throw new Error('Camera permission denied. Please allow camera access.');
        }
        if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          throw new Error('No camera found. Please connect a camera.');
        }
        throw error;
      }
    }

    if (audioEnabled) {
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: selectedMicrophone ? { deviceId: { exact: selectedMicrophone } } : true,
          video: false,
        });
        setAudioStream(micStream);
      } catch (error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          throw new Error('Microphone permission denied. Please allow microphone access.');
        }
        if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          throw new Error('No microphone found. Please connect a microphone.');
        }
        throw error;
      }
    }

    if (micStream) {
      micStream.getTracks().forEach(track => {
        if (!videoStream.getTracks().includes(track)) {
          videoStream.addTrack(track);
        }
      });
    }

    return videoStream;
  };

  const handleStartRecording = async () => {
    try {
      const stream = await getStreamForRecording();
      setPreviewStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const options = {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000,
      };

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
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const result = await window.electronAPI.saveRecording(Array.from(uint8Array), 'webm');
        
        if (result.success) {
          addVideo({
            path: result.path,
            name: `${recordingMode === 'screen' ? 'Screen' : 'Webcam'} Recording ${new Date().toLocaleTimeString()}`,
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
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
        setPreviewStream(null);
      }
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
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
        Recording
      </h3>

      <div className="mb-3 flex gap-2">
        <button
          onClick={() => setRecordingMode('screen')}
          className={`flex-1 px-3 py-2 rounded transition-colors ${
            recordingMode === 'screen'
              ? 'bg-[#4a9eff] text-white'
              : 'bg-[#404040] text-[#b3b3b3] hover:bg-[#505050]'
          }`}
          disabled={isRecording}
        >
          Screen
        </button>
        <button
          onClick={() => setRecordingMode('webcam')}
          className={`flex-1 px-3 py-2 rounded transition-colors ${
            recordingMode === 'webcam'
              ? 'bg-[#4a9eff] text-white'
              : 'bg-[#404040] text-[#b3b3b3] hover:bg-[#505050]'
          }`}
          disabled={isRecording}
        >
          Webcam
        </button>
      </div>

      {recordingMode === 'webcam' && availableCameras.length > 1 && (
        <div className="mb-3">
          <label className="block text-sm text-[#b3b3b3] mb-1">Camera:</label>
          <select
            value={selectedCamera || ''}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#404040] text-white px-3 py-2 rounded"
            disabled={isRecording}
          >
            {availableCameras.map((camera) => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label || `Camera ${availableCameras.indexOf(camera) + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mb-3 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-[#b3b3b3]">Audio:</label>
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              audioEnabled
                ? 'bg-[#4a9eff] text-white hover:bg-[#3a8eef]'
                : 'bg-[#404040] text-[#b3b3b3] hover:bg-[#505050]'
            }`}
            disabled={isRecording}
          >
            {audioEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {audioEnabled && availableMicrophones.length > 1 && (
          <select
            value={selectedMicrophone || ''}
            onChange={(e) => setSelectedMicrophone(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#404040] text-white px-3 py-2 rounded text-sm"
            disabled={isRecording}
          >
            {availableMicrophones.map((mic) => (
              <option key={mic.deviceId} value={mic.deviceId}>
                {mic.label || `Microphone ${availableMicrophones.indexOf(mic) + 1}`}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mb-3">
        <video
          ref={videoRef}
          autoPlay
          muted
          className="w-full h-40 bg-black rounded border border-[#404040] object-contain"
        />
        {!previewStream && (
          <div className="flex items-center justify-center h-40 bg-black rounded border border-[#404040] text-[#b3b3b3] text-sm">
            Click Start Recording to begin
          </div>
        )}
      </div>

      {isRecording && (
        <div className="mb-3 flex items-center justify-center gap-2 bg-[#1a1a1a] rounded p-2 border border-red-500/30">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-white font-mono text-lg">
            {formatTime(Math.floor(recordingDuration))}
          </span>
        </div>
      )}

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
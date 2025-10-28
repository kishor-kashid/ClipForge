import React, { useState, useRef, useEffect } from 'react';
import { useVideoStore } from '../store/videoStore';
import { formatTime } from '../utils/timeUtils';

function PipRecorder() {
  const { isRecording, recordingDuration, startRecording, stopRecording, addVideo } = useVideoStore();
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [canvasStream, setCanvasStream] = useState(null);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [availableMicrophones, setAvailableMicrophones] = useState([]);
  const [selectedMicrophone, setSelectedMicrophone] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioStream, setAudioStream] = useState(null);
  const [pipPosition, setPipPosition] = useState('bottom-right');
  const [availableScreens, setAvailableScreens] = useState([]);
  const [selectedScreen, setSelectedScreen] = useState(null);
  
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const webcamVideoRef = useRef(null);
  const animationFrameRef = useRef(null);
  const screenMediaStreamRef = useRef(null);
  const webcamMediaStreamRef = useRef(null);

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
        
        // Get screen sources
        const sources = await window.electronAPI.getScreenSources();
        if (sources && sources.length > 0) {
          setAvailableScreens(sources);
          // Auto-select first screen source (not window)
          const screenSources = sources.filter(s => s.type === 'screen');
          if (screenSources.length > 0) {
            setSelectedScreen(screenSources[0].id);
          } else {
            setSelectedScreen(sources[0].id);
          }
        }
      } catch (error) {
        console.error('Error enumerating devices:', error);
      }
    };
    getDevices();
  }, []);

  useEffect(() => {
    if (!isRecording) {
      if (canvasStream) {
        canvasStream.getTracks().forEach(track => track.stop());
        setCanvasStream(null);
      }
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      }
      if (screenMediaStreamRef.current) {
        screenMediaStreamRef.current.getTracks().forEach(track => track.stop());
        screenMediaStreamRef.current = null;
      }
      if (webcamMediaStreamRef.current) {
        webcamMediaStreamRef.current.getTracks().forEach(track => track.stop());
        webcamMediaStreamRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [isRecording, canvasStream, audioStream]);

  const drawToCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const screenVideo = screenVideoRef.current;
    const webcamVideo = webcamVideoRef.current;

    if (!canvas || !screenVideo || !webcamVideo) return;

    // Clear canvas first
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (screenVideo.readyState >= 2) {
      ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
    } else {
      console.log('Screen video not ready, readyState:', screenVideo.readyState);
    }

    if (webcamVideo.readyState >= 2) {
        const pipWidth = canvas.width / 4;
        const pipHeight = (canvas.height / 4) * (webcamVideo.videoHeight / webcamVideo.videoWidth);
        
        let x = 0, y = 0;
        switch (pipPosition) {
          case 'top-left':
            x = 20;
            y = 20;
            break;
          case 'top-right':
            x = canvas.width - pipWidth - 20;
            y = 20;
            break;
          case 'bottom-left':
            x = 20;
            y = canvas.height - pipHeight - 20;
            break;
          case 'bottom-right':
            x = canvas.width - pipWidth - 20;
            y = canvas.height - pipHeight - 20;
            break;
        }

        ctx.fillStyle = '#4a9eff';
        ctx.fillRect(x - 3, y - 3, pipWidth + 6, pipHeight + 6);
        ctx.drawImage(webcamVideo, x, y, pipWidth, pipHeight);
    } else {
      console.log('Webcam video not ready, readyState:', webcamVideo.readyState);
    }

    // Continue the loop as long as we have active streams
    if (screenMediaStreamRef.current && webcamMediaStreamRef.current) {
      animationFrameRef.current = requestAnimationFrame(drawToCanvas);
    }
  };

  const handleStartRecording = async () => {
    try {
      const canvas = canvasRef.current;
      
      if (!selectedScreen) {
        throw new Error('No screen source selected');
      }
      
      const source = availableScreens.find(s => s.id === selectedScreen);
      console.log('Recording with source:', { id: source.id, name: source.name, type: source.type });

      const screenStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: source.id,
          },
        },
      });

      const webcamStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: selectedCamera ? { deviceId: { exact: selectedCamera } } : true,
      });

      screenMediaStreamRef.current = screenStream;
      webcamMediaStreamRef.current = webcamStream;

      // Set up both videos
      if (screenVideoRef.current && webcamVideoRef.current) {
        screenVideoRef.current.srcObject = screenStream;
        webcamVideoRef.current.srcObject = webcamStream;
        
        // Wait for both videos to load
        Promise.all([
          new Promise(resolve => {
            screenVideoRef.current.onloadedmetadata = resolve;
          }),
          new Promise(resolve => {
            webcamVideoRef.current.onloadedmetadata = resolve;
          })
        ]).then(() => {
          canvas.width = screenVideoRef.current.videoWidth || 1920;
          canvas.height = screenVideoRef.current.videoHeight || 1080;
          
          console.log('Canvas size:', canvas.width, 'x', canvas.height);
          console.log('Screen video:', screenVideoRef.current.videoWidth, 'x', screenVideoRef.current.videoHeight);
          console.log('Webcam video:', webcamVideoRef.current.videoWidth, 'x', webcamVideoRef.current.videoHeight);
          
          // Start continuous drawing
          drawToCanvas();
        });
      }

      const stream = canvas.captureStream(30);

      if (audioEnabled) {
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: selectedMicrophone ? { deviceId: { exact: selectedMicrophone } } : true,
          video: false,
        });
        setAudioStream(micStream);
        micStream.getTracks().forEach(track => {
          stream.addTrack(track);
        });
      }

      setCanvasStream(stream);

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
          const timestamp = new Date();
          const sourceName = availableScreens.find(s => s.id === selectedScreen)?.name || 'Screen';
          
          addVideo({
            path: result.path,
            name: `PiP Recording ${timestamp.toLocaleTimeString()}`,
            duration: recordingDuration,
            isRecording: true,
            recordingType: 'pip',
            recordedAt: timestamp.toISOString(),
            hasAudio: audioEnabled,
            pipPosition,
            screenSource: sourceName,
          }, true); // Auto-select the new recording
          
          alert('PiP recording saved and added to timeline!');
        } else {
          alert('Failed to save recording: ' + result.error);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      startRecording();
      
      // Start the continuous drawing loop after recording begins
      drawToCanvas();
    } catch (error) {
      console.error('Error starting PiP recording:', error);
      alert('Failed to start PiP recording: ' + error.message);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setMediaRecorder(null);
      stopRecording();

      if (canvasStream) {
        canvasStream.getTracks().forEach(track => track.stop());
        setCanvasStream(null);
      }

      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  return (
    <div className="bg-[#2d2d2d] rounded-lg border border-[#404040] p-4">
      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" />
        </svg>
        Picture-in-Picture Recording
      </h3>

      <div className="mb-3">
        <label className="block text-sm text-[#b3b3b3] mb-1">Screen/Window:</label>
        <select
          value={selectedScreen || ''}
          onChange={(e) => setSelectedScreen(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-[#404040] text-white px-3 py-2 rounded text-sm"
          disabled={isRecording}
        >
          {availableScreens.map((screen) => (
            <option key={screen.id} value={screen.id}>
              {screen.name} {screen.type === 'screen' ? '(Screen)' : '(Window)'}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="block text-sm text-[#b3b3b3] mb-1">PiP Position:</label>
        <select
          value={pipPosition}
          onChange={(e) => setPipPosition(e.target.value)}
          className="w-full bg-[#1a1a1a] border border-[#404040] text-white px-3 py-2 rounded"
          disabled={isRecording}
        >
          <option value="top-left">Top Left</option>
          <option value="top-right">Top Right</option>
          <option value="bottom-left">Bottom Left</option>
          <option value="bottom-right">Bottom Right</option>
        </select>
      </div>

      {availableCameras.length > 1 && (
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

      <div className="mb-3 relative">
        <video ref={screenVideoRef} autoPlay muted className="absolute -top-[9999px]" />
        <video ref={webcamVideoRef} autoPlay muted className="absolute -top-[9999px]" />
        <canvas ref={canvasRef} className="w-full h-40 bg-black rounded border border-[#404040]" />
        {!canvasStream && (
          <div className="flex items-center justify-center h-40 bg-black rounded border border-[#404040] text-[#b3b3b3] text-sm -mt-40">
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
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="3" />
            </svg>
            Start PiP Recording
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

export default PipRecorder;

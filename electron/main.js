// Load environment variables from .env file (if in dev mode)
if (!require('electron').app.isPackaged) {
  require('dotenv').config();
}

const { app, BrowserWindow, ipcMain, dialog, desktopCapturer } = require('electron');
const path = require('path');
const fs = require('fs');
const { exportVideo, exportTimeline } = require('./ffmpeg');
const { transcribeVideo, generateSummary } = require('./openaiHandlers');

// Better dev detection - check if app is packaged
const isDev = !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allow loading local files
    },
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers

/**
 * Handle file dialog for selecting video files
 */
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Videos', extensions: ['mp4', 'mov', 'webm'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    title: 'Select Video Files'
  });

  return result;
});

/**
 * Handle save dialog for exporting video
 */
ipcMain.handle('dialog:saveFile', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'Videos', extensions: ['mp4'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    title: 'Save Video As',
    defaultPath: `clipforge-${Date.now()}.mp4`
  });

  return result;
});

/**
 * Handle video export with FFmpeg
 */
ipcMain.handle('export:video', async (event, params) => {
  try {
    const { inputPath, outputPath, startTime, duration, resolution, quality, format, playbackSpeed } = params;

    // Validate parameters
    if (!inputPath || !outputPath) {
      throw new Error('Input and output paths are required');
    }

    // Export video with progress updates
    const exportedPath = await exportVideo(
      { inputPath, outputPath, startTime, duration, resolution, quality, format, playbackSpeed },
      (percent) => {
        // Send progress updates to renderer
        mainWindow.webContents.send('export:progress', percent);
      }
    );

    return { success: true, path: exportedPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * Handle timeline export with FFmpeg
 */
ipcMain.handle('export:timeline', async (event, params) => {
  try {
    const { tracks, outputPath, videos, trimPoints } = params;

    // Validate parameters
    if (!tracks || !outputPath || !videos) {
      throw new Error('Tracks, output path, and videos are required');
    }

    // Helper function to get playback speed from trim points
    const getPlaybackSpeed = (videoPath) => {
      if (!trimPoints || !trimPoints[videoPath]) {
        return 1.0;
      }
      return trimPoints[videoPath].playbackSpeed || 1.0;
    };

    // Export timeline with progress updates
    const exportedPath = await exportTimeline(
      { tracks, outputPath, videos, getPlaybackSpeed },
      (percent) => {
        // Send progress updates to renderer
        mainWindow.webContents.send('export:progress', percent);
      }
    );

    return { success: true, path: exportedPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * Handle getting screen sources for recording
 */
ipcMain.handle('recording:getScreenSources', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['window', 'screen'],
      thumbnailSize: { width: 320, height: 200 }
    });

    return sources.map(source => ({
      id: source.id,
      name: source.name,
      type: source.id.startsWith('screen:') ? 'screen' : 'window',
      thumbnail: source.thumbnail.toDataURL()
    }));
  } catch (error) {
    console.error('Error getting screen sources:', error);
    return [];
  }
});

/**
 * Handle saving recording blob
 */
ipcMain.handle('recording:save', async (event, dataArray, extension) => {
  try {
    // Get save location from user
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'Videos', extensions: [extension || 'webm'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      title: 'Save Recording',
      defaultPath: `clipforge-recording-${Date.now()}.${extension || 'webm'}`
    });

    if (result.canceled || !result.filePath) {
      return { success: false, error: 'Save cancelled' };
    }

    // Convert array to Buffer and save file
    const buffer = Buffer.from(dataArray);
    await fs.promises.writeFile(result.filePath, buffer);

    return { success: true, path: result.filePath };
  } catch (error) {
    console.error('Error saving recording:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Handle video transcription using OpenAI Whisper API
 */
ipcMain.handle('ai:transcribe', async (event, videoPath) => {
  try {
    if (!videoPath) {
      throw new Error('Video path is required');
    }

    // Check if file exists
    await fs.promises.access(videoPath);

    // Transcribe video
    const transcriptData = await transcribeVideo(videoPath);

    return { success: true, transcript: transcriptData };
  } catch (error) {
    console.error('Transcription error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Handle content summarization using OpenAI GPT
 */
ipcMain.handle('ai:summarize', async (event, transcriptText) => {
  try {
    if (!transcriptText) {
      throw new Error('Transcript text is required');
    }

    // Generate summary
    const summaryData = await generateSummary(transcriptText);

    return { success: true, summary: summaryData };
  } catch (error) {
    console.error('Summarization error:', error);
    return { success: false, error: error.message };
  }
});


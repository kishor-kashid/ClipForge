const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform information
  platform: process.platform,
  
  // File dialog for importing videos
  selectVideoFiles: () => ipcRenderer.invoke('dialog:openFile'),
  
  // Save dialog for exporting videos
  saveVideoFile: () => ipcRenderer.invoke('dialog:saveFile'),
  
  // Export video with FFmpeg
  exportVideo: (params) => ipcRenderer.invoke('export:video', params),
  
  // Export timeline with FFmpeg
  exportTimeline: (params) => ipcRenderer.invoke('export:timeline', params),
  
  // Listen for export progress updates
  onExportProgress: (callback) => {
    ipcRenderer.on('export:progress', (event, percent) => callback(percent));
  },
  
  // Remove export progress listener
  removeExportProgressListener: () => {
    ipcRenderer.removeAllListeners('export:progress');
  },
  
  // Recording APIs
  getScreenSources: () => ipcRenderer.invoke('recording:getScreenSources'),
  saveRecording: (buffer, extension) => ipcRenderer.invoke('recording:save', buffer, extension),
});


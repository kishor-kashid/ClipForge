const { contextBridge } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // APIs will be added in subsequent PRs
  // For now, just establish the pattern
  platform: process.platform,
});


import React from 'react';
import { VideoProvider } from './store/videoStore';
import VideoImport from './components/VideoImport';

function App() {
  return (
    <VideoProvider>
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-6xl font-bold text-blue-600 mb-4">ClipForge</h1>
            <p className="text-2xl text-gray-700">Desktop Video Editor</p>
          </header>
          
          <main>
            <VideoImport />
          </main>
        </div>
      </div>
    </VideoProvider>
  );
}

export default App;

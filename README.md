# ClipForge

A professional desktop video editor for trimming, recording, and exporting videos. Built with Electron, React, and FFmpeg.

## 🎬 Features

### Core Video Editing
- **Video Import**: Drag & drop or file picker to import videos (MP4, MOV, WebM, AVI)
- **Timeline View**: Multi-track timeline with visual clip representation
- **Video Preview**: Play imported videos with playback controls and seek bar
- **Trim Controls**: Set precise in/out points for video trimming
- **Export Options**: Export with multiple resolution and quality settings

### Advanced Recording
- **Screen Recording**: Record entire screen or specific windows
- **Webcam Recording**: Record from webcam with device selection
- **Picture-in-Picture**: Combine screen and webcam recording
- **Audio Capture**: Record system audio and microphone
- **Live Preview**: Real-time preview during recording

### Professional Timeline
- **Multi-Track Support**: Arrange clips across multiple tracks
- **Drag & Drop**: Move clips between tracks and reposition
- **Clip Splitting**: Split clips at playhead position
- **Zoom & Snap**: Timeline zoom with snap-to-grid functionality
- **Timeline Export**: Export entire multi-track timeline as single video

### Export & Quality
- **Resolution Options**: Source, 720p, 1080p, 4K
- **Quality Presets**: Fast, Medium, High quality settings
- **Format Support**: MP4 (H.264), MP4 (H.265), WebM
- **Parallel Processing**: Fast export with multi-threaded processing
- **Progress Tracking**: Real-time progress during video export

### AI-Powered Features
- **Auto Transcription**: Generate transcripts using OpenAI Whisper API
- **Content Summarization**: AI-generated summaries with key topics
- **Smart Highlights**: AI detects best segments automatically
- **One-Click Apply**: Apply AI-suggested highlights with a single click

### User Experience
- **Undo/Redo**: Full history management with keyboard shortcuts
- **Keyboard Shortcuts**: Professional editing shortcuts
- **Thumbnail System**: Visual thumbnails for all videos
- **Collapsible UI**: Organized interface with expandable sections
- **Toast Notifications**: User-friendly status messages
- **Resizable Panels**: Customize layout to your workflow
- **Maximize Video**: Focus mode for distraction-free editing

## 🎥 Demo Video

Watch ClipForge in action! This 5-minute demo showcases all major features:

**[🎬 Watch Demo Video](https://youtube.com/watch?v=demo)** *(Coming Soon)*

The demo covers:
- App launch and interface overview
- Screen recording demonstration
- Video import and timeline editing
- Trimming and splitting clips
- Multi-track arrangement
- Export process with different settings

## 📋 System Requirements

- **OS**: Windows 10 or later
- **RAM**: 4GB minimum (8GB recommended)
- **Disk Space**: ~200MB for app installation
- **Graphics**: Any graphics card that supports hardware acceleration
- **Audio**: Microphone and speakers for recording features

## 🚀 Getting Started

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ClipForge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (for AI features)
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
   
   *Note: AI features are optional. The app works without an API key for basic editing.*

4. **Run in development mode**
   ```bash
   npm run dev
   ```

   This starts the Vite dev server and opens the Electron app.

### Build for Production

1. **Build the React app**
   ```bash
   npm run build
   ```

2. **Package for Windows**
   ```bash
   npm run electron:build
   ```

   This creates a Windows installer (`ClipForge-1.0.0-setup.exe`) in the `dist/` directory.

## 📖 Usage Guide

### Recording Videos

1. **Screen Recording**
   - Click "Screen" mode in the recording panel
   - Select screen/window source from dropdown
   - Enable/disable audio as needed
   - Click "Start Recording" to begin
   - Click "Stop Recording" when finished

2. **Webcam Recording**
   - Click "Webcam" mode in the recording panel
   - Select camera from dropdown
   - Enable/disable audio as needed
   - Click "Start Recording" to begin

3. **Picture-in-Picture Recording**
   - Click "PiP" mode in the recording panel
   - Select both screen and webcam sources
   - Configure audio settings
   - Click "Start Recording" to begin

### Importing Videos

1. **Drag & Drop**: Drag video files onto the import area
2. **File Picker**: Click "Select Files" button to browse and select videos
3. Supported formats: MP4, MOV, WebM, AVI
4. Videos appear in the library and can be dragged to timeline

### Timeline Editing

1. **Adding Clips to Timeline**
   - Drag videos from library to timeline tracks
   - Clips can be moved between tracks
   - Multiple clips can be arranged on different tracks

2. **Clip Operations**
   - **Split**: Position playhead and click "Split" to divide clip
   - **Trim**: Use trim controls to set in/out points
   - **Reposition**: Drag clips to different positions on timeline

3. **Timeline Controls**
   - **Zoom**: Use zoom controls to adjust timeline scale
   - **Snap**: Enable snap-to-grid for precise positioning
   - **Multi-track**: Add/remove tracks as needed

### Trimming Videos

1. Select a video from the timeline
2. Click to load it in the video player
3. Use the seek bar to find the desired start point
4. Click "Set In Point" to mark the start of your clip
5. Navigate to the desired end point
6. Click "Set Out Point" to mark the end of your clip
7. The trimmed duration is displayed in the trim controls

### Exporting Videos

#### Single Video Export
1. Ensure you have a video selected
2. Set trim points if you want to export only a portion
3. Choose resolution (Source, 720p, 1080p, 4K)
4. Select quality preset (Fast, Medium, High)
5. Choose format (MP4 H.264, MP4 H.265, WebM)
6. Click "Export to MP4"
7. Choose a save location in the file dialog
8. Wait for the export to complete

#### Timeline Export
1. Arrange clips on timeline tracks
2. Click "Export Timeline" button
3. Choose a save location
4. Wait for multi-track concatenation to complete
5. All clips will be combined into a single video

### Keyboard Shortcuts

#### Video Controls
- **Space**: Play/Pause video
- **I**: Set in point
- **O**: Set out point
- **S**: Split clip at playhead (when not in input field)

#### Editing
- **Ctrl+Z**: Undo
- **Ctrl+Y**: Redo
- **Delete / Backspace**: Remove selected clip

#### Layout
- **1**: Toggle left panel
- **3**: Toggle right panel
- **F**: Maximize video player

## 🧪 Running Tests

ClipForge includes a comprehensive test suite with **93 tests** covering unit and integration scenarios:

- **60 Unit Tests**: File utilities, time utilities, video store, transcript analysis
- **33 Integration Tests**: Video import, player, timeline, trim controls, recording, transcription, export

Run all tests:
```bash
npm test
```

Run unit tests only:
```bash
npm run test:unit
```

Run integration tests only:
```bash
npm run test:integration
```

Run tests in watch mode:
```bash
npm run test:watch
```

**Test Status**: ✅ All 93 tests passing (100% pass rate)

## 🛠️ Development Scripts

- `npm run dev` - Start development server with Electron
- `npm run dev:vite` - Start Vite dev server only
- `npm run electron:dev` - Run Electron in dev mode
- `npm run build` - Build React app for production
- `npm run electron:build` - Package app for distribution
- `npm test` - Run all tests
- `npm run test:unit` - Run unit tests
- `npm run test:integration` - Run integration tests
- `npm run test:watch` - Run tests in watch mode

## 🏗️ Project Structure

```
clipforge/
├── electron/          # Electron main process
│   ├── main.js        # App lifecycle and IPC handlers
│   ├── preload.js     # Context bridge API
│   └── ffmpeg.js      # FFmpeg export utilities
├── src/               # React renderer process
│   ├── components/    # React components
│   ├── store/         # State management (React Context)
│   └── utils/         # Utility functions
├── tests/             # Test files
│   ├── unit/          # Unit tests
│   └── integration/   # Integration tests
└── public/            # Static assets
```

## 🐛 Troubleshooting

### Recording Issues
- **Permission Denied**: Grant camera/microphone permissions when prompted
- **No Audio**: Check audio device selection and system volume
- **Poor Quality**: Ensure stable internet connection and sufficient disk space
- **Device Not Found**: Restart app and check device connections

### Video Import Issues
- **File Won't Load**: Ensure the video file is a supported format (MP4, MOV, WebM, AVI)
- **Corrupted File**: Try importing a different video file
- **Large Files**: Very large files may take time to process

### Timeline Problems
- **Drag & Drop Not Working**: Ensure you're dragging from the video library to timeline tracks
- **Clips Not Playing**: Select the clip and ensure it's loaded in the video player
- **Split Not Working**: Position the playhead at the desired split point

### Export Issues
- **Export Fails**: Check disk space and ensure output path is writable
- **Invalid Trim Points**: Ensure out-point > in-point
- **Slow Export**: Try using "Fast" quality preset for quicker exports
- **Timeline Export Errors**: Ensure all clips have valid video files

### Performance Issues
- **Slow App**: Close other applications to free up RAM
- **Export Hanging**: Check console for FFmpeg error messages
- **Memory Issues**: Restart the app if it becomes unresponsive

### General Issues
- **App Won't Start**: Try deleting `node_modules` and running `npm install` again
- **Missing Features**: Ensure you're using the latest version
- **UI Problems**: Try restarting the app or clearing app data

## 🧩 Technology Stack

- **Electron**: Desktop application framework
- **React**: UI library with Context API for state management
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **FFmpeg**: Video processing (bundled with ffmpeg-static)
- **Vitest**: Testing framework (93 tests, 100% pass rate)
- **Electron Builder**: App packaging
- **OpenAI API**: AI-powered transcription and content summarization

## 🔧 Code Quality

ClipForge follows best practices for maintainable code:
- ✅ **Performance Optimized**: Memoized calculations, parallel processing for exports
- ✅ **Clean Codebase**: Dead code removed, debug logs cleaned
- ✅ **Well Tested**: Comprehensive test suite with 93 tests
- ✅ **Type Safety**: Proper error handling and validation
- ✅ **Documentation**: Comprehensive README and inline comments

## 📝 License

ISC

## 🎯 Project Status

**Version 1.0.0 - Complete MVP + Optimized**

This project represents a fully functional video editing application with:
- ✅ Multi-track timeline with drag & drop
- ✅ Professional recording capabilities
- ✅ Advanced export options
- ✅ Comprehensive testing suite (93 tests, 100% pass rate)
- ✅ Production-ready packaging
- ✅ Optimized codebase with performance improvements
- ✅ Clean codebase (dead code removed, debug logs cleaned)

### Future Enhancements
- Video effects and filters
- Advanced audio editing
- Cloud export options
- Linux and macOS support
- Plugin system for extensions

## 📦 Download

Get the latest version of ClipForge:

**[⬇️ Download ClipForge v1.0.0](https://github.com/your-repo/releases/latest)**

- Windows installer included
- No additional dependencies required
- Ready to use out of the box

---

# ClipForge

A desktop video editor for trimming and exporting videos. Built with Electron, React, and FFmpeg.

## 🎬 Features

- **Video Import**: Drag & drop or file picker to import videos (MP4, MOV, WebM)
- **Timeline View**: Visual timeline showing all imported clips
- **Video Preview**: Play imported videos with playback controls and seek bar
- **Trim Controls**: Set in/out points for video trimming
- **Export**: Export trimmed videos to MP4 format
- **Progress Tracking**: Real-time progress during video export

## 📋 System Requirements

- **OS**: Windows 10 or later
- **RAM**: 4GB minimum (8GB recommended)
- **Disk Space**: ~200MB for app installation
- **Graphics**: Any graphics card that supports hardware acceleration

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

3. **Run in development mode**
   ```bash
   npm run dev
   ```

   This starts the Vite dev server and opens the Electron app.

### Build for Production

1. **Build the React app**
   ```bash
   npm run build
   ```

2. **Package for Windows** (when PR #8 is implemented)
   ```bash
   npm run electron:build
   ```

   This creates a Windows installer in the `dist/` directory.

## 📖 Usage Guide

### Importing Videos

1. **Drag & Drop**: Drag video files onto the import area
2. **File Picker**: Click "Select Files" button to browse and select videos
3. Supported formats: MP4, MOV, WebM

### Trimming Videos

1. Select a video from the timeline
2. Click to load it in the video player
3. Use the seek bar to find the desired start point
4. Click "Set In Point" to mark the start of your clip
5. Navigate to the desired end point
6. Click "Set Out Point" to mark the end of your clip
7. The trimmed duration is displayed in the trim controls

### Exporting Videos

1. Ensure you have a video selected
2. Set trim points if you want to export only a portion
3. Click "Export to MP4"
4. Choose a save location in the file dialog
5. Wait for the export to complete (progress bar shows status)
6. The exported MP4 file will be saved to your chosen location

## 🧪 Running Tests

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

### Video won't load
- Ensure the video file is a supported format (MP4, MOV, WebM)
- Check that the file path is valid and the file exists
- Try importing a different video file

### Export fails
- Make sure you have enough disk space at the destination
- Check that the output path is writable
- Ensure trim points are valid (out-point > in-point)
- Verify the source video file is not corrupted

### App won't start
- Try deleting `node_modules` and running `npm install` again
- Check Node.js version is 18 or later
- Ensure all dependencies are installed correctly

### FFmpeg errors
- The app includes ffmpeg-static, no manual installation needed
- If export fails, check the console for detailed error messages
- Ensure the input video file is valid and readable

## 🧩 Technology Stack

- **Electron**: Desktop application framework
- **React**: UI library
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **FFmpeg**: Video processing
- **Vitest**: Testing framework
- **Electron Builder**: App packaging

## 📝 License

ISC

## 👥 Contributing

This is an MVP project. Future enhancements may include:
- Multi-track timeline
- Video effects and filters
- Audio editing
- Cloud export options
- Linux and macOS support

---

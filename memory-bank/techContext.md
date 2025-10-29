# ClipForge - Technical Context

## Technology Stack

### Project Status
**🎉 COMPLETE**: All 22 PRs + UI Enhancements implemented and tested
- ✅ MVP implementation (PR #1-10)
- ✅ Recording features (PR #11-14)
- ✅ Timeline advanced features (PR #16-17)
- ✅ Advanced export features (PR #18)
- ✅ Testing suite (PR #19)
- ✅ Demo materials (PR #20)
- ✅ AI Transcription (PR #21)
- ✅ AI Highlights Detection (PR #22)
- ✅ Professional UI Overhaul (Design System, Buttons, Spacing, Typography)
- ✅ Advanced Layout Features (Collapsible/Resizable Panels, Maximize, Adjustable Timeline)

### Core Framework
- **Electron**: vLatest (desktop application framework)
- **React**: v18+ (UI components and state management)
- **Vite**: vLatest (fast frontend build tool)

### Dependencies

#### Production Dependencies
```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "fluent-ffmpeg": "^2.1.3",
  "ffmpeg-static": "^5.2.0",
  "openai": "^4.x",
  "dotenv": "^16.x",
  "@vitejs/plugin-react": "^4.7.0",
  "vite": "^6.4.1"
}
```
Note: electron is in devDependencies (not production)

#### Development Dependencies
```json
{
  "electron": "^38.4.0",
  "electron-builder": "^26.0.12",
  "vitest": "^4.0.4",
  "@testing-library/react": "^16.3.0",
  "@testing-library/jest-dom": "^6.9.1",
  "happy-dom": "^20.0.8",
  "jsdom": "^27.0.1",
  "concurrently": "^9.2.1",
  "wait-on": "^9.0.1",
  "tailwindcss": "^4.1.16",
  "@tailwindcss/postcss": "^4.1.16",
  "autoprefixer": "^10.4.21",
  "postcss": "^8.5.6"
}
```

### Build & Distribution
- **Vite**: Fast HMR for development
- **electron-builder**: Package for Windows (NSIS installer)
- **Target**: Windows 10+ executable (.exe)
- **Status**: ✅ ClipForge-1.0.0-setup.exe created successfully

## Development Setup

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or yarn package manager
- Windows OS (development environment)
- Git for version control

### Installation Steps
```bash
# Clone repository
git clone <repo-url>
cd ClipForge

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Scripts
```json
{
  "dev": "concurrently \"npm run dev:vite\" \"wait-on http://localhost:5173 && electron .\"",
  "dev:vite": "vite",
  "electron:dev": "electron .",
  "build": "vite build",
  "electron:build": "electron-builder",
  "test": "vitest",
  "test:unit": "vitest tests/unit",
  "test:integration": "vitest tests/integration",
  "test:watch": "vitest --watch"
}
```

### Build Configuration

#### Vite Config (`vite.config.js`)
- React plugin enabled
- Build output to `dist/` directory
- Public assets in `public/` directory
- Target ES2020

#### Electron Builder Config (`electron-builder.yml`)
- App ID: `com.clipforge.app`
- Windows NSIS installer (x64)
- File associations for MP4, MOV, WebM
- Code signing disabled for development
- Output: `ClipForge-1.0.0-setup.exe`

## Environment & Configuration

### Development Environment
- **Node Environment**: `development`
- **Debugging**: DevTools enabled
- **Hot Reload**: Enabled for React components
- **FFmpeg**: Bundled static binary

### Production Environment
- **Node Environment**: `production`
- **Debugging**: DevTools disabled (optional)
- **Optimizations**: Minification, tree-shaking enabled
- **FFmpeg**: Same static binary included

### Environment Variables
```env
# Not currently used, but structure for future
VITE_APP_VERSION=1.0.0
NODE_ENV=production
```

## File System Access

### Electron File Access
- **Main Process**: Full Node.js `fs` access
- **Renderer Process**: Only via IPC (secure)
- **Context Bridge**: Exposes controlled APIs

### Supported File Formats
- **Input**: MP4, MOV, WebM
- **Output**: MP4 (H.264 codec)

### File Path Handling
- Use `path` module for cross-platform paths
- Normalize paths before operations
- Validate paths before FFmpeg calls

## FFmpeg Integration

### FFmpeg Usage
```javascript
// Import ffmpeg-static
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

// Export with trim
ffmpeg(inputPath)
  .setStartTime(startPoint)
  .setDuration(duration)
  .output(outputPath)
  .on('progress', (progress) => {
    // Send progress updates
  })
  .on('end', () => {
    // Export complete
  })
  .run();
```

### FFmpeg Configuration
- **Codec**: H.264 (libx264)
- **Container**: MP4
- **Audio**: AAC (copy when possible)
- **Quality**: Default preset (balanced)

## Testing Infrastructure

### Test Runner
- **Vitest**: Fast, Vite-native test runner
- **jsdom**: DOM simulation for React components
- **Testing Library**: React component testing utilities

### Test Structure
```
tests/
├── setup.js              # Global test configuration
├── unit/                 # Fast, isolated tests
├── integration/          # Component interaction tests
└── fixtures/             # Test data (sample-video.mp4)
```

### Test Configuration (`vitest.config.js`)
```javascript
prefixId: 'vi'
testEnvironment: 'jsdom'
setupFiles: ['./tests/setup.js']
```

### Test Scripts
- **Run all**: `npm test`
- **Unit only**: `npm run test:unit`
- **Integration only**: `npm run test:integration`
- **Watch mode**: `npm run test:watch`
- **Status**: ✅ 69 tests passing (100% success rate)

### Layout & UI Features
- **Panel Management**: Collapsible and resizable panels with drag handles
- **Keyboard Shortcuts**: 1 (left panel), 3 (right panel), F (maximize video)
- **Timeline Height**: Adjustable from 150px to 600px with drag handle
- **Design System**: Comprehensive CSS variables for consistent styling
- **Button System**: Standardized button classes for all actions
- **Professional Styling**: Shadows, elevations, typography hierarchy throughout

## Styling Approach

### Tailwind CSS
- **Utility-first**: Rapid styling without custom CSS
- **Responsive**: Built-in responsive classes
- **Customization**: Tailwind config for brand colors

### Design System (index.css)
- **CSS Variables**: Comprehensive color, shadow, spacing, typography tokens
- **Button System**: Standardized button classes (btn-primary, btn-secondary, btn-success, btn-danger, btn-tertiary)
- **Input System**: Standardized form inputs with focus states and labels
- **Panel System**: Standardized panel headers and content styling
- **Typography Scale**: Consistent text sizes (text-xs through text-2xl)
- **Shadow System**: Elevation levels (shadow-sm, shadow-md, shadow-lg, shadow-xl)
- **Spacing Scale**: Consistent spacing tokens (4px increments)

### Global Styles
- Tailwind base layer for reset
- Custom CSS for design system and specific overrides
- Component-scoped styles via className
- Professional empty states and loading indicators

## Browser APIs Used

### HTML5 Video Element
- **Methods**: `play()`, `pause()`, `load()`
- **Properties**: `currentTime`, `duration`, `readyState`
- **Events**: `loadedmetadata`, `timeupdate`, `ended`

### Web APIs
- **File API**: `FileReader` (limited use)
- **Drag & Drop**: `dragover`, `dragleave`, `drop` events
- **Fetch**: For loading assets (if needed)

## Node.js Modules Used

### Core Modules
- **fs**: File system operations
- **path**: Path manipulation and normalization
- **events**: EventEmitter for IPC

### Electron Modules
- **app**: Application lifecycle
- **BrowserWindow**: Window management
- **ipcMain/ipcRenderer**: IPC communication
- **dialog**: File picker dialogs
- **contextBridge**: Secure API exposure

### External Packages
- **openai**: OpenAI SDK for Whisper API transcription
- **dotenv**: Environment variable management from .env files
- **fluent-ffmpeg**: FFmpeg wrapper for audio extraction
- **ffmpeg-static**: Bundled FFmpeg binary

## AI Features Integration

### OpenAI Integration
- **API**: Whisper API for audio transcription
- **Client**: Initialized in main process with API key from .env
- **IPC Handler**: `ai:transcribe` in `electron/main.js`
- **Context Bridge**: `window.electronAPI.aiTranscribe()` exposed to renderer
- **Audio Extraction**: FFmpeg extracts audio to temporary MP3 files
- **Response Format**: `verbose_json` with timestamped segments
- **File Size Limit**: 25MB (handled with error messages)

### Highlights Detection
- **Analysis**: Transcript segments analyzed for best content
- **Algorithms**: 
  - Silence detection (backend only, not shown in UI)
  - Filler word detection (backend only, not shown in UI)
  - Highlight detection (primary feature, shown in UI)
- **Scoring**: Word density × duration for highlight ranking
- **Confidence**: Calculated based on content quality
- **UI Display**: Only highlight suggestions shown (filtered from all suggestions)

### Environment Variables
- **.env file**: Contains OPENAI_API_KEY (gitignored)
- **.env.example**: Template with placeholder
- **Loading**: `dotenv.config()` in Electron main process only
- **Security**: API key never exposed to renderer process

## Version Control

### Git Workflow
- **Branch**: `main` (production-ready)
- **PR-based**: Feature branches merged via PRs
- **Commits**: Conventional commits (feat:, fix:, etc.)

### Repository Structure
- **Source Code**: `electron/`, `src/`
- **Tests**: `tests/`
- **Configuration**: Root level config files
- **Documentation**: `*.md` files
- **Build Artifacts**: `dist/` (gitignored)
- **Environment**: `.env` (gitignored), `.env.example` (committed)

## Deployment Process

### Build Commands
```bash
# Build React app
npm run build

# Package Electron app
npm run electron:build
```

### Output Location
- **Build Artifacts**: `dist/` directory
- **Installer**: `dist/ClipForge-1.0.0-setup.exe` (NSIS)
- **Unpacked App**: `dist/win-unpacked/ClipForge.exe`

### Distribution
- GitHub Releases
- Upload installer artifact
- Include README and demo video
- **Status**: ✅ Ready for GitHub release

## Known Technical Constraints

### Platform Limitations
- **Windows Focus**: Primary target, Linux/Mac not prioritized for MVP
- **Architecture**: Currently x64 only

### Performance Constraints
- **Bundle Size**: ~100-200MB (Electron + FFmpeg)
- **Startup Time**: 2-5 seconds (typical for Electron)
- **Memory**: ~150-300MB typical usage

### FFmpeg Constraints
- **Processing Speed**: Depends on system CPU
- **Large Files**: May take significant time to export
- **Format Support**: Limited to common formats

## Troubleshooting Common Issues

### Development
- **Port Already in Use**: Kill process on port 5173
- **FFmpeg Not Found**: Ensure ffmpeg-static installed
- **Hot Reload Not Working**: Check Vite config

### Build
- **Build Fails**: Check Node version compatibility
- **Packager Error**: Clean node_modules and reinstall
- **Bundle Too Large**: Check electron-builder config

### Runtime
- **Export Fails**: Check file paths and permissions
- **Playback Issues**: Verify video file integrity
- **IPC Errors**: Check preload.js context bridge

## Technical Debt & Future Improvements

### Project Status
**🎉 ALL DEVELOPMENT COMPLETE**
- ✅ All 20 PRs implemented and tested
- ✅ 69 tests passing (100% success rate)
- ✅ Production build verified
- ✅ Installer created (ClipForge-1.0.0-setup.exe)
- ✅ Documentation complete
- ✅ Demo materials prepared

### Future Enhancements (Post-Submission)
- Add loading skeleton for better perceived performance
- Implement cancel button for long exports
- Add more keyboard shortcuts for common actions
- Migrate to React 19 for improved performance
- Add TypeScript for type safety
- Implement automated end-to-end tests
- Optimize bundle size
- Add Linux and macOS builds


# ClipForge - System Patterns

## Architecture Overview

### Process Model
ClipForge uses Electron's multi-process architecture:
- **Main Process**: Manages app lifecycle, window creation, file system access
- **Renderer Process**: React UI, user interactions
- **IPC Bridge**: Secure communication between processes via context bridge

### Component Architecture

#### UI Layer (React)
```
App
├── VideoImport (drag & drop + file picker)
├── VideoPlayer (preview with controls)
├── Timeline (visual clip representation)
├── TrimControls (in/out point setters)
└── ExportButton (export trigger + progress)
```

#### State Management
- **Store**: React Context API (simple, built-in)
- **Store Structure**:
  - `videos`: Array of imported video metadata
  - `selectedVideo`: Current video being edited  
  - `trimPoints`: In/out points per video
  - Methods: addVideo, removeVideo, updateVideo, selectVideo, setInPoint, setOutPoint, getTrimPoints

#### Utility Layer
- **fileUtils.js**: File validation, path handling
- **timeUtils.js**: Time formatting (seconds ↔ MM:SS)

#### Electron Layer
- **main.js**: Window management, IPC handlers, FFmpeg coordination
- **preload.js**: Secure API exposure via context bridge
- **ffmpeg.js**: Video processing utilities

## Key Design Patterns

### 1. IPC Communication Pattern
**Goal**: Secure, type-safe communication between renderer and main process

**Implementation**:
```javascript
// preload.js - Expose API
contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: () => ipcRenderer.invoke('dialog:openFile')
});

// renderer - Use API
const files = await window.electronAPI.selectFile();

// main.js - Handle IPC
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(...);
  return result;
});
```

**Why**: Electron security best practice, prevents renderer from direct Node.js access

### 2. State Management Pattern
**Goal**: Centralized state accessible across components

**Implementation**:
- Single Context with `useState` and `useReducer` for complex state
- Provider wraps entire app
- Custom hooks for state access (`useVideoStore`)

**Why**: Simple for MVP, no external dependencies, sufficient for current scope

### 3. File Handling Pattern
**Goal**: Validate and safely handle user-provided files

**Implementation**:
- Validation before processing (type, existence, permissions)
- Store file paths, not file contents
- Path normalization for cross-platform compatibility

**Why**: Security and reliability for file operations

### 4. Async Processing Pattern
**Goal**: Handle long-running FFmpeg operations without blocking UI

**Implementation**:
- Use `fluent-ffmpeg` promises
- Progress events from FFmpeg → IPC → renderer → UI update
- Async/await throughout chain

**Why**: Better UX, app remains responsive during export

### 5. Error Handling Pattern
**Goal**: Graceful failure with helpful user feedback

**Implementation**:
- Try-catch blocks around critical operations
- User-friendly error messages (not stack traces)
- Validation before operations (fail fast)
- State recovery after errors

**Why**: Reliability and user confidence

## Data Flow Patterns

### Import Flow
```
User Action → VideoImport Component
↓
Extract file path → fileUtils validation
↓
IPC → main process → validate file exists
↓
IPC response → VideoImport
↓
Update videoStore (add video metadata)
↓
Timeline re-renders with new clip
```

### Preview Flow
```
User clicks clip in Timeline
↓
Update selectedVideo in store
↓
VideoPlayer subscribes to selectedVideo usesEffect
↓
Load video element src with file path
↓
Playback ready
```

### Trim Flow
```
User plays video in VideoPlayer
↓
User clicks "Set In Point" → get currentTime from video element
↓
Update trimPoints in store (inPoint = currentTime)
↓
TrimControls displays new inPoint time
```

### Export Flow
```
User clicks Export → ExportButton
↓
Validate trim points (out > in, within duration)
↓
IPC → main process → showSaveDialog
↓
User selects save location → IPC response
↓
IPC → ffmpeg.js → start FFmpeg process with trim params
↓
FFmpeg emits progress events → IPC updates → progress bar (with fallback timer)
↓
Export complete → IPC success → UI confirmation
```

## File Organization Pattern

### Directory Structure
```
clipforge/
├── electron/          # Main process code
├── src/               # Renderer (React) code
│   ├── components/    # React components
│   ├── utils/         # Pure utility functions
│   └── store/         # State management
├── tests/             # Test files
│   ├── unit/          # Component/utility tests
│   ├── integration/   # Feature workflow tests
│   └── fixtures/      # Test data
└── public/            # Static assets
```

### Naming Conventions
- **Components**: PascalCase (VideoPlayer.jsx)
- **Utilities**: camelCase (fileUtils.js)
- **Constants**: UPPER_SNAKE_CASE
- **Test files**: *.test.js or *.test.jsx

## Testing Patterns

### Unit Tests
- **Target**: Pure utility functions (fileUtils, timeUtils)
- **Pattern**: Input → Expected Output assertions
- **Speed**: Fast (< 1 second per file)

### Integration Tests
- **Target**: Component interactions and workflows
- **Pattern**: User actions → State changes → UI updates
- **Speed**: Moderate (< 5 seconds per test)

### Manual Testing
- **Target**: End-to-end workflows in packaged app
- **Pattern**: User journey verification
- **Critical**: Export functionality must be manually verified

## Build & Package Pattern

### Development
```
Vite dev server (port 5173)
↓
Electron main process loads dev server
↓
Hot reload for React changes
↓
Full restart for Electron main process changes
```

### Production
```
Vite build → dist/ (static React bundle)
↓
electron-builder bundles:
  - dist/
  - electron/ (main.js, preload.js, ffmpeg.js)
  - node_modules/
  - ffmpeg-static binary
↓
Windows executable + installer
```

## Security Patterns

### Context Bridge Only
- Never expose full Node.js API to renderer
- Preload script as security boundary
- Explicit API surface area

### Input Validation
- Validate all user-provided file paths
- Sanitize before passing to FFmpeg
- Check file exists before operations

### Sandbox Ready
- While not using sandbox for MVP, design supports it
- All Node.js access happens in main process
- Future sandbox mode would require minimal changes

## Performance Considerations

### Lazy Loading (Future)
- Import only components that are needed
- Code-split for faster initial load

### Memory Management
- Don't load entire video files into memory
- Let HTML5 video element handle streaming
- Release resources when clips are removed

### Export Optimization (Future)
- Queue export requests if needed
- Cancel support for long exports
- Background processing with worker threads

## Decision Log

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| React Context vs Zustand | Simpler, fewer dependencies | Less powerful, adequate for MVP |
| HTML5 video vs custom player | Faster implementation | Less control over playback |
| ffmpeg-static vs system FFmpeg | Zero user setup friction | Larger bundle size (~150MB) |
| DOM timeline vs Canvas | Faster MVP development | Less scalable for large projects |
| Electron vs native | Cross-platform, web skills | Larger size, slower startup |
| webSecurity: false | Required for local file access in Electron | Less secure, but needed for MVP |
| Fallback progress timer | FFmpeg progress events unreliable | Progress bar shows forward movement |


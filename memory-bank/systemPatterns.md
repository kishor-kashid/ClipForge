# ClipForge - System Patterns

## Architecture Overview

### Process Model
ClipForge uses Electron's multi-process architecture:
- **Main Process**: Manages app lifecycle, window creation, file system access, FFmpeg processing
- **Renderer Process**: React UI, user interactions, recording management
- **IPC Bridge**: Secure communication between processes via context bridge

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

### Component Architecture

#### UI Layer (React) - Complete Implementation
```
App
├── Header (with panel toggles, maximize button, current video info)
├── Main Content Area
│   ├── Left Panel (collapsible, resizable 200-600px)
│   │   └── ImportRecordPanel (collapsible container)
│   │       ├── VideoImport (drag & drop + file picker)
│   │       └── RecordingPanel (screen, webcam, audio, PiP)
│   │   └── VideoGrid (library with thumbnails)
│   ├── Center Panel (video player area, maximizable)
│   │   └── VideoPlayer (preview with controls + live recording)
│   └── Right Panel (collapsible, resizable 200-600px)
│       └── EditExportPanel
│           ├── TranscriptionPanel (generate/display transcripts, collapsible)
│           ├── SmartTrimPanel (Highlights Panel - find/apply highlights, collapsible)
│           ├── TrimControls (in/out point setters with AI suggestions toggle)
│           └── ExportButton (single video export with options, collapsible)
└── Timeline Section (adjustable height 150-600px)
    ├── QuickActionsToolbar (undo/redo, shortcuts)
    └── Timeline (multi-track with drag-drop, zoom, snap, highlight markers)
└── ToastProvider (notifications)
```

#### State Management - Complete Implementation
- **Store**: React Context API (simple, built-in)
- **Store Structure**:
  - `videos`: Array of imported video metadata
  - `selectedVideo`: Current video being edited  
  - `trimPoints`: In/out points per video
  - `tracks`: Multi-track timeline state
  - `clips`: Video clips positioned on tracks
  - `recordingState`: Recording mode and device selection
  - `history`: Undo/redo state management
  - `videoElementRef`: Reference to main video player
  - **AI Features**:
    - `transcript`: Transcript data with segments, fullText, duration, isGenerating (stored per video)
    - `trimSuggestions`: Array of trim suggestions (silence, filler, highlights - stored per video)
    - `suggestionsGenerated`: Boolean flag for suggestion generation status
  - Methods: addVideo, removeVideo, updateVideo, selectVideo, setInPoint, setOutPoint, getTrimPoints, addClipToTrack, removeClipFromTrack, undo, redo, setTranscript, getTranscript, clearTranscript, setTranscriptGenerating, generateTrimSuggestions, getTrimSuggestions, clearSuggestions, applySuggestion

#### Utility Layer - Complete Implementation
- **fileUtils.js**: File validation, path handling
- **timeUtils.js**: Time formatting (seconds ↔ MM:SS)
- **thumbnailUtils.jsx**: Canvas-based thumbnail generation with caching
- **keyboardShortcuts.js**: Professional editing shortcuts
- **transcriptAnalysis.js**: AI transcript analysis (silence, filler words, highlights detection)
- **trimSuggestions.js**: Highlight suggestion generator from transcript analysis

#### Electron Layer - Complete Implementation
- **main.js**: Window management, IPC handlers, FFmpeg coordination, AI transcription IPC
- **preload.js**: Secure API exposure via context bridge (includes aiTranscribe)
- **ffmpeg.js**: Video processing utilities with timeline export
- **openaiClient.js**: OpenAI client initialization with API key from .env
- **openaiHandlers.js**: Whisper API transcription handlers
- **audioExtraction.js**: FFmpeg audio extraction utilities for transcription

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

## Timeline Export Implementation

### Filter-Free FFmpeg Approach
**Problem**: FFmpeg filter network errors (`Error reinitializing filters!`) when using `.setStartTime()`, `.setDuration()`, and `.size()` methods.

**Solution**: Use raw FFmpeg input/output options instead of fluent-ffmpeg methods that create internal filters.

**Implementation**:
```javascript
// Stage 1: Normalize clips using inputOptions (NO FILTERS)
clipCommand.inputOptions(['-ss', startTime, '-t', duration])
  .outputOptions(['-preset ultrafast', '-crf 23'])
  .size('1280x720'); // Direct output option

// Stage 2: Concatenate using concat demuxer
ffmpeg().input(concatFile)
  .inputOptions(['-f concat', '-safe 0'])
  .videoCodec('copy').audioCodec('copy'); // No re-encoding
```

### Parallel Processing for Performance
**Goal**: Process multiple clips simultaneously for 2-5x speed improvement.

**Implementation**:
```javascript
// Process all clips in parallel
const clipPromises = allClips.map(async (clip, i) => {
  return processClip(clip); // Each runs independently
});
await Promise.all(clipPromises);
```

**Benefits**:
- Utilizes all CPU cores simultaneously
- Total time = max(clip times) instead of sum
- 2x faster for 2 clips, 3x for 3 clips, etc.

### Timeline Video Library Filtering
**Goal**: Show only videos that are actively used in timeline tracks.

**Implementation**:
```javascript
const getVideosInTimeline = () => {
  const videoIds = new Set();
  tracks.forEach(track => {
    track.clips.forEach(clip => videoIds.add(clip.video.id));
  });
  return videos.filter(v => videoIds.has(v.id));
};
```

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

## UI Layout & Interaction Patterns

### Collapsible Panels Pattern
**Goal**: Maximize workspace flexibility and content visibility

**Implementation**:
- Panel visibility state managed in App component
- Toggle buttons in header with visual state indicators
- Smooth collapse/expand animations
- Keyboard shortcuts for quick access (1: left, 3: right, F: maximize)

### Resizable Panels Pattern
**Goal**: Allow users to customize layout to their workflow

**Implementation**:
- Mouse drag handlers on thin divider lines
- Width/height constraints (200-600px for panels, 150-600px for timeline)
- Visual feedback (resizers highlight on hover)
- Cursor changes during resize operation
- User-select disabled during resize for better UX

### Maximize Video Player Pattern
**Goal**: Focus mode for video editing without distractions

**Implementation**:
- Maximize button hides both side panels
- Video player expands to full width/height
- Padding removed in maximize mode
- Single-key toggle (F) for quick access

### Design System Pattern
**Goal**: Consistent, professional appearance across all components

**Implementation**:
- CSS variables for colors, shadows, spacing, typography
- Standardized button classes (btn-primary, btn-secondary, etc.)
- Consistent spacing scale (4px increments)
- Professional shadow system (sm, md, lg, xl)
- Typography hierarchy with proper weights and sizes

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
| CSS Variables vs Tailwind Only | Better maintainability, consistent design system | Slightly more CSS code |
| Resizable Panels vs Fixed Width | Better user experience, flexibility | More complex state management |


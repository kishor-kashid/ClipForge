# ClipForge MVP - Product Requirements Document

## Executive Summary
ClipForge is a desktop video editor. The focus is on core functionality: import video files, display them on a timeline, perform basic trimming, and export to MP4. This PRD focuses exclusively on MVP requirements to ensure successful completion within the 72-hour timeframe.

---

## User Stories

### Primary User: Content Creator
- **As a content creator**, I want to import video files into the application so that I can begin editing my content
- **As a content creator**, I want to see my imported clips in a timeline view so that I can understand my project structure
- **As a content creator**, I want to preview my video clips so that I can see what I'm working with
- **As a content creator**, I want to trim a clip by setting in/out points so that I can remove unwanted footage
- **As a content creator**, I want to export my edited video as an MP4 file so that I can share my finished work

---

## Key Features for MVP

### 1. Desktop Application Launch
- **Requirement**: Native desktop app that successfully launches and runs
- **Acceptance Criteria**: 
  - App opens without errors on Windows
  - Displays main application window with basic UI
  - App must be packaged (not just running in dev mode)

### 2. Video Import
- **Requirement**: Import video files using **BOTH** drag & drop AND file picker
- **Rationale**: Final submission requires "drag and drop video files" AND "file picker for importing from disk" as separate bullet points under "Import & Media Management"
- **Supported Formats**: MP4, MOV, WebM (as specified in final requirements)
- **Acceptance Criteria**:
  - User can drag and drop video files onto the application
  - User can click a button to open file picker dialog
  - Successfully imported files are stored and accessible
  - Basic error handling for unsupported formats

### 3. Timeline View
- **Requirement**: Simple timeline interface showing imported clips
- **Acceptance Criteria**:
  - Timeline displays imported clips in a visual representation
  - Clips show basic information (filename or thumbnail)
  - Timeline is visually distinct and easy to understand
  - No advanced features needed for MVP (no dragging, reordering, or multi-track)

### 4. Video Preview Player
- **Requirement**: Video player that plays imported clips
- **Acceptance Criteria**:
  - Selected clip plays in preview window
  - Basic play/pause controls present
  - Video and audio play synchronously
  - Player uses HTML5 video element

### 5. Basic Trim Functionality
- **Requirement**: Set in/out points on a single clip
- **Acceptance Criteria**:
  - User can mark a start point (in-point) on a clip
  - User can mark an end point (out-point) on a clip
  - Trim operation affects the exported video
  - Simple UI controls for setting these points

### 6. Export to MP4
- **Requirement**: Export edited video to MP4 format
- **Acceptance Criteria**:
  - Export button triggers video processing
  - Resulting file is a valid MP4
  - Trimmed sections are respected in export
  - File is saved to user's local file system
  - Basic progress indicator or feedback during export

---

## Tech Stack

### Core Technologies
- **Desktop Framework**: Electron
- **Frontend Framework**: React 18+
- **Build Tool**: Vite
- **Media Processing**: FFmpeg (fluent-ffmpeg npm package)
- **Video Player**: HTML5 `<video>` element
- **Styling**: Tailwind CSS (fast, utility-first)
- **File System**: Node.js fs module via Electron
- **Package & Distribution**: electron-builder (targeting Windows)

---

## Technical Pitfalls & Considerations

### 1. FFmpeg Integration
**Challenge**: FFmpeg must be available at runtime
**Solution for MVP**: 
- Bundle ffmpeg-static npm package (adds ~50MB but guarantees availability)
- Eliminates user setup friction
- **Recommendation**: Bundle ffmpeg-static for MVP to avoid deployment issues

### 2. File Path Handling
**Challenge**: Electron runs in multiple processes (main & renderer)
**Solution for MVP**:
- Use IPC (Inter-Process Communication) to handle file operations
- Store file paths in main process, expose via context bridge
- **Recommendation**: Use Electron's contextBridge API for secure access

### 3. Video Preview Performance
**Challenge**: Large video files may cause performance issues
**Solution for MVP**:
- Use native HTML5 video with limited resolution in preview
- Don't load entire video into memory
- Let HTML5 video element handle streaming
- **Recommendation**: Avoid manual buffering for MVP

### 4. Timeline UI Complexity
**Challenge**: Timeline interfaces can become complex quickly
**Solution for MVP**:
- Start with simplest possible visualization (horizontal list of clips)
- Use CSS flexbox for layout, avoid canvas initially
- **Recommendation**: DOM-based solution for speed, can optimize later

### 5. Export Processing Time
**Challenge**: FFmpeg export can be slow, blocking UI
**Solution for MVP**:
- Run FFmpeg in separate process (fluent-ffmpeg handles this)
- Show progress bar based on FFmpeg output
- **Recommendation**: Use fluent-ffmpeg's progress events for real-time feedback

### 6. Drag and Drop Implementation
**Challenge**: Drag and drop needs to work with Electron's security model
**Solution for MVP**:
- Prevent default browser behavior for file drops
- Extract file paths from drop event
- Validate file types before processing
- **Recommendation**: Test early to ensure Windows file path handling works correctly

---

## Explicitly NOT Included in MVP

The following features are **out of scope** for MVP and should not be implemented until after Tuesday's deadline:

### Recording Features (Post-MVP)
- ❌ Screen recording
- ❌ Webcam recording  
- ❌ Audio capture
- ❌ Simultaneous screen + webcam

### Advanced Timeline Features (Post-MVP)
- ❌ Drag and drop clips onto timeline
- ❌ Reordering clips
- ❌ Multiple tracks
- ❌ Clip splitting
- ❌ Zoom in/out
- ❌ Snap-to-grid
- ❌ Playhead scrubbing

### Media Management (Post-MVP)
- ❌ Media library panel
- ❌ Thumbnail generation
- ❌ Metadata display (duration, resolution, file size)
- ❌ Support for additional formats beyond MP4/MOV/WebM

### Advanced Export (Post-MVP)
- ❌ Resolution options (720p, 1080p, etc.)
- ❌ Export presets
- ❌ Cloud upload
- ❌ Multiple format support

### Polish Features (Post-MVP)
- ❌ Text overlays
- ❌ Transitions
- ❌ Audio controls
- ❌ Filters and effects
- ❌ Keyboard shortcuts
- ❌ Auto-save
- ❌ Undo/redo

---

## MVP Success Criteria

The MVP is considered **complete and passing** when:

1. ✅ Desktop app launches successfully when packaged
2. ✅ User can import video files via drag & drop
3. ✅ User can import video files via file picker
4. ✅ Timeline displays the imported clip(s)
5. ✅ Preview player can play the imported clip
6. ✅ User can set in/out points to trim the clip
7. ✅ Export produces a valid MP4 file with trim applied
8. ✅ All functionality works in packaged app (not just dev mode)

---

## Platform Information
- **Development OS**: Windows
- **Target Platform**: Windows (primary)
- **Electron Experience**: First time
- **Framework Choice**: React

---

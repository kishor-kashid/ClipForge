# ClipForge MVP - Task List & PR Breakdown

## Project File Structure

```
clipforge/
├── package.json
├── package-lock.json
├── vite.config.js
├── vitest.config.js               # Vitest configuration
├── electron-builder.yml
├── .gitignore
├── README.md
│
├── electron/
│   ├── main.js                    # Electron main process
│   ├── preload.js                 # Context bridge for renderer
│   └── ffmpeg.js                  # FFmpeg utilities
│
├── src/
│   ├── main.jsx                   # React entry point
│   ├── App.jsx                    # Main app component
│   ├── index.css                  # Global styles (Tailwind)
│   │
│   ├── components/
│   │   ├── VideoImport.jsx        # Drag & drop + file picker
│   │   ├── VideoPlayer.jsx        # Preview player with controls
│   │   ├── Timeline.jsx           # Timeline view
│   │   ├── TrimControls.jsx       # In/out point controls
│   │   └── ExportButton.jsx       # Export functionality
│   │
│   ├── utils/
│   │   ├── fileUtils.js           # File handling utilities
│   │   └── timeUtils.js           # Time formatting utilities
│   │
│   └── store/
│       └── videoStore.js          # State management (Context/Zustand)
│
├── tests/
│   ├── setup.js                   # Test setup file
│   ├── unit/
│   │   ├── fileUtils.test.js      # Unit tests for file utilities
│   │   ├── timeUtils.test.js      # Unit tests for time utilities
│   │   └── videoStore.test.js     # Unit tests for state management
│   │
│   ├── integration/
│   │   ├── videoImport.test.jsx   # Integration test for import flow
│   │   ├── trimControls.test.jsx  # Integration test for trim workflow
│   │   └── export.test.js         # Integration test for export flow
│   │
│   └── fixtures/
│       └── sample-video.mp4       # Small test video (5 seconds)
│
├── public/
│   └── index.html
│
└── dist/                          # Build output (not in git)
```

## Testing Strategy

### Unit Tests (Fast, Isolated)
**Purpose**: Verify individual utility functions work correctly
**PRs with Unit Tests**:
- **PR #2**: `fileUtils.test.js` - File validation logic
- **PR #2**: `videoStore.test.js` - State management operations  
- **PR #5**: `timeUtils.test.js` - Time formatting functions

**Run Command**: `npm test -- tests/unit`

### Integration Tests (Moderate Speed, Component Interaction)
**Purpose**: Verify features work together as user workflows
**PRs with Integration Tests**:
- **PR #2**: `videoImport.test.jsx` - Import flow (drag & drop)
- **PR #6**: `trimControls.test.jsx` - Trim workflow
- **PR #7**: `export.test.js` - Export workflow with FFmpeg

**Run Command**: `npm test -- tests/integration`

### Manual Testing (Slow, End-to-End)
**Purpose**: Verify packaged app works on real hardware
**All PRs**: Manual testing after each PR merge
**Critical**: PR #8 (packaging) requires extensive manual testing

### Test Fixtures
- Create `tests/fixtures/sample-video.mp4` (5-second video)
- Use for integration tests
- Generate using FFmpeg: `ffmpeg -f lavfi -i testsrc=duration=5:size=1280x720:rate=30 -pix_fmt yuv420p sample-video.mp4`

---

## PR #1: Project Setup & Basic Electron App

**Goal**: Initialize project with Electron + React + Vite and get a basic window launching

### Tasks:
- [ ] **Initialize Node.js project**
  - Files: `package.json`
  - Run: `npm init -y`

- [ ] **Install core dependencies**
  - Files: `package.json`
  - Dependencies: `electron`, `react`, `react-dom`, `vite`, `@vitejs/plugin-react`
  - Dev dependencies: `electron-builder`, `concurrently`, `wait-on`

- [ ] **Install utility dependencies**
  - Files: `package.json`
  - Dependencies: `fluent-ffmpeg`, `ffmpeg-static`

- [ ] **Install testing dependencies**
  - Files: `package.json`
  - Dev dependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`

- [ ] **Configure Vitest**
  - Files: `vitest.config.js`, `tests/setup.js`
  - Set up test environment (jsdom for React)
  - Configure test globals
  - Set up testing library

- [ ] **Configure Vite**
  - Files: `vite.config.js`
  - Set up React plugin
  - Configure build output for Electron

- [ ] **Create Electron main process**
  - Files: `electron/main.js`
  - Create browser window
  - Handle app lifecycle events
  - Set up dev/prod environment detection

- [ ] **Create preload script**
  - Files: `electron/preload.js`
  - Set up context bridge
  - Expose safe APIs to renderer

- [ ] **Create basic React app**
  - Files: `src/main.jsx`, `src/App.jsx`, `src/index.css`
  - Set up Tailwind CSS
  - Create basic "Hello ClipForge" UI

- [ ] **Configure package.json scripts**
  - Files: `package.json`
  - Add `dev`, `build`, `electron:dev`, `electron:build` scripts
  - Add `test`, `test:unit`, `test:integration`, `test:watch` scripts

- [ ] **Create .gitignore**
  - Files: `.gitignore`
  - Ignore `node_modules`, `dist`, `build`, etc.

- [ ] **Test app launches in dev mode**
  - Run: `npm run dev`
  - Verify Electron window opens with React content

**PR Title**: "Initial project setup with Electron + React + Vite"

---

## PR #2: Video Import - Drag & Drop

**Goal**: Implement drag and drop functionality for video files

### Tasks:
- [ ] **Create VideoImport component**
  - Files: `src/components/VideoImport.jsx`
  - Create drop zone UI
  - Handle drag events (dragover, dragleave, drop)
  - Prevent default browser behavior

- [ ] **Add file validation**
  - Files: `src/components/VideoImport.jsx`
  - Check file types (MP4, MOV, WebM)
  - Display error for invalid files

- [ ] **Set up IPC for file handling**
  - Files: `electron/preload.js`
  - Expose file reading API via context bridge
  - Handle file path extraction

- [ ] **Create file utilities**
  - Files: `src/utils/fileUtils.js`
  - File type validation
  - File path handling

- [ ] **Write unit tests for file utilities**
  - Files: `tests/unit/fileUtils.test.js`
  - Test file type validation (MP4, MOV, WebM valid; others invalid)
  - Test file extension extraction
  - Test invalid input handling
  - **Verification**: Run `npm test fileUtils.test.js` - all tests must pass

- [ ] **Create video state management**
  - Files: `src/store/videoStore.js`
  - Set up React Context or Zustand
  - Store imported video information (path, name, duration)

- [ ] **Write unit tests for video store**
  - Files: `tests/unit/videoStore.test.js`
  - Test adding videos to store
  - Test selecting videos
  - Test updating video metadata
  - Test removing videos
  - **Verification**: Run `npm test videoStore.test.js` - all tests must pass

- [ ] **Integrate VideoImport into App**
  - Files: `src/App.jsx`
  - Add VideoImport component
  - Wire up state management

- [ ] **Test drag and drop**
  - Verify MP4, MOV, WebM files can be dropped
  - Verify invalid files show error

- [ ] **Write integration test for drag & drop**
  - Files: `tests/integration/videoImport.test.jsx`
  - Test drag and drop event handling
  - Test file validation during drop
  - Test state updates after successful drop
  - **Verification**: Run `npm test videoImport.test.jsx` - all tests must pass

**PR Title**: "Add video import via drag and drop"

---

## PR #3: Video Import - File Picker

**Goal**: Add file picker dialog as alternative import method

### Tasks:
- [ ] **Add file dialog IPC handler**
  - Files: `electron/main.js`
  - Use `dialog.showOpenDialog`
  - Filter for video files
  - Return selected file paths

- [ ] **Expose file picker to renderer**
  - Files: `electron/preload.js`
  - Add `selectFile` method to context bridge

- [ ] **Add file picker button to UI**
  - Files: `src/components/VideoImport.jsx`
  - Create "Import Video" button
  - Handle button click to open dialog
  - Process selected files same as drag & drop

- [ ] **Update state management**
  - Files: `src/store/videoStore.js`
  - Ensure both import methods update state identically

- [ ] **Test file picker**
  - Click button opens file dialog
  - Selected files appear in app
  - Multiple files can be selected

**PR Title**: "Add video import via file picker dialog"

---

## PR #4: Video Player Component

**Goal**: Display and play imported videos

### Tasks:
- [ ] **Create VideoPlayer component**
  - Files: `src/components/VideoPlayer.jsx`
  - Add HTML5 `<video>` element
  - Create play/pause button
  - Add current time display

- [ ] **Handle video source loading**
  - Files: `src/components/VideoPlayer.jsx`
  - Load video from file path
  - Handle video loading errors
  - Display placeholder when no video selected

- [ ] **Add video metadata extraction**
  - Files: `electron/main.js`, `electron/preload.js`
  - Get video duration using ffprobe
  - Store duration in state

- [ ] **Sync player with state**
  - Files: `src/components/VideoPlayer.jsx`, `src/store/videoStore.js`
  - Display currently selected video
  - Update when different clip selected

- [ ] **Add basic playback controls**
  - Files: `src/components/VideoPlayer.jsx`
  - Play/pause toggle
  - Show current playback time
  - Show total duration

- [ ] **Integrate player into App**
  - Files: `src/App.jsx`
  - Add VideoPlayer component
  - Create layout for import + player

- [ ] **Test video playback**
  - Import video, verify it plays
  - Test play/pause controls
  - Verify audio plays with video

**PR Title**: "Add video preview player with playback controls"

---

## PR #5: Timeline View

**Goal**: Display imported videos in a simple timeline interface

### Tasks:
- [ ] **Create Timeline component**
  - Files: `src/components/Timeline.jsx`
  - Create horizontal timeline container
  - Display imported clips as visual blocks

- [ ] **Style timeline clips**
  - Files: `src/components/Timeline.jsx`
  - Show clip filename or thumbnail placeholder
  - Display clip duration
  - Highlight selected clip

- [ ] **Handle clip selection**
  - Files: `src/components/Timeline.jsx`, `src/store/videoStore.js`
  - Click on clip to select it
  - Update video player to show selected clip

- [ ] **Create time utilities**
  - Files: `src/utils/timeUtils.js`
  - Format seconds to MM:SS
  - Convert between time formats

- [ ] **Write unit tests for time utilities**
  - Files: `tests/unit/timeUtils.test.js`
  - Test seconds to MM:SS formatting (e.g., 65 → "01:05")
  - Test edge cases (0 seconds, 3600+ seconds)
  - Test invalid input handling
  - **Verification**: Run `npm test timeUtils.test.js` - all tests must pass

- [ ] **Integrate timeline into App**
  - Files: `src/App.jsx`
  - Add Timeline component
  - Create layout: import area + player + timeline

- [ ] **Test timeline display**
  - Import multiple videos
  - Verify all appear in timeline
  - Click different clips, verify player updates

**PR Title**: "Add timeline view to display imported clips"

---

## PR #6: Trim Controls (In/Out Points)

**Goal**: Allow users to set start and end points for trimming

### Tasks:
- [ ] **Create TrimControls component**
  - Files: `src/components/TrimControls.jsx`
  - Add "Set In Point" button
  - Add "Set Out Point" button
  - Display current in/out times

- [ ] **Add trim state to store**
  - Files: `src/store/videoStore.js`
  - Store in-point (start time) for each clip
  - Store out-point (end time) for each clip
  - Initialize to full clip duration

- [ ] **Sync trim controls with player**
  - Files: `src/components/TrimControls.jsx`, `src/components/VideoPlayer.jsx`
  - Get current playback time from video player
  - Set in-point at current time
  - Set out-point at current time

- [ ] **Add visual feedback**
  - Files: `src/components/TrimControls.jsx`
  - Show in/out times in MM:SS format
  - Show trimmed duration
  - Display trim markers if possible

- [ ] **Add trim validation**
  - Files: `src/components/TrimControls.jsx`
  - Ensure in-point < out-point
  - Display error if invalid
  - Prevent setting invalid ranges

- [ ] **Integrate trim controls into App**
  - Files: `src/App.jsx`
  - Add TrimControls component below player
  - Update layout

- [ ] **Test trim functionality**
  - Play video, set in-point at 5 seconds
  - Set out-point at 10 seconds
  - Verify times stored correctly
  - Test validation with invalid ranges

- [ ] **Write integration test for trim controls**
  - Files: `tests/integration/trimControls.test.jsx`
  - Test setting in-point updates state correctly
  - Test setting out-point updates state correctly
  - Test validation (in-point must be < out-point)
  - Test trim duration calculation
  - **Verification**: Run `npm test trimControls.test.jsx` - all tests must pass

**PR Title**: "Add trim controls for setting in/out points"

---

## PR #7: FFmpeg Export Functionality

**Goal**: Export trimmed video to MP4 using FFmpeg

### Tasks:
- [ ] **Create FFmpeg utility module**
  - Files: `electron/ffmpeg.js`
  - Set up fluent-ffmpeg with ffmpeg-static
  - Create export function with trim parameters
  - Handle progress events

- [ ] **Add export IPC handler**
  - Files: `electron/main.js`
  - Handle export request from renderer
  - Call FFmpeg utility
  - Send progress updates back to renderer
  - Handle export completion/errors

- [ ] **Expose export API to renderer**
  - Files: `electron/preload.js`
  - Add `exportVideo` method
  - Add progress event listener

- [ ] **Create ExportButton component**
  - Files: `src/components/ExportButton.jsx`
  - Add "Export to MP4" button
  - Show progress bar during export
  - Display export status (idle, exporting, complete, error)

- [ ] **Implement export logic**
  - Files: `src/components/ExportButton.jsx`
  - Get selected clip and trim points from state
  - Call export API with parameters
  - Update UI based on progress

- [ ] **Add save dialog**
  - Files: `electron/main.js`
  - Use `dialog.showSaveDialog` to choose output location
  - Default filename with timestamp
  - Return chosen path to renderer

- [ ] **Integrate export button into App**
  - Files: `src/App.jsx`
  - Add ExportButton component
  - Update layout

- [ ] **Test export functionality**
  - Import video, set trim points
  - Click export, choose save location
  - Verify MP4 file created
  - Verify trimmed duration is correct
  - Test progress indicator updates

- [ ] **Write integration test for export**
  - Files: `tests/integration/export.test.js`, `tests/fixtures/sample-video.mp4`
  - Create small sample video fixture (5 seconds)
  - Test export with full video (no trim)
  - Test export with trim applied
  - Test exported file exists and is valid MP4
  - Mock FFmpeg for speed (or use actual small file)
  - **Verification**: Run `npm test export.test.js` - all tests must pass

**PR Title**: "Add video export to MP4 with FFmpeg"

---

## PR #8: App Packaging & Build Configuration

**Goal**: Package app as standalone Windows executable

### Tasks:
- [ ] **Configure electron-builder**
  - Files: `electron-builder.yml`
  - Set app ID, name, version
  - Configure Windows target (NSIS installer)
  - Set icon (optional)
  - Configure file associations

- [ ] **Update build scripts**
  - Files: `package.json`
  - Add `electron:build` script
  - Ensure FFmpeg static binary is included

- [ ] **Test production build**
  - Run: `npm run electron:build`
  - Verify build completes without errors
  - Check build output in `dist/` folder

- [ ] **Install and test packaged app**
  - Run installer from `dist/`
  - Test app launches from installed location
  - Verify all features work in packaged version
  - Test import, play, trim, export flow

- [ ] **Create release artifacts**
  - Locate `.exe` installer in `dist/`
  - Test on clean Windows machine if possible

- [ ] **Document build process**
  - Files: `README.md`
  - Add build instructions
  - Add usage instructions
  - Document system requirements

**PR Title**: "Configure app packaging for Windows distribution"

---

## PR #9: UI Polish & Error Handling

**Goal**: Improve user experience and handle edge cases

### Tasks:
- [ ] **Add loading states**
  - Files: `src/components/VideoImport.jsx`, `src/components/VideoPlayer.jsx`
  - Show loading indicator when importing
  - Show loading while video loads in player

- [ ] **Add error handling**
  - Files: All component files
  - Display user-friendly error messages
  - Handle missing files
  - Handle corrupted videos
  - Handle export failures

- [ ] **Improve UI styling**
  - Files: All component files, `src/index.css`
  - Polish layout and spacing
  - Add hover states to buttons
  - Improve visual hierarchy
  - Ensure responsive design

- [ ] **Add empty states**
  - Files: `src/components/Timeline.jsx`, `src/components/VideoPlayer.jsx`
  - Show helpful message when no videos imported
  - Guide user to import videos

- [ ] **Add keyboard focus management**
  - Files: All component files
  - Ensure tab navigation works
  - Add visible focus indicators

- [ ] **Test complete user flow**
  - Import video via drag & drop
  - Import video via file picker
  - Play video
  - Set trim points
  - Export video
  - Verify exported file

**PR Title**: "Add UI polish and comprehensive error handling"

---

## PR #10: Final Testing & Documentation

**Goal**: Ensure app meets MVP criteria and is ready for submission

### Tasks:
- [ ] **Complete MVP checklist verification**
  - Files: N/A (Testing)
  - ✅ Desktop app launches when packaged
  - ✅ Drag & drop video import works
  - ✅ File picker video import works
  - ✅ Timeline displays imported clips
  - ✅ Preview player plays clips
  - ✅ Trim controls set in/out points
  - ✅ Export produces valid MP4
  - ✅ All features work in packaged app

- [ ] **Run full test suite**
  - Run: `npm test`
  - Verify all unit tests pass
  - Verify all integration tests pass
  - Fix any failing tests
  - **Verification**: 100% test pass rate required

- [ ] **Update README**
  - Files: `README.md`
  - Add project description
  - Add setup instructions
  - Add build instructions
  - Add usage guide
  - Add troubleshooting section
  - List system requirements

- [ ] **Prepare submission package**
  - Create GitHub release
  - Upload Windows installer
  - Add demo video link
  - Add README

- [ ] **Final code cleanup**
  - Remove console.logs
  - Remove commented code
  - Ensure consistent code style
  - Add comments where needed

**PR Title**: "Final testing, documentation, and demo preparation"

---

## MVP Submission Checklist

Before submitting on **Tuesday, October 28th at 10:59 PM CT**:

- [ ] All PRs #1-10 completed and merged
- [ ] App packaged as Windows executable
- [ ] All MVP features functional in packaged app
- [ ] README with setup/build instructions complete
- [ ] Demo video recorded (3-5 minutes)
- [ ] GitHub repository clean and organized
- [ ] Release created with downloadable installer
- [ ] Submission uploaded before deadline

---

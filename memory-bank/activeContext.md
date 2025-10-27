# ClipForge - Active Context

## Current Status
**Phase**: Core Feature Development
**Date**: Post PR #2
**Focus**: PR #3 - Video Import via File Picker

## Recent Changes
- ✅ PR #1 Complete: Project setup with Electron + React + Vite
- ✅ PR #2 Complete: Video Import via Drag & Drop
- ✅ Fixed Tailwind CSS v4 setup with @tailwindcss/postcss
- ✅ Fixed Electron dev mode detection (now loads localhost:5173)
- ✅ All 37 tests passing (fileUtils, videoStore, VideoImport)
- ✅ Drag & drop working in both browser and Electron
- 🔄 Ready to begin PR #3: File Picker Import

## Current Work Focus

### Immediate Next Steps
1. **PR #2: Video Import - Drag & Drop**
   - Create VideoImport component with drag & drop UI
   - Implement file validation utilities
   - Add Electron file dialog handler to main process
   - Expose file picker API via context bridge
   - Update VideoImport component to support file picker
   - Test file picker in Electron window

### Priority Tasks
- Set up IPC for file dialog
- Wire up file picker button to Electron dialog
- Test file selection flow

## Active Decisions & Considerations

### Technology Choices Made
- **State Management**: React Context (simple, no external deps)
- **Styling**: Tailwind CSS (rapid development)
- **Testing**: Vitest (Vite-native, fast)
- **FFmpeg**: ffmpeg-static (zero user setup friction)

### Architecture Decisions
- **IPC Pattern**: Context bridge for security
- **File Handling**: Main process only
- **Progress Feedback**: IPC events from FFmpeg

### Current Concerns
- First-time Electron developer → watch for IPC communication issues
- FFmpeg integration → test early in packaged mode
- Windows path handling → validate file operations work correctly

## Learning Notes

### Electron Concepts to Apply
- Main process vs Renderer process separation
- Context bridge API for secure IPC
- IPC handlers for dialog/file operations
- Window lifecycle management

### Implementation Patterns to Use
- Custom hooks for state access
- useEffect for side effects (video loading, IPC subscriptions)
- Error boundaries for component error handling
- Async/await for FFmpeg operations

## Risk Mitigation

### Identified Risks
1. **IPC Communication Complexity**: Test early with simple message
2. **FFmpeg Not Working**: Use ffmpeg-static and test in dev first
3. **Packaging Issues**: Test packaging early (PR #8 won't be first test)
4. **File Path Issues**: Normalize paths, test with real files
5. **Time Pressure**: Follow PR plan strictly, don't add scope

### Mitigation Strategies
- Create minimal working example for each pattern before full implementation
- Test in packaged app as soon as basic features work
- Keep features minimal (scope reduction if needed)
- Focus on core user flow: import → preview → trim → export

## Next Milestone
**Milestone**: Complete PR #3 - Video Import (File Picker)
**Success Criteria**:
- File picker dialog opens when clicking "Select Files"
- Electron dialog API working via IPC
- File picker accepts multiple video files
- Selected files added to video store
- Works in packaged app (not just dev mode)

## Active Questions
- None currently - proceeding with PR #3 implementation

## Configuration Issues Resolved
- ✅ Fixed index.html location (moved from public/ to root)
- ✅ Fixed PostCSS config (CommonJS syntax, Tailwind v4)
- ✅ Fixed Electron dev detection (using app.isPackaged)
- ✅ Fixed Tailwind CSS v4 setup (@tailwindcss/postcss plugin)

## Communication Notes
- User has reviewed PRD and architecture
- Ready to begin implementation
- Will follow 10-PR plan sequentially


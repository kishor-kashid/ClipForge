# ClipForge - Active Context

## Current Status
**Phase**: Core Feature Development
**Date**: Post PR #1
**Focus**: PR #2 - Video Import via Drag & Drop

## Recent Changes
- ✅ PR #1 Complete: Project setup with Electron + React + Vite
- ✅ All dependencies installed and configured
- ✅ Electron main process and preload script created
- ✅ Basic React app with Tailwind CSS running
- ✅ Test suite working (happy-dom environment)
- 🔄 Ready to begin PR #2: Video Import - Drag & Drop

## Current Work Focus

### Immediate Next Steps
1. **PR #2: Video Import - Drag & Drop**
   - Create VideoImport component with drag & drop UI
   - Implement file validation utilities
   - Set up IPC for file handling
   - Create video state management (React Context)
   - Write unit tests for file utilities
   - Write integration tests for import flow

### Priority Tasks
- Implement drag & drop file handling
- Create file validation logic
- Set up video store with React Context
- Test import workflow end-to-end

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
**Milestone**: Complete PR #2 - Video Import (Drag & Drop)
**Success Criteria**:
- VideoImport component created
- Drag & drop accepts MP4, MOV, WebM files
- Invalid files show error messages
- File utilities unit tests pass
- Video store tests pass
- Integration test for drag & drop passes

## Active Questions
- None currently - proceeding with PR #1 implementation

## Communication Notes
- User has reviewed PRD and architecture
- Ready to begin implementation
- Will follow 10-PR plan sequentially


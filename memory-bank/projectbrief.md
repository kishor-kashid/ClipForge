# ClipForge - Project Brief

## Project Identity
**ClipForge** is a desktop video editing application designed to provide essential video editing capabilities with a clean, intuitive interface.

## Core Mission
Build a functional video editor that allows users to import, preview, trim, and export video content quickly and efficiently without the complexity of professional editing software.

## Primary Goals
1. **MVP Deadline**: Deliver complete MVP by **Tuesday, October 28th at 10:59 PM CT** (72-hour sprint)
2. **Core Functionality**: Video import, timeline display, preview playback, trimming, and MP4 export
3. **Platform**: Windows desktop application using Electron + React
4. **User Experience**: Simple, efficient workflow for basic video editing tasks

## Success Definition
The MVP is considered **complete and passing** when:
- ✅ Desktop app launches successfully when packaged
- ✅ User can import video files via drag & drop
- ✅ User can import video files via file picker
- ✅ Timeline displays the imported clip(s)
- ✅ Preview player can play the imported clip
- ✅ User can set in/out points to trim the clip
- ✅ Export produces a valid MP4 file with trim applied
- ✅ All functionality works in packaged app (not just dev mode)

## Scope Boundaries

### In Scope (MVP)
- Import videos (MP4, MOV, WebM) via drag & drop and file picker
- Display clips in a timeline view
- Preview playback with basic controls
- Set in/out points for trimming
- Export trimmed video to MP4

### Out of Scope (Post-MVP)
- Recording features (screen, webcam, audio capture)
- Advanced timeline features (multi-track, reordering, drag-and-drop on timeline)
- Media library panel and thumbnail generation
- Advanced export options (resolutions, presets, cloud upload)
- Polish features (transitions, filters, effects, text overlays, audio controls)

## Target User
**Primary User**: Content Creator
- Needs basic video editing capabilities
- Wants simple, fast workflow
- Doesn't need professional-grade features
- Values ease of use over feature complexity

## Technical Foundation
- **Desktop Framework**: Electron
- **Frontend**: React 18+ with Tailwind CSS
- **Build Tool**: Vite
- **Media Processing**: FFmpeg (fluent-ffmpeg with ffmpeg-static)
- **Testing**: Vitest + Testing Library
- **Packaging**: electron-builder (Windows target)

## Key Constraints
- **Time**: 72-hour development window
- **Platform**: Windows primary target
- **Experience Level**: First-time Electron developer
- **Resource Priority**: MVP features over optimization
- **Bundle Size**: Acceptable for MVP (performance > size initially)

## Project Structure
See `clipforge_tasks.md` for detailed 10-PR breakdown and file structure.

## Critical Success Factors
1. Early packaging testing (don't wait until PR #8)
2. FFmpeg integration working in both dev and production
3. File handling across Electron main/renderer processes
4. IPC communication for file operations
5. Complete feature testing in packaged app before submission


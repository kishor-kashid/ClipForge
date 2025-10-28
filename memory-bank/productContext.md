# ClipForge - Product Context

## Why This Project Exists

### The Problem
Content creators need simple video editing capabilities without the learning curve and complexity of professional editing software. Many existing solutions are either:
- Overly complex with features they don't need
- Expensive subscription-based services
- Web-based with upload/download limitations
- Lacking basic functionality

### The Solution
ClipForge provides a focused, desktop-based video editor with exactly the core features needed: import, preview, trim, and export. It runs locally, processes files quickly, and requires no cloud services or subscriptions.

## User Experience Goals

### Simplicity First
- **One workflow**: Import → Preview → Trim → Export
- **No jargon**: Clear, everyday language in the UI
- **Immediate feedback**: Visual indicators for all actions
- **No hidden steps**: Everything the user needs is visible

### Fast & Efficient
- **Local processing**: No upload delays or bandwidth concerns
- **Quick preview**: Start playback almost instantly
- **Straightforward trimming**: Set points and export
- **Reliable export**: One-button export process

### Confidence Building
- **Clear visual feedback**: Timeline shows what's imported
- **Playback verification**: See exactly what will be exported
- **Trim validation**: Prevent invalid settings (in > out)
- **Export confirmation**: Know when export completes successfully

## How It Should Work

### User Journey 1: Quick Trim
1. User drags a video file into the app
2. Timeline shows the imported clip
3. User plays video in preview player
4. User sets start point at 00:15 (in-point)
5. User sets end point at 01:30 (out-point)
6. User clicks "Export to MP4"
7. App processes trim and saves file
8. User gets valid MP4 with 01:15 duration

### User Journey 2: Multiple Clips
1. User clicks "Import Video" button
2. File picker opens, user selects 3 clips
3. Timeline displays all 3 clips
4. User clicks different clips to preview each
5. User selects clip 2 and sets trim points
6. User exports clip 2 with trimming applied

## Feature Prioritization

### Must-Have (MVP)
- **Import**: Essential first step
- **Timeline**: User needs to see what they're working with
- **Preview**: User must verify content before editing
- **Trim**: Core editing functionality
- **Export**: Deliverable end result

### Critical UX Elements
- **Loading states**: Show progress during import/export
- **Error messages**: User-friendly when things go wrong
- **Empty states**: Guide users to take action
- **Feedback**: Confirm successful actions

### Deliberately Excluded (Post-MVP)
- Recording: Different use case, adds significant complexity
- Multi-track: Complicates timeline and export logic
- Transitions: Nice-to-have, not essential for MVP
- Effects: Scope creep, can be added later

## User Expectations

### What Users Expect
- Desktop app launches reliably
- Common video formats work (MP4, MOV, WebM)
- Preview plays smoothly
- Trim is precise to second level
- Export produces watchable video

### Where Users Are Understanding
- Export takes time (video processing is intensive)
- Large files may take longer to import/export
- Preview may have slight delay on load
- App bundle size is significant (FFmpeg included)

## Success Metrics
- **Functional**: ✅ All MVP features implemented and working
- **Usable**: ✅ Workflow completes in under 2 minutes for typical use
- **Reliable**: ✅ Export produces valid, playable MP4 consistently
- **No-crash**: ✅ App handles errors gracefully without closing
- **Tested**: ✅ 64/64 tests passing

## Problem-Solution Alignment

| User Need | ClipForge Solution |
|-----------|-------------------|
| Quick video trim | In/out point controls with export |
| Preview before export | HTML5 video player with playback |
| See project structure | Timeline with visible clips |
| Import files easily | Drag & drop + file picker |
| Local, offline use | Electron desktop app |
| No subscription | One-time install |
| Reliable export | FFmpeg with progress feedback |


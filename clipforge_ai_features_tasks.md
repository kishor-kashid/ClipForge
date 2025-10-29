# ClipForge AI Features - Task List & PR Breakdown
## Transcription + Smart Trim Implementation

---

## Project Overview

**Goal**: Integrate OpenAI Whisper API for video transcription and implement AI-powered smart trim suggestions based on transcript analysis.

**Features**:
1. **Auto Transcription** - Generate transcripts from video audio using Whisper API
2. **Highlights Detection** - Analyze transcripts to find and suggest the best highlight segments of the video

**Dependencies**: OpenAI API key required, OpenAI Node.js SDK

---

## PR #21: Auto Transcription with Whisper API

**Goal**: Extract audio from videos and generate transcripts with timestamps using OpenAI Whisper API.

### Tasks:

#### Task 1: Setup OpenAI Integration Infrastructure
- [ ] **Install OpenAI SDK**
  - Files: `package.json`
  - Add `openai` package to dependencies
  - Version: Latest stable (^4.x)
  - Command: `npm install openai`

- [ ] **Create OpenAI Client Utility**
  - Files: `electron/openaiClient.js` (NEW)
  - Initialize OpenAI client with API key from environment variable
  - Load API key from process.env.OPENAI_API_KEY
  - Export singleton client instance
  - Include error handling for missing/invalid keys

- [ ] **Add Environment Variable Support**
  - Files: `.env.example` (NEW), `.gitignore`, `package.json`
  - Create `.env.example` file with OPENAI_API_KEY placeholder
  - Install `dotenv` package: `npm install dotenv`
  - Ensure `.env` is in `.gitignore` (already present)
  - Load environment variables in `electron/main.js` using dotenv.config()

#### Task 2: Audio Extraction from Video
- [ ] **Create Audio Extraction Utility**
  - Files: `electron/audioExtraction.js` (NEW)
  - Use FFmpeg to extract audio track from video
  - Support formats: MP3, WAV for Whisper input
  - Handle videos without audio tracks gracefully
  - Create temporary audio files in system temp directory
  - Cleanup temp files after processing

- [ ] **Audio Extraction Helper Function**
  - Function: `extractAudio(videoPath, outputFormat)`
  - Use fluent-ffmpeg to extract audio
  - Return path to extracted audio file

- [ ] **Integration with Existing FFmpeg Setup**
  - Files: `electron/ffmpeg.js`
  - Ensure ffmpeg-static is available for audio extraction
  - Reuse existing FFmpeg configuration

#### Task 3: Whisper API Integration
- [ ] **Create Transcription IPC Handler**
  - Files: `electron/openaiHandlers.js` (NEW)
  - IPC handler: `ai:transcribe`
  - Accepts: video path or audio file path
  - Extracts audio, sends to Whisper API
  - Returns transcript with timestamps
  - Handle rate limits and errors gracefully

- [ ] **Implement Transcription Function**
  - Function: `transcribeVideo(videoPath)`
  - Extract audio from video
  - Send audio file to Whisper API
  - Process response with timestamps
  - Return structured transcript data

- [ ] **Handle Whisper Response Format**
  - Parse Whisper API response
  - Extract segments with timestamps
  - Structure data for storage: segments array, fullText, duration

- [ ] **Progress Tracking**
  - Show progress during transcription (indeterminate, API doesn't provide progress)
  - Handle long transcriptions (>25MB audio files need chunking)
  - Timeout handling for very long videos

#### Task 4: Expose Transcription API via Context Bridge
- [ ] **Update Preload Script**
  - Files: `electron/preload.js`
  - Add transcription API method: `aiTranscribe(videoPath)`
  - Use `ipcRenderer.invoke('ai:transcribe', videoPath)`

- [ ] **Secure API Exposure**
  - Follow existing context bridge pattern
  - Ensure no direct API key exposure to renderer

#### Task 5: Store Transcripts in Video Store
- [ ] **Update Video Store Structure**
  - Files: `src/store/videoStore.jsx`
  - Add `transcript` field to video objects with: segments, fullText, duration, generatedAt, isGenerating

- [ ] **Add Transcript Management Methods**
  - Files: `src/store/videoStore.jsx`
  - `setTranscript(videoPath, transcriptData)` - Store transcript
  - `getTranscript(videoPath)` - Retrieve transcript
  - `clearTranscript(videoPath)` - Remove transcript
  - Update `updateVideo` to handle transcript updates

#### Task 6: Create TranscriptionPanel Component
- [ ] **Build TranscriptionPanel Component**
  - Files: `src/components/TranscriptionPanel.jsx` (NEW)
  - Show transcription status (idle, generating, complete, error)
  - Display transcript with timestamps
  - "Generate Transcript" button
  - "Regenerate Transcript" button
  - Loading spinner during transcription
  - Error message display

- [x] **Transcript Display UI**
  - Full transcript text display (segments list removed from UI)
  - Scrollable transcript area
  - Copy transcript text functionality
  - Segments data still stored internally for highlight detection
  - Export to SRT/VTT file option (optional enhancement - not implemented)

- [ ] **Integrate with Video Store**
  - Use `useVideoStore` hook
  - Call `window.electronAPI.aiTranscribe(videoPath)`
  - Update video store with transcript data
  - Show transcript for selected video

#### Task 7: Integrate TranscriptionPanel into App
- [ ] **Add to Edit/Export Panel**
  - Files: `src/components/EditExportPanel.jsx`
  - Add TranscriptionPanel as new section
  - Or create collapsible section
  - Position: Above trim controls or as separate panel

- [ ] **Alternative: Standalone Panel**
  - Files: `src/App.jsx`
  - Add TranscriptionPanel to right panel
  - Or add as new tab/section in existing panels

#### Task 8: Error Handling & User Feedback
- [ ] **Handle API Errors**
  - Missing API key (show helpful message)
  - Rate limit errors (429)
  - Invalid API key
  - Network errors
  - Large file errors (>25MB for Whisper)
  - Video without audio track

- [ ] **User Feedback**
  - Toast notifications for success/error
  - Clear error messages
  - Instructions for API key setup (if needed)
  - Progress indicators

#### Task 9: Testing
- [ ] **Unit Tests**
  - Files: `tests/unit/transcriptAnalysis.test.js` (NEW - for next PR)
  - Test audio extraction function (if extractable logic)
  - Mock OpenAI API responses
  - Test transcript data structure parsing

- [ ] **Integration Tests**
  - Files: `tests/integration/transcription.test.jsx` (NEW)
  - Test TranscriptionPanel component
  - Mock `window.electronAPI.aiTranscribe`
  - Test transcript storage in videoStore
  - Test error states

- [ ] **Manual Testing**
  - Test with video that has audio
  - Test with video without audio (should handle gracefully)
  - Test with long videos (>10 minutes)
  - Test API key validation
  - Test error scenarios

**PR Title**: "Add auto transcription using OpenAI Whisper API"

**Acceptance Criteria**:
- ✅ User can generate transcript for any video with audio
- ✅ Transcripts display with timestamps
- ✅ Transcripts stored in videoStore and persist
- ✅ Error handling for missing/invalid API keys
- ✅ Loading states during transcription
- ✅ Works with existing video selection workflow

---

## PR #22: Highlights Detection Based on Transcript Analysis

**Goal**: Analyze transcripts to find and suggest the best highlight segments (best parts) of the video.

**Dependencies**: Requires PR #21 (transcription must be complete)

**Note**: Backend includes silence and filler word detection, but UI only shows highlight suggestions.

### Tasks:

#### Task 1: Create Transcript Analysis Utilities
- [x] **Create Transcript Analysis Module**
  - Files: `src/utils/transcriptAnalysis.js` (NEW)
  - Functions to analyze transcript segments
  - Silence detection algorithm (backend only, not shown in UI)
  - Filler word detection (backend only, not shown in UI)
  - Natural pause identification (backend only, not shown in UI)
  - Best segment detection (PRIMARY - shown in UI as highlights)

- [x] **Silence Detection Function**
  - Function: `detectSilence(transcript)`
  - Analyze gaps between segments
  - Identify silence periods (>2 seconds)
  - Return silence regions with timestamps: start, end, duration
  - Used in backend but not displayed in UI

- [x] **Filler Word Detection Function**
  - Function: `detectFillerWords(transcript)`
  - Common fillers: "um", "uh", "like", "you know", "so", "well"
  - Detect filler word occurrences
  - Return filler word segments with: start, end, text, confidence
  - Used in backend but not displayed in UI

- [x] **Natural Pause Detection**
  - Detect punctuation pauses (periods, commas)
  - Identify natural speech breaks
  - Return pause positions suitable for trimming
  - Used in backend but not displayed in UI

- [x] **Best Segment Detection (Highlight Detection)**
  - Function: `detectBestSegments(transcript, highlightDuration)`
  - Identify most interesting 30-60 second segments
  - Analyze word density (words per second)
  - Filter out segments starting with fillers
  - Score segments and suggest top highlights
  - PRIMARY FEATURE - shown in UI

#### Task 2: Generate Highlight Suggestions
- [x] **Create Trim Suggestion Generator**
  - Files: `src/utils/trimSuggestions.js` (NEW)
  - Combine analysis results into trim suggestions
  - Calculate confidence scores
  - Generate suggestion objects with: type, startTime, endTime, confidence, reason, suggestion

- [x] **Suggestion Types**
  - **Remove Silence**: Suggest removing silence gaps (backend only, not shown in UI)
  - **Remove Fillers**: Suggest removing filler word segments (backend only, not shown in UI)
  - **Create Highlight**: Suggest best 30/60 second segment (PRIMARY - shown in UI)
  - Note: Only highlight suggestions are displayed to users

- [x] **Confidence Scoring**
  - Calculate confidence based on:
    - Silence duration (longer = higher confidence) - for silence suggestions (backend)
    - Filler word frequency - for filler suggestions (backend)
    - Segment content quality (words per second × duration) - for highlights (UI)

#### Task 3: Update Video Store for Suggestions
- [x] **Add Suggestions to Video Store**
  - Files: `src/store/videoStore.jsx`
  - Store suggestions per video: trimSuggestions array, suggestionsGenerated boolean
  - All suggestion types stored (silence, filler, highlights) but UI filters to highlights only

- [x] **Add Suggestion Methods**
  - `generateTrimSuggestions(videoPath, options)` - Analyze transcript and generate all suggestions
  - `getTrimSuggestions(videoPath)` - Retrieve all suggestions (UI filters for highlights)
  - `clearSuggestions(videoPath)` - Clear suggestions
  - `applySuggestion(videoPath, suggestion)` - Apply suggestion to trim points

#### Task 4: Create Highlights Panel Component
- [x] **Build Highlights Panel Component**
  - Files: `src/components/SmartTrimPanel.jsx` (renamed conceptually to Highlights Panel)
  - Show highlight suggestions only (filtered from all suggestions)
  - Display timestamps, duration, confidence
  - "Find Highlights" button
  - "Apply Best Highlight" button (applies top highlight)
  - Preview and Apply buttons for each highlight

- [x] **Highlight Display**
  - List of highlight suggestions with:
    - Time range (MM:SS - MM:SS)
    - Duration
    - Confidence indicator (visual progress bar)
    - Reason/description
    - Preview button (seek to time in video player)
    - Apply button (sets trim points to highlight range)

- [x] **Integration with Video Store**
  - Use `useVideoStore` hook
  - Call suggestion generation (gets all types, filters to highlights)
  - Display highlight suggestions for selected video
  - Apply highlight suggestions to trim points
  - Filter suggestions: `suggestions.filter(s => s.type === 'create_highlight')`

#### Task 5: Visual Indicators on Timeline
- [x] **Add Highlight Markers to Timeline**
  - Files: `src/components/Timeline.jsx`
  - Show highlight markers on timeline only
  - Visual indicators:
    - Highlight suggestions (blue markers)
    - Filtered to show only `create_highlight` type suggestions
  - Clickable markers show tooltip with highlight info
  - Markers positioned at highlight start/end times

#### Task 6: Apply Highlight Functionality
- [x] **Implement Apply Logic**
  - Files: `src/store/videoStore.jsx`, `src/components/SmartTrimPanel.jsx`
  - When highlight suggestion applied:
    - Update trim points in store
    - Set in-point to highlight start time
    - Set out-point to highlight end time
    - Save to history for undo/redo

- [x] **Apply Best Highlight**
  - Apply the first (best) highlight suggestion
  - Confirmation dialog before applying
  - Updates trim points to highlight time range
  - Toast notification on success

#### Task 7: Enhance TrimControls Component
- [x] **Add AI Suggestions Integration**
  - Files: `src/components/TrimControls.jsx`
  - Add "Show AI Suggestions" toggle
  - Display top highlight suggestions inline (filtered to highlights only)
  - Quick apply buttons for each suggestion
  - Visual connection between suggestions and trim controls
  - Shows top 3 highlights by confidence

#### Task 8: User Preferences for Highlights
- [x] **Add Configuration Options**
  - Files: `src/components/SmartTrimPanel.jsx`
  - Configurable thresholds:
    - Minimum confidence threshold (slider 0-100%)
    - Silence duration and filler detection kept in backend (not shown in UI)
    - Highlight duration defaults to 30 seconds (configurable in backend)

#### Task 9: Error Handling
- [x] **Handle Edge Cases**
  - Video without transcript (show message to generate first)
  - Transcript with no highlights found (show message)
  - Invalid trim points after applying suggestions (validate in apply logic)
  - Video player not ready for preview (show warning)

#### Task 10: Testing
- [x] **Unit Tests**
  - Files: `tests/unit/transcriptAnalysis.test.js`
  - Test silence detection algorithm (backend functionality)
  - Test filler word detection (backend functionality)
  - Test highlight detection (primary feature)
  - Test suggestion generation logic
  - Test confidence scoring

- [x] **Integration Tests**
  - Files: `tests/integration/smartTrim.test.jsx`
  - Test Highlights Panel component (SmartTrimPanel)
  - Test highlight generation and display
  - Test applying highlight suggestions to trim points
  - Test timeline visual indicators (highlight markers only)

- [x] **Manual Testing**
  - Test with video to generate transcript
  - Test "Find Highlights" button
  - Test highlight suggestions display
  - Test applying individual highlight suggestions
  - Test "Apply Best Highlight" functionality
  - Test preview functionality
  - Test with videos without transcripts

**PR Title**: "Add AI-powered highlights detection based on transcript analysis"

**Acceptance Criteria**:
- ✅ Can generate highlight suggestions from transcript
- ✅ Highlights display in Highlights Panel (SmartTrimPanel)
- ✅ Visual indicators (blue markers) show on timeline for highlights only
- ✅ Can apply highlight suggestions to trim points
- ✅ Highlight detection finds best 30-60 second segments
- ✅ "Apply Best Highlight" quickly applies top highlight
- ✅ Preview functionality for highlights
- ✅ Highlights integrate with existing trim workflow
- ✅ Error handling for videos without transcripts
- ✅ Backend still detects silence/fillers but UI only shows highlights
- ✅ Segments removed from TranscriptionPanel UI (data still stored)

---

## Implementation Order

1. **Start with PR #21 (Transcription)**
   - Complete all transcription tasks
   - Test thoroughly
   - Ensure transcripts are stored and accessible

2. **Then PR #22 (Smart Trim)**
   - Build on transcription data
   - Test suggestion generation
   - Integrate with existing trim workflow

---

## File Structure Summary

### New Files to Create:
```
electron/
├── openaiClient.js           # OpenAI client initialization
├── openaiHandlers.js         # Transcription IPC handlers
└── audioExtraction.js        # FFmpeg audio extraction

src/
├── components/
│   ├── TranscriptionPanel.jsx    # Transcription UI (segments removed from display)
│   └── SmartTrimPanel.jsx         # Highlights Panel UI (shows highlights only)
└── utils/
    ├── transcriptAnalysis.js      # Analyze transcripts
    └── trimSuggestions.js          # Generate suggestions

tests/
├── unit/
│   └── transcriptAnalysis.test.js
└── integration/
    ├── transcription.test.jsx
    └── smartTrim.test.jsx
```

### Files to Modify:
```
electron/
├── main.js              # Register new IPC handlers
└── preload.js           # Expose AI APIs

src/
├── store/
│   └── videoStore.jsx   # Add transcript & suggestions storage
├── components/
│   ├── EditExportPanel.jsx  # Add TranscriptionPanel & Highlights Panel
│   ├── Timeline.jsx         # Add highlight markers only (blue)
│   ├── TrimControls.jsx     # Integrate highlight suggestions
│   └── TranscriptionPanel.jsx  # Remove segments display from UI
└── App.jsx              # Layout updates (if needed)
```

---

## Configuration & Setup

### Environment Variables
- Files: `.env` (create from `.env.example`), `.env.example` (template)
- Required variable: `OPENAI_API_KEY=sk-...`
- Use `dotenv` package to load environment variables in Electron main process

### Package Dependencies
- Add to `package.json`: 
  - `openai` (^4.x) - For Whisper API integration
  - `dotenv` - For loading environment variables from .env file
- Commands: `npm install openai dotenv`

---

## Testing Strategy

### Manual Testing Checklist

**PR #21 - Transcription**:
- [ ] Generate transcript for short video (<2 min)
- [ ] Generate transcript for medium video (5-10 min)
- [ ] Test with video without audio (should handle gracefully)
- [ ] Test with invalid/missing API key (should show error)
- [ ] Verify transcript persists when selecting different videos
- [ ] Test copy transcript functionality
- [ ] Verify timestamps are accurate

**PR #22 - Highlights Detection**:
- [ ] Test "Find Highlights" button
- [ ] Generate highlight suggestions from transcript
- [ ] Verify highlights appear in Highlights Panel
- [ ] Test highlight markers on timeline (blue markers)
- [ ] Apply individual highlight suggestion
- [ ] Test "Apply Best Highlight" button
- [ ] Test preview functionality for highlights
- [ ] Test with video without transcript (should prompt)
- [ ] Verify undo/redo works with applied highlight suggestions
- [ ] Verify segments removed from TranscriptionPanel UI

---

## Known Limitations & Considerations

1. **API Costs**: Whisper API charges per minute of audio (~$0.006/minute)
   - Consider showing cost estimate before transcription
   - Cache transcripts to avoid re-transcribing

2. **File Size Limits**: Whisper has 25MB file size limit
   - Need to handle large videos (chunk or compress audio)

3. **Rate Limits**: OpenAI API has rate limits
   - Implement retry logic with exponential backoff
   - Show rate limit errors to user

4. **Processing Time**: Transcription can take time for long videos
   - Show progress indicators
   - Consider background processing

5. **Language Support**: Whisper supports 50+ languages
   - Default to auto-detect
   - Could add language selection in future

6. **Accuracy**: Whisper accuracy varies by audio quality
   - Best with clear speech
   - May struggle with background noise

---

## Future Enhancements (Post-MVP)

- Export transcript to SRT/VTT files
- Real-time caption display in video player
- Multi-language transcript support
- Custom filler word lists
- Advanced highlight detection (sentiment analysis)
- AI-powered scene detection (Phase 2 feature)
- Search functionality using transcripts (Phase 2 feature)

---

**Dependencies**: OpenAI API key required

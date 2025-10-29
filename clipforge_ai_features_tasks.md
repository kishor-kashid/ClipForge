# ClipForge AI Features - Task List & PR Breakdown
## Transcription + Smart Trim Implementation

---

## Project Overview

**Goal**: Integrate OpenAI Whisper API for video transcription and implement AI-powered smart trim suggestions based on transcript analysis.

**Features**:
1. **Auto Transcription** - Generate transcripts from video audio using Whisper API
2. **Smart Trim Suggestions** - Analyze transcripts to suggest optimal trim points (silence, filler words, highlights)

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

- [ ] **Transcript Display UI**
  - Show segments in readable format
  - Timestamp display (MM:SS format)
  - Full transcript text display
  - Scrollable transcript area
  - Copy transcript text functionality
  - Export to SRT/VTT file option (optional enhancement)

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

## PR #22: Smart Trim Suggestions Based on Transcript Analysis

**Goal**: Analyze transcripts to suggest optimal trim points for removing silence, filler words, and creating highlight reels.

**Dependencies**: Requires PR #21 (transcription must be complete)

### Tasks:

#### Task 1: Create Transcript Analysis Utilities
- [ ] **Create Transcript Analysis Module**
  - Files: `src/utils/transcriptAnalysis.js` (NEW)
  - Functions to analyze transcript segments
  - Silence detection algorithm
  - Filler word detection
  - Natural pause identification
  - Best segment detection

- [ ] **Silence Detection Function**
  - Function: `detectSilence(transcript)`
  - Analyze gaps between segments
  - Identify silence periods (>2 seconds)
  - Return silence regions with timestamps: start, end, duration

- [ ] **Filler Word Detection Function**
  - Function: `detectFillerWords(transcript)`
  - Common fillers: "um", "uh", "like", "you know", "so", "well"
  - Detect filler word occurrences
  - Return filler word segments with: start, end, text, confidence

- [ ] **Natural Pause Detection**
  - Detect punctuation pauses (periods, commas)
  - Identify natural speech breaks
  - Return pause positions suitable for trimming

- [ ] **Best Segment Detection (Optional)**
  - Identify most interesting 30-60 second segments
  - Could analyze word frequency, detect key phrases
  - Suggest highlight reels

#### Task 2: Generate Trim Suggestions
- [ ] **Create Trim Suggestion Generator**
  - Files: `src/utils/trimSuggestions.js` (NEW)
  - Combine analysis results into trim suggestions
  - Calculate confidence scores
  - Generate suggestion objects with: type, startTime, endTime, confidence, reason, suggestion

- [ ] **Suggestion Types**
  - **Remove Silence**: Suggest removing silence gaps
  - **Remove Fillers**: Suggest removing filler word segments
  - **Create Highlight**: Suggest best 30/60 second segment
  - **Trim to Segment**: Suggest trimming to keep specific segment

- [ ] **Confidence Scoring**
  - Calculate confidence based on:
    - Silence duration (longer = higher confidence)
    - Filler word frequency
    - Segment content quality

#### Task 3: Update Video Store for Suggestions
- [ ] **Add Suggestions to Video Store**
  - Files: `src/store/videoStore.jsx`
  - Store suggestions per video: trimSuggestions array, suggestionsGenerated boolean

- [ ] **Add Suggestion Methods**
  - `generateTrimSuggestions(videoPath)` - Analyze transcript and generate
  - `getTrimSuggestions(videoPath)` - Retrieve suggestions
  - `clearSuggestions(videoPath)` - Clear suggestions
  - `applySuggestion(videoPath, suggestion)` - Apply suggestion to trim points

#### Task 4: Create SmartTrimPanel Component
- [ ] **Build SmartTrimPanel Component**
  - Files: `src/components/SmartTrimPanel.jsx` (NEW)
  - Show suggestions list
  - Display suggestion type, timestamps, confidence
  - Accept/reject individual suggestions
  - "Generate Suggestions" button
  - "Apply All" button (with confirmation)
  - Group suggestions by type (Silence, Fillers, Highlights)

- [ ] **Suggestion Display**
  - List of suggestions with:
    - Type badge (Silence, Filler, Highlight)
    - Time range (MM:SS - MM:SS)
    - Confidence indicator
    - Reason/description
    - Accept/Reject buttons
  - Preview button (seek to time in video player)

- [ ] **Integration with Video Store**
  - Use `useVideoStore` hook
  - Call suggestion generation
  - Display suggestions for selected video
  - Apply suggestions to trim points

#### Task 5: Visual Indicators on Timeline
- [ ] **Add Suggestions to Timeline**
  - Files: `src/components/Timeline.jsx`
  - Show suggestion markers on timeline
  - Visual indicators for:
    - Silence regions (red/yellow overlay)
    - Filler word positions (small dots/indicators)
    - Highlight suggestions (blue markers)
  - Clickable markers to preview/app

#### Task 6: Apply Suggestions Functionality
- [ ] **Implement Apply Logic**
  - Files: `src/store/videoStore.jsx`, `src/components/SmartTrimPanel.jsx`
  - When suggestion applied:
    - Update trim points in store
    - For "remove" suggestions: Set trim points to exclude
    - For "highlight" suggestions: Set trim points to include
  - Save to history for undo/redo

- [ ] **Batch Apply**
  - Apply multiple suggestions at once
  - Combine overlapping suggestions
  - Validate resulting trim points

#### Task 7: Enhance TrimControls Component
- [ ] **Add AI Suggestions Integration**
  - Files: `src/components/TrimControls.jsx`
  - Add "Show AI Suggestions" toggle
  - Display suggestions inline
  - Quick apply buttons for each suggestion
  - Visual connection between suggestions and trim controls

#### Task 8: User Preferences for Suggestions
- [ ] **Add Configuration Options**
  - Files: `src/components/SmartTrimPanel.jsx` or new settings component
  - Configurable thresholds:
    - Minimum silence duration (default: 2 seconds)
    - Filler word list (customizable)
    - Minimum confidence threshold
    - Highlight duration preferences (30s, 60s)

#### Task 9: Error Handling
- [ ] **Handle Edge Cases**
  - Video without transcript (show message to generate first)
  - Transcript with no silence/fillers (show message)
  - Overlapping suggestions
  - Invalid trim points after applying suggestions

#### Task 10: Testing
- [ ] **Unit Tests**
  - Files: `tests/unit/transcriptAnalysis.test.js`
  - Test silence detection algorithm
  - Test filler word detection
  - Test suggestion generation logic
  - Test confidence scoring

- [ ] **Integration Tests**
  - Files: `tests/integration/smartTrim.test.jsx`
  - Test SmartTrimPanel component
  - Test suggestion generation and display
  - Test applying suggestions to trim points
  - Test timeline visual indicators

- [ ] **Manual Testing**
  - Test with video containing silence
  - Test with video containing fillers
  - Test suggestion generation
  - Test applying individual suggestions
  - Test batch apply
  - Test with videos without transcripts

**PR Title**: "Add AI-powered smart trim suggestions based on transcript analysis"

**Acceptance Criteria**:
- ✅ Can generate trim suggestions from transcript
- ✅ Suggestions display in SmartTrimPanel
- ✅ Visual indicators show on timeline
- ✅ Can apply suggestions to trim points
- ✅ Silence and filler words detected accurately
- ✅ Highlights can be generated
- ✅ Suggestions integrate with existing trim workflow
- ✅ Error handling for videos without transcripts

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
│   ├── TranscriptionPanel.jsx    # Transcription UI
│   └── SmartTrimPanel.jsx         # Smart trim suggestions UI
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
│   ├── EditExportPanel.jsx  # Add TranscriptionPanel
│   ├── Timeline.jsx         # Add suggestion markers
│   └── TrimControls.jsx     # Integrate suggestions
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

**PR #22 - Smart Trim**:
- [ ] Generate suggestions for video with silence
- [ ] Generate suggestions for video with filler words
- [ ] Test highlight reel suggestion
- [ ] Apply individual suggestion
- [ ] Apply multiple suggestions (batch)
- [ ] Verify suggestions appear on timeline
- [ ] Test preview functionality
- [ ] Test with video without transcript (should prompt)
- [ ] Verify undo/redo works with applied suggestions

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

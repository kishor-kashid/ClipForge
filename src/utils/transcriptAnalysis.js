/**
 * Transcript analysis utilities for detecting silence, filler words, and natural pauses
 */

/**
 * Detect silence periods in transcript by analyzing gaps between segments
 * @param {Object} transcript - Transcript object with segments array
 * @param {number} minSilenceDuration - Minimum silence duration in seconds (default: 2)
 * @returns {Array} - Array of silence regions with start, end, duration
 */
export function detectSilence(transcript, minSilenceDuration = 2) {
  if (!transcript || !transcript.segments || transcript.segments.length === 0) {
    return [];
  }

  const segments = transcript.segments;
  const silenceRegions = [];

  // Check gaps between consecutive segments
  for (let i = 0; i < segments.length - 1; i++) {
    const currentSegment = segments[i];
    const nextSegment = segments[i + 1];
    
    const gapStart = currentSegment.end;
    const gapEnd = nextSegment.start;
    const gapDuration = gapEnd - gapStart;

    // If gap is large enough, it's a silence region
    if (gapDuration >= minSilenceDuration) {
      silenceRegions.push({
        start: gapStart,
        end: gapEnd,
        duration: gapDuration,
      });
    }
  }

  // Check for silence at the beginning (before first segment)
  if (segments.length > 0 && segments[0].start >= minSilenceDuration) {
    silenceRegions.push({
      start: 0,
      end: segments[0].start,
      duration: segments[0].start,
    });
  }

  return silenceRegions;
}

/**
 * Common filler words in English
 */
const FILLER_WORDS = [
  'um', 'uh', 'uhh', 'uhm',
  'like', 'you know', 'youknow',
  'so', 'well',
  'actually', 'literally',
  'basically',
  'right', 'okay', 'ok',
  'erm', 'er',
];

/**
 * Detect filler words in transcript segments
 * @param {Object} transcript - Transcript object with segments array
 * @returns {Array} - Array of filler word segments with start, end, text, confidence
 */
export function detectFillerWords(transcript) {
  if (!transcript || !transcript.segments || transcript.segments.length === 0) {
    return [];
  }

  const fillerSegments = [];
  const fillerWordsLower = FILLER_WORDS.map(f => f.toLowerCase());

  transcript.segments.forEach((segment) => {
    const text = segment.text.toLowerCase();
    const words = text.split(/\s+/);
    
    // Check if segment is primarily filler words
    const fillerWordCount = words.filter(word => 
      fillerWordsLower.some(filler => 
        word.includes(filler) || filler.includes(word)
      )
    ).length;

    // If segment has high ratio of filler words, mark it
    const fillerRatio = fillerWordCount / Math.max(words.length, 1);
    const isFillerSegment = fillerRatio >= 0.5 || 
      fillerWordsLower.some(filler => 
        text.trim() === filler || 
        text.trim().startsWith(filler + ' ') ||
        text.trim().endsWith(' ' + filler) ||
        text.trim().includes(' ' + filler + ' ')
      );

    if (isFillerSegment) {
      // Confidence based on filler word ratio
      const confidence = Math.min(0.5 + fillerRatio * 0.5, 1.0);
      
      fillerSegments.push({
        start: segment.start,
        end: segment.end,
        text: segment.text,
        confidence: confidence,
      });
    }
  });

  return fillerSegments;
}

/**
 * Detect natural pause positions based on punctuation
 * @param {Object} transcript - Transcript object with segments array
 * @returns {Array} - Array of pause positions suitable for trimming
 */
export function detectNaturalPauses(transcript) {
  if (!transcript || !transcript.segments || transcript.segments.length === 0) {
    return [];
  }

  const pausePositions = [];

  transcript.segments.forEach((segment) => {
    const text = segment.text.trim();
    
    // Look for sentence-ending punctuation
    const sentenceEnders = /[.!?]+$/;
    if (sentenceEnders.test(text)) {
      pausePositions.push({
        time: segment.end,
        type: 'sentence',
      });
    }
    
    // Look for comma pauses (if segment is short, might be a pause point)
    if (text.includes(',') && (segment.end - segment.start) < 2) {
      pausePositions.push({
        time: segment.end,
        type: 'comma',
      });
    }
  });

  return pausePositions;
}

/**
 * Detect best segments for highlight reels
 * @param {Object} transcript - Transcript object with segments array
 * @param {number} highlightDuration - Desired highlight duration in seconds (default: 30)
 * @returns {Array} - Array of suggested highlight segments
 */
export function detectBestSegments(transcript, highlightDuration = 30) {
  if (!transcript || !transcript.segments || transcript.segments.length === 0) {
    return [];
  }

  const segments = transcript.segments;
  const highlights = [];

  // Simple heuristic: look for segments with more words (more content)
  // And avoid segments that start with fillers
  const scoredSegments = segments
    .filter(seg => {
      const text = seg.text.toLowerCase().trim();
      const startsWithFiller = FILLER_WORDS.some(filler => 
        text.startsWith(filler + ' ') || text === filler
      );
      return !startsWithFiller && (seg.end - seg.start) >= 2; // At least 2 seconds
    })
    .map(seg => {
      const wordCount = seg.text.split(/\s+/).length;
      const duration = seg.end - seg.start;
      const wordsPerSecond = wordCount / Math.max(duration, 1);
      
      // Score: higher word density = better highlight
      return {
        ...seg,
        score: wordsPerSecond * duration,
      };
    })
    .sort((a, b) => b.score - a.score);

  // Find consecutive segments that sum up to highlightDuration
  for (let i = 0; i < scoredSegments.length; i++) {
    let totalDuration = 0;
    const highlightSegments = [];
    
    for (let j = i; j < scoredSegments.length && totalDuration < highlightDuration; j++) {
      const seg = scoredSegments[j];
      const segDuration = seg.end - seg.start;
      
      if (totalDuration + segDuration <= highlightDuration + 5) { // Allow 5s buffer
        highlightSegments.push(seg);
        totalDuration += segDuration;
      }
    }

    if (highlightSegments.length > 0 && totalDuration >= 15) { // At least 15 seconds
      highlights.push({
        start: highlightSegments[0].start,
        end: highlightSegments[highlightSegments.length - 1].end,
        duration: totalDuration,
        segmentCount: highlightSegments.length,
      });
      
      // Limit to top 3 highlights
      if (highlights.length >= 3) break;
    }
  }

  return highlights;
}


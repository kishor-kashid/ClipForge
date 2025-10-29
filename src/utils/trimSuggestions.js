/**
 * Generate trim suggestions from transcript analysis
 */

import {
  detectSilence,
  detectFillerWords,
  detectNaturalPauses,
  detectBestSegments,
} from './transcriptAnalysis';

/**
 * Generate all trim suggestions for a transcript
 * @param {Object} transcript - Transcript object with segments array
 * @param {Object} options - Configuration options
 * @returns {Array} - Array of suggestion objects
 */
export function generateTrimSuggestions(transcript, options = {}) {
  if (!transcript || !transcript.segments || transcript.segments.length === 0) {
    return [];
  }

  const {
    minSilenceDuration = 2,
    highlightDuration = 30,
    minConfidence = 0.5,
  } = options;

  const suggestions = [];

  // 1. Silence detection suggestions
  const silenceRegions = detectSilence(transcript, minSilenceDuration);
  silenceRegions.forEach((region) => {
    suggestions.push({
      type: 'remove_silence',
      startTime: region.start,
      endTime: region.end,
      duration: region.duration,
      confidence: Math.min(0.5 + (region.duration / 10) * 0.5, 1.0), // Longer silence = higher confidence
      reason: `Silence detected: ${region.duration.toFixed(1)}s gap`,
      suggestion: `Remove ${region.duration.toFixed(1)} seconds of silence`,
    });
  });

  // 2. Filler word suggestions
  const fillerSegments = detectFillerWords(transcript);
  fillerSegments
    .filter(f => f.confidence >= minConfidence)
    .forEach((filler) => {
      suggestions.push({
        type: 'remove_filler',
        startTime: filler.start,
        endTime: filler.end,
        duration: filler.end - filler.start,
        confidence: filler.confidence,
        reason: `Filler word detected: "${filler.text.substring(0, 30)}"`,
        suggestion: `Remove filler word segment`,
      });
    });

  // 3. Highlight suggestions (best segments)
  const highlights = detectBestSegments(transcript, highlightDuration);
  highlights.forEach((highlight, index) => {
    suggestions.push({
      type: 'create_highlight',
      startTime: highlight.start,
      endTime: highlight.end,
      duration: highlight.duration,
      confidence: 0.7 + (index === 0 ? 0.2 : 0), // First highlight is best
      reason: `Best ${highlight.duration.toFixed(0)}-second highlight (${highlight.segmentCount} segments)`,
      suggestion: `Create ${highlight.duration.toFixed(0)}-second highlight reel`,
    });
  });

  // Sort suggestions by start time for better UX
  return suggestions.sort((a, b) => a.startTime - b.startTime);
}

/**
 * Calculate confidence score for a suggestion
 * @param {Object} suggestion - Suggestion object
 * @returns {number} - Confidence score (0-1)
 */
export function calculateConfidence(suggestion) {
  let baseConfidence = 0.5;

  if (suggestion.type === 'remove_silence') {
    // Longer silence = higher confidence
    baseConfidence = Math.min(0.5 + (suggestion.duration / 10) * 0.5, 1.0);
  } else if (suggestion.type === 'remove_filler') {
    // Use provided confidence from filler detection
    baseConfidence = suggestion.confidence || 0.6;
  } else if (suggestion.type === 'create_highlight') {
    // Highlights have base confidence of 0.7
    baseConfidence = suggestion.confidence || 0.7;
  }

  return Math.min(Math.max(baseConfidence, 0), 1);
}

/**
 * Filter suggestions by type
 * @param {Array} suggestions - Array of suggestions
 * @param {string} type - Suggestion type to filter by
 * @returns {Array} - Filtered suggestions
 */
export function filterSuggestionsByType(suggestions, type) {
  return suggestions.filter(s => s.type === type);
}

/**
 * Filter suggestions by minimum confidence
 * @param {Array} suggestions - Array of suggestions
 * @param {number} minConfidence - Minimum confidence threshold
 * @returns {Array} - Filtered suggestions
 */
export function filterSuggestionsByConfidence(suggestions, minConfidence) {
  return suggestions.filter(s => s.confidence >= minConfidence);
}

/**
 * Merge overlapping suggestions (for batch apply)
 * @param {Array} suggestions - Array of suggestions
 * @returns {Array} - Merged suggestions
 */
export function mergeOverlappingSuggestions(suggestions) {
  if (suggestions.length === 0) return [];

  // Sort by start time
  const sorted = [...suggestions].sort((a, b) => a.startTime - b.startTime);
  const merged = [];
  let current = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];

    // Check if overlapping (within 1 second)
    if (next.startTime <= current.endTime + 1) {
      // Merge: extend end time, combine confidence
      current = {
        ...current,
        endTime: Math.max(current.endTime, next.endTime),
        duration: Math.max(current.endTime, next.endTime) - current.startTime,
        confidence: (current.confidence + next.confidence) / 2,
        reason: `${current.reason} + ${next.reason}`,
      };
    } else {
      merged.push(current);
      current = next;
    }
  }

  merged.push(current);
  return merged;
}


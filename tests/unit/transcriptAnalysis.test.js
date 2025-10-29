import { describe, it, expect } from 'vitest';
import {
  detectSilence,
  detectFillerWords,
  detectNaturalPauses,
  detectBestSegments,
} from '../../src/utils/transcriptAnalysis';

describe('transcriptAnalysis', () => {
  describe('detectSilence', () => {
    it('should detect silence gaps between segments', () => {
      const transcript = {
        segments: [
          { start: 0, end: 5, text: 'Hello world' },
          { start: 8, end: 12, text: 'How are you' }, // 3 second gap
          { start: 15, end: 18, text: 'I am fine' }, // 3 second gap
        ],
      };

      const silence = detectSilence(transcript, 2);
      expect(silence.length).toBe(2);
      expect(silence[0]).toEqual({
        start: 5,
        end: 8,
        duration: 3,
      });
      expect(silence[1]).toEqual({
        start: 12,
        end: 15,
        duration: 3,
      });
    });

    it('should not detect gaps shorter than minimum duration', () => {
      const transcript = {
        segments: [
          { start: 0, end: 5, text: 'Hello' },
          { start: 5.5, end: 10, text: 'World' }, // 0.5 second gap (too short)
        ],
      };

      const silence = detectSilence(transcript, 2);
      expect(silence.length).toBe(0);
    });

    it('should detect silence at the beginning', () => {
      const transcript = {
        segments: [
          { start: 3, end: 5, text: 'Hello' }, // 3 second silence at start
        ],
      };

      const silence = detectSilence(transcript, 2);
      expect(silence.length).toBe(1);
      expect(silence[0]).toEqual({
        start: 0,
        end: 3,
        duration: 3,
      });
    });

    it('should return empty array for empty transcript', () => {
      const transcript = { segments: [] };
      const silence = detectSilence(transcript);
      expect(silence).toEqual([]);
    });

    it('should return empty array for null transcript', () => {
      const silence = detectSilence(null);
      expect(silence).toEqual([]);
    });
  });

  describe('detectFillerWords', () => {
    it('should detect filler word segments', () => {
      const transcript = {
        segments: [
          { start: 0, end: 1, text: 'um' },
          { start: 1, end: 3, text: 'you know' },
          { start: 3, end: 5, text: 'Hello world' },
        ],
      };

      const fillers = detectFillerWords(transcript);
      expect(fillers.length).toBeGreaterThan(0);
      
      // Check that filler segments are detected
      const fillerTexts = fillers.map(f => f.text.toLowerCase());
      expect(fillerTexts.some(text => text.includes('um'))).toBe(true);
      expect(fillerTexts.some(text => text.includes('you know'))).toBe(true);
    });

    it('should not detect non-filler segments', () => {
      const transcript = {
        segments: [
          { start: 0, end: 5, text: 'This is a regular sentence without fillers' },
        ],
      };

      const fillers = detectFillerWords(transcript);
      expect(fillers.length).toBe(0);
    });

    it('should calculate confidence based on filler ratio', () => {
      const transcript = {
        segments: [
          { start: 0, end: 1, text: 'um uh like' }, // High filler ratio
        ],
      };

      const fillers = detectFillerWords(transcript);
      expect(fillers.length).toBeGreaterThan(0);
      expect(fillers[0].confidence).toBeGreaterThan(0.5);
    });

    it('should return empty array for empty transcript', () => {
      const transcript = { segments: [] };
      const fillers = detectFillerWords(transcript);
      expect(fillers).toEqual([]);
    });
  });

  describe('detectNaturalPauses', () => {
    it('should detect sentence-ending pauses', () => {
      const transcript = {
        segments: [
          { start: 0, end: 3, text: 'Hello world.' },
          { start: 4, end: 7, text: 'How are you?' },
        ],
      };

      const pauses = detectNaturalPauses(transcript);
      expect(pauses.length).toBeGreaterThan(0);
      
      // Check for sentence-ending punctuation
      const pauseAt3 = pauses.find(p => p.time === 3);
      expect(pauseAt3).toBeDefined();
      if (pauseAt3) {
        expect(pauseAt3.type).toBe('sentence');
      }
    });

    it('should return empty array for transcript without punctuation', () => {
      const transcript = {
        segments: [
          { start: 0, end: 3, text: 'Hello world' },
        ],
      };

      const pauses = detectNaturalPauses(transcript);
      expect(pauses.length).toBe(0);
    });
  });

  describe('detectBestSegments', () => {
    it('should detect highlight segments', () => {
      const transcript = {
        segments: [
          { start: 0, end: 5, text: 'This is a long interesting segment with many words' },
          { start: 5, end: 10, text: 'Another good segment' },
          { start: 10, end: 15, text: 'um uh' }, // Short filler
        ],
      };

      const highlights = detectBestSegments(transcript, 30);
      expect(highlights.length).toBeGreaterThan(0);
      expect(highlights[0].duration).toBeGreaterThan(0);
    });

    it('should filter out segments starting with fillers', () => {
      const transcript = {
        segments: [
          { start: 0, end: 2, text: 'um hello' },
          { start: 2, end: 10, text: 'This is a great segment' },
        ],
      };

      const highlights = detectBestSegments(transcript, 30);
      // Should prefer the second segment
      expect(highlights.length).toBeGreaterThan(0);
    });

    it('should return empty array for empty transcript', () => {
      const transcript = { segments: [] };
      const highlights = detectBestSegments(transcript);
      expect(highlights).toEqual([]);
    });
  });
});


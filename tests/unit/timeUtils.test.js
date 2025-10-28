import { describe, it, expect } from 'vitest';
import { formatTime, parseTime, clamp } from '../../src/utils/timeUtils';

describe('timeUtils', () => {
  describe('formatTime', () => {
    it('should format 0 seconds correctly', () => {
      expect(formatTime(0)).toBe('00:00');
    });

    it('should format seconds less than 60', () => {
      expect(formatTime(5)).toBe('00:05');
      expect(formatTime(30)).toBe('00:30');
      expect(formatTime(59)).toBe('00:59');
    });

    it('should format 65 seconds as 01:05', () => {
      expect(formatTime(65)).toBe('01:05');
    });

    it('should format minutes correctly', () => {
      expect(formatTime(60)).toBe('01:00');
      expect(formatTime(120)).toBe('02:00');
      expect(formatTime(125)).toBe('02:05');
    });

    it('should handle 3600+ seconds (1 hour+)', () => {
      expect(formatTime(3600)).toBe('60:00');
      expect(formatTime(3661)).toBe('61:01');
    });

    it('should round down fractional seconds', () => {
      expect(formatTime(65.9)).toBe('01:05');
      expect(formatTime(125.7)).toBe('02:05');
    });

    it('should handle invalid input', () => {
      expect(formatTime(NaN)).toBe('00:00');
      expect(formatTime(-1)).toBe('00:00');
      expect(formatTime('invalid')).toBe('00:00');
      expect(formatTime(null)).toBe('00:00');
      expect(formatTime(undefined)).toBe('00:00');
    });

    it('should handle edge cases', () => {
      expect(formatTime(599)).toBe('09:59');
      expect(formatTime(600)).toBe('10:00');
    });
  });

  describe('parseTime', () => {
    it('should parse 00:00 correctly', () => {
      expect(parseTime('00:00')).toBe(0);
    });

    it('should parse MM:SS correctly', () => {
      expect(parseTime('00:05')).toBe(5);
      expect(parseTime('00:30')).toBe(30);
      expect(parseTime('01:05')).toBe(65);
    });

    it('should parse longer times correctly', () => {
      expect(parseTime('02:00')).toBe(120);
      expect(parseTime('02:05')).toBe(125);
      expect(parseTime('10:30')).toBe(630);
    });

    it('should handle invalid input', () => {
      expect(parseTime('')).toBe(0);
      expect(parseTime('invalid')).toBe(0);
      expect(parseTime('5')).toBe(0);
      expect(parseTime('00:00:00')).toBe(0);
      expect(parseTime(null)).toBe(0);
      expect(parseTime(undefined)).toBe(0);
      expect(parseTime(123)).toBe(0);
    });

    it('should parse single digit minutes and seconds', () => {
      expect(parseTime('1:5')).toBe(65);
      expect(parseTime('5:3')).toBe(303);
    });
  });

  describe('clamp', () => {
    it('should return value when within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });

    it('should clamp to minimum', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(0, 10, 20)).toBe(10);
    });

    it('should clamp to maximum', () => {
      expect(clamp(15, 0, 10)).toBe(10);
      expect(clamp(50, 0, 30)).toBe(30);
    });

    it('should handle edge cases', () => {
      expect(clamp(0, 0, 0)).toBe(0);
      expect(clamp(1, 0, 0)).toBe(0);
      expect(clamp(-1, 0, 0)).toBe(0);
    });
  });
});


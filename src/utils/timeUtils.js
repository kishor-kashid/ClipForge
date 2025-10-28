/**
 * Formats seconds into MM:SS format
 * @param {number} seconds - The number of seconds
 * @returns {string} - Formatted time string (e.g., "01:05" for 65 seconds)
 */
export function formatTime(seconds) {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
    return '00:00';
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Parses MM:SS format string into seconds
 * @param {string} timeString - The time string in MM:SS format
 * @returns {number} - The number of seconds
 */
export function parseTime(timeString) {
  if (!timeString || typeof timeString !== 'string') {
    return 0;
  }
  
  const parts = timeString.split(':');
  if (parts.length !== 2) {
    return 0;
  }
  
  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);
  
  if (isNaN(minutes) || isNaN(seconds)) {
    return 0;
  }
  
  return minutes * 60 + seconds;
}

/**
 * Clamps a value between min and max
 * @param {number} value - The value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} - The clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

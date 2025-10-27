// Supported video file extensions
export const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm'];

/**
 * Validates if a file is a supported video format
 * @param {string} filename - The name of the file
 * @returns {boolean} - True if the file is a supported video format
 */
export function isValidVideoFile(filename) {
  if (!filename || typeof filename !== 'string') {
    return false;
  }
  
  const extension = getFileExtension(filename);
  return SUPPORTED_VIDEO_EXTENSIONS.includes(extension.toLowerCase());
}

/**
 * Extracts the file extension from a filename
 * @param {string} filename - The name of the file
 * @returns {string} - The file extension including the dot (e.g., '.mp4')
 */
export function getFileExtension(filename) {
  if (!filename || typeof filename !== 'string') {
    return '';
  }
  
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
    return '';
  }
  
  return filename.substring(lastDotIndex);
}

/**
 * Gets the file name without extension
 * @param {string} filename - The name of the file
 * @returns {string} - The file name without extension
 */
export function getFileNameWithoutExtension(filename) {
  if (!filename || typeof filename !== 'string') {
    return '';
  }
  
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return filename;
  }
  
  return filename.substring(0, lastDotIndex);
}


/**
 * Utility functions for generating academic-style thumbnails with initials
 */

// Professional color palette for badges
export const BADGE_COLORS = {
  ACADEMIC_BLUE: '#1E3A5F',
  TEAL: '#17A2B8',
  DEEP_SLATE: '#2C3E50',
} as const;

// Array of colors for rotation
const COLOR_PALETTE = [
  BADGE_COLORS.ACADEMIC_BLUE,
  BADGE_COLORS.TEAL,
  BADGE_COLORS.DEEP_SLATE,
];

/**
 * Get a badge color based on an ID (deterministic rotation)
 * @param id - Unique identifier for the item
 * @returns A color from the professional palette
 */
export const getBadgeColor = (id: string): string => {
  // Simple hash function to ensure consistent color for the same ID
  const hash = id.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const index = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
};

/**
 * Extract the first letter of a course title for the badge
 * @param title - Course title
 * @returns Single uppercase letter
 */
export const getCourseInitial = (title: string): string => {
  if (!title || title.trim().length === 0) return '?';
  return title.trim().charAt(0).toUpperCase();
};

/**
 * Extract initials from an author's name for book badges
 * Handles various name formats:
 * - "Camara Laye" → "CL"
 * - "Mariama Bâ" → "MB"
 * - "Paulo Coelho" → "PC"
 * - "Chinua" → "C"
 * @param author - Author's full name
 * @returns 1-2 uppercase letters
 */
export const getAuthorInitials = (author: string): string => {
  if (!author || author.trim().length === 0) return '?';

  const nameParts = author.trim().split(/\s+/).filter(part => part.length > 0);

  if (nameParts.length === 0) return '?';

  if (nameParts.length === 1) {
    // Single word name - return first letter
    return nameParts[0].charAt(0).toUpperCase();
  }

  // Multiple words - get first letter of first and last name
  const firstInitial = nameParts[0].charAt(0).toUpperCase();
  const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();

  return `${firstInitial}${lastInitial}`;
};

/**
 * Normalize accented characters for consistency
 * @param text - Text to normalize
 * @returns Normalized text
 */
export const normalizeText = (text: string): string => {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

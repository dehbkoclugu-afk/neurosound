/**
 * Layout constants shared across screens.
 */

/**
 * Widest a column of content is allowed to get.
 *
 * The app declares tablet support, so on an iPad every screen was rendering a
 * phone layout stretched to ~1000pt: list rows a metre wide with a 20pt label
 * at one end, and intent blocks 108pt tall by the full width of the display.
 * Reading line length, not screen width, sets the ceiling.
 */
export const CONTENT_MAX_WIDTH = 640;

/** Centre a content column and stop it from stretching on large screens. */
export const contentColumn = {
  width: '100%',
  maxWidth: CONTENT_MAX_WIDTH,
  alignSelf: 'center',
} as const;

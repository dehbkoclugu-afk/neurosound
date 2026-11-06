const MAX_SIZE = 88;
const LONG_NAME_MAX_SIZE = 44;
const MIN_SIZE = 28;
// Widest average glyph in the display serif, measured from "Yağmur", which broke.
const EM_PER_CHAR = 0.74;

/**
 * Player title size that keeps the longest word on one line. Text wraps between
 * words happily but breaks mid-word once a single word is wider than the screen:
 * "Yağmu/r" at 88pt on a 360pt phone.
 */
export function fitTitleSize(name: string, availableWidth: number): number {
  const longestWord = Math.max(...name.split(/\s+/).map((word) => Array.from(word).length));
  const ceiling = Array.from(name).length > 8 ? LONG_NAME_MAX_SIZE : MAX_SIZE;
  const fitted = Math.floor(availableWidth / (longestWord * EM_PER_CHAR));
  return Math.max(MIN_SIZE, Math.min(ceiling, fitted));
}

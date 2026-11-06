const MAX_SIZE = 88;
const LONG_NAME_MAX_SIZE = 44;
const MIN_SIZE = 22;
// Measured in the display serif against every sound name in every language:
// "Gamma" runs 0.8em a character, and CJK, kana and Hangul are a full em.
const EM_PER_CHAR = 0.86;
const EM_PER_WIDE_CHAR = 1.04;
const WIDE_CHAR = /[　-鿿가-힯豈-﫿＀-￯]/;

function wordEms(word: string): number {
  return Array.from(word).reduce((sum, c) => sum + (WIDE_CHAR.test(c) ? EM_PER_WIDE_CHAR : EM_PER_CHAR), 0);
}

/**
 * Player title size that keeps the longest word on one line. Text wraps between
 * words happily but breaks mid-word once a single word is wider than the screen:
 * "Yağmu/r" at 88pt on a 360pt phone.
 */
export function fitTitleSize(name: string, availableWidth: number): number {
  const widestWord = Math.max(...name.split(/\s+/).map(wordEms));
  // Hangul can wrap between syllables even when the next word fits on its own.
  const requiredWidth = /[가-힣]/.test(name) ? wordEms(name) : widestWord;
  const ceiling = Array.from(name).length > 8 ? LONG_NAME_MAX_SIZE : MAX_SIZE;
  return Math.max(MIN_SIZE, Math.min(ceiling, Math.floor(availableWidth / requiredWidth)));
}

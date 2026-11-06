import { fitTitleSize } from '../titleSize';

describe('fitTitleSize', () => {
  it('shrinks a short word that would break on a narrow phone', () => {
    const size = fitTitleSize('Yağmur', 312);
    expect(size).toBeLessThan(88);
    expect(6 * 0.74 * size).toBeLessThanOrEqual(312);
  });

  it('keeps the full size when the word fits', () => {
    expect(fitTitleSize('Rain', 342)).toBe(88);
  });

  it('sizes a long name by its longest word', () => {
    const size = fitTitleSize('Cosmic Consciousness', 312);
    expect(13 * 0.74 * size).toBeLessThanOrEqual(312);
    expect(fitTitleSize('Kozmik Bilinç', 312)).toBe(44);
  });

  it('never goes below the floor', () => {
    expect(fitTitleSize('ไบนอรัลสำหรับการนอนหลับยาวมาก', 312)).toBe(28);
  });
});

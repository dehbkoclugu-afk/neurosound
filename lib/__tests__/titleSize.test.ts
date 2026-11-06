import { fitTitleSize } from '../titleSize';

describe('fitTitleSize', () => {
  it.each(['Yağmur', 'Gamma'])('shrinks %s, which broke at full size on a narrow phone', (name) => {
    const size = fitTitleSize(name, 312);
    expect(size).toBeLessThan(88);
    expect(Array.from(name).length * 0.8 * size).toBeLessThanOrEqual(312);
  });

  it('keeps the full size when the word fits', () => {
    expect(fitTitleSize('Rain', 342)).toBe(88);
  });

  it('gives CJK a full em per character', () => {
    expect(5 * fitTitleSize('リラックス', 312)).toBeLessThanOrEqual(312);
  });

  it('sizes a long name by its longest word', () => {
    expect(fitTitleSize('Kozmik Bilinç', 312)).toBe(44);
    expect(13 * 0.8 * fitTitleSize('Cosmic Consciousness', 312)).toBeLessThanOrEqual(312);
  });

  it('never goes below the floor', () => {
    expect(fitTitleSize('ความกลมกลืนตามธรรมชาติแบบยาวมากจริงๆ', 272)).toBe(22);
  });
});

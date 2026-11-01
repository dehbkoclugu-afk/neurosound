jest.mock('@/i18n', () => ({ __esModule: true, default: { language: 'en' } }));

import { upper } from '../upper';

describe('upper', () => {
  it('keeps the Turkish dotted capital I', () => {
    expect(upper('ya da başka bir şey', 'tr')).toBe('YA DA BAŞKA BİR ŞEY');
    expect(upper('ılık', 'tr')).toBe('ILIK');
  });

  it('uses plain uppercase elsewhere', () => {
    expect(upper('binaural beats', 'en')).toBe('BINAURAL BEATS');
  });
});

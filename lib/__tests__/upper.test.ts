jest.mock('@/i18n', () => ({ __esModule: true, default: { language: 'en' } }));

import { upper, foldForSearch } from '../upper';

describe('foldForSearch', () => {
  it('matches Turkish names without the exact dots and accents', () => {
    expect(foldForSearch('Işık')).toBe(foldForSearch('isik'));
    expect(foldForSearch('İçe Dönüş')).toBe('ice donus');
    expect(foldForSearch('Kahverengi Gürültü').includes(foldForSearch('gurultu'))).toBe(true);
  });
});

describe('upper', () => {
  it('keeps the Turkish dotted capital I', () => {
    expect(upper('ya da başka bir şey', 'tr')).toBe('YA DA BAŞKA BİR ŞEY');
    expect(upper('ılık', 'tr')).toBe('ILIK');
  });

  it('uses plain uppercase elsewhere', () => {
    expect(upper('binaural beats', 'en')).toBe('BINAURAL BEATS');
  });
});

import { lastNightMinutes } from '../lastNight';

const at = (day: number, hour: number) => new Date(2026, 10, day, hour, 0, 0);
const session = (end: Date, minutes: number) => ({ endedAt: end.getTime(), seconds: minutes * 60 });

describe('lastNightMinutes', () => {
  it('shows an overnight session in the morning', () => {
    expect(lastNightMinutes(session(at(4, 23), 47), at(5, 8))).toBe(47);
    expect(lastNightMinutes(session(at(5, 1), 90), at(5, 7))).toBe(90);
  });

  it('stays quiet outside the morning', () => {
    expect(lastNightMinutes(session(at(4, 23), 47), at(5, 14))).toBeNull();
    expect(lastNightMinutes(session(at(4, 23), 47), at(5, 3))).toBeNull();
  });

  it('ignores short, old and daytime sessions', () => {
    expect(lastNightMinutes(session(at(4, 23), 2), at(5, 8))).toBeNull();
    expect(lastNightMinutes(session(at(2, 23), 47), at(5, 8))).toBeNull();
    expect(lastNightMinutes(session(at(4, 16), 47), at(5, 3))).toBeNull();
    expect(lastNightMinutes(session(at(5, 9), 47), at(5, 11))).toBeNull();
    // Morning-only meditation (07:00–07:20) is not "last night"
    expect(lastNightMinutes(session(new Date(2026, 10, 5, 7, 20, 0), 20), at(5, 8))).toBeNull();
    // Future endedAt (clock rolled back) is ignored
    expect(lastNightMinutes(session(at(5, 10), 45), at(5, 8))).toBeNull();
    expect(lastNightMinutes(null, at(5, 8))).toBeNull();
  });
});

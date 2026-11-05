const MIN_MINUTES = 5;
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

/**
 * Minutes to show on Home's morning line, or null when it shouldn't appear: only
 * in the morning, only for a real session that ended overnight.
 */
export function lastNightMinutes(
  session: { endedAt: number; seconds: number } | null,
  now: Date,
): number | null {
  if (!session) return null;
  const hour = now.getHours();
  if (hour < 5 || hour >= 12) return null;
  if (now.getTime() - session.endedAt > MAX_AGE_MS) return null;
  const endHour = new Date(session.endedAt).getHours();
  if (endHour >= 12 && endHour < 20) return null;
  if (endHour >= 8 && endHour < 12) return null;
  const minutes = Math.round(session.seconds / 60);
  return minutes >= MIN_MINUTES ? minutes : null;
}

/**
 * Formatting helpers for distances and durations.
 *
 * WHY: Keeps display formatting consistent across web and native UI.
 */

export const formatDistance = (meters: number): string => {
  if (!Number.isFinite(meters) || meters <= 0) {
    return '-';
  }

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  const kilometers = meters / 1000;
  const precision = kilometers < 10 ? 1 : 0;
  return `${kilometers.toFixed(precision)} km`;
};

export const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '-';
  }

  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
};

/**
 * Event timer utilities for custom events
 * Structure: 45min first half + 15min halftime + 45min second half = 105min total
 */

export const FIRST_HALF_DURATION = 45 * 60 * 1000; // 45 minutes
export const HALFTIME_DURATION = 15 * 60 * 1000; // 15 minutes
export const SECOND_HALF_DURATION = 45 * 60 * 1000; // 45 minutes
export const TOTAL_MATCH_DURATION =
  FIRST_HALF_DURATION + HALFTIME_DURATION + SECOND_HALF_DURATION; // 105 minutes

export type EventLifecycle =
  | "not_started"
  | "first_half"
  | "halftime"
  | "second_half"
  | "finished";

export interface EventTimerState {
  lifecycle: EventLifecycle;
  elapsedMs: number; // Total elapsed time since match start
  remainingMs: number; // Time remaining in current phase
  progressPercent: number; // Overall match progress (0-100)
  isLive: boolean; // True if match has started
  isFinished: boolean; // True if match is complete
  displayText: string; // Human-readable status
}

/**
 * Calculate event timer state based on start time and current time
 * DB only stores startTime; all calculations happen client-side
 */
export function calculateEventTimer(
  startTimeMs: number,
  nowMs: number
): EventTimerState {
  const timeSinceStart = nowMs - startTimeMs;

  // Event hasn't started yet
  if (timeSinceStart < 0) {
    const timeUntilStart = Math.abs(timeSinceStart);
    return {
      lifecycle: "not_started",
      elapsedMs: 0,
      remainingMs: timeUntilStart,
      progressPercent: 0,
      isLive: false,
      isFinished: false,
      displayText: formatCountdownToStart(timeUntilStart),
    };
  }

  // First half (0 - 45 minutes)
  if (timeSinceStart < FIRST_HALF_DURATION) {
    return {
      lifecycle: "first_half",
      elapsedMs: timeSinceStart,
      remainingMs: FIRST_HALF_DURATION - timeSinceStart,
      progressPercent:
        (timeSinceStart / TOTAL_MATCH_DURATION) * 100,
      isLive: true,
      isFinished: false,
      displayText: `1st Half · ${formatTimerDisplay(
        FIRST_HALF_DURATION - timeSinceStart
      )}`,
    };
  }

  // Halftime (45 - 60 minutes)
  if (timeSinceStart < FIRST_HALF_DURATION + HALFTIME_DURATION) {
    const timeInHalftime = timeSinceStart - FIRST_HALF_DURATION;
    return {
      lifecycle: "halftime",
      elapsedMs: timeSinceStart,
      remainingMs:
        FIRST_HALF_DURATION + HALFTIME_DURATION - timeSinceStart,
      progressPercent:
        (timeSinceStart / TOTAL_MATCH_DURATION) * 100,
      isLive: true,
      isFinished: false,
      displayText: `Halftime · ${formatTimerDisplay(
        HALFTIME_DURATION - timeInHalftime
      )}`,
    };
  }

  // Second half (60 - 105 minutes)
  if (
    timeSinceStart <
    FIRST_HALF_DURATION + HALFTIME_DURATION + SECOND_HALF_DURATION
  ) {
    const timeInSecondHalf =
      timeSinceStart - FIRST_HALF_DURATION - HALFTIME_DURATION;
    return {
      lifecycle: "second_half",
      elapsedMs: timeSinceStart,
      remainingMs:
        FIRST_HALF_DURATION +
        HALFTIME_DURATION +
        SECOND_HALF_DURATION -
        timeSinceStart,
      progressPercent:
        (timeSinceStart / TOTAL_MATCH_DURATION) * 100,
      isLive: true,
      isFinished: false,
      displayText: `2nd Half · ${formatTimerDisplay(
        SECOND_HALF_DURATION - timeInSecondHalf
      )}`,
    };
  }

  // Match finished
  return {
    lifecycle: "finished",
    elapsedMs: TOTAL_MATCH_DURATION,
    remainingMs: 0,
    progressPercent: 100,
    isLive: false,
    isFinished: true,
    displayText: "Finished",
  };
}

/**
 * Format milliseconds to MM:SS display
 */
export function formatTimerDisplay(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Format countdown to event start (XdXhXmXs)
 */
export function formatCountdownToStart(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
}

/**
 * Get badge styling and text for event lifecycle
 */
export function getEventBadgeConfig(lifecycle: EventLifecycle): {
  label: string;
  variant: "default" | "secondary" | "outline" | "destructive";
  animate: boolean;
} {
  switch (lifecycle) {
    case "not_started":
      return { label: "Upcoming", variant: "outline", animate: false };
    case "first_half":
      return { label: "1st Half Live", variant: "default", animate: true };
    case "halftime":
      return { label: "Halftime", variant: "secondary", animate: true };
    case "second_half":
      return { label: "2nd Half Live", variant: "default", animate: true };
    case "finished":
      return { label: "Finished", variant: "secondary", animate: false };
  }
}

/**
 * Formats seconds into MM:SS display format
 */
export function formatTimeDisplay(totalSeconds: number): string {
  // Ensure we don't show negative numbers
  const absoluteSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(absoluteSeconds / 60);
  const seconds = absoluteSeconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Formats record time with milliseconds if under 8 seconds (like a stopwatch)
 * Otherwise shows MM:SS format
 */
export function formatRecordTime(totalSeconds: number): string {
  const absoluteSeconds = Math.max(0, totalSeconds);
  
  // If under 8 seconds, show as stopwatch with milliseconds (e.g., "7.45")
  if (absoluteSeconds < 8) {
    return absoluteSeconds.toFixed(2);
  }
  
  // Otherwise use standard MM:SS format
  return formatTimeDisplay(absoluteSeconds);
}

/**
 * Formats duration in seconds to human-readable text
 */
export function formatDurationText(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes} min`;
  } else {
    return `${seconds}s`;
  }
}

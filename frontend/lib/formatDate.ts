/**
 * The backend serializes naive UTC datetimes with no timezone suffix
 * (e.g. "2026-08-25T08:54:10.273893"). Without an explicit "Z", JavaScript's
 * Date parser treats a timezone-less ISO string as *local* time, which would
 * silently shift every timestamp by the viewer's UTC offset. Force it to be
 * read as UTC before doing any date math.
 */
function parseUtc(isoString: string): Date {
  return new Date(isoString.endsWith("Z") ? isoString : `${isoString}Z`);
}

export function formatRelativeTime(isoString: string): string {
  const date = parseUtc(isoString);
  const diffSec = Math.round((Date.now() - date.getTime()) / 1000);

  if (diffSec < 30) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;

  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 30) return `${diffDay}d ago`;

  return formatAbsoluteTime(isoString);
}

export function formatAbsoluteTime(isoString: string): string {
  const date = parseUtc(isoString);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

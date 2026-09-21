// Converts a "HH:MM:SS" or "HH:MM" time string into 12-hour format with AM/PM.
// e.g. "14:00:00" -> "2:00 PM", "09:30" -> "9:30 AM"
export function formatTime12h(time: string): string {
  if (!time) return "";
  const [hStr, mStr] = time.split(":");
  let hour = parseInt(hStr, 10);
  const minute = mStr ?? "00";
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${period}`;
}

// Formats a start/end pair together: "14:00:00", "15:00:00" -> "2:00 PM – 3:00 PM"
export function formatTimeRange12h(start: string, end: string): string {
  return `${formatTime12h(start)} – ${formatTime12h(end)}`;
}
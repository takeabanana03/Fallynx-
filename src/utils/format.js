export function coords(lat, lng, precision = 5) {
  if (lat == null || lng == null) return 'unknown';
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}

export function mapsLink(lat, lng) {
  return `https://maps.google.com/?q=${lat},${lng}`;
}

export function clockTime(date = new Date()) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function shortDate(date = new Date()) {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function elapsed(ms) {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

export function accuracyLabel(metres) {
  if (metres == null) return 'unknown';
  if (metres <= 10) return 'precise';
  if (metres <= 50) return 'approximate';
  return 'poor';
}

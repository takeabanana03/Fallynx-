export const colors = {
  ink: '#10151C',        // screen background
  surface: '#1A222D',    // cards, tab bar
  line: '#2E3A4A',       // borders
  text: '#EEF2F6',
  muted: '#93A1B2',
  faint: '#5F7085',
  safe: '#3DD68C',       // armed, granted
  warn: '#F0A63C',       // standing by, optional missing
  alarm: '#E5484D',      // cannot arm, critical missing
};

export const space = { xs: 4, sm: 8, md: 16, lg: 24 };

export const type = {
  display: { fontSize: 28, fontWeight: '700', color: colors.text },
  body: { fontSize: 15, color: colors.muted, lineHeight: 22 },
  label: { fontSize: 11, fontWeight: '700', color: colors.faint, letterSpacing: 1.2 },
  mono: { fontSize: 13, fontFamily: 'monospace', color: colors.muted },
};

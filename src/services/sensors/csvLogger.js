import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Records raw samples to a CSV so Phase 3 can tune thresholds against real
// data instead of guesses. Rows are held in memory and written once on stop:
// three minutes at 50 Hz is about 9000 rows, which is nothing.

export const HEADER = 't,ax,ay,az,gx,gy,gz,pressure,label';

const FOLDER = 'recordings';

let rows = [];
let label = null;
let startedAt = 0;

export function isRecording() {
  return label !== null;
}

export function start(newLabel) {
  rows = [];
  label = newLabel;
  startedAt = Date.now();
}

export function add(a, g, pressure) {
  if (!isRecording()) return;
  // Time relative to the start of the recording, so files are comparable.
  const t = a.t - startedAt;
  rows.push(
    [
      t,
      round(a.x), round(a.y), round(a.z),
      round(g?.x), round(g?.y), round(g?.z),
      round(pressure, 2),
      label,
    ].join(',')
  );
}

export function count() {
  return rows.length;
}

export async function stop() {
  if (!isRecording()) return null;

  const dir = new Directory(Paths.document, FOLDER);
  if (!dir.exists) dir.create({ intermediates: true });

  const file = new File(dir, `${label}-${stamp(startedAt)}.csv`);
  file.create({ overwrite: true });
  file.write([HEADER, ...rows].join('\n'));

  const saved = { name: file.name, uri: file.uri, rows: rows.length };
  rows = [];
  label = null;
  return saved;
}

export function list() {
  const dir = new Directory(Paths.document, FOLDER);
  if (!dir.exists) return [];
  return dir
    .list()
    .filter((f) => f.name.endsWith('.csv'))
    .map((f) => ({ name: f.name, uri: f.uri }));
}

export function read(uri) {
  return new File(uri).textSync();
}

// Opens the Android share sheet so the file can be pulled off the phone.
export async function share(uri) {
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(uri, { mimeType: 'text/csv' });
  return true;
}

export function remove(uri) {
  const file = new File(uri);
  if (file.exists) file.delete();
}

function round(n, places = 4) {
  return n == null ? '' : Number(n.toFixed(places));
}

function stamp(ms) {
  return new Date(ms).toISOString().slice(0, 19).replace(/[:T]/g, '-');
}
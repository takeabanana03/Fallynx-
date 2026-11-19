import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { magnitude } from '../../utils/math';
import { RECORDING } from '../../config/thresholds';

// Records raw samples to a CSV so Phase 3 can tune thresholds against real
// data instead of guesses. Every row is a real reading straight from the
// phone's sensors; nothing here makes data up.
//
// Two ways to record:
//   start(label)            records everything until stop() (normal activity)
//   startOnMovement(label)  waits until the phone really moves, keeps the
//                           second before it, records RECORDING.AFTER_MS more,
//                           then saves on its own (falls)

export const HEADER = 't,ax,ay,az,gx,gy,gz,pressure,label';

const FOLDER = 'recordings';

let label = null;     // set while recording or waiting
let waiting = false;  // true until real movement starts the recording
let auto = false;     // true when the recording stops and saves on its own
let samples = [];     // { a, g, pressure } raw readings, turned into rows on save
let before = [];      // rolling last second while waiting
let triggeredAt = 0;
let onSaved = null;

export function isRecording() {
  return label !== null;
}

export function isWaiting() {
  return waiting;
}

export function start(newLabel) {
  reset();
  label = newLabel;
}

// onDone(saved) runs after the automatic save.
export function startOnMovement(newLabel, onDone) {
  reset();
  label = newLabel;
  waiting = true;
  auto = true;
  onSaved = onDone;
}

export function add(a, g, pressure) {
  if (!isRecording()) return;
  const sample = { a, g, pressure };

  if (waiting) {
    // Tiny wobble of a still phone stays below TRIGGER_G and is ignored.
    before.push(sample);
    before = before.filter((s) => a.t - s.a.t <= RECORDING.BEFORE_MS);
    if (Math.abs(magnitude(a) - 1) > RECORDING.TRIGGER_G) {
      waiting = false;
      triggeredAt = a.t;
      samples = before;
      before = [];
    }
    return;
  }

  samples.push(sample);

  if (auto && a.t - triggeredAt >= RECORDING.AFTER_MS) {
    const done = onSaved;
    stop().then((saved) => done && done(saved));
  }
}

export function count() {
  return samples.length;
}

// Lowest and highest acceleration so far, in g. A real fall shows a low
// value (the drop) and a high one (the landing).
export function range() {
  if (!samples.length) return null;
  let min = Infinity;
  let max = 0;
  samples.forEach((s) => {
    const m = magnitude(s.a);
    if (m < min) min = m;
    if (m > max) max = m;
  });
  return { min, max };
}

export async function stop() {
  if (!isRecording() || !samples.length) {
    reset();
    return null;
  }

  // Time relative to the first kept sample, so files are comparable.
  const startedAt = samples[0].a.t;
  const rows = samples.map(({ a, g, pressure }) =>
    [
      a.t - startedAt,
      round(a.x), round(a.y), round(a.z),
      round(g?.x), round(g?.y), round(g?.z),
      round(pressure, 2),
      label,
    ].join(',')
  );

  const dir = new Directory(Paths.document, FOLDER);
  if (!dir.exists) dir.create({ intermediates: true });

  const file = new File(dir, `${label}-${stamp(startedAt)}.csv`);
  file.create({ overwrite: true });
  file.write([HEADER, ...rows].join('\n'));

  const saved = { name: file.name, uri: file.uri, rows: rows.length, ...range() };
  reset();
  return saved;
}

// Stop without saving.
export function cancel() {
  reset();
}

function reset() {
  label = null;
  waiting = false;
  auto = false;
  samples = [];
  before = [];
  triggeredAt = 0;
  onSaved = null;
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
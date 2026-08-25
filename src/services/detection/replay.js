import { createDetector } from './fallDetector';
import { STATE } from './states';

// Replays a recorded CSV through the detector, sample by sample. This is why
// the detector is kept pure: tuning becomes a measurement you can repeat in
// seconds instead of falling onto a mattress another forty times.

export function parseCsv(text) {
  const [, ...lines] = text.trim().split('\n');
  return lines
    .filter(Boolean)
    .map((line) => {
      const [t, ax, ay, az, gx, gy, gz, pressure, label] = line.split(',');
      return {
        t: Number(t),
        x: Number(ax),
        y: Number(ay),
        z: Number(az),
        gyro: { x: Number(gx), y: Number(gy), z: Number(gz) },
        pressure: Number(pressure),
        label,
      };
    });
}

// One recorded file, ready to score. The label column is written by
// csvLogger when you choose "fall" or "normal activity".
export function parseRecording(text) {
  const samples = parseCsv(text);
  return { samples, isFall: samples[0]?.label === 'fall' };
}

// Every point where the detector would have fired.
export function replay(samples, thresholds) {
  const detector = createDetector(thresholds);
  const hits = [];
  samples.forEach((sample, index) => {
    if (detector.push(sample).state === STATE.CONFIRMED) {
      hits.push({ index, t: sample.t });
      detector.reset();
    }
  });
  return hits;
}

// Confusion matrix across a labelled set. These are the numbers that go in
// the evaluation chapter of your report.
export function evaluate(recordings, thresholds) {
  let truePositives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  let trueNegatives = 0;

  recordings.forEach(({ samples, isFall }) => {
    const fired = replay(samples, thresholds).length > 0;
    if (isFall && fired) truePositives += 1;
    else if (isFall && !fired) falseNegatives += 1;
    else if (!isFall && fired) falsePositives += 1;
    else trueNegatives += 1;
  });

  const precision = truePositives / (truePositives + falsePositives || 1);
  const recall = truePositives / (truePositives + falseNegatives || 1);

  return {
    truePositives,
    falsePositives,
    falseNegatives,
    trueNegatives,
    precision,
    recall,
    f1: (2 * precision * recall) / (precision + recall || 1),
  };
}
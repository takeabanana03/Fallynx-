import { Accelerometer, Gyroscope, Barometer } from 'expo-sensors';
import RingBuffer from './ringBuffer';
import * as csv from './csvLogger';
import { createDetector } from '../detection/fallDetector';
import { STATE } from '../detection/states';
import { fire, SOURCE } from '../triggers/triggerBus';
import { SENSORS } from '../../config/thresholds';

// Owns every sensor subscription. Nothing else in the app imports
// expo-sensors directly, so swapping sensor libraries stays a one-file change.

export const accel = new RingBuffer(SENSORS.BUFFER_SIZE);

// Latest reading of each sensor. Gyroscope and barometer arrive at their own
// rate, so a CSV row uses whatever the most recent value was.
const latest = { accel: null, gyro: null, pressure: null };

let subs = [];

// One live detector, fed every accelerometer sample. Detection has to see
// all 50 samples a second; the screen only polls ten times a second, so it
// cannot drive this itself.
const detector = createDetector();
let result = { state: STATE.IDLE, reason: null };

export function start() {
  if (subs.length) return;
  resetDetector(); // always arm from a clean state

  Accelerometer.setUpdateInterval(1000 / SENSORS.ACCEL_HZ);
  Gyroscope.setUpdateInterval(1000 / SENSORS.GYRO_HZ);
  Barometer.setUpdateInterval(1000 / SENSORS.BARO_HZ);

  subs = [
    Accelerometer.addListener((v) => {
      const sample = { ...v, t: Date.now() };
      latest.accel = sample;
      accel.push(sample);
      result = detector.push(sample);
      // A confirmed fall goes out on the trigger bus, the same path a shake
      // or a panic button uses. One dispatch route, several sources.
      if (result.state === STATE.CONFIRMED && result.changed) {
        fire(SOURCE.FALL, { at: sample.t });
      }
      // Recording pulls from here so every sample is captured, not just the
      // ones the screen happens to poll.
      if (csv.isRecording()) csv.add(sample, latest.gyro, latest.pressure);
    }),
    Gyroscope.addListener((v) => {
      latest.gyro = v;
    }),
    Barometer.addListener((v) => {
      latest.pressure = v.pressure;
    }),
  ];
}

export function stop() {
  subs.forEach((s) => s.remove());
  subs = [];
}

export function isRunning() {
  return subs.length > 0;
}

export function snapshot() {
  return { ...latest };
}

export function detection() {
  return result;
}

export function resetDetector() {
  detector.reset();
  result = { state: STATE.IDLE, reason: null };
}

// Newest last, for the chart.
export function recent(count) {
  return accel.last(count).reverse();
}

// Some devices have no barometer. Checked once, shown in the debug screen.
export async function available() {
  return {
    accelerometer: await Accelerometer.isAvailableAsync(),
    gyroscope: await Gyroscope.isAvailableAsync(),
    barometer: await Barometer.isAvailableAsync(),
  };
}
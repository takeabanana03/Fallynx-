import { STATE, REASON } from './states';
import { DETECTION } from '../../config/thresholds';
import { magnitude, angleBetween, variance } from '../../utils/math';

// The state machine. Pure logic on purpose: it takes samples and returns a
// state, and knows nothing about sensors, screens or Firebase. That is what
// lets replay.js feed it a recorded CSV and get the same answer the phone
// would give.

const HISTORY = 50; // 1 second at 50 Hz

export function createDetector(thresholds = DETECTION) {
  let state = STATE.IDLE;
  let enteredAt = 0;
  let freeFallStart = 0;
  let reference = null;  // gravity direction before the fall began
  let history = [];      // recent samples, for variance and orientation
  let sinceEnter = [];   // magnitudes collected in the current state only

  function enter(next, t) {
    state = next;
    enteredAt = t;
    sinceEnter = [];
  }

  // sample: { x, y, z, t } with x/y/z in g
  function push(sample) {
    history.push(sample);
    if (history.length > HISTORY) history.shift();

    const mag = magnitude(sample);
    const t = sample.t;
    const held = t - enteredAt;
    const before = state;
    let reason = null;

    sinceEnter.push(mag);

    switch (state) {
      // Weightlessness. Acceleration collapses towards zero as the phone
      // stops resisting gravity.
      case STATE.IDLE:
        if (mag < thresholds.FREE_FALL_G) {
          // Orientation from just before the drop, to compare against later.
          reference = averageVector(history.slice(0, -1)) || sample;
          enter(STATE.FREE_FALL, t);
          freeFallStart = t;
        }
        break;

      // The landing. A real fall spikes hard within a few hundred ms.
      case STATE.FREE_FALL:
        if (mag > thresholds.IMPACT_G) {
          // Too brief to be a fall: a knock or a jolt, not a drop.
          if (t - freeFallStart >= thresholds.FREE_FALL_MIN_MS) {
            enter(STATE.IMPACT, t);
          } else {
            reason = REASON.TIMEOUT;
            enter(STATE.IDLE, t);
          }
        } else if (held > thresholds.FREE_FALL_MAX_MS + thresholds.IMPACT_WINDOW_MS) {
          reason = REASON.NO_IMPACT;
          enter(STATE.IDLE, t);
        }
        break;

      // Let the phone settle, then ask whether it actually turned over.
      // A phone dropped flat on a table lands level; a person does not.
      case STATE.IMPACT:
        if (held >= thresholds.IMPACT_WINDOW_MS) {
          const now = averageVector(history.slice(-10));
          const tilt = reference && now ? angleBetween(reference, now) : 0;
          if (tilt > thresholds.TILT_DEGREES) {
            enter(STATE.ORIENTATION, t);
          } else {
            reason = REASON.TOO_LEVEL;
            enter(STATE.IDLE, t);
          }
        }
        break;

      // Orientation passed. Move straight on to watching for stillness.
      case STATE.ORIENTATION:
        enter(STATE.INACTIVITY, t);
        break;

      // Someone who trips and recovers keeps moving. Someone who cannot get
      // up does not. Only magnitudes gathered since entering this state are
      // measured, so the impact spike itself does not count as movement.
      case STATE.INACTIVITY:
        if (sinceEnter.length >= 15) {
          if (variance(sinceEnter) > thresholds.INACTIVITY_VARIANCE) {
            reason = REASON.STILL_MOVING;
            enter(STATE.IDLE, t);
          } else if (held >= thresholds.INACTIVITY_MS) {
            reason = REASON.CONFIRMED;
            enter(STATE.CONFIRMED, t);
          }
        }
        break;

      // Terminal. The caller decides what happens next, then resets.
      case STATE.CONFIRMED:
        break;
    }

    return { state, reason, changed: state !== before };
  }

  function reset() {
    state = STATE.IDLE;
    enteredAt = 0;
    freeFallStart = 0;
    reference = null;
    history = [];
    sinceEnter = [];
  }

  return {
    push,
    reset,
    get state() {
      return state;
    },
  };
}

// Mean of a set of vectors. Averaging smooths out noise, so the orientation
// comparison is not thrown off by a single odd sample.
function averageVector(samples) {
  if (!samples || !samples.length) return null;
  const sum = samples.reduce(
    (acc, s) => ({ x: acc.x + s.x, y: acc.y + s.y, z: acc.z + s.z }),
    { x: 0, y: 0, z: 0 }
  );
  const n = samples.length;
  return { x: sum.x / n, y: sum.y / n, z: sum.z / n };
}
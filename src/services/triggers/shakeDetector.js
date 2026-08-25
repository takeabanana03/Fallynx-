// Phase 6. Hard shake as a manual panic trigger, for the case where
// nobody falls but help is still needed.

import { fire, SOURCE } from './triggerBus';
import { TRIGGERS } from '../../config/thresholds';

// TODO Phase 6: count direction reversals above SHAKE_G within
// SHAKE_WINDOW_MS, then call fire(SOURCE.SHAKE).
export function start() {
  throw new Error('shakeDetector.start not implemented (Phase 6)');
}

export function stop() {}

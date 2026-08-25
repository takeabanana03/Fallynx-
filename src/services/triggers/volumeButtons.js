// Phase 6. Triple volume-down press. Works with the screen on, which is
// the honest limit of what Android allows without a system-level hook.

import { fire, SOURCE } from './triggerBus';
import { TRIGGERS } from '../../config/thresholds';

// TODO Phase 6: listen with react-native-keyevent, count presses inside
// VOLUME_WINDOW_MS, then call fire(SOURCE.VOLUME_BUTTONS).
export function start() {
  throw new Error('volumeButtons.start not implemented (Phase 6)');
}

export function stop() {}

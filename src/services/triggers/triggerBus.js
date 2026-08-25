// One event bus. Fall detection, shake, volume buttons and the on-screen
// button all publish here, and the dispatcher is the only subscriber.
// Keeping this as the single path means a new trigger in Phase 6 needs
// no changes to the dispatch code at all.

import { TRIGGERS } from '../../config/thresholds';

export const SOURCE = {
  FALL: 'fall',
  SHAKE: 'shake',
  VOLUME_BUTTONS: 'volume_buttons',
  BUTTON: 'button',
  SAFE_WALK: 'safe_walk',
};

const listeners = new Set();
let lastFiredAt = 0;

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Returns false if the request was swallowed by the debounce window,
// so two triggers firing together never produce two alerts.
export function fire(source, payload = {}) {
  const now = Date.now();
  if (now - lastFiredAt < TRIGGERS.DEBOUNCE_MS) return false;
  lastFiredAt = now;

  const event = { source, at: now, ...payload };
  listeners.forEach((listener) => listener(event));
  return true;
}

export function resetDebounce() {
  lastFiredAt = 0;
}

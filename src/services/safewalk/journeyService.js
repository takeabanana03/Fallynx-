// Phase 7. A journey with an expected arrival time. Miss the check-in and
// the same dispatch pipeline runs, flagged so the message reads
// "did not arrive" rather than "has fallen".

import { fire, SOURCE } from '../triggers/triggerBus';

export const JOURNEY_STATUS = {
  ACTIVE: 'active',
  ARRIVED: 'arrived',
  OVERDUE: 'overdue',
  ALERTED: 'alerted',
};

export const GRACE_PERIOD_MS = 2 * 60 * 1000;
export const PING_INTERVAL_MS = 30 * 1000;

// TODO Phase 7: start the foreground service, write a location ping every
// PING_INTERVAL_MS, and schedule the check-in prompt at the ETA.
export async function start({ destination, etaMinutes, watcherIds }) {
  throw new Error('journeyService.start not implemented (Phase 7)');
}

export async function checkIn(journeyId) {
  throw new Error('journeyService.checkIn not implemented (Phase 7)');
}

export async function arrive(journeyId) {
  throw new Error('journeyService.arrive not implemented (Phase 7)');
}

// Called when the grace period expires with no check-in.
function escalate(journey) {
  fire(SOURCE.SAFE_WALK, { journeyId: journey.id });
}

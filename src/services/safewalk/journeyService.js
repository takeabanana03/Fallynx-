// Phase 7. A journey with an expected arrival time. Miss the check-in and
// the same dispatch pipeline runs, flagged so the message reads
// "did not arrive" rather than "has fallen".
//
// Everything here is real: the destination is looked up on the map, the
// phone's GPS is read every PING_INTERVAL_MS, and reaching the destination
// ends the walk on its own. The latest GPS fix is what the alert sends.
//
// Limit until Phase 8 (foreground service): Fallynx has to stay open.

import { Vibration } from 'react-native';
import * as Location from 'expo-location';
import * as localStore from '../storage/localStore';
import { getFix } from '../location/locationService';
import { fire, SOURCE } from '../triggers/triggerBus';

export const JOURNEY_STATUS = {
  ACTIVE: 'active',
  ARRIVED: 'arrived',
  OVERDUE: 'overdue',
  ALERTED: 'alerted',
};

export const GRACE_PERIOD_MS = 2 * 60 * 1000; // time to check in after the ETA
export const PING_INTERVAL_MS = 30 * 1000;    // how often GPS is read
export const ARRIVED_WITHIN_M = 100;          // this close counts as arrived

const KEY = 'fallynx.journey';
const S = JOURNEY_STATUS;

let journey = null;
let timer = null;
let lastPing = 0;

// Pick up a walk that was running when the app was closed. If it went
// overdue in the meantime, the first tick raises the alert straight away.
const loaded = localStore.read(KEY, null).then((saved) => {
  journey = saved;
  if (isRunning()) watch();
});

// A copy, so the screen cannot change the walk by accident.
export function get() {
  return journey ? { ...journey } : null;
}

export async function start({ destination, etaMinutes }) {
  await loaded;
  const now = Date.now();
  journey = {
    id: String(now),
    destination,
    place: await findPlace(destination), // { latitude, longitude } or null
    startedAt: now,
    dueAt: now + etaMinutes * 60 * 1000,
    status: S.ACTIVE,
    lastFix: null,
    distanceM: null,
    arrivedAt: null,
  };
  await save();
  lastPing = 0; // read GPS on the next tick
  watch();
  return get();
}

// "I'm okay, I need more time." Also how you check in once overdue.
export async function extend(minutes = 10) {
  if (!isRunning()) return get();
  journey.dueAt = Math.max(journey.dueAt, Date.now()) + minutes * 60 * 1000;
  journey.status = S.ACTIVE;
  await save();
  return get();
}

export async function arrive() {
  if (!isRunning()) return get();
  journey.status = S.ARRIVED;
  journey.arrivedAt = Date.now();
  unwatch();
  await save();
  return get();
}

// Clears a finished or cancelled walk.
export async function finish() {
  unwatch();
  journey = null;
  await localStore.remove(KEY);
  return null;
}

function isRunning() {
  return journey && (journey.status === S.ACTIVE || journey.status === S.OVERDUE);
}

function watch() {
  if (!timer) timer = setInterval(tick, 1000);
}

function unwatch() {
  if (timer) clearInterval(timer);
  timer = null;
}

function tick() {
  if (!isRunning()) return unwatch();
  const now = Date.now();

  if (now - lastPing >= PING_INTERVAL_MS) {
    lastPing = now;
    ping();
  }

  if (journey.status === S.ACTIVE && now >= journey.dueAt) {
    // Time is up. Buzz so the walker looks at the phone and checks in.
    journey.status = S.OVERDUE;
    Vibration.vibrate([0, 600, 300, 600, 300, 600]);
    save();
  }

  if (journey.status === S.OVERDUE && now >= journey.dueAt + GRACE_PERIOD_MS) {
    escalate();
  }
}

// Read the GPS. getFix also keeps this as the last known position, which is
// exactly what dispatch sends if the alert fires.
async function ping() {
  const fix = await getFix();
  if (!fix || !isRunning()) return;
  journey.lastFix = fix;
  if (journey.place) {
    journey.distanceM = metresBetween(fix, journey.place);
    if (journey.distanceM <= ARRIVED_WITHIN_M) return arrive();
  }
  save();
}

// Called when the grace period expires with no check-in. Opens the same
// "Are you okay?" countdown a fall does; cancelling it there stops the alert.
function escalate() {
  const sent = fire(SOURCE.SAFE_WALK, {
    journeyId: journey.id,
    destination: journey.destination,
  });
  if (!sent) return; // another alert just fired; try again next tick
  journey.status = S.ALERTED;
  unwatch();
  save();
}

// Turns the typed destination into coordinates using the phone's geocoder.
// null when it cannot be found: the walk still works, you just tap
// "I've arrived" yourself.
async function findPlace(address) {
  try {
    const [hit] = await Promise.race([
      Location.geocodeAsync(address),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
    ]);
    return hit ? { latitude: hit.latitude, longitude: hit.longitude } : null;
  } catch (e) {
    return null;
  }
}

function save() {
  return localStore.write(KEY, journey);
}

// Straight-line distance between two GPS points, in metres (haversine).
function metresBetween(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}
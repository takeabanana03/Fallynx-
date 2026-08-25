import * as Location from 'expo-location';
import { ALERT } from '../../config/thresholds';

// GPS, with a hard timeout. A stale fix beats no fix, so a failed lookup
// falls back to the last position we managed to get.

let lastKnown = null;

export async function getFix() {
  try {
    const fix = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      ALERT.GPS_TIMEOUT_MS
    );
    lastKnown = {
      latitude: fix.coords.latitude,
      longitude: fix.coords.longitude,
      accuracy: fix.coords.accuracy,
      heading: fix.coords.heading,
      timestamp: fix.timestamp,
    };
    return lastKnown;
  } catch (e) {
    // Under a roof or indoors a high-accuracy fix can simply never arrive.
    // Anything we already have is more useful to a responder than nothing.
    return lastKnown;
  }
}

export function getLastKnown() {
  return lastKnown;
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('gps timeout')), ms)),
  ]);
}
import { ALERT_URL, ALERT_KEY } from '../../config/emergency';

// Sends the alert through the Twilio function (firebase/functions/index.js)
// over Wi-Fi or mobile data. This is the path for a phone with no SIM card.
//
// Returns { sms, call } from the server, or null if it could not be reached.
// Never throws: a failed alert must not freeze the countdown screen.

const TIMEOUT_MS = 20000; // the function can take a few seconds to wake up

export async function send({ numbers, sms, say, call }) {
  try {
    const res = await withTimeout(
      fetch(ALERT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-alert-key': ALERT_KEY },
        body: JSON.stringify({ to: numbers, sms, say, call }),
      }),
      TIMEOUT_MS
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}
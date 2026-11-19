// Mauritius emergency numbers.
// VERIFY against the current NEOC listing before any real deployment.
export const EMERGENCY_NUMBERS = {
  police: '999',
  ambulance: '114',
  fire: '995',
};

// Which number the auto-dialer calls on a fall.
export const PRIMARY_EMERGENCY = EMERGENCY_NUMBERS.ambulance;

// While developing, every call and SMS goes here instead.
// NEVER point this at a live emergency line during testing.
export const TEST_MODE = true;
export const TEST_NUMBER = '+23057549312';

export function dialTarget() {
  return TEST_MODE ? TEST_NUMBER : PRIMARY_EMERGENCY;
}

// --- Twilio (for a phone with no SIM card) --------------------------------
// false: alerts go out through Twilio over Wi-Fi (firebase/functions).
// true:  the phone makes the call itself and needs a SIM card.
export const USE_SIM = false;

// Printed by `firebase deploy`. If it prints a different address, paste it here.
export const ALERT_URL = 'https://us-central1-fallynx-318cd.cloudfunctions.net/sendAlert';

// Must be exactly the same text as ALERT_KEY in firebase/functions/.env
export const ALERT_KEY = 'fallynx-demo-8f3k2m9q';
// ---------------------------------------------------------------------------
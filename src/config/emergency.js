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

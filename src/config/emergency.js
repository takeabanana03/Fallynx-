export const EMERGENCY_NUMBERS = {
  police: '999',
  ambulance: '114',
  fire: '995',
};

// Which number the auto-dialer calls on a fall.
export const PRIMARY_EMERGENCY = EMERGENCY_NUMBERS.ambulance;

export const TEST_MODE = true;
export const TEST_NUMBER = process.env.EXPO_PUBLIC_TEST_NUMBER || '';

export function dialTarget() {
  return TEST_MODE ? TEST_NUMBER : PRIMARY_EMERGENCY;
}

export const USE_SIM = false;

export const TWILIO = {
  ACCOUNT_SID: process.env.EXPO_PUBLIC_TWILIO_ACCOUNT_SID,
  KEY_SID: process.env.EXPO_PUBLIC_TWILIO_KEY_SID,
  KEY_SECRET: process.env.EXPO_PUBLIC_TWILIO_KEY_SECRET,
  FROM: process.env.EXPO_PUBLIC_TWILIO_FROM || '',
  TRIAL: process.env.EXPO_PUBLIC_TWILIO_TRIAL !== 'false',
};
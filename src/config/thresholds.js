// Every tunable number lives here. Phase 3 tunes these against
// recorded CSV data; nothing else in the app should hardcode a value.

export const SENSORS = {
  ACCEL_HZ: 50,
  GYRO_HZ: 50,
  BARO_HZ: 1,
  BUFFER_SIZE: 150, // 3 seconds at 50 Hz
};

export const DETECTION = {
  FREE_FALL_G: 0.7,
  FREE_FALL_MIN_MS: 40,
  FREE_FALL_MAX_MS: 400,
  IMPACT_G: 1.5,
  IMPACT_WINDOW_MS: 500,
  TILT_DEGREES: 5,
  INACTIVITY_MS: 500,
  // Variance of acceleration magnitude, in g squared. Measured separation is
  // wide: lying still is around 0.0001, walking around 0.1. Tune against your
  // own recordings before trusting it.
  INACTIVITY_VARIANCE: 0.02,
  ALTITUDE_DELTA_HPA: 0.3,
};

export const TRIGGERS = {
  SHAKE_G: 2.0,
  SHAKE_REVERSALS: 3,
  SHAKE_WINDOW_MS: 1500,
  VOLUME_PRESS_COUNT: 3,
  VOLUME_WINDOW_MS: 1500,
  BUTTON_HOLD_MS: 3000,
  DEBOUNCE_MS: 5000,
};

export const ALERT = {
  COUNTDOWN_S: 30,
  GPS_TIMEOUT_MS: 10000,
  MAX_CONTACTS: 5,
};

// Phase 8 maps these presets onto DETECTION.
export const SENSITIVITY_PRESETS = {
  low: { IMPACT_G: 3.0, INACTIVITY_MS: 4000 },
  medium: { IMPACT_G: 2.5, INACTIVITY_MS: 3000 },
  high: { IMPACT_G: 2.0, INACTIVITY_MS: 2000 },
};
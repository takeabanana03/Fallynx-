// The five states of the fall detector, and the reasons a run can end.
// Phase 3 implements the transitions; this file just names them so the
// debug UI and the logger agree on vocabulary.

export const STATE = {
  IDLE: 'idle',
  FREE_FALL: 'free_fall',
  IMPACT: 'impact',
  ORIENTATION: 'orientation',
  INACTIVITY: 'inactivity',
  CONFIRMED: 'confirmed',
};

export const ORDER = [
  STATE.IDLE,
  STATE.FREE_FALL,
  STATE.IMPACT,
  STATE.ORIENTATION,
  STATE.INACTIVITY,
  STATE.CONFIRMED,
];

export const REASON = {
  TIMEOUT: 'timeout',
  NO_IMPACT: 'no_impact',
  TOO_LEVEL: 'too_level',
  STILL_MOVING: 'still_moving',
  CONFIRMED: 'confirmed',
};

export const LABELS = {
  [STATE.IDLE]: 'Idle',
  [STATE.FREE_FALL]: 'Free fall',
  [STATE.IMPACT]: 'Impact',
  [STATE.ORIENTATION]: 'Orientation change',
  [STATE.INACTIVITY]: 'Inactivity',
  [STATE.CONFIRMED]: 'Fall confirmed',
};

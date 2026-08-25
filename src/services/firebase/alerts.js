// Phase 5. Alert documents and their history.

export const ALERT_TYPE = {
  FALL: 'fall',
  PANIC: 'panic',
  SAFE_WALK: 'safe_walk',
};

export const ALERT_STATUS = {
  ACTIVE: 'active',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled',
};

// TODO Phase 5: write to alerts/{alertId}. Include the sensor trace, it is
// what makes the history screen and the report graphs possible.
export async function create(alert) {
  throw new Error('alerts.create not implemented (Phase 5)');
}

export async function resolve(alertId) {
  throw new Error('alerts.resolve not implemented (Phase 5)');
}

export function listenForUser(uid, onChange) {
  throw new Error('alerts.listenForUser not implemented (Phase 5)');
}

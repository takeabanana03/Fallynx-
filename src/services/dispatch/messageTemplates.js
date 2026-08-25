// The text that actually reaches a human. Pure functions so they can be
// reviewed and tested without sending anything.

import { coords, mapsLink, clockTime } from '../../utils/format';
import { SOURCE } from '../triggers/triggerBus';

const OPENING = {
  [SOURCE.FALL]: 'may have fallen',
  [SOURCE.SHAKE]: 'triggered an emergency alert',
  [SOURCE.VOLUME_BUTTONS]: 'triggered an emergency alert',
  [SOURCE.BUTTON]: 'triggered an emergency alert',
  [SOURCE.SAFE_WALK]: 'did not arrive as expected',
};

// SMS is charged per 160 characters, so this stays tight and puts the
// location first. A contact reading it on a lock screen should get the
// link without opening anything.
export function alertSms({ name, source, location, battery }) {
  const who = name || 'A Fallynx user';
  const lines = [`${who} ${OPENING[source] || 'needs help'}.`];

  if (location) {
    lines.push(mapsLink(location.latitude, location.longitude));
    lines.push(`Location at ${clockTime(new Date(location.timestamp))}`);
  } else {
    lines.push('Location unavailable.');
  }

  if (battery != null) lines.push(`Phone battery ${Math.round(battery * 100)}%`);
  return lines.join('\n');
}

// Longer form for the push notification, where there is room for the
// medical details a responder would want.
export function alertPush({ name, source, location, medical }) {
  const who = name || 'A Fallynx user';
  const parts = [`${who} ${OPENING[source] || 'needs help'}.`];

  if (location) {
    parts.push(`At ${coords(location.latitude, location.longitude)}.`);
  }
  if (medical?.bloodGroup) parts.push(`Blood group ${medical.bloodGroup}.`);
  if (medical?.allergies) parts.push(`Allergies: ${medical.allergies}.`);
  if (medical?.conditions) parts.push(`Conditions: ${medical.conditions}.`);

  return parts.join(' ');
}

export function safeWalkStarted({ name, destination, etaMinutes }) {
  return `${name || 'Someone'} started a Safe Walk to ${destination}, arriving in about ${etaMinutes} minutes. You will be alerted if they do not check in.`;
}

export function safeWalkArrived({ name }) {
  return `${name || 'They'} arrived safely.`;
}

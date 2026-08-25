import * as location from '../location/locationService';
import * as phoneCall from './phoneCall';
import * as sms from './sms';
import * as localStore from '../storage/localStore';
import { dialTarget, TEST_MODE, TEST_NUMBER } from '../../config/emergency';

// The single path from "something happened" to "someone knows".
//
// Order is deliberate. Steps 2 and 3 work with no data connection; step 4
// does not. In a cane field with one bar of signal the call and the message
// are what actually reach help, so nothing that could block on the network
// runs before them.

export const STEP = {
  LOCATION: 'location',
  CALL: 'call',
  SMS: 'sms',
  CLOUD: 'cloud',
};

let lastResult = null;

export async function dispatch(event) {
  const steps = {};

  // 1. Where. Times out rather than blocking the call behind a slow fix.
  const fix = await location.getFix();
  steps[STEP.LOCATION] = fix ? 'ok' : 'unavailable';

  // 2. Call. The one thing that matters if everything else fails.
  steps[STEP.CALL] = (await phoneCall.dial(dialTarget())) ? 'ok' : 'failed';

  // 3. Message everyone. Carries the coordinates the call cannot.
  const contacts = await recipients();
  const payload = {
    name: await localStore.read('name', null),
    source: event.source,
    location: fix,
  };
  const sent = contacts.length ? await sms.sendToContacts(contacts, payload) : 0;
  steps[STEP.SMS] = contacts.length ? `${sent}/${contacts.length}` : 'no contacts';

  // 4. Phase 5 writes the alert to Firestore here and the cloud function
  //    pushes it to watchers. Until then the local record is enough.
  steps[STEP.CLOUD] = 'phase 5';

  lastResult = { at: Date.now(), source: event.source, location: fix, steps };
  await saveToHistory(lastResult);
  return lastResult;
}

export function lastDispatch() {
  return lastResult;
}

// While TEST_MODE is on every message goes to your own number instead of
// real contacts, so a development build can never wake up a stranger.
async function recipients() {
  if (TEST_MODE) return [{ name: 'Test', phone: TEST_NUMBER }];
  return localStore.read('contacts', []);
}

async function saveToHistory(entry) {
  const history = await localStore.read('history', []);
  await localStore.write('history', [entry, ...history].slice(0, 50));
}
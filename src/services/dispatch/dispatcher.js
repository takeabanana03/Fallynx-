import * as location from '../location/locationService';
import * as phoneCall from './phoneCall';
import * as sms from './sms';
import * as cloudAlert from './cloudAlert';
import * as localStore from '../storage/localStore';
import * as history from '../supabase/history';
import { alertSms } from './messageTemplates';
import { dialTarget, TEST_MODE, TEST_NUMBER, USE_SIM } from '../../config/emergency';


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

  const contacts = await recipients();
  const payload = {
    name: await localStore.read('name', null),
    source: event.source,
    location: fix,
    destination: event.destination, // Safe Walk only
  };

  if (USE_SIM) {
    // 2. Call. The one thing that matters if everything else fails.
    steps[STEP.CALL] = (await phoneCall.dial(dialTarget())) ? 'ok' : 'failed';

    // 3. Message everyone. Carries the coordinates the call cannot.
    const sent = contacts.length ? await sms.sendToContacts(contacts, payload) : 0;
    steps[STEP.SMS] = contacts.length ? `${sent}/${contacts.length}` : 'no contacts';
  } else {
    // 2 + 3. Twilio texts every contact and calls the first one.
    // It never calls the emergency number: Twilio does not carry
    // emergency calls, so the call goes to your first contact instead.
    const numbers = contacts.map((c) => c.phone);
    const text = alertSms(payload);
    const result = numbers.length
      ? await cloudAlert.send({ numbers, sms: text, say: spoken(text), call: true })
      : null;

    if (!numbers.length) {
      steps[STEP.CALL] = 'no contacts';
      steps[STEP.SMS] = 'no contacts';
    } else if (!result) {
      steps[STEP.CALL] = 'no internet or server error';
      steps[STEP.SMS] = 'no internet or server error';
    } else {
      steps[STEP.CALL] = result.call;
      steps[STEP.SMS] = `${result.sms}/${numbers.length}`;
    }
  }

  steps[STEP.CLOUD] = 'phase 5';

  
  lastResult = { at: Date.now(), source: event.source, location: fix, steps };
  const uploaded = await history.save(lastResult);
  steps[STEP.CLOUD] = uploaded ? 'saved' : 'saved on phone, uploads later';
  return lastResult;
}

export function lastDispatch() {
  return lastResult;
}

// What the phone call says. A map link cannot be read out, so the call
// reads the words and points to the text message for the location.
function spoken(text) {
  const words = text
    .split('\n')
    .filter((line) => !line.startsWith('http') && !line.startsWith('Location'))
    .join(' ');
  const where = text.includes('http')
    ? 'Their location has been sent to you by text message.'
    : 'Their location is not known.';
  return `This is a Fallynx alert. ${words} ${where}`;
}

// While TEST_MODE is on every message goes to your own number instead of
// real contacts, so a development build can never wake up a stranger.
async function recipients() {
  if (TEST_MODE) return [{ name: 'Test', phone: TEST_NUMBER }];
  return localStore.read('contacts', []);
}



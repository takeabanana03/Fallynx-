// Firebase functions. Deploy from the firebase/ folder:
//   firebase deploy --only functions:sendAlert

const { onRequest } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const twilio = require('twilio');

admin.initializeApp();

// ---------------------------------------------------------------------------
// sendAlert: the alert goes out through Twilio as an SMS and a phone call.
// This is how a phone with no SIM card still reaches help, over Wi-Fi.
// The Twilio keys live here in functions/.env, never inside the app.
//
// The app POSTs: { to: ['+230...'], sms: 'text', say: 'spoken text', call: true }
// with the header x-alert-key, which must match ALERT_KEY in .env.
// ---------------------------------------------------------------------------

// Trial accounts may only use Twilio's own templates (no custom text).
const TRIAL_SMS = 'sms_internal_alerts';
const TRIAL_CALL = 'https://webhooks.twilio.com/v1/Voice/Template/voice_text_to_speech';

exports.sendAlert = onRequest({ maxInstances: 2 }, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('POST only');
  if (!process.env.ALERT_KEY || req.get('x-alert-key') !== process.env.ALERT_KEY) {
    return res.status(403).send('Wrong key');
  }

  const { to = [], sms, say, call } = req.body || {};
  // At most five numbers, all in +230... form, so nobody can use this to spam.
  const numbers = [...new Set([].concat(to).map(clean))]
    .filter((n) => /^\+\d{7,15}$/.test(n))
    .slice(0, 5);
  if (!numbers.length || !sms) return res.status(400).send('Need numbers and a message');

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  const trial = process.env.TWILIO_TRIAL === 'true';
  const from = process.env.TWILIO_FROM;

  // Every SMS at once, and the call to the first number at the same time.
  const texts = numbers.map((number) =>
    client.messages.create({
      to: number,
      ...(from && { from }),
      body: trial ? TRIAL_SMS : sms,
    })
  );
  const ring = call
    ? client.calls.create({
        to: numbers[0],
        ...(from && { from }),
        ...(trial ? { url: TRIAL_CALL } : { twiml: spoken(say || sms) }),
      })
    : null;

  const sent = await Promise.allSettled(texts);
  const rang = ring ? await Promise.allSettled([ring]) : [];

  // Shows up in `firebase functions:log` when something goes wrong.
  [...sent, ...rang]
    .filter((r) => r.status === 'rejected')
    .forEach((r) => console.error('Twilio:', r.reason?.message || r.reason));

  res.json({
    sms: sent.filter((r) => r.status === 'fulfilled').length,
    call: !ring ? 'skipped' : rang[0].status === 'fulfilled' ? 'ok' : 'failed',
  });
});

// Read the message twice, in case the first time is missed.
function spoken(text) {
  const voice = new twilio.twiml.VoiceResponse();
  voice.say(text);
  voice.pause({ length: 1 });
  voice.say(text);
  return voice.toString();
}

// "+230 5754 9312" -> "+23057549312"
function clean(n) {
  return String(n).replace(/[\s-]/g, '');
}

// ---------------------------------------------------------------------------
// Phase 5. When an alert document appears, push it to everyone watching.
// Not deployed yet: deploy only sendAlert until Phase 5 is built.
// ---------------------------------------------------------------------------
exports.onAlertCreated = onDocumentCreated('alerts/{alertId}', async (event) => {
  const alert = event.data?.data();
  if (!alert) return;

  // TODO Phase 5: look up each watcher's FCM token and send.
  // Keep the payload small: name, type, coordinates, maps link.
  const tokens = [];
  if (!tokens.length) return;

  await admin.messaging().sendEachForMulticast({
    tokens,
    notification: {
      title: 'Fallynx alert',
      body: `${alert.name || 'Someone'} needs help`,
    },
    data: {
      alertId: event.params.alertId,
      type: String(alert.type || ''),
      lat: String(alert.lat || ''),
      lng: String(alert.lng || ''),
    },
    android: { priority: 'high' },
  });
});
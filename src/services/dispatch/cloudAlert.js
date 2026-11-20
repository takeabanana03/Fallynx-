import { TWILIO } from '../../config/emergency';

const API = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO.ACCOUNT_SID}`;
const TIMEOUT_MS = 15000;

// The free trial only allows Twilio's own templates, not custom text.
const TRIAL_SMS = 'sms_internal_alerts';
const TRIAL_CALL = 'https://webhooks.twilio.com/v1/Voice/Template/voice_text_to_speech';

export async function send({ numbers, sms, say, call }) {
  // "+230 5754 9312" -> "+23057549312", at most five, no duplicates.
  const to = [...new Set(numbers.map((n) => String(n).replace(/[\s-]/g, '')))]
    .filter((n) => /^\+\d{7,15}$/.test(n))
    .slice(0, 5);
  if (!to.length) return { sms: 0, call: 'no valid number' };

  const from = TWILIO.FROM ? { From: TWILIO.FROM } : {};

  // Every SMS at once, and the call to the first number at the same time.
  const texts = to.map((number) =>
    post('Messages.json', { To: number, ...from, Body: TWILIO.TRIAL ? TRIAL_SMS : sms })
  );
  const ring = call
    ? post('Calls.json', {
        To: to[0],
        ...from,
        ...(TWILIO.TRIAL ? { Url: TRIAL_CALL } : { Twiml: twiml(say || sms) }),
      })
    : null;

  const sent = await Promise.all(texts);
  const rang = ring ? await ring : null;

  return {
    sms: sent.filter((r) => r.ok).length,
    call: !rang ? 'skipped' : rang.ok ? 'ok' : `failed: ${rang.error}`,
  };
}

// One request to Twilio. Returns { ok } or { ok: false, error }.
async function post(path, fields) {
  try {
    const res = await withTimeout(
      fetch(`${API}/${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${base64(`${TWILIO.KEY_SID}:${TWILIO.KEY_SECRET}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: Object.entries(fields)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join('&'),
      }),
      TIMEOUT_MS
    );
    if (res.ok) return { ok: true };
    const body = await res.json().catch(() => ({}));
    const error = body.message || `HTTP ${res.status}`;
    console.warn(`Twilio ${path}:`, error);
    return { ok: false, error };
  } catch (e) {
    const error = e.message === 'timeout' ? 'no answer from Twilio (internet?)' : String(e.message || e);
    console.warn(`Twilio ${path}:`, error);
    return { ok: false, error };
  }
}

// What the call says: the alert, read twice in case the first is missed.
function twiml(text) {
  const safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<Response><Say>${safe}</Say><Pause length="1"/><Say>${safe}</Say></Response>`;
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

// Basic auth needs base64. Written out so it works on any phone.
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function base64(text) {
  let out = '';
  for (let i = 0; i < text.length; i += 3) {
    const n =
      (text.charCodeAt(i) << 16) | ((text.charCodeAt(i + 1) || 0) << 8) | (text.charCodeAt(i + 2) || 0);
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    out += i + 1 < text.length ? B64[(n >> 6) & 63] : '=';
    out += i + 2 < text.length ? B64[n & 63] : '=';
  }
  return out;
}
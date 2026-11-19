// Silent SMS from the phone itself needs a small native module (see
// docs/SETUP.md, "expo-sms will not work for dispatch"). Until that exists
// this sends nothing and reports 0, so the dispatcher never crashes.
// With USE_SIM = false in config/emergency.js, Twilio sends the SMS instead.

export async function sendToContacts(contacts, payload) {
  return 0;
}
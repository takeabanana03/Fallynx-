// Phase 5. One function, one job: when an alert document appears, push it
// to everyone watching. Everything else the app does client side.

const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');

admin.initializeApp();

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

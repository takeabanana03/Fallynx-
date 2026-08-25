// Phase 5. One place that initialises Firebase, so no other file imports
// the SDK directly and swapping backends stays a single-file change.

// TODO Phase 5: initialise @react-native-firebase/app and export the
// auth, firestore and messaging handles.
export function getAuth() {
  throw new Error('firebase.getAuth not implemented (Phase 5)');
}

export function getDb() {
  throw new Error('firebase.getDb not implemented (Phase 5)');
}

export function getMessaging() {
  throw new Error('firebase.getMessaging not implemented (Phase 5)');
}

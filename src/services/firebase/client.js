import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth, getAuth, getReactNativePersistence, signInAnonymously,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_CONFIG } from '../../config/firebase';

// One place that starts Firebase, so nothing else imports the SDK directly.

const app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);

// Persistence matters: without it the anonymous account is thrown away on
// every restart and the user's contacts appear to vanish. initializeAuth
// throws if it has already run, which Fast Refresh causes constantly.
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const db = getFirestore(app);

// Anonymous sign in gives each device a stable uid with no login screen.
// The uid is kept in AsyncStorage, so it survives restarts, and the
// security rules work exactly as they would for a real account.
let signInPromise = null;

export function ready() {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  if (!signInPromise) {
    signInPromise = signInAnonymously(auth)
      .then((cred) => cred.user)
      .catch((e) => {
        // Offline, or Anonymous sign in not enabled in the console.
        signInPromise = null;
        throw e;
      });
  }
  return signInPromise;
}
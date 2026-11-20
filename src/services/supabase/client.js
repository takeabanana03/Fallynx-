import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from '../../config/supabase';

// One place that starts Supabase, so nothing else imports the SDK directly.

const STORAGE_KEY = 'fallynx.auth';
const REMEMBER_KEY = 'fallynx.rememberMe';

// "Remember me"
//   on:  the login is saved on the phone, so the app opens logged in.
//   off: the login is kept in memory only, so closing the app logs out.
let remember = true;
const memory = new Map();
const rememberLoaded = AsyncStorage.getItem(REMEMBER_KEY)
  .then((value) => {
    remember = value !== 'false';
  })
  .catch(() => {});

const storage = {
  async getItem(key) {
    await rememberLoaded;
    return remember ? AsyncStorage.getItem(key) : memory.get(key) ?? null;
  },
  async setItem(key, value) {
    await rememberLoaded;
    if (remember) await AsyncStorage.setItem(key, value);
    else memory.set(key, value);
  },
  async removeItem(key) {
    memory.delete(key);
    await AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage,
    storageKey: STORAGE_KEY,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Keep the login fresh only while the app is on screen (Supabase's advice
// for React Native, where there is no browser tab to do it).
if (AppState.currentState === 'active') supabase.auth.startAutoRefresh();
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

// Called by the login screen before logging in.
export async function setRemember(value) {
  await rememberLoaded;
  remember = value;
  await AsyncStorage.setItem(REMEMBER_KEY, String(value));
  if (!value) await AsyncStorage.removeItem(STORAGE_KEY); // forget an older saved login
}

// The login saved on this phone, read straight from storage. Offline with
// an expired token, Supabase keeps the login but cannot refresh it yet;
// this lets the app (and fall detection) still open with no internet.
export async function savedUser() {
  try {
    const raw = await storage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw).user ?? null : null;
  } catch (e) {
    return null;
  }
}
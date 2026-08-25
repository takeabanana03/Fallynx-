// Thin wrapper over AsyncStorage. Everything the app must be able to read
// with no network goes through here: the medical ID above all, because the
// moment it matters is the moment there is no signal.

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  medicalId: 'fallynx.medicalId',
  contacts: 'fallynx.contacts',
  sensitivity: 'fallynx.sensitivity',
  armed: 'fallynx.armed',
  queue: 'fallynx.alertQueue',
  history: 'fallynx.history',
  name: 'fallynx.name',
};

export async function read(key, fallback = null) {
  try {
    const raw = await AsyncStorage.getItem(KEYS[key] || key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

export async function write(key, value) {
  try {
    await AsyncStorage.setItem(KEYS[key] || key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

export function remove(key) {
  return AsyncStorage.removeItem(KEYS[key] || key);
}

export { KEYS };
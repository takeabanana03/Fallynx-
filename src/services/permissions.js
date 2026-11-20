import { PermissionsAndroid, Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Every permission Fallynx needs, in the order Android will grant them.
// critical: without it, Fallynx cannot raise an alert at all.
export const PERMISSIONS = [
  {
    id: 'location',
    label: 'Location',
    why: 'Your coordinates are what makes an alert useful. Without this, contacts get a message but no place to go.',
    name: 'android.permission.ACCESS_FINE_LOCATION',
    minSdk: 23,
    critical: true,
  },
  {
    id: 'call',
    label: 'Phone calls',
    why: 'Lets Fallynx dial for help on its own. Someone who has just fallen cannot always unlock a phone.',
    name: 'android.permission.CALL_PHONE',
    minSdk: 23,
    critical: true,
  },
  {
    id: 'sms',
    label: 'Send SMS',
    why: 'SMS gets through with no mobile data and one bar of signal. It is the channel that always works.',
    name: 'android.permission.SEND_SMS',
    minSdk: 23,
    critical: true,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    why: 'The countdown appears over your lock screen. Blocked notifications mean no countdown.',
    name: 'android.permission.POST_NOTIFICATIONS',
    minSdk: 33,
  },
  {
    id: 'activity',
    label: 'Physical activity',
    why: 'Motion data separates a real fall from a phone dropped on a table.',
    name: 'android.permission.ACTIVITY_RECOGNITION',
    minSdk: 29,
  },
];

// Permissions that do not exist on this Android version are skipped.
export function applies(p) {
  return Platform.OS === 'android' && Platform.Version >= p.minSdk;
}

export function usable() {
  return PERMISSIONS.filter(applies);
}

export async function check(p) {
  if (!applies(p)) return true;
  return PermissionsAndroid.check(p.name);
}

// { location: true, call: false, ... }
export async function checkAll() {
  const result = {};
  for (const p of PERMISSIONS) {
    result[p.id] = await check(p);
  }
  return result;
}

export async function request(p) {
  if (!applies(p)) return true;

  // Android 11+ refuses background location from a dialog. Send the user to
  // Settings instead, and only once foreground location is already granted.
  if (p.viaSettings && Platform.Version >= 30) {
    await Linking.openSettings();
    return false; // The caller re-checks when the user comes back.
  }

  const result = await PermissionsAndroid.request(p.name);
  return result === 'granted';
}

// Which critical permissions are still missing.
export function missingCritical(statuses) {
  return PERMISSIONS.filter((p) => p.critical && !statuses[p.id]);
}

export function openSettings() {
  return Linking.openSettings();
}

export function openBatterySettings() {
  return Linking.sendIntent('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS')
    .catch(() => Linking.openSettings());
}

// Remembers that onboarding has been completed.
const ONBOARDED = 'fallynx.onboarded';

export async function hasOnboarded() {
  return (await AsyncStorage.getItem(ONBOARDED)) === '1';
}

export function setOnboarded() {
  return AsyncStorage.setItem(ONBOARDED, '1');
}

export function resetOnboarding() {
  return AsyncStorage.removeItem(ONBOARDED);
}

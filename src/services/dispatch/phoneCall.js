import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';
import { dialTarget } from '../../config/emergency';

// Places a call without the user touching anything. Android only: iOS
// forbids dialling without a tap, which is why Fallynx is Android only.
// Needs CALL_PHONE, granted during onboarding.

export async function dial(number = dialTarget()) {
  if (Platform.OS !== 'android') return false;
  try {
    await IntentLauncher.startActivityAsync('android.intent.action.CALL', {
      data: `tel:${number}`,
    });
    return true;
  } catch (e) {
    return false;
  }
}
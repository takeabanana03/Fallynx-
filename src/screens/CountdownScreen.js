import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Vibration, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import { colors, space, type } from '../theme';
import { ALERT } from '../config/thresholds';
import { dispatch } from '../services/dispatch/dispatcher';
import { resetDetector } from '../services/sensors/sensorManager';

// Escalating buzz: short at first, longer as the countdown runs out.
const PATTERN = [0, 400, 200, 400, 200, 800];

export default function CountdownScreen({ navigation, route }) {
  const event = route.params?.event ?? { source: 'fall' };
  const [left, setLeft] = useState(ALERT.COUNTDOWN_S);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const fired = useRef(false);

  useKeepAwake();

  // Someone who has just fallen may not be able to hold the phone steady
  // enough to read a small screen. Vibration carries when sight does not.
  useEffect(() => {
    Vibration.vibrate(PATTERN, true);
    return () => Vibration.cancel();
  }, []);

  // Back must not dismiss an alert by accident.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (sending) return;
    if (left <= 0) {
      if (!fired.current) {
        fired.current = true;
        send();
      }
      return;
    }
    const id = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [left, sending]);

  async function send() {
    setSending(true);
    Vibration.cancel();
    setResult(await dispatch(event));
  }

  function cancel() {
    Vibration.cancel();
    resetDetector();
    navigation.goBack();
  }

  if (result) {
    return (
      <SafeAreaView style={[styles.screen, styles.sent]}>
        <View style={styles.middle}>
          <Text style={styles.heading}>Help has been called</Text>
          <Text style={styles.detail}>
            {result.location
              ? `Location sent: ${result.location.latitude.toFixed(5)}, ${result.location.longitude.toFixed(5)}`
              : 'Location was not available'}
          </Text>
          <Text style={styles.detail}>Call: {result.steps.call}</Text>
          <Text style={styles.detail}>Messages: {result.steps.sms}</Text>
        </View>
        <Pressable style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Done</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.middle}>
        <Text style={styles.heading}>
          {sending ? 'Calling for help' : 'Are you okay?'}
        </Text>
        {!sending && (
          <>
            <Text style={styles.count}>{left}</Text>
            <Text style={styles.detail}>
              Calling for help and sharing your location in {left} second{left === 1 ? '' : 's'}
            </Text>
          </>
        )}
      </View>

      {!sending && (
        // Deliberately enormous. This has to be findable by someone who is
        // hurt, panicking, and not looking closely.
        <Pressable style={styles.button} onPress={cancel}>
          <Text style={styles.buttonText}>I'm okay</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.alarm, padding: space.lg },
  sent: { backgroundColor: colors.ink },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.md },
  heading: { fontSize: 30, fontWeight: '700', color: '#fff', textAlign: 'center' },
  count: { fontSize: 120, fontWeight: '800', color: '#fff' },
  detail: { fontSize: 16, color: '#fff', textAlign: 'center', opacity: 0.9 },
  button: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: 'center',
  },
  buttonText: { fontSize: 26, fontWeight: '800', color: colors.ink },
});
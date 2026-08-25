import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Card, Label, Dot, Button } from '../components/ui';
import { colors, space, type } from '../theme';
import * as Perms from '../services/permissions';
import * as sensors from '../services/sensors/sensorManager';
import { fire, SOURCE } from '../services/triggers/triggerBus';
import { TEST_MODE, dialTarget } from '../config/emergency';

export default function HomeScreen({ navigation }) {
  const [armed, setArmed] = useState(sensors.isRunning());
  const [missing, setMissing] = useState([]);

  const blocked = missing.length > 0;

  // Re-check on focus so revoking a permission in Android settings shows up
  // as soon as the user comes back.
  useFocusEffect(
    useCallback(() => {
      Perms.checkAll().then((statuses) => {
        const gaps = Perms.missingCritical(statuses);
        setMissing(gaps);
        if (gaps.length) disarm();
      });
      setArmed(sensors.isRunning());
    }, [])
  );

  function disarm() {
    sensors.stop();
    setArmed(false);
  }

  function toggle() {
    if (blocked) return;
    if (armed) return disarm();
    sensors.start();
    setArmed(true);
  }

  const color = blocked ? colors.alarm : armed ? colors.safe : colors.warn;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.content}>
        <Label>Fallynx</Label>

        <Pressable
          onPress={toggle}
          style={({ pressed }) => [styles.center, pressed && { opacity: 0.8 }]}
        >
          <View style={[styles.ring, { borderColor: color }]}>
            <Text style={[styles.state, { color }]}>
              {blocked ? 'Cannot arm' : armed ? 'Armed' : 'Standing by'}
            </Text>
            <Text style={styles.hint}>
              {blocked ? 'Permissions missing' : armed ? 'Tap to stand down' : 'Tap to arm'}
            </Text>
          </View>
        </Pressable>

        {blocked && (
          <Pressable onPress={() => navigation.navigate('Settings')}>
            <Card style={{ borderColor: colors.alarm }}>
              <View style={styles.row}>
                <Dot color={colors.alarm} />
                <Text style={styles.cardText}>
                  {missing.map((p) => p.label).join(', ')} not granted
                </Text>
              </View>
              <Text style={type.body}>Tap to open Settings</Text>
            </Card>
          </Pressable>
        )}

        <Card>
          <Label>Status</Label>
          <Row
            name="Fall detection"
            value={armed ? 'Watching' : 'Off'}
            color={armed ? colors.safe : colors.faint}
          />
          <Row
            name="Location"
            value={blocked ? 'Blocked' : 'Ready'}
            color={blocked ? colors.alarm : colors.safe}
          />
        </Card>

        <Card>
          <Label>Test</Label>
          <Text style={type.body}>
            Runs the full alert without needing to fall. The countdown can be
            cancelled, exactly as a real one can.
          </Text>
          <Button title="Trigger a test alert" ghost onPress={() => fire(SOURCE.BUTTON)} />
          {TEST_MODE && (
            <Text style={styles.test}>
              Test mode: calls and messages go to {dialTarget()}, not an emergency line.
            </Text>
          )}
        </Card>
      </View>
    </SafeAreaView>
  );
}

function Row({ name, value, color }) {
  return (
    <View style={styles.between}>
      <View style={styles.row}>
        <Dot color={color} />
        <Text style={styles.cardText}>{name}</Text>
      </View>
      <Text style={type.mono}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: space.lg, gap: space.md },
  center: { alignItems: 'center', marginVertical: space.md },
  ring: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  state: { fontSize: 24, fontWeight: '700' },
  hint: { ...type.body, fontSize: 13, marginTop: space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexShrink: 1 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardText: { color: colors.text, fontSize: 14, flexShrink: 1 },
  test: { ...type.body, fontSize: 13, color: colors.warn },
});
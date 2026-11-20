import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Card, Label, Button, Dot } from '../components/ui';
import { colors, space, type } from '../theme';
import * as Perms from '../services/permissions';
import * as auth from '../services/supabase/auth';
import { EMERGENCY_NUMBERS, TEST_MODE, dialTarget } from '../config/emergency';

export default function SettingsScreen({ navigation }) {
  const [statuses, setStatuses] = useState({});
  const [email, setEmail] = useState('');

  const refresh = useCallback(() => {
    Perms.checkAll().then(setStatuses);
    auth.currentUser().then((u) => setEmail(u?.email || ''));
  }, []);

  useFocusEffect(refresh);

  async function grant(p) {
    await Perms.request(p);
    refresh();
  }

  // The app returns to the login screen on its own (see RootNavigator).
  function logOut() {
    Alert.alert('Log out?', 'You will need your email and password to log back in.', [
      { text: 'Cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => auth.logOut() },
    ]);
  }

  function reset() {
    Alert.alert('Run setup again?', 'The permission walkthrough will show on next launch.', [
      { text: 'Cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => Perms.resetOnboarding() },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={type.display}>Settings</Text>

        <Card>
          <Label>Permissions</Label>
          {Perms.usable().map((p) => {
            const ok = statuses[p.id];
            return (
              <Pressable key={p.id} onPress={() => !ok && grant(p)} style={styles.row}>
                <View style={styles.left}>
                  <Dot color={ok ? colors.safe : p.critical ? colors.alarm : colors.warn} />
                  <Text style={styles.name}>{p.label}</Text>
                </View>
                <Text style={type.mono}>{ok ? 'granted' : 'tap to grant'}</Text>
              </Pressable>
            );
          })}
        </Card>

        <Card>
          <Label>Emergency numbers</Label>
          {Object.entries(EMERGENCY_NUMBERS).map(([service, number]) => (
            <View key={service} style={styles.row}>
              <Text style={styles.name}>{service}</Text>
              <Text style={type.mono}>{number}</Text>
            </View>
          ))}
          {TEST_MODE && (
            <Text style={styles.test}>
              Test mode is on. Calls and messages go to {dialTarget()}, not any emergency line.
            </Text>
          )}
        </Card>

        <Card>
          <Label>Account</Label>
          <Text style={type.body}>{email ? `Logged in as ${email}` : 'Logged in'}</Text>
          <Button title="Log out" ghost onPress={logOut} />
        </Card>

        <Card>
          <Label>More</Label>
          <Button title="Medical ID" ghost onPress={() => navigation.navigate('Medical ID')} />
          <Button title="Alert history" ghost onPress={() => navigation.navigate('History')} />
          <Button title="Battery optimisation" ghost onPress={Perms.openBatterySettings} />
          <Button title="Android app settings" ghost onPress={Perms.openSettings} />
          <Button title="Run setup again" ghost onPress={reset} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: space.lg, gap: space.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    gap: space.md,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexShrink: 1 },
  name: { color: colors.text, fontSize: 15, flexShrink: 1 },
  test: { ...type.body, fontSize: 13, color: colors.warn },
});
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Label } from '../components/ui';
import { colors, space, type } from '../theme';
import * as Perms from '../services/permissions';

const WELCOME = {
  title: 'Fallynx watches for falls',
  why: 'If Fallynx detects a hard fall it gives you 30 seconds to cancel, then calls for help and sends your location.\n\nAndroid asks for each permission separately. This takes about a minute.',
};

export default function OnboardingScreen({ onDone }) {
  // usable() already drops anything this Android version does not have,
  // so the walkthrough is shorter on older phones with no extra logic.
  const steps = [WELCOME, ...Perms.usable()];
  const [index, setIndex] = useState(0);
  const [denied, setDenied] = useState(false);

  const step = steps[index];
  const isWelcome = index === 0;
  const isLast = index === steps.length - 1;

  function next() {
    setDenied(false);
    if (isLast) onDone();
    else setIndex(index + 1);
  }

  async function allow() {
    if (isWelcome) return next();
    const granted = await Perms.request(step);
    if (granted) next();
    else setDenied(true);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.progress}>
        {steps.map((s, i) => (
          <View key={s.id || 'welcome'} style={[styles.tick, i <= index && styles.tickOn]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Label>{`Step ${index + 1} of ${steps.length}`}</Label>
        <Text style={styles.title}>{step.title || step.label}</Text>
        <Text style={styles.body}>{step.why}</Text>

        {denied && (
          <Text style={[styles.notice, step.critical && styles.critical]}>
            {step.critical
              ? 'Fallynx cannot raise an alert without this. You can grant it later in Settings, but detection stays off until you do.'
              : 'Skipped. You can turn this on later in Settings.'}
          </Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={isWelcome ? 'Start' : `Allow ${step.label.toLowerCase()}`}
          onPress={allow}
        />
        {!isWelcome && <Button title={isLast ? 'Finish' : 'Skip for now'} ghost onPress={next} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  progress: { flexDirection: 'row', gap: 4, paddingHorizontal: space.lg, paddingTop: space.md },
  tick: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.line },
  tickOn: { backgroundColor: colors.safe },
  content: { padding: space.lg, paddingTop: space.lg * 1.5 },
  title: { ...type.display, marginTop: space.sm, marginBottom: space.md },
  body: { ...type.body, fontSize: 16 },
  notice: { ...type.body, marginTop: space.lg, color: colors.warn },
  critical: { color: colors.alarm },
  footer: { padding: space.lg, gap: space.sm },
});

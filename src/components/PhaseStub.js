import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Label } from './ui';
import { colors, space, type } from '../theme';

// Stands in for a screen a later phase will build. Replacing a stub with
// the real screen is a one-file change; the navigator never has to know.
export default function PhaseStub({ title, phase, description }) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.content}>
        <Text style={type.display}>{title}</Text>
        <Text style={styles.body}>{description}</Text>
        <View style={styles.tag}>
          <Label>{`Phase ${phase}`}</Label>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { flex: 1, padding: space.lg, justifyContent: 'center', gap: space.md },
  body: { ...type.body, fontSize: 16 },
  tag: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 4,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
});

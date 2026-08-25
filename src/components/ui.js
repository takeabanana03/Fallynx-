import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, space, type } from '../theme';

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Label({ children }) {
  return <Text style={type.label}>{String(children).toUpperCase()}</Text>;
}

export function Dot({ color }) {
  return <View style={[styles.dot, { backgroundColor: color }]} />;
}

export function Button({ title, onPress, ghost }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        ghost ? styles.ghost : styles.solid,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={ghost ? styles.ghostText : styles.solidText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.md,
    gap: space.sm,
  },
  dot: { width: 9, height: 9, borderRadius: 5 },
  button: { borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  solid: { backgroundColor: colors.safe },
  solidText: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  ghost: { borderWidth: 1, borderColor: colors.line },
  ghostText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
});

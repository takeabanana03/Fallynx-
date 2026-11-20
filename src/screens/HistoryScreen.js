import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, StyleSheet, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card, Label, Dot } from '../components/ui';
import { colors, space, type } from '../theme';
import * as history from '../services/supabase/history';
import { clockTime, shortDate, accuracyLabel, mapsLink } from '../utils/format';

const TYPES = {
  fall: 'Fall detected',
  safe_walk: 'Safe Walk check-in missed',
  shake: 'Shake alert',
  volume_buttons: 'Volume button alert',
  button: 'Manual alert',
};

// Every alert sent from this account, newest first. Loaded from Supabase,
// or from the copy on the phone when there is no internet.
export default function HistoryScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    history.list().then((list) => {
      setItems(list);
      setLoading(false);
    });
  }, []);

  useFocusEffect(load);

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(item) => String(item.at)}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.safe} />}
      ListEmptyComponent={
        !loading && (
          <Text style={type.body}>
            No alerts yet. Every alert you send appears here and is saved to your account.
          </Text>
        )
      }
      renderItem={({ item }) => <Entry item={item} />}
    />
  );
}

function Entry({ item }) {
  const when = new Date(item.at);
  const fix = item.location;
  return (
    <Card>
      <Label>{TYPES[item.source] || 'Alert'}</Label>
      <Text style={styles.when}>
        {shortDate(when)} · {clockTime(when)}
      </Text>
      <Text style={styles.detail}>Call: {item.steps?.call ?? '—'}</Text>
      <Text style={styles.detail}>Messages: {item.steps?.sms ?? '—'}</Text>
      <Text style={styles.detail}>
        {fix ? `GPS ${accuracyLabel(fix.accuracy)}` : 'Location unavailable'}
      </Text>
      {fix && (
        <Pressable onPress={() => Linking.openURL(mapsLink(fix.latitude, fix.longitude))}>
          <Text style={styles.link}>Show on map</Text>
        </Pressable>
      )}
      <View style={styles.row}>
        <Dot color={item.uploaded ? colors.safe : colors.warn} />
        <Text style={styles.small}>
          {item.uploaded ? 'Saved to your account' : 'On this phone, uploads when online'}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: space.lg, gap: space.md },
  when: { color: colors.text, fontSize: 18, fontWeight: '700' },
  detail: { color: colors.text, fontSize: 14 },
  link: { color: colors.safe, fontSize: 14, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  small: { color: colors.faint, fontSize: 13 },
});
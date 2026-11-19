import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Label, Button, Dot } from '../components/ui';
import { colors, space, type } from '../theme';
import * as walk from '../services/safewalk/journeyService';
import { clockTime, accuracyLabel, mapsLink } from '../utils/format';

const S = walk.JOURNEY_STATUS;

// The walk itself runs in journeyService, so it keeps going on other tabs.
// This screen only shows it, refreshing once a second.
export default function SafeWalkScreen() {
  const [journey, setJourney] = useState(walk.get());
  const [now, setNow] = useState(Date.now());
  const [destination, setDestination] = useState('');
  const [minutes, setMinutes] = useState('15');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setJourney(walk.get());
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  async function start() {
    const mins = parseInt(minutes, 10);
    if (!destination.trim()) {
      return Alert.alert('Where to?', 'Type where you are going, e.g. "Royal Road, Curepipe".');
    }
    if (!mins || mins < 1 || mins > 600) {
      return Alert.alert('How long?', 'Enter how many minutes the walk should take (1 to 600).');
    }
    setStarting(true);
    setJourney(await walk.start({ destination: destination.trim(), etaMinutes: mins }));
    setStarting(false);
  }

  function confirmCancel() {
    Alert.alert('Cancel this walk?', 'Nobody will be alerted.', [
      { text: 'Keep walking' },
      { text: 'Cancel walk', style: 'destructive', onPress: async () => setJourney(await walk.finish()) },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={type.display}>Safe Walk</Text>

        {!journey && (
          <>
            <Text style={type.body}>
              Set a destination and how long it should take. If you have not
              arrived or checked in by then, your contacts are alerted with
              your last GPS position.
            </Text>
            <Card>
              <Label>Where are you going?</Label>
              <TextInput
                style={styles.input}
                value={destination}
                onChangeText={setDestination}
                placeholder="Address or place"
                placeholderTextColor={colors.faint}
              />
              <Label>Minutes to get there</Label>
              <TextInput
                style={styles.input}
                value={minutes}
                onChangeText={setMinutes}
                keyboardType="number-pad"
                placeholder="15"
                placeholderTextColor={colors.faint}
              />
              <Button title={starting ? 'Finding the place…' : 'Start Safe Walk'} onPress={starting ? undefined : start} />
            </Card>
          </>
        )}

        {journey && (journey.status === S.ACTIVE || journey.status === S.OVERDUE) && (
          <>
            <Card style={journey.status === S.OVERDUE && { borderColor: colors.alarm }}>
              <Label>{`Walking to ${journey.destination}`}</Label>
              {journey.status === S.ACTIVE ? (
                <>
                  <Text style={styles.big}>{mmss(journey.dueAt - now)}</Text>
                  <Text style={type.body}>Arrive by {clockTime(new Date(journey.dueAt))}</Text>
                </>
              ) : (
                <>
                  <Text style={[styles.big, { color: colors.alarm }]}>Time's up</Text>
                  <Text style={styles.warn}>
                    Are you okay? Check in within {mmss(journey.dueAt + walk.GRACE_PERIOD_MS - now)} or
                    your contacts are alerted.
                  </Text>
                </>
              )}
            </Card>

            <Card>
              <Label>Live location</Label>
              <Where journey={journey} />
            </Card>

            <Button title="I've arrived" onPress={async () => setJourney(await walk.arrive())} />
            <Button
              title={journey.status === S.OVERDUE ? "I'm okay, 10 more minutes" : '+10 minutes'}
              ghost
              onPress={async () => setJourney(await walk.extend(10))}
            />
            <Button title="Cancel walk" ghost onPress={confirmCancel} />
          </>
        )}

        {journey && journey.status === S.ARRIVED && (
          <>
            <Card style={{ borderColor: colors.safe }}>
              <Label>Arrived</Label>
              <Text style={[styles.big, { color: colors.safe }]}>Safe</Text>
              <Text style={type.body}>
                Reached {journey.destination} at {clockTime(new Date(journey.arrivedAt))}.
              </Text>
            </Card>
            <Button title="Done" onPress={async () => setJourney(await walk.finish())} />
          </>
        )}

        {journey && journey.status === S.ALERTED && (
          <>
            <Card style={{ borderColor: colors.alarm }}>
              <Label>Check-in missed</Label>
              <Text style={styles.warn}>
                You did not check in on the way to {journey.destination}. The
                alert countdown was started with your last position.
              </Text>
            </Card>
            <Button title="Finish walk" onPress={async () => setJourney(await walk.finish())} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// GPS position, how good it is, and distance to the destination.
function Where({ journey }) {
  const fix = journey.lastFix;
  return (
    <>
      <View style={styles.row}>
        <Dot color={fix ? colors.safe : colors.warn} />
        <Text style={styles.text}>
          {fix
            ? `GPS ${accuracyLabel(fix.accuracy)} · updated ${clockTime(new Date(fix.timestamp))}`
            : 'Finding your location…'}
        </Text>
      </View>
      {journey.place ? (
        <Text style={type.body}>
          {journey.distanceM != null
            ? `${distance(journey.distanceM)} to go. Within ${walk.ARRIVED_WITHIN_M} m counts as arrived.`
            : 'Destination found on the map.'}
        </Text>
      ) : (
        <Text style={type.body}>
          Destination not found on the map. Tap "I've arrived" when you get there.
        </Text>
      )}
      {fix && (
        <Pressable onPress={() => Linking.openURL(mapsLink(fix.latitude, fix.longitude))}>
          <Text style={styles.link}>Show my position on the map</Text>
        </Pressable>
      )}
    </>
  );
}

function mmss(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function distance(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: space.lg, gap: space.md },
  big: { fontSize: 44, fontWeight: '800', color: colors.text },
  warn: { color: colors.warn, fontSize: 15, lineHeight: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  text: { color: colors.text, fontSize: 14, flexShrink: 1 },
  link: { color: colors.safe, fontSize: 14, fontWeight: '600' },
  input: {
    backgroundColor: colors.ink,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 15,
  },
});
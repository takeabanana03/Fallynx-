import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Label, Button } from '../components/ui';
import { colors, space, type } from '../theme';
import * as sensors from '../services/sensors/sensorManager';
import * as csv from '../services/sensors/csvLogger';
import { parseRecording, evaluate } from '../services/detection/replay';
import { LABELS, STATE } from '../services/detection/states';
import { magnitude } from '../utils/math';

const BARS = 50;
const MAX_G = 4; // chart ceiling

export default function SensorDebugScreen() {
  const [running, setRunning] = useState(false);
  const [data, setData] = useState({ accel: null, gyro: null, pressure: null });
  const [chart, setChart] = useState([]);
  const [recording, setRecording] = useState(false);
  const [rows, setRows] = useState(0);
  const [files, setFiles] = useState([]);
  const [detected, setDetected] = useState({ state: STATE.IDLE, reason: null });
  const [score, setScore] = useState(null);

  // Sensors push at 50 Hz. Redrawing that often would melt the UI thread, so
  // the screen polls at 10 Hz instead and the buffer keeps every sample.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setData(sensors.snapshot());
      setChart(sensors.recent(BARS).map(magnitude));
      setRows(csv.count());
      setDetected(sensors.detection());
    }, 100);
    return () => clearInterval(id);
  }, [running]);

  // Stop the sensors when leaving the screen so nothing drains battery in
  // the background. Phase 8 replaces this with a proper foreground service.
  useEffect(() => () => sensors.stop(), []);

  useEffect(() => {
    setFiles(csv.list());
  }, []);

  function toggleSensors() {
    if (running) {
      sensors.stop();
      setRunning(false);
    } else {
      sensors.start();
      setRunning(true);
    }
  }

  function startRecording(label) {
    if (!running) sensors.start();
    setRunning(true);
    csv.start(label);
    setRecording(true);
  }

  // Scores every saved recording against the current thresholds. Edit
  // config/thresholds.js, reload, run this again: that loop is the whole
  // point of keeping the detector free of native dependencies.
  function scoreRecordings() {
    const saved = csv.list();
    if (!saved.length) return Alert.alert('Nothing to score', 'Record some falls first.');
    try {
      const recordings = saved.map((f) => parseRecording(csv.read(f.uri)));
      setScore(evaluate(recordings));
    } catch (e) {
      Alert.alert('Could not score', String(e.message || e));
    }
  }

  async function stopRecording() {
    const saved = await csv.stop();
    setRecording(false);
    setFiles(csv.list());
    if (saved) Alert.alert('Saved', `${saved.name}\n${saved.rows} samples`);
  }

  const a = data.accel;
  const g = a ? magnitude(a) : 0;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={type.display}>Sensors</Text>

        <Card>
          <Label>Acceleration</Label>
          <Text style={styles.big}>{g.toFixed(2)} g</Text>
          <Chart values={chart} />
          <Text style={type.body}>
            {running ? 'At rest this reads about 1.00 g' : 'Sensors are off'}
          </Text>
        </Card>

        <Card>
          <Label>Raw</Label>
          <Reading name="accel x y z" value={xyz(a)} />
          <Reading name="gyro x y z" value={xyz(data.gyro)} />
          <Reading
            name="pressure"
            value={data.pressure ? `${data.pressure.toFixed(2)} hPa` : 'no barometer'}
          />
        </Card>

        <Button title={running ? 'Stop sensors' : 'Start sensors'} onPress={toggleSensors} />

        <Card>
          <Label>Detector</Label>
          <Text style={[styles.state, detected.state !== STATE.IDLE && { color: colors.warn }]}>
            {LABELS[detected.state]}
          </Text>
          <Text style={type.body}>
            {detected.state === STATE.CONFIRMED
              ? 'A fall was confirmed. Phase 4 turns this into an alert.'
              : detected.reason
                ? `Last run ended: ${detected.reason.replace(/_/g, ' ')}`
                : 'Waiting for a free fall.'}
          </Text>
          {detected.state === STATE.CONFIRMED && (
            <Button title="Reset detector" ghost onPress={() => sensors.resetDetector()} />
          )}
        </Card>

        <Card>
          <Label>Record</Label>
          <Text style={type.body}>
            Label each recording honestly. Phase 3 replays these to tune the
            detector, so a mislabelled file quietly corrupts the results.
          </Text>
          {recording ? (
            <>
              <Text style={styles.recording}>Recording — {rows} samples</Text>
              <Button title="Stop and save" onPress={stopRecording} />
            </>
          ) : (
            <>
              <Button title="Record a fall" onPress={() => startRecording('fall')} />
              <Button title="Record normal activity" ghost onPress={() => startRecording('normal')} />
            </>
          )}
        </Card>

        <Card>
          <Label>Score</Label>
          <Text style={type.body}>
            Replays every saved recording through the detector and compares the
            result with its label. Change a threshold, reload, score again.
          </Text>
          <Button title="Score recordings" ghost onPress={scoreRecordings} />
          {score && (
            <>
              <Reading name="caught falls" value={`${score.truePositives}/${score.truePositives + score.falseNegatives}`} />
              <Reading name="false alarms" value={String(score.falsePositives)} />
              <Reading name="precision" value={`${(score.precision * 100).toFixed(0)}%`} />
              <Reading name="recall" value={`${(score.recall * 100).toFixed(0)}%`} />
              <Reading name="F1" value={score.f1.toFixed(2)} />
            </>
          )}
        </Card>

        <Card>
          <Label>{`Recordings (${files.length})`}</Label>
          {files.length === 0 && <Text style={type.body}>Nothing recorded yet.</Text>}
          {files.map((f) => (
            <View key={f.uri} style={styles.fileRow}>
              <Text style={styles.fileName} numberOfLines={1}>
                {f.name}
              </Text>
              <Pressable onPress={() => csv.share(f.uri)}>
                <Text style={styles.action}>Share</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  csv.remove(f.uri);
                  setFiles(csv.list());
                }}
              >
                <Text style={[styles.action, { color: colors.alarm }]}>Delete</Text>
              </Pressable>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

// Bars grow with acceleration. A fall shows a dip near zero followed by a
// spike, which is exactly what the detector looks for in Phase 3.
function Chart({ values }) {
  return (
    <View style={styles.chart}>
      {Array.from({ length: BARS }).map((_, i) => {
        const v = values[i] ?? 0;
        const height = Math.min(1, v / MAX_G) * 70;
        const color = v > 2.5 ? colors.alarm : v < 0.5 ? colors.warn : colors.safe;
        return <View key={i} style={[styles.bar, { height: height || 1, backgroundColor: color }]} />;
      })}
    </View>
  );
}

function Reading({ name, value }) {
  return (
    <View style={styles.between}>
      <Text style={styles.name}>{name}</Text>
      <Text style={type.mono}>{value}</Text>
    </View>
  );
}

function xyz(v) {
  if (!v) return '—';
  return `${v.x.toFixed(2)}  ${v.y.toFixed(2)}  ${v.z.toFixed(2)}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: space.lg, gap: space.md },
  big: { fontSize: 34, fontWeight: '700', color: colors.text },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 70,
    gap: 2,
    marginVertical: space.sm,
  },
  bar: { flex: 1, borderRadius: 1 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { color: colors.text, fontSize: 14 },
  recording: { color: colors.alarm, fontSize: 16, fontWeight: '700' },
  state: { fontSize: 22, fontWeight: '700', color: colors.safe },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  fileName: { flex: 1, color: colors.text, fontSize: 13 },
  action: { color: colors.safe, fontSize: 13, fontWeight: '600' },
});
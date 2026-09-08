import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Label, Button } from '../components/ui';
import { colors, space, type } from '../theme';
import * as contacts from '../services/firebase/contacts';

const FIELDS = [
  { key: 'bloodGroup', label: 'Blood group', placeholder: 'O+' },
  { key: 'allergies', label: 'Allergies', placeholder: 'Penicillin, peanuts' },
  { key: 'medications', label: 'Medications', placeholder: 'Warfarin 5mg daily' },
  { key: 'conditions', label: 'Conditions', placeholder: 'Type 1 diabetes, epilepsy' },
  { key: 'nextOfKin', label: 'Next of kin', placeholder: 'Name and number' },
];

export default function MedicalIdScreen() {
  const [medical, setMedical] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    contacts.readMedicalId().then(setMedical);
  }, []);

  function set(key, value) {
    setMedical({ ...medical, [key]: value });
    setSaved(false);
  }

  async function save() {
    try {
      await contacts.saveMedicalId(medical);
      setSaved(true);
    } catch (e) {
      Alert.alert('Could not save', e.message);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={type.body}>
          Attached to every alert, and kept on the phone so it still reads with
          no signal. Leave anything blank that does not apply.
        </Text>

        <Card>
          {FIELDS.map((field) => (
            <View key={field.key} style={styles.field}>
              <Label>{field.label}</Label>
              <TextInput
                style={styles.input}
                value={medical[field.key] || ''}
                onChangeText={(v) => set(field.key, v)}
                placeholder={field.placeholder}
                placeholderTextColor={colors.faint}
                multiline={field.key !== 'bloodGroup'}
              />
            </View>
          ))}
        </Card>

        <Button title={saved ? 'Saved' : 'Save medical ID'} onPress={save} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: space.lg, gap: space.md },
  field: { gap: space.xs, paddingVertical: space.xs },
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
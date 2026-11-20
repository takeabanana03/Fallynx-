import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Card, Label, Button, Dot } from '../components/ui';
import { colors, space, type } from '../theme';
import * as contacts from '../services/supabase/contacts';
import { ALERT } from '../config/thresholds';

export default function ContactsScreen({ navigation }) {
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [adding, setAdding] = useState(false);

  const refresh = useCallback(() => {
    contacts.list().then(setList);
  }, []);

  useFocusEffect(refresh);

  async function add() {
    if (!name.trim() || !phone.trim()) {
      return Alert.alert('Missing details', 'A name and a phone number are needed.');
    }
    try {
      setList(await contacts.add({ name: name.trim(), phone: phone.trim() }));
      setName('');
      setPhone('');
      setAdding(false);
    } catch (e) {
      Alert.alert('Could not save', e.message);
    }
  }

  function confirmRemove(contact) {
    Alert.alert('Remove contact?', `${contact.name} will no longer be alerted.`, [
      { text: 'Cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => setList(await contacts.remove(contact.id)),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={type.display}>Contacts</Text>

        <Card>
          <Label>{`Alert list (${list.length}/${ALERT.MAX_CONTACTS})`}</Label>
          <Text style={type.body}>
            Messaged in order when an alert fires. Include the country code, or
            the message will not reach them.
          </Text>
          {list.length === 0 && (
            <Text style={styles.empty}>Nobody will be alerted yet.</Text>
          )}
          {list.map((c, i) => (
            <View key={c.id} style={styles.row}>
              <View style={styles.left}>
                <Dot color={i === 0 ? colors.safe : colors.faint} />
                <View style={styles.flex}>
                  <Text style={styles.name}>{c.name}</Text>
                  <Text style={type.mono}>{c.phone}</Text>
                </View>
              </View>
              <Pressable onPress={() => confirmRemove(c)}>
                <Text style={styles.remove}>Remove</Text>
              </Pressable>
            </View>
          ))}
        </Card>

        {adding ? (
          <Card>
            <Label>New contact</Label>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Name"
              placeholderTextColor={colors.faint}
            />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+230 5xxx xxxx"
              placeholderTextColor={colors.faint}
              keyboardType="phone-pad"
            />
            <Button title="Save contact" onPress={add} />
            <Button title="Cancel" ghost onPress={() => setAdding(false)} />
          </Card>
        ) : (
          <Button
            title="Add a contact"
            onPress={() => setAdding(true)}
          />
        )}

        <Button title="Medical ID" ghost onPress={() => navigation.navigate('Medical ID')} />
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
  flex: { flexShrink: 1 },
  name: { color: colors.text, fontSize: 15 },
  remove: { color: colors.alarm, fontSize: 13, fontWeight: '600' },
  empty: { ...type.body, fontStyle: 'italic' },
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
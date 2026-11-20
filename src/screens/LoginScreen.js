import React, { useState } from 'react';
import { View, Text, TextInput, Switch, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Label, Button } from '../components/ui';
import { colors, space, type } from '../theme';
import * as auth from '../services/supabase/auth';

// Email + password login. With "Remember me" on (the default) the app opens
// logged in next time; off, closing the app logs out.
export default function LoginScreen({ onLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(action) {
    if (!email.includes('@')) return setError('Enter your email address.');
    if (password.length < 6) return setError('The password needs at least 6 characters.');
    setBusy(true);
    setError('');
    try {
      const user = await action({ email, password, remember });
      onLoggedIn(user);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={type.display}>Fallynx</Text>
        <Text style={type.body}>Log in to keep your contacts and medical ID safe in your account.</Text>

        <Card>
          <Label>Email</Label>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.faint}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <Label>Password</Label>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            placeholderTextColor={colors.faint}
            secureTextEntry
            textContentType="password"
          />

          <View style={styles.row}>
            <Text style={styles.text}>Remember me</Text>
            <Switch
              value={remember}
              onValueChange={setRemember}
              trackColor={{ true: colors.safe, false: colors.line }}
            />
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <Button
            title={busy ? 'Please wait…' : 'Log in'}
            onPress={busy ? undefined : () => submit(auth.logIn)}
          />
          <Button
            title="Create account"
            ghost
            onPress={busy ? undefined : () => submit(auth.signUp)}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: space.lg, gap: space.md, flexGrow: 1, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  text: { color: colors.text, fontSize: 15 },
  error: { color: colors.alarm, fontSize: 14 },
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
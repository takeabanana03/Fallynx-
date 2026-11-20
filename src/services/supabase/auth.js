import { supabase, setRemember, savedUser } from './client';
import * as localStore from '../storage/localStore';

// Email + password login with "Remember me". Screens use these functions
// and never touch the Supabase SDK directly.

export async function currentUser() {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session) return data.session.user;
  } catch (e) {
    // Fall through to the saved login.
  }
  return savedUser();
}

export async function logIn({ email, password, remember }) {
  await setRemember(remember);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw new Error(friendly(error));
  return data.user;
}

export async function signUp({ email, password, remember }) {
  await setRemember(remember);
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
  if (error) throw new Error(friendly(error));
  if (!data.session) {
    // "Confirm email" is still on in the Supabase dashboard.
    throw new Error('Account created. Open the confirmation email, then log in.');
  }
  return data.user;
}

// Logs out on this phone only, which works offline too. The cached
// contacts and medical ID go with it, so the next person starts clean.
export async function logOut() {
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch (e) {
    // The saved login is removed either way.
  }
  await localStore.remove('contacts');
  await localStore.remove('medicalId');
  await localStore.remove('history');
}

// Calls back with the user on log in and null on log out. Only these two
// events count, so a failed refresh while offline never kicks anyone out.
export function onChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') callback(null);
    else if (event === 'SIGNED_IN' && session) callback(session.user);
  });
  return () => data.subscription.unsubscribe();
}

function friendly(error) {
  if (error.name === 'AuthRetryableFetchError' || error.status === 0) {
    return 'No internet connection. Connect and try again.';
  }
  return error.message || 'Something went wrong. Try again.';
}
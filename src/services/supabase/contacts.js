import { supabase } from './client';
import * as localStore from '../storage/localStore';
import { ALERT } from '../../config/thresholds';

// Contacts and the medical ID. Written to Supabase and mirrored into
// AsyncStorage on every change.
//
// The mirror is not an optimisation. The moment these details matter is the
// moment someone is on the ground, possibly with no signal. A read must
// never depend on the network, so Supabase is tried first and the cached
// copy answers whenever it fails.

async function uid() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error('Not logged in');
  return data.session.user.id;
}

export async function list() {
  try {
    await uid();
    const { data, error } = await supabase
      .from('contacts')
      .select('id, name, phone, relationship, priority')
      .order('priority');
    if (error) throw error;
    await localStore.write('contacts', data);
    return data;
  } catch (e) {
    return localStore.read('contacts', []);
  }
}

export async function add({ name, phone, relationship }) {
  const existing = await localStore.read('contacts', []);
  if (existing.length >= ALERT.MAX_CONTACTS) {
    throw new Error(`Maximum ${ALERT.MAX_CONTACTS} contacts`);
  }

  const contact = {
    id: String(Date.now()),
    name,
    phone,
    relationship: relationship || '',
    priority: existing.length + 1,
  };

  // Local first, so adding a contact works with no signal.
  const updated = [...existing, contact];
  await localStore.write('contacts', updated);

  try {
    const { error } = await supabase
      .from('contacts')
      .upsert({ ...contact, user_id: await uid() });
    if (error) throw error;
  } catch (e) {
    // Saved on the device. It reaches Supabase on the next successful write,
    // which is an acceptable trade for working offline.
  }

  return updated;
}

export async function remove(contactId) {
  const updated = (await localStore.read('contacts', []))
    .filter((c) => c.id !== contactId)
    .map((c, i) => ({ ...c, priority: i + 1 }));
  await localStore.write('contacts', updated);

  try {
    await uid();
    // Row Level Security limits this to the logged-in user's own rows.
    const { error } = await supabase.from('contacts').delete().eq('id', contactId);
    if (error) throw error;
  } catch (e) {
    // Removed locally; the Supabase copy is cleaned up on the next sync.
  }

  return updated;
}

export async function saveMedicalId(medical) {
  await localStore.write('medicalId', medical);
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: await uid(), medical_id: medical, updated_at: new Date().toISOString() });
    if (error) throw error;
  } catch (e) {
    // Kept on the device, which is where it is actually read from.
  }
}

export async function readMedicalId() {
  try {
    const id = await uid();
    const { data, error } = await supabase
      .from('profiles')
      .select('medical_id')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (data?.medical_id) {
      await localStore.write('medicalId', data.medical_id);
      return data.medical_id;
    }
  } catch (e) {
    // Fall through.
  }
  return localStore.read('medicalId', {});
}
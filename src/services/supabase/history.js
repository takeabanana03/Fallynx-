import { supabase } from './client';
import * as localStore from '../storage/localStore';

// Alert history: every alert the app sent, newest first.
//
// Each alert is saved on the phone first, so nothing is lost without
// internet, then uploaded to Supabase (table alert_history). Anything that
// could not be uploaded is sent the next time the history is loaded online.

const MAX = 50;

async function uid() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error('Not logged in');
  return data.session.user.id;
}

// Called by dispatch after every alert. Returns true once it is in Supabase.
export async function save(entry) {
  const item = { ...entry, uploaded: false };
  const saved = await localStore.read('history', []);
  await localStore.write('history', [item, ...saved].slice(0, MAX));
  return upload([item]);
}

// Newest first. From Supabase when online, from the phone otherwise.
export async function list() {
  const pending = (await localStore.read('history', [])).filter((e) => !e.uploaded);
  if (pending.length) await upload(pending);

  try {
    await uid();
    const { data, error } = await supabase
      .from('alert_history')
      .select('at, source, latitude, longitude, accuracy, steps')
      .order('at', { ascending: false })
      .limit(MAX);
    if (error) throw error;

    // Keep anything still waiting to upload, then everything from Supabase.
    const waiting = (await localStore.read('history', [])).filter((e) => !e.uploaded);
    const remote = data.map(fromRow).filter((r) => !waiting.some((w) => w.at === r.at));
    const merged = [...waiting, ...remote].sort((a, b) => b.at - a.at).slice(0, MAX);
    await localStore.write('history', merged);
    return merged;
  } catch (e) {
    return localStore.read('history', []);
  }
}

async function upload(items) {
  try {
    const id = await uid();
    const { error } = await supabase.from('alert_history').upsert(items.map((e) => toRow(e, id)));
    if (error) throw error;

    const done = new Set(items.map((e) => e.at));
    const saved = await localStore.read('history', []);
    await localStore.write(
      'history',
      saved.map((e) => (done.has(e.at) ? { ...e, uploaded: true } : e))
    );
    return true;
  } catch (e) {
    return false; // stays on the phone, retried by list()
  }
}

function toRow(entry, userId) {
  return {
    user_id: userId,
    id: String(entry.at),
    at: new Date(entry.at).toISOString(),
    source: entry.source,
    latitude: entry.location?.latitude ?? null,
    longitude: entry.location?.longitude ?? null,
    accuracy: entry.location?.accuracy ?? null,
    steps: entry.steps || {},
  };
}

function fromRow(row) {
  const at = new Date(row.at).getTime();
  return {
    at,
    source: row.source,
    location:
      row.latitude == null
        ? null
        : { latitude: row.latitude, longitude: row.longitude, accuracy: row.accuracy, timestamp: at },
    steps: row.steps || {},
    uploaded: true,
  };
}
import {
  collection, doc, setDoc, deleteDoc, getDocs, getDoc, query, orderBy,
} from 'firebase/firestore';
import { db, ready } from './client';
import * as localStore from '../storage/localStore';
import { ALERT } from '../../config/thresholds';

// Contacts and the medical ID. Written to Firestore and mirrored into
// AsyncStorage on every change.
//
// The mirror is not an optimisation. The moment these details matter is the
// moment someone is on the ground, possibly with no signal. A read must
// never depend on the network, so Firestore is tried first and the cached
// copy answers whenever it fails.

async function uid() {
  const user = await ready();
  return user.uid;
}

export async function list() {
  try {
    const id = await uid();
    const snap = await getDocs(
      query(collection(db, 'users', id, 'contacts'), orderBy('priority'))
    );
    const contacts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    await localStore.write('contacts', contacts);
    return contacts;
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
    const id = await uid();
    const { id: _, ...data } = contact;
    await setDoc(doc(db, 'users', id, 'contacts', contact.id), data);
  } catch (e) {
    // Saved on the device. It will not reach Firestore until the next
    // successful write, which is an acceptable trade for working offline.
  }

  return updated;
}

export async function remove(contactId) {
  const updated = (await localStore.read('contacts', []))
    .filter((c) => c.id !== contactId)
    .map((c, i) => ({ ...c, priority: i + 1 }));
  await localStore.write('contacts', updated);

  try {
    const id = await uid();
    await deleteDoc(doc(db, 'users', id, 'contacts', contactId));
  } catch (e) {
    // Removed locally; Firestore copy is cleaned up on the next sync.
  }

  return updated;
}

export async function saveMedicalId(medical) {
  await localStore.write('medicalId', medical);
  try {
    const id = await uid();
    await setDoc(doc(db, 'users', id), { medicalId: medical }, { merge: true });
  } catch (e) {
    // Kept on the device, which is where it is actually read from.
  }
}

export async function readMedicalId() {
  try {
    const id = await uid();
    const snap = await getDoc(doc(db, 'users', id));
    const medical = snap.data()?.medicalId;
    if (medical) {
      await localStore.write('medicalId', medical);
      return medical;
    }
  } catch (e) {
    // Fall through.
  }
  return localStore.read('medicalId', {});
}
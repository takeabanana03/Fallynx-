// Phase 5. The people an alert reaches, and the medical details it carries.

import { ALERT } from '../../config/thresholds';
import * as localStore from '../storage/localStore';

// TODO Phase 5: CRUD against users/{uid}/contacts, capped at
// ALERT.MAX_CONTACTS and ordered by priority.
export async function list(uid) {
  return localStore.read('contacts', []);
}

export async function save(uid, contact) {
  throw new Error('contacts.save not implemented (Phase 5)');
}

export async function remove(uid, contactId) {
  throw new Error('contacts.remove not implemented (Phase 5)');
}

// Always mirrored to local storage. A paramedic reading this needs it to
// work with the phone in airplane mode.
export async function saveMedicalId(uid, medical) {
  await localStore.write('medicalId', medical);
  throw new Error('contacts.saveMedicalId not implemented (Phase 5)');
}

export function readMedicalId() {
  return localStore.read('medicalId', {});
}

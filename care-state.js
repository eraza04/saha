export const BUILD = 'saha-phase1-1.1.0';
export const PREFIX = 'saha:v1:';
export const MEDICINES = [
  { id: 'A', name: 'Medicine A', period: 'morning', time: '9:00 am' },
  { id: 'B', name: 'Medicine B', period: 'evening', time: '8:00 pm' }
];
export const VISIT = { date: 'Tuesday, 27 October 2026', time: '10:30 am', clinician: 'Dr. Sara Ahmed', place: 'Community Health Centre', room: 'Ground floor · Room 04' };
export function defaults() {
  return { screen: 'welcome', view: 'prototype', condition: 'C', size: 'comfortable', contrast: false, roomy: false, gestures: false,
    selectedDose: 'A', doses: { A: { status: 'pending' }, B: { status: 'pending' } }, snooze: 10, events: [],
    visitReminder: true, visitSeen: false, contact: { name: 'Nida', relation: 'Daughter', number: '0300 000 0000' },
    otherContact: { name: 'Omar', relation: 'Son', number: '0300 000 0001' }, selectedContact: 0,
    emptyVisits: false, offline: false, formError: '', saved: false, onboarded: false };
}
const dateOK = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
export function validContact(c) {
  return c && ['name', 'relation', 'number'].every(k => typeof c[k] === 'string' && c[k].trim()) &&
    c.name.length <= 40 && c.relation.length <= 40 && c.number.length <= 24 && /^\+?[\d ()-]+$/.test(c.number) &&
    c.number.replace(/\D/g, '').length >= 7 && c.number.replace(/\D/g, '').length <= 15;
}
export function restore(value) {
  if (!value || value.version !== 1 || !value.state) throw new Error('Unrecognized saved data');
  const s = value.state, fresh = defaults();
  if (!['A','B','C'].includes(s.condition) || !['comfortable','large','largest'].includes(s.size) ||
      !['A','B'].includes(s.selectedDose) || !validContact(s.contact) || !validContact(s.otherContact) ||
      ![0,1].includes(s.selectedContact) || ![10,20,30].includes(s.snooze) || typeof s.screen !== 'string' ||
      !Array.isArray(s.events) || !s.doses) throw new Error('Invalid saved data');
  for (const key of ['contrast','roomy','gestures','visitReminder','visitSeen','emptyVisits','offline','onboarded']) {
    if (typeof s[key] !== 'boolean') throw new Error('Invalid preference');
    fresh[key] = s[key];
  }
  for (const id of ['A','B']) {
    const d = s.doses[id];
    if (!d || !['pending','taken','postponed'].includes(d.status) ||
        (d.status === 'taken' && !dateOK(d.takenAt)) ||
        (d.status === 'postponed' && (!dateOK(d.remindAt) || ![10,20,30].includes(d.delay)))) throw new Error('Invalid medicine record');
    fresh.doses[id] = { status: d.status, ...(dateOK(d.takenAt) ? {takenAt:d.takenAt} : {}),
      ...(dateOK(d.remindAt) ? {remindAt:d.remindAt,delay:d.delay} : {}) };
  }
  if (s.events.some(e => !e || !['taken','undo','postponed'].includes(e.type) || !['A','B'].includes(e.doseId) ||
      typeof e.label !== 'string' || e.label.length > 300 || !dateOK(e.time))) throw new Error('Invalid activity');
  for (const key of ['condition','size','selectedDose','contact','otherContact','selectedContact','snooze','screen']) fresh[key] = s[key];
  fresh.events = s.events;
  return fresh;
}
export function snapshot(state) {
  const clean = Object.fromEntries(Object.keys(defaults()).map(key => [key, state[key]]));
  return { version: 1, build: BUILD, state: clean };
}
export function changeMedicine(state, action, delay, now = new Date()) {
  const id = state.selectedDose, dose = state.doses[id], med = MEDICINES.find(m => m.id === id);
  if (!med || !dose) return false;
  let label;
  if (action === 'taken') {
    if (dose.status === 'taken') return false;
    state.doses[id] = {status:'taken',takenAt:now.toISOString()};
    label = med.name + ' marked taken';
  } else if (action === 'undo') {
    if (dose.status !== 'taken') return false;
    state.doses[id] = {status:'pending'};
    label = med.name + ' taken entry corrected; no taken record remains';
  } else if (action === 'postponed') {
    if (dose.status === 'taken' || ![10,20,30].includes(delay)) return false;
    state.doses[id] = {status:'postponed',delay,remindAt:new Date(now.getTime()+delay*60000).toISOString()};
    state.snooze = delay;
    label = med.name + ' reminder postponed by ' + delay + ' minutes';
  } else return false;
  state.events.push({type:action,label,time:now.toISOString(),doseId:id});
  return true;
}
export function preferences(state) {
  return {size:state.size,contrast:state.contrast,roomy:state.roomy,gestures:state.gestures};
}

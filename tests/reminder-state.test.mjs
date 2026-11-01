import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,reminderState,relativeReminder,nextUpItem,changeMedicine,dueReminders,upcomingAppointments,saveAppointment,snapshot,restore} from '../care-state.js';
const at=s=>new Date('2026-10-25T'+s),fresh=()=>defaults('personal',at('08:40:00'));
test('clock-derived reminder states change exactly at due and 30-minute missed boundaries',()=>{
 const s=fresh(),o=s.occurrences['A~2026-10-25'];assert.equal(reminderState(s,o,at('08:40:00')).key,'upcoming');assert.equal(relativeReminder(s,o,at('08:40:00')),'in 20 min');assert.equal(reminderState(s,o,at('09:00:00')).key,'due');assert.equal(reminderState(s,o,at('09:29:59')).key,'due');assert.equal(reminderState(s,o,at('09:30:00')).key,'missed');assert.equal(o.status,'pending');
 changeMedicine(s,'taken',null,at('09:45:00'));assert.equal(reminderState(s,o,at('12:00:00')).key,'taken');assert.equal(nextUpItem(s,at('12:00:00')).record.medicineId,'B');
});
test('skip dismisses only its occurrence and remains reversible and persistent',()=>{
 const s=fresh(),before=JSON.stringify(s.medicines);changeMedicine(s,'skipped',null,at('09:10:00'));const o=s.occurrences['A~2026-10-25'];assert.equal(o.status,'skipped');assert.equal(o.takenAt,undefined);assert.equal(JSON.stringify(s.medicines),before);assert.ok(!dueReminders(s,at('12:00:00')).medicines.some(x=>x.id===o.id));assert.equal(restore(snapshot(s),'personal',at('12:00:00')).occurrences[o.id].status,'skipped');changeMedicine(s,'undo',null,at('12:00:00'));assert.equal(o.status,'pending');assert.equal(s.events.at(-1).type,'undo');
});
test('snooze retains schedule and derives upcoming/due/missed from the new reminder time',()=>{
 const s=fresh(),o=s.occurrences['A~2026-10-25'];changeMedicine(s,'postponed',20,at('09:01:00'));assert.equal(o.time,'09:00');assert.equal(reminderState(s,o,at('09:10:00')).key,'upcoming');assert.equal(reminderState(s,o,at('09:21:00')).key,'due');assert.equal(reminderState(s,o,at('09:51:00')).key,'missed');
});
test('visit list and reminders share the same current window, including study clock',()=>{
 const s=fresh(),a=saveAppointment(s,{clinician:'Visit',date:'2026-10-25',time:'10:00',location:'Room 1',reminder:'at-time'});assert.ok(upcomingAppointments(s,at('10:01:00')).some(v=>v.id===a.id));assert.ok(dueReminders(s,at('10:01:00')).appointments.some(v=>v.id===a.id));assert.ok(!upcomingAppointments(s,at('10:31:00')).some(v=>v.id===a.id));assert.ok(!dueReminders(s,at('10:31:00')).appointments.some(v=>v.id===a.id));s.recordsMode='study';const real=new Date('2026-11-01T10:01:00');assert.ok(upcomingAppointments(s,real).some(v=>v.id===a.id));assert.ok(dueReminders(s,real).appointments.some(v=>v.id===a.id));
});
test('Next up uses effective snoozed time rather than the original schedule',()=>{
 const s=fresh();const b=s.occurrences['B~2026-10-25'];b.time='12:00';b.scheduledAt=at('12:00:00').toISOString();changeMedicine(s,'postponed',20,at('12:00:00'));assert.equal(nextUpItem(s,at('12:00:00')).record.id,b.id);
});
test('study Next up compares snoozed real-time offsets with its fixed scenario clock',()=>{
 const real=new Date('2026-11-01T12:00:00'),s=defaults('study',real);changeMedicine(s,'postponed',20,real);assert.equal(nextUpItem(s,real).record.medicineId,'A');
});

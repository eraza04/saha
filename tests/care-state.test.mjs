import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,changeMedicine,snapshot,restore,validContact,saveMedicine,archiveMedicine,selectMedicine,selectedOccurrence,occurrenceForDay,ensureOccurrences,saveAppointment,deleteAppointment,upcomingAppointments,saveContact,dueReminders,appointmentReminderAt,nextDay,localDay} from '../care-state.js';
const now=new Date('2026-10-25T12:00:00');
const fresh=()=>defaults('personal',now);
const roundTrip=s=>restore(JSON.parse(JSON.stringify(snapshot(s))),'personal',now);
function legacy(){return {version:1,state:{screen:'taken',view:'prototype',condition:'B',size:'largest',contrast:true,roomy:true,gestures:false,selectedDose:'A',doses:{A:{status:'taken',takenAt:now.toISOString()},B:{status:'postponed',delay:20,remindAt:new Date(+now+1200000).toISOString()}},snooze:20,events:[{type:'taken',label:'Medicine A marked taken',time:now.toISOString(),doseId:'A'}],visitReminder:true,visitSeen:true,contact:{name:'Edited Nida',relation:'Daughter',number:'0300 000 0002'},otherContact:{name:'Omar',relation:'Son',number:'0300 000 0001'},selectedContact:1,emptyVisits:false,offline:false,onboarded:true}};}

test('recording is explicit, duplicate safe, independent per medicine and persists',()=>{
 const s=fresh();assert.equal(changeMedicine(s,'taken',null,now),true);assert.equal(changeMedicine(s,'taken',null,now),false);
 selectMedicine(s,'B',now);assert.equal(selectedOccurrence(s).status,'pending');changeMedicine(s,'taken',null,now);
 const saved=roundTrip(s);assert.equal(saved.events.length,2);assert.equal(occurrenceForDay(saved,'A','2026-10-25').takenAt,now.toISOString());assert.equal(selectedOccurrence(saved).status,'taken');
});
test('postponement replaces only the selected occurrence reminder, never its daily schedule',()=>{
 const s=fresh(),schedule=JSON.stringify(s.medicines);assert.equal(changeMedicine(s,'postponed',17,now),false);
 changeMedicine(s,'postponed',10,now);changeMedicine(s,'postponed',20,now);
 assert.equal(selectedOccurrence(s).remindAt,new Date(+now+1200000).toISOString());assert.equal(JSON.stringify(s.medicines),schedule);
 changeMedicine(s,'taken',null,now);assert.equal(changeMedicine(s,'postponed',30,now),false);
});
test('correction retains its audit trail and allows another explicit report',()=>{
 const s=fresh();assert.equal(changeMedicine(s,'undo',null,now),false);changeMedicine(s,'taken',null,now);changeMedicine(s,'undo',null,now);
 assert.equal(selectedOccurrence(s).status,'pending');assert.equal(s.events[1].type,'undo');assert.equal(changeMedicine(s,'undo',null,now),false);changeMedicine(s,'taken',null,now);
 assert.equal(s.events.filter(e=>e.type==='taken').length,2);assert.ok(s.events.every(e=>e.occurrenceId===s.selectedOccurrenceId));
});
test('new medicines have unique IDs even when name and time are identical; validated drafts do not mutate state',()=>{
 const s=fresh(),a=saveMedicine(s,{name:'Fictional example',time:'08:30'},null,now),b=saveMedicine(s,{name:'Fictional example',time:'08:30'},null,now);
 assert.notEqual(a.id,b.id);assert.notEqual(occurrenceForDay(s,a.id,'2026-10-25').id,occurrenceForDay(s,b.id,'2026-10-25').id);
 const before=snapshot(s);for(const d of [{name:'',time:'09:00'},{name:'Name',time:'25:00'},{name:'x'.repeat(81),time:'09:00'}])assert.throws(()=>saveMedicine(s,d,null,now));assert.deepEqual(snapshot(s),before);
});
test('daily rollover, skipped offline days and correction target the exact occurrence',()=>{
 const s=fresh();changeMedicine(s,'taken',null,now);const old=s.selectedOccurrenceId;
 const later=new Date('2026-10-28T12:00:00');ensureOccurrences(s,later);selectMedicine(s,'A',later);changeMedicine(s,'taken',null,later);const today=s.selectedOccurrenceId;
 assert.notEqual(old,today);assert.ok(s.occurrences['A~2026-10-26']);assert.ok(s.occurrences['A~2026-10-27']);
 changeMedicine(s,'undo',null,later,old);assert.equal(s.occurrences[old].status,'pending');assert.equal(s.occurrences[today].status,'taken');
 const count=Object.keys(s.occurrences).length;ensureOccurrences(s,later);assert.equal(Object.keys(s.occurrences).length,count);
 assert.equal(restore(snapshot(s),'personal',later).occurrences[today].status,'taken');
});
test('name and reminder-time edits preserve existing occurrences; tomorrow uses latest revision',()=>{
 const s=fresh(),old=structuredClone(selectedOccurrence(s));saveMedicine(s,{name:'New fictional label',time:'14:45'},'A',now);saveMedicine(s,{name:'Latest label',time:'15:30'},'A',now);
 assert.deepEqual(selectedOccurrence(s),old);assert.equal(s.medicines[0].schedule.length,2);
 const tomorrow=new Date('2026-10-26T12:00:00');ensureOccurrences(s,tomorrow);const o=occurrenceForDay(s,'A','2026-10-26');assert.equal(o.time,'15:30');assert.equal(o.name,'Latest label');assert.notEqual(o.scheduleId,old.scheduleId);
 assert.doesNotThrow(()=>restore(snapshot(s),'personal',tomorrow));
});
test('archive stops reminders and generation, preserves all history and allows correcting archived records',()=>{
 const s=fresh();changeMedicine(s,'taken',null,now);const id=s.selectedOccurrenceId,events=structuredClone(s.events);assert.equal(archiveMedicine(s,'A',now),true);
 ensureOccurrences(s,new Date('2026-10-28T12:00:00'));assert.equal(s.occurrences['A~2026-10-26'],undefined);assert.deepEqual(s.events,events);assert.equal(s.occurrences[id].status,'taken');
 assert.equal(changeMedicine(s,'postponed',10,now),false);assert.equal(changeMedicine(s,'undo',null,now,id),true);assert.equal(changeMedicine(s,'taken',null,now,id),false);
 assert.ok(!dueReminders(s,new Date('2026-10-29T12:00:00')).medicines.some(o=>o.medicineId==='A'));assert.ok(roundTrip(s).medicines[0].archivedAt);
});
test('due scheduled and postponed reminders survive refresh and remain until recorded',()=>{
 const s=fresh();assert.ok(dueReminders(s,now).medicines.some(o=>o.medicineId==='A'));changeMedicine(s,'postponed',20,now);
 assert.ok(!dueReminders(s,new Date(+now+60000)).medicines.some(o=>o.medicineId==='A'));
 const restored=roundTrip(s);assert.ok(dueReminders(restored,new Date(+now+1200001)).medicines.some(o=>o.medicineId==='A'));
 changeMedicine(restored,'taken',null,now);assert.ok(!dueReminders(restored,new Date(+now+1200001)).medicines.some(o=>o.medicineId==='A'));
});
test('v1 migration preserves records, postponed reminders, contacts, acknowledgement, preferences and events',()=>{
 const old=legacy(),copy=structuredClone(old),s=restore(old,'personal',new Date('2026-10-27T12:00:00'));
 assert.deepEqual(old,copy);assert.equal(s.occurrences['A~2026-10-25'].takenAt,now.toISOString());assert.equal(s.occurrences['B~2026-10-25'].delay,20);assert.equal(s.contacts[0].name,'Edited Nida');assert.equal(s.selectedContactId,'contact-1');assert.equal(s.size,'largest');assert.equal(s.condition,'B');assert.equal(s.events[0].occurrenceId,'A~2026-10-25');assert.ok(s.appointments[0].acknowledgedReminderAt);assert.ok(s.occurrences['A~2026-10-27']);assert.equal(snapshot(s).version,2);
 assert.doesNotThrow(()=>restore(snapshot(s),'personal',new Date('2026-10-27T12:00:00')));
});
test('malformed legacy records are rejected rather than discarded',()=>{
 for(const mutate of [s=>s.doses.A={status:'taken'},s=>s.events=[null],s=>s.contact.number='abc1234567',s=>s.contrast='yes']){const old=legacy();mutate(old.state);assert.throws(()=>restore(old));}
});
test('migration keeps a prior visit acknowledgement even when its reminder was switched off',()=>{
 const old=legacy();old.state.visitReminder=false;old.state.visitSeen=true;
 const s=restore(old,'personal',now);assert.equal(s.appointments[0].reminder,'none');assert.ok(s.appointments[0].acknowledgedReminderAt);
 assert.equal(roundTrip(s).appointments[0].acknowledgedReminderAt,s.appointments[0].acknowledgedReminderAt);
});
test('v2 restore rejects invalid records, duplicate IDs, missing occurrence links and invalid preferences',()=>{
 for(const value of [null,{}, {version:42,state:fresh()}])assert.throws(()=>restore(value));
 for(const mutate of [s=>s.occurrences[s.selectedOccurrenceId]={status:'taken'},s=>s.events=[null],s=>s.contrast='yes',s=>s.contacts[0].number='abc1234567',s=>s.medicines.push(structuredClone(s.medicines[0])),s=>s.appointments[0].date='2026-02-30',s=>s.occurrences[s.selectedOccurrenceId].medicineId='missing']){const s=fresh();mutate(s);assert.throws(()=>restore(snapshot(s)));}
});
test('appointments add/edit/delete by ID and upcoming ordering includes date and time',()=>{
 const s=fresh();s.appointments=[];s.selectedAppointmentId=null;
 const fields={clinician:'Fictional visit',location:'Room 2',reminder:'none'};
 const later=saveAppointment(s,{...fields,date:'2026-10-28',time:'08:00'}),early=saveAppointment(s,{...fields,date:'2026-10-27',time:'11:00'}),first=saveAppointment(s,{...fields,date:'2026-10-27',time:'09:00'});
 assert.deepEqual(upcomingAppointments(s,now).map(a=>a.id),[first.id,early.id,later.id]);saveAppointment(s,{...fields,date:'2026-10-26',time:'10:00'},later.id);
 assert.equal(upcomingAppointments(s,now)[0].id,later.id);assert.equal(deleteAppointment(s,early.id),true);assert.equal(s.appointments.length,2);assert.equal(deleteAppointment(s,early.id),false);
 assert.throws(()=>saveAppointment(s,{...fields,date:'2026-02-30',time:'10:00'}));assert.throws(()=>saveAppointment(s,{...fields,date:'2026-10-26',time:'29:00'}));assert.doesNotThrow(()=>roundTrip(s));
});
test('appointment reminders become due, persist overdue, acknowledge once, and reset when time changes',()=>{
 const s=fresh(),a=saveAppointment(s,{clinician:'Test visit',date:'2026-10-26',time:'11:00',location:'Test room',reminder:'day-before'});
 assert.ok(dueReminders(s,now).appointments.some(x=>x.id===a.id));a.acknowledgedReminderAt=appointmentReminderAt(a);assert.ok(!dueReminders(roundTrip(s),now).appointments.some(x=>x.id===a.id));
 saveAppointment(s,{...a,time:'12:00'},a.id);assert.equal(a.acknowledgedReminderAt,null);assert.ok(dueReminders(s,new Date('2026-10-27T12:00:00')).appointments.some(x=>x.id===a.id));
 const at=saveAppointment(s,{...a,time:'10:00',reminder:'at-time'},a.id);assert.ok(dueReminders(s,new Date('2026-10-26T10:01:00')).appointments.some(x=>x.id===at.id));
});
test('adding contacts preserves existing contacts and selected IDs through refresh',()=>{
 const s=fresh(),before=structuredClone(s.contacts),c=saveContact(s,{name:'Fictional helper',relation:'Friend',number:'+92 (300) 000-0003'});assert.equal(s.contacts.length,3);assert.deepEqual(s.contacts.slice(0,2),before);assert.equal(roundTrip(s).selectedContactId,c.id);saveContact(s,{...c,name:'Edited helper'},c.id);assert.equal(s.contacts.at(-1).name,'Edited helper');
});
test('contact validation rejects text, too short/long phone numbers and incomplete data',()=>{
 assert.equal(validContact({name:'Nida',relation:'Daughter',number:'+92 (300) 000-0000'}),true);
 for(const number of ['','123','abc1234567','1234567890123456','++1234567'])assert.equal(validContact({name:'N',relation:'D',number}),false);
});
test('study daily samples stay equivalent on their fixed date; personal days use the local calendar',()=>{
 const later=new Date('2027-01-03T12:00:00'),s=defaults('study',later);assert.equal(Object.keys(s.occurrences).length,2);assert.ok(s.occurrences['A~2026-10-25']);assert.equal(localDay(later),'2027-01-03');assert.equal(nextDay('2026-12-31'),'2027-01-01');assert.ok(defaults('personal',later).occurrences['A~2027-01-03']);
});

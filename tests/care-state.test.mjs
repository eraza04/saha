import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, changeMedicine, snapshot, restore, validContact, MEDICINES } from '../care-state.js';
const now = new Date('2026-10-25T04:02:00Z');
test('recording is explicit, duplicate safe, independent per medicine, and survives serialization',()=>{
  const s=defaults();
  assert.equal(changeMedicine(s,'taken',null,now),true);
  assert.equal(changeMedicine(s,'taken',null,now),false);
  s.selectedDose='B';assert.equal(s.doses.B.status,'pending');
  changeMedicine(s,'taken',null,now);
  const saved=restore(JSON.parse(JSON.stringify(snapshot(s))));
  assert.equal(saved.events.length,2);assert.equal(saved.doses.A.takenAt,now.toISOString());assert.equal(saved.doses.B.status,'taken');
});
test('postponement replaces only the reminder, never a taken record or schedule',()=>{
  const s=defaults(),schedule=JSON.stringify(MEDICINES);
  assert.equal(changeMedicine(s,'postponed',17,now),false);
  changeMedicine(s,'postponed',10,now);changeMedicine(s,'postponed',20,now);
  assert.equal(s.doses.A.remindAt,'2026-10-25T04:22:00.000Z');
  assert.equal(JSON.stringify(MEDICINES),schedule);
  changeMedicine(s,'taken',null,now);assert.equal(changeMedicine(s,'postponed',30,now),false);
});
test('correction has a persistent audit trail and permits a new explicit report',()=>{
  const s=defaults();assert.equal(changeMedicine(s,'undo',null,now),false);
  changeMedicine(s,'taken',null,now);changeMedicine(s,'undo',null,now);
  assert.equal(s.doses.A.status,'pending');assert.equal(s.events[1].type,'undo');
  assert.equal(changeMedicine(s,'undo',null,now),false);changeMedicine(s,'taken',null,now);
  assert.equal(s.events.filter(e=>e.type==='taken').length,2);
});
test('restore rejects corrupt schemas, records, preferences and contact data',()=>{
  for(const value of [null,{}, {version:42,state:defaults()}]) assert.throws(()=>restore(value));
  for(const mutate of [s=>s.doses.A={status:'taken'},s=>s.events=[null],s=>s.contrast='yes',s=>s.contact.number='abc1234567']){
    const s=defaults();mutate(s);assert.throws(()=>restore(snapshot(s)));
  }
});
test('contact validation accepts formatted fictional numbers and rejects text and incomplete data',()=>{
  assert.equal(Boolean(validContact({name:'Nida',relation:'Daughter',number:'+92 (300) 000-0000'})),true);
  for(const number of ['','123','abc1234567','1234567890123456','++1234567'])assert.equal(Boolean(validContact({name:'N',relation:'D',number})),false);
});

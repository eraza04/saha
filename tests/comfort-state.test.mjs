import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,snapshot,restore,preferences,formDraftKey} from '../care-state.js';
import {makeSession,restoreResearch,newResearch} from '../research-state.js';

test('older v2 snapshots gain dark/draft defaults while preserving records',()=>{
 const old=snapshot(defaults());delete old.state.dark;delete old.state.formDrafts;
 const current=restore(old);assert.equal(current.dark,false);assert.deepEqual(current.formDrafts,{});
 for(const key of ['medicines','occurrences','appointments','contacts','events'])assert.deepEqual(current[key],old.state[key]);
 const invalid=structuredClone(old);invalid.state.dark='yes';assert.throws(()=>restore(invalid));
});
test('draft keys separate forms, records and stores; snapshots retain drafts but not validation state',()=>{
 const s=defaults();s.dark=true;s.screen='addmedicine';const key=formDraftKey(s);assert.equal(key,'addmedicine:new');
 s.formDrafts[key]={name:'Unfinished fictional item',time:'08:00'};s.draft={name:'transient'};
 const restored=restore(snapshot(s));assert.equal(restored.dark,true);assert.deepEqual(restored.formDrafts,s.formDrafts);assert.equal(restored.draft,undefined);
 s.screen='editmedicine';assert.equal(formDraftKey(s),'editmedicine:A');s.selectedMedicineId='B';assert.equal(formDraftKey(s),'editmedicine:B');
 assert.deepEqual(defaults('study').formDrafts,{});
 const bad=snapshot(s);bad.state.formDrafts[key].name={bad:true};assert.throws(()=>restore(bad));
});
test('research freezes/exports theme while retaining legacy configurations',()=>{
 const s=defaults();s.dark=true;s.gestures=true;const session=makeSession('THEME','ABC',preferences(s));
 s.dark=false;assert.equal(session.config.dark,true);
 const legacy=newResearch();legacy.sessions=[{...session,config:{size:'comfortable',contrast:false,roomy:false,gestures:true}}];
 assert.equal(restoreResearch(legacy).sessions.length,1);
 const invalid=newResearch();invalid.sessions=[{...session,config:{...session.config,dark:'yes'}}];assert.throws(()=>restoreResearch(invalid));
});

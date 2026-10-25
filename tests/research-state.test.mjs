import test from 'node:test';
import assert from 'node:assert/strict';
import { makeSession, newResearch, restoreResearch, sessionContext } from '../research-state.js';
const config={size:'largest',contrast:true,roomy:true,gestures:true};
test('new coded sessions freeze choices, have distinct identifiers and keep earlier results',()=>{
  const r=newResearch(),one=makeSession('P01','ABC',config),two=makeSession('P02','CBA',config);
  assert.notEqual(one.id,two.id);r.sessions.push(one);r.currentSessionId=one.id;
  const result={...sessionContext(r),task:'dose',condition:'A',config,seconds:12,result:'assisted',help:1,errors:1,build:one.build};
  r.results.push(result);r.sessions.push(two);r.currentSessionId=two.id;config.size='large';
  assert.equal(one.config.size,'largest');assert.equal(r.results.length,1);assert.equal(r.results[0].participantCode,'P01');
  assert.equal(restoreResearch(r).sessions.length,2);config.size='largest';
});
test('legacy records are preserved with explicit unassigned identities',()=>{
  const old={version:1,events:[{type:'navigation',time:'2026-10-25T00:00:00Z'}],results:[{task:'dose',condition:'B',config,seconds:12,result:'failed',help:0,errors:1,build:'saha-phase1-1.0.0'}],active:null};
  const r=restoreResearch(old);assert.equal(r.results.length,1);assert.equal(r.results[0].participantCode,'UNASSIGNED');assert.equal(r.events[0].sessionId,'legacy');assert.equal(r.currentSessionId,null);assert.equal(old.results[0].sessionId,undefined);
});
test('malformed records throw instead of silently dropping earlier rows',()=>{
  assert.throws(()=>restoreResearch({version:1,events:[],results:[null],active:null}));
  assert.throws(()=>restoreResearch({...newResearch(),sessions:{damaged:true}}));
  assert.throws(()=>makeSession('Real Name','ABC',config));assert.throws(()=>makeSession('P01','AAA',config));
  assert.throws(()=>makeSession('P01','ABC',{...config,gestures:false}));
});

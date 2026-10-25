import { BUILD } from './care-state.js';
export const ORDERS = ['ABC','ACB','BAC','BCA','CAB','CBA'];
export const TASK_IDS = ['dose','later','visit','contact','home'];
export const newId = () => globalThis.crypto?.randomUUID?.() || Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
export const newResearch = () => ({version:1,sessions:[],currentSessionId:null,events:[],results:[],active:null});
const configOK = c => c && ['comfortable','large','largest'].includes(c.size) && ['contrast','roomy','gestures'].every(k=>typeof c[k]==='boolean');
const countsOK = a => Number.isInteger(a.help) && a.help>=0 && Number.isInteger(a.errors) && a.errors>=0;
export function restoreResearch(value){
  const r=structuredClone(value);
  if(!r || r.version!==1 || !Array.isArray(r.events) || !Array.isArray(r.results) ||
    r.events.some(e=>!e||typeof e.type!=='string'||typeof e.time!=='string') ||
    r.results.some(a=>!a||!TASK_IDS.includes(a.task)||!['A','B','C'].includes(a.condition)||!Number.isFinite(a.seconds)||a.seconds<0||!['completed','assisted','failed'].includes(a.result)||!configOK(a.config)||!countsOK(a)||typeof a.build!=='string'))throw new Error('Invalid study data');
  // Earlier builds had no participant/session identifiers. Preserve those rows
  // explicitly as unassigned rather than attaching them to the next participant.
  if('sessions' in r && !Array.isArray(r.sessions))throw new Error('Invalid session list');
  if(!('sessions' in r)){
    r.sessions=[];r.currentSessionId=null;
    if(r.events.length||r.results.length||r.active){
      r.sessions.push({id:'legacy',participantCode:'UNASSIGNED',conditionOrder:'UNSPECIFIED',build:'legacy',createdAt:null,config:null});
      for(const row of [...r.events,...r.results])Object.assign(row,{sessionId:'legacy',participantCode:'UNASSIGNED',conditionOrder:'UNSPECIFIED'});
    }
  }
  if(r.sessions.some(s=>!s||typeof s.id!=='string'||typeof s.participantCode!=='string'||typeof s.conditionOrder!=='string'||(s.config!==null&&!configOK(s.config))) ||
    (r.currentSessionId!==null&&!r.sessions.some(s=>s.id===r.currentSessionId)))throw new Error('Invalid session data');
  if(r.active){
    const a=r.active;
    if(!TASK_IDS.includes(a.taskId)||!['A','B','C'].includes(a.condition)||!configOK(a.config)||!countsOK(a)||typeof a.build!=='string'||(a.start!==null&&!Number.isFinite(a.start)))throw new Error('Invalid active task');
    a.phase??='running';a.navigation??={buttons:0,swipes:0};a.runId??='legacy-active';
    a.sessionId??='legacy';a.participantCode??='UNASSIGNED';a.conditionOrder??='UNSPECIFIED';
    if(!['ready','running','review'].includes(a.phase)||!Number.isInteger(a.navigation.buttons)||a.navigation.buttons<0||!Number.isInteger(a.navigation.swipes)||a.navigation.swipes<0)throw new Error('Invalid active phase');
  }
  return r;
}
export function makeSession(participantCode,conditionOrder,config){
  if(!/^[A-Za-z0-9_-]{1,20}$/.test(participantCode)||!ORDERS.includes(conditionOrder)||!configOK(config))throw new Error('Use a participant code (letters, digits, - or _) and an order.');
  if(!config.gestures)throw new Error('Enable Optional swipes in condition C before creating the session. C must offer gestures; participants may use buttons throughout.');
  return {id:newId(),participantCode,conditionOrder,config:{...config},build:BUILD,createdAt:new Date().toISOString()};
}
export function sessionContext(r){
  const s=r.sessions.find(s=>s.id===r.currentSessionId);
  return s?{sessionId:s.id,participantCode:s.participantCode,conditionOrder:s.conditionOrder}:{sessionId:null,participantCode:'UNASSIGNED',conditionOrder:'UNSPECIFIED'};
}

export const BUILD = 'saha-phase1-1.2.2';
// Retain existing storage keys; the envelope version controls migration.
export const PREFIX = 'saha:v1:';
export const SAMPLE_DAY = '2026-10-25';
export const MEDICINES = [{id:'A',name:'Medicine A',time:'09:00'},{id:'B',name:'Medicine B',time:'20:00'}];
export const VISIT = {date:'Tuesday, 27 October 2026',time:'10:30 am',clinician:'Dr. Sara Ahmed',place:'Community Health Centre',room:'Ground floor · Room 04'};
export const recordId = () => globalThis.crypto?.randomUUID?.() || Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
export const localDay = (now=new Date()) => [now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
export function nextDay(day) {const d=new Date(day+'T12:00:00');d.setDate(d.getDate()+1);return localDay(d);}
export const careDay = (s,now=new Date()) => s.recordsMode==='study'?SAMPLE_DAY:localDay(now);
const dateOK = v => typeof v==='string' && Number.isFinite(Date.parse(v));
export const validDay = v => typeof v==='string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && dateOK(v+'T12:00:00') && localDay(new Date(v+'T12:00:00'))===v;
export const validTime = v => typeof v==='string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const textOK = (v,max) => typeof v==='string' && !!v.trim() && v.length<=max;
export const scheduledISO = (day,time) => new Date(day+'T'+time+':00').toISOString();
export const timeLabel = time => {if(!validTime(time))return '';const [h,m]=time.split(':').map(Number);return (h%12||12)+':'+String(m).padStart(2,'0')+' '+(h<12?'am':'pm');};
export const dayLabel = day => new Date(day+'T12:00:00').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
export function validContact(c) {return Boolean(c && textOK(c.name,40) && textOK(c.relation,40) && textOK(c.number,24) && /^\+?[\d ()-]+$/.test(c.number) && c.number.replace(/\D/g,'').length>=7 && c.number.replace(/\D/g,'').length<=15);}
export const validAppointment = a => Boolean(a && textOK(a.clinician,80) && validDay(a.date) && validTime(a.time) && textOK(a.location,160) && ['none','at-time','day-before'].includes(a.reminder));
export function defaults(recordsMode='personal',now=new Date()) {
  const day=recordsMode==='study'?SAMPLE_DAY:localDay(now);
  const s={recordsMode,screen:'welcome',view:'prototype',condition:'C',size:'comfortable',contrast:false,roomy:false,gestures:false,
    medicines:MEDICINES.map(m=>({...m,startDate:day,archivedAt:null,schedule:[{id:recordId(),from:day,time:m.time}],generatedThrough:null})),
    occurrences:{},selectedMedicineId:'A',selectedOccurrenceId:'A~'+day,snooze:10,events:[],
    appointments:[{id:'sample-visit',clinician:VISIT.clinician,date:'2026-10-27',time:'10:30',location:VISIT.place+' · '+VISIT.room,reminder:'at-time',acknowledgedReminderAt:null}],selectedAppointmentId:'sample-visit',
    contacts:[{id:'contact-0',name:'Nida',relation:'Daughter',number:'0300 000 0000'},{id:'contact-1',name:'Omar',relation:'Son',number:'0300 000 0001'}],selectedContactId:'contact-0',
    emptyVisits:false,offline:false,formError:'',onboarded:false};
  ensureOccurrences(s,now);return s;
}
export const selectedMedicine = s => s.medicines.find(m=>m.id===s.selectedMedicineId);
export const selectedOccurrence = s => s.occurrences[s.selectedOccurrenceId];
export const selectedAppointment = s => s.appointments.find(a=>a.id===s.selectedAppointmentId);
export const selectedContact = s => s.contacts.find(c=>c.id===s.selectedContactId);
export const occurrenceForDay = (s,id,day=careDay(s)) => s.occurrences[id+'~'+day];
export function ensureOccurrences(s,now=new Date()) {
  const today=careDay(s,now);let changed=false;
  for(const m of s.medicines){
    if(m.archivedAt)continue;
    for(let day=m.generatedThrough?nextDay(m.generatedThrough):m.startDate;day<=today;day=nextDay(day)){
      const revision=m.schedule.filter(r=>r.from<=day).at(-1);if(!revision)continue;
      const id=m.id+'~'+day;
      if(!s.occurrences[id]){s.occurrences[id]={id,medicineId:m.id,scheduleId:revision.id,date:day,time:revision.time,name:m.name,scheduledAt:scheduledISO(day,revision.time),status:'pending'};changed=true;}
      m.generatedThrough=day;
    }
  }
  return changed;
}
export function selectMedicine(s,id,now=new Date()) {ensureOccurrences(s,now);const o=occurrenceForDay(s,id,careDay(s,now));if(!o)return false;s.selectedMedicineId=id;s.selectedOccurrenceId=o.id;return true;}
export function saveMedicine(s,draft,id=null,now=new Date()) {
  const name=String(draft.name??'').trim(),time=String(draft.time??'');
  if(!textOK(name,80)||!validTime(time))throw new Error('Enter a medicine name and a valid reminder time.');
  ensureOccurrences(s,now);const today=careDay(s,now);
  if(id){
    const m=s.medicines.find(m=>m.id===id);if(!m||m.archivedAt)throw new Error('This medicine is no longer active.');
    m.name=name;
    // Existing occurrences retain their identity, name and scheduled time.
    const from=nextDay(today),current=m.schedule.filter(r=>r.from<=from).at(-1);
    if(current.time!==time){m.schedule=m.schedule.filter(r=>r.from<from);m.schedule.push({id:recordId(),from,time});}
    m.time=time;return m;
  }
  const m={id:recordId(),name,time,startDate:today,archivedAt:null,schedule:[{id:recordId(),from:today,time}],generatedThrough:null};
  s.medicines.push(m);selectMedicine(s,m.id,now);return m;
}
export function archiveMedicine(s,id,now=new Date()) {ensureOccurrences(s,now);const m=s.medicines.find(m=>m.id===id);if(!m||m.archivedAt)return false;m.archivedAt=now.toISOString();return true;}
export function changeMedicine(s,action,delay,now=new Date(),occurrenceId=s.selectedOccurrenceId) {
  const o=s.occurrences[occurrenceId],m=s.medicines.find(m=>m.id===o?.medicineId);if(!o||!m||(m.archivedAt&&action!=='undo'))return false;
  let label;
  if(action==='taken'){
    if(o.status==='taken')return false;o.status='taken';o.takenAt=now.toISOString();delete o.remindAt;delete o.delay;label=o.name+' marked taken';
  }else if(action==='undo'){
    if(o.status!=='taken')return false;o.status='pending';delete o.takenAt;delete o.remindAt;delete o.delay;label=o.name+' taken entry corrected; no taken record remains';
  }else if(action==='postponed'){
    if(o.status==='taken'||![10,20,30].includes(delay))return false;o.status='postponed';o.delay=delay;o.remindAt=new Date(now.getTime()+delay*60000).toISOString();s.snooze=delay;label=o.name+' reminder postponed by '+delay+' minutes';
  }else return false;
  s.events.push({type:action,label,time:now.toISOString(),doseId:m.id,occurrenceId:o.id});return true;
}
export function saveAppointment(s,draft,id=null) {
  const clean={clinician:String(draft.clinician??'').trim(),date:String(draft.date??''),time:String(draft.time??''),location:String(draft.location??'').trim(),reminder:String(draft.reminder??'')};
  if(!validAppointment(clean))throw new Error('Enter a title, valid date, time, location and reminder choice.');
  let a=s.appointments.find(a=>a.id===id);if(id&&!a)throw new Error('This appointment no longer exists.');
  if(!a){a={id:recordId(),...clean,acknowledgedReminderAt:null};s.appointments.push(a);}
  else{const changed=['date','time','reminder'].some(k=>a[k]!==clean[k]);Object.assign(a,clean);if(changed)a.acknowledgedReminderAt=null;}
  s.selectedAppointmentId=a.id;s.emptyVisits=false;return a;
}
export function deleteAppointment(s,id) {const count=s.appointments.length;s.appointments=s.appointments.filter(a=>a.id!==id);if(s.selectedAppointmentId===id)s.selectedAppointmentId=s.appointments[0]?.id??null;return s.appointments.length!==count;}
export function saveContact(s,draft,id=null) {
  const clean=Object.fromEntries(['name','relation','number'].map(k=>[k,String(draft[k]??'').trim()]));
  if(!validContact(clean))throw new Error('Enter a name, relationship and phone number (7 to 15 digits). Use digits, spaces, (), - or a starting +.');
  let c=s.contacts.find(c=>c.id===id);if(id&&!c)throw new Error('This contact no longer exists.');
  if(c)Object.assign(c,clean);else s.contacts.push(c={id:recordId(),...clean});s.selectedContactId=c.id;return c;
}
export const sortedAppointments = s => s.emptyVisits?[]:s.appointments.slice().sort((a,b)=>(a.date+'T'+a.time).localeCompare(b.date+'T'+b.time)||a.id.localeCompare(b.id));
export const upcomingAppointments = (s,now=new Date()) => sortedAppointments(s).filter(a=>Date.parse(scheduledISO(a.date,a.time))>=(s.recordsMode==='study'?Date.parse(SAMPLE_DAY+'T00:00:00'):now.getTime()));
export function appointmentReminderAt(a) {if(!a||a.reminder==='none')return null;const d=new Date(a.date+'T'+a.time+':00');if(a.reminder==='day-before')d.setDate(d.getDate()-1);return d.toISOString();}
export function dueReminders(s,now=new Date()) {
  const scheduleNow=s.recordsMode==='study'?new Date(SAMPLE_DAY+'T'+String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0')+':'+String(now.getSeconds()).padStart(2,'0')).getTime():now.getTime();
  const medicines=Object.values(s.occurrences).filter(o=>s.medicines.some(m=>m.id===o.medicineId&&!m.archivedAt)&&o.status!=='taken'&&Date.parse(o.status==='postponed'?o.remindAt:o.scheduledAt)<=(o.status==='postponed'?now.getTime():scheduleNow));
  const appointments=sortedAppointments(s).filter(a=>{const at=appointmentReminderAt(a);return at&&at!==a.acknowledgedReminderAt&&Date.parse(at)<=scheduleNow;});
  return {medicines,appointments};
}
export function preferences(s) {return {size:s.size,contrast:s.contrast,roomy:s.roomy,gestures:s.gestures};}
const transient=new Set(['formError','draft','editingId']);
export function snapshot(state) {return {version:2,build:BUILD,state:structuredClone(Object.fromEntries(Object.entries(state).filter(([k])=>!transient.has(k))))};}
function migrateV1(s,recordsMode,now) {
  if(!s||!['A','B','C'].includes(s.condition)||!['comfortable','large','largest'].includes(s.size)||!['A','B'].includes(s.selectedDose)||!validContact(s.contact)||!validContact(s.otherContact)||![0,1].includes(s.selectedContact)||![10,20,30].includes(s.snooze)||typeof s.screen!=='string'||!Array.isArray(s.events)||!s.doses)throw new Error('Invalid legacy data');
  for(const k of ['contrast','roomy','gestures','visitReminder','visitSeen','emptyVisits','offline','onboarded'])if(typeof s[k]!=='boolean')throw new Error('Invalid legacy preference');
  const fresh=defaults(recordsMode,now);fresh.occurrences={};
  for(const m of fresh.medicines){
    const o=s.doses[m.id];if(!o||!['pending','taken','postponed'].includes(o.status)||(o.status==='taken'&&!dateOK(o.takenAt))||(o.status==='postponed'&&(!dateOK(o.remindAt)||![10,20,30].includes(o.delay))))throw new Error('Invalid legacy occurrence');
    m.startDate=SAMPLE_DAY;m.generatedThrough=SAMPLE_DAY;m.schedule[0].from=SAMPLE_DAY;
    const id=m.id+'~'+SAMPLE_DAY;fresh.occurrences[id]={id,medicineId:m.id,scheduleId:m.schedule[0].id,name:m.name,date:SAMPLE_DAY,time:m.time,scheduledAt:scheduledISO(SAMPLE_DAY,m.time),...o};
  }
  if(s.events.some(e=>!e||!['taken','undo','postponed'].includes(e.type)||!['A','B'].includes(e.doseId)||typeof e.label!=='string'||e.label.length>300||!dateOK(e.time)))throw new Error('Invalid legacy activity');
  fresh.events=s.events.map(e=>({...e,occurrenceId:e.doseId+'~'+SAMPLE_DAY}));
  for(const k of ['screen','condition','size','contrast','roomy','gestures','snooze','emptyVisits','offline','onboarded'])fresh[k]=s[k];
  fresh.contacts=[{...s.contact,id:'contact-0'},{...s.otherContact,id:'contact-1'}];fresh.selectedContactId='contact-'+s.selectedContact;
  fresh.appointments[0].reminder=s.visitReminder?'at-time':'none';fresh.appointments[0].acknowledgedReminderAt=s.visitSeen?scheduledISO(fresh.appointments[0].date,fresh.appointments[0].time):null;
  fresh.selectedMedicineId=s.selectedDose;fresh.selectedOccurrenceId=s.selectedDose+'~'+SAMPLE_DAY;
  ensureOccurrences(fresh,now);return fresh;
}
export function restore(value,recordsMode='personal',now=new Date()) {
  if(value?.version===1)return migrateV1(value.state,recordsMode,now);
  if(value?.version!==2||!value.state)throw new Error('Unrecognized saved data');
  const s=structuredClone(value.state),unique=items=>new Set(items.map(x=>x.id)).size===items.length;
  if(!['personal','study'].includes(s.recordsMode)||!['A','B','C'].includes(s.condition)||!['comfortable','large','largest'].includes(s.size)||typeof s.screen!=='string'||![10,20,30].includes(s.snooze))throw new Error('Invalid saved preferences');
  for(const k of ['contrast','roomy','gestures','emptyVisits','offline','onboarded'])if(typeof s[k]!=='boolean')throw new Error('Invalid preference');
  const idOK=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(id);
  for(const list of ['medicines','appointments','contacts'])if(!Array.isArray(s[list])||s[list].some(x=>!x||!idOK(x.id))||!unique(s[list]))throw new Error('Invalid record identifiers');
  for(const m of s.medicines){
    if(!textOK(m.name,80)||!validDay(m.startDate)||(m.archivedAt!==null&&!dateOK(m.archivedAt))||(m.generatedThrough!==null&&!validDay(m.generatedThrough))||!validTime(m.time)||!Array.isArray(m.schedule)||!m.schedule.length||!unique(m.schedule)||m.schedule[0].from!==m.startDate)throw new Error('Invalid daily schedule');
    if(m.schedule.some((r,i)=>!idOK(r.id)||!validDay(r.from)||!validTime(r.time)||(i>0&&r.from<=m.schedule[i-1].from)))throw new Error('Invalid schedule revision');
  }
  if(s.contacts.some(c=>!validContact(c))||s.appointments.some(a=>!validAppointment(a)||(a.acknowledgedReminderAt!==null&&!dateOK(a.acknowledgedReminderAt))))throw new Error('Invalid contact or appointment');
  if(!s.occurrences||typeof s.occurrences!=='object'||Array.isArray(s.occurrences))throw new Error('Invalid occurrences');
  for(const [id,o] of Object.entries(s.occurrences)){
    const m=s.medicines.find(m=>m.id===o?.medicineId),revision=m?.schedule.find(r=>r.id===o?.scheduleId);
    if(!o||id!==o.id||id!==o.medicineId+'~'+o.date||!m||!revision||!validDay(o.date)||!validTime(o.time)||!textOK(o.name,80)||!dateOK(o.scheduledAt)||!['pending','taken','postponed'].includes(o.status)||(o.status==='taken'&&!dateOK(o.takenAt))||(o.status==='postponed'&&(!dateOK(o.remindAt)||![10,20,30].includes(o.delay))))throw new Error('Invalid medicine occurrence');
  }
  if(!Array.isArray(s.events)||s.events.some(e=>!e||!['taken','undo','postponed'].includes(e.type)||!s.occurrences[e.occurrenceId]||s.occurrences[e.occurrenceId].medicineId!==e.doseId||typeof e.label!=='string'||e.label.length>300||!dateOK(e.time)))throw new Error('Invalid activity');
  for(const [key,list] of [['selectedMedicineId','medicines'],['selectedAppointmentId','appointments'],['selectedContactId','contacts']])if(s[key]!==null&&!s[list].some(x=>x.id===s[key]))throw new Error('Invalid selected record');
  if(s.selectedOccurrenceId!==null&&!s.occurrences[s.selectedOccurrenceId])throw new Error('Invalid selected occurrence');
  s.recordsMode=recordsMode;s.formError='';ensureOccurrences(s,now);return s;
}

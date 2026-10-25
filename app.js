'use strict';
import { renderScreen } from './participant-screens.js';
import { newResearch, restoreResearch, makeSession, sessionContext, newId } from './research-state.js';
import { BUILD, PREFIX, MEDICINES, VISIT, defaults, restore, snapshot, changeMedicine, validContact, preferences } from './care-state.js';
const isStudio = document.body.dataset.mode === 'studio';
const DATA_KEY = PREFIX + (isStudio ? 'studio' : 'participant');
const STUDY_KEY = PREFIX + 'research';
let storageIssue = '';
let researchBlocked = false;
function readStored(key) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
  catch { if(key===STUDY_KEY)researchBlocked=true; storageIssue = 'Saved data could not be read. Fictional defaults are shown. Changes may last only while this page is open.'; return null; }
}
function writeStored(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { storageIssue = 'This browser cannot save changes. They last only while this page is open.'; showStorageIssue(); return false; }
}
function loadCare(key) {
  const data = readStored(key);
  if (!data) return defaults();
  try { return restore(data); }
  catch { storageIssue = 'Saved prototype data was damaged. Fictional defaults are shown. Use the researcher reset to start over.'; return defaults(); }
}
function showStorageIssue() {
  const notice = document.querySelector('#storage-notice');
  if (notice) { notice.hidden = !storageIssue; notice.textContent = storageIssue; }
}
function saveCare() { writeStored(DATA_KEY, snapshot(state)); showStorageIssue(); }
function loadResearch() {
  researchBlocked=false;
  const r=readStored(STUDY_KEY);
  if(!r)return newResearch();
  try{return restoreResearch(r);}
  catch{researchBlocked=true;storageIssue='Saved study data was damaged. Recording is blocked. Export a raw backup in the studio before explicitly deleting study data.';return newResearch();}
}
let research;
function saveResearch() { return !researchBlocked && writeStored(STUDY_KEY,research); }

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={
 phone:'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4"/>',
 grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
 route:'<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h9a4 4 0 0 1 0 8H8a3 3 0 0 0 0 6h9"/>',
 sliders:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="currentColor" stroke="none"/><circle cx="16" cy="17" r="3" fill="currentColor" stroke="none"/>',
 clipboard:'<path d="M9 4H6a2 2 0 0 0-2 2v14h16V6a2 2 0 0 0-2-2h-3"/><rect x="9" y="2" width="6" height="5" rx="1"/><path d="M8 11h8M8 15h6"/>',
 expand:'<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>',
 reset:'<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
 hand:'<path d="M8 13V5a2 2 0 0 1 4 0v7M12 8a2 2 0 0 1 4 0v5M16 10a2 2 0 0 1 4 0v6a6 6 0 0 1-6 6h-1a7 7 0 0 1-5-2l-5-5a2 2 0 0 1 3-3l2 2"/>',
 bell:'<path d="M5 16v-6a7 7 0 0 1 14 0v6l2 2H3l2-2M10 21h4"/>',
 home:'<path d="m3 11 9-8 9 8M5 10v11h14V10M10 21v-7h4v7"/>',
 pill:'<path d="M4 20a6 6 0 0 1 0-8l8-8a6 6 0 0 1 8 8l-8 8a6 6 0 0 1-8 0ZM8 8l8 8"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v5M17 3v5M3 11h18M7 15h3M14 15h3"/>',
 people:'<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M17 4a4 4 0 0 1 0 8M18 15a6 6 0 0 1 4 6"/>',
 call:'<path d="m5 3 4 1 1 5-3 2a14 14 0 0 0 6 6l2-3 5 1 1 4c-1 6-10 2-15-3S0 4 5 3Z"/>',
 back:'<path d="m14 5-7 7 7 7M7 12h14"/>',
 arrow:'<path d="m9 5 7 7-7 7"/>',
 right:'<path d="M3 12h18m-7-7 7 7-7 7"/>',
 check:'<path d="m5 12 5 5L20 6"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v7l4 2"/>',
 audio:'<path d="M11 4 5 9H2v6h3l6 5V4ZM15 8a6 6 0 0 1 0 8M18 4a11 11 0 0 1 0 16"/>',
 heart:'<path d="M20 5c-3-3-6-1-8 1C10 4 7 2 4 5c-5 5 1 10 8 15 7-5 13-10 8-15Z"/>',
 eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
 shield:'<path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Z"/><path d="m8 12 3 3 5-6"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v.1"/>',
 location:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
 edit:'<path d="m14 4 6 6M3 21l2-7L16 3a3 3 0 0 1 5 5L10 19l-7 2Z"/>',
 plus:'<path d="M12 4v16M4 12h16"/>',
 wifi:'<path d="M2 7a16 16 0 0 1 20 0M5 11a11 11 0 0 1 14 0M8 15a6 6 0 0 1 8 0M12 19h.1M3 3l18 18"/>',
 close:'<path d="m6 6 12 12M6 18 18 6"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>'
};
function icon(name){return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">'+(paths[name]||paths.info)+'</svg>';}
function initIcons(root=document){$$('[data-icon]',root).forEach(n=>n.innerHTML=icon(n.dataset.icon));}
const screens=[
 ['welcome','01','A warm welcome','Start','A calm first impression, with a choice to personalize or begin immediately.','No account wall','The first session starts without registration or typing. Personalization remains available later.','Clear invitation','One primary action. A visible skip route respects an experienced user’s time.'],
 ['comfort','02','Make it comfortable','Start','Choose readable text, contrast, and roomier controls without a disability label.','Live preview','Changes appear immediately. The user stays in control and can reverse any selection.','Combined needs','Text size, contrast and target spacing can be combined. No forced motor-versus-visual mode.'],
 ['gesture','03','A gentle gesture lesson','Start','One simple swipe moves between main sections. Every destination also has a labeled button.','Optional learning','Practice after a demonstration, or skip. There is no gesture-only function.','Safe boundaries','Horizontal gestures are recognized on main-section content, not on actions, forms, or detail screens.'],
 ['home','04','The next useful thing','Daily care','A calm Today screen puts the next pending reminder ahead of a wall of health statistics.','A clear hierarchy','One prominent care card, then the next visit and trusted people. Essential destinations stay in a fixed order.','Recognition over recall','Text labels, familiar symbols and persistent navigation reduce the need to remember paths.'],
 ['meds','05','A readable day plan','Daily care','A short chronological list shows scheduled, postponed, and recorded items with text labels.','Status without guessing','Status is written out and paired with an icon. Colour is secondary.','Shared state','Recording a dose updates Today, the schedule, and the record together. It cannot be logged twice.'],
 ['dose','06','One reminder, one decision','Daily care','A focused reminder separates recording an action from postponing the notification.','Explicit action','“I’ve taken it” records a self-report. Swiping and opening the reminder never record a dose.','No disappearing feedback','A full confirmation screen follows. The record can be corrected later as well as immediately.'],
 ['taken','07','Reassurance, with recovery','Daily care','The recorded item and time remain visible, with a persistent undo route.','Reversible action','Undo changes the record only. It is not an instruction to take another dose.','No pressure','There are no streaks, guilt messages, scores, or timed disappearing controls.'],
 ['snooze','08','Postpone the reminder','Daily care','Large, separated time choices avoid a tiny time picker or precision slider.','One choice at a time','10, 20 or 30 minutes. Going back makes no change.','Clear meaning','Only the reminder is postponed. The prescribed medicine schedule is unchanged.'],
 ['postponed','09','Know what changed','Daily care','The chosen delay and original schedule are shown together after postponing.','State visibility','Confirmation appears in the schedule and Today too. A second postponement replaces the existing reminder.','Persistent correction','“Change reminder” remains available. No action depends on catching a toast message.'],
 ['history','10','A trustworthy record','Daily care','A plain activity record makes recent actions and corrections easy to inspect.','A record, not a score','Show what was recorded and corrected. Do not imply clinical adherence or infer actual ingestion.','Recovery later','The current recorded dose offers correction even after the success screen is closed.'],
 ['visits','11','The next appointment','Visits','Appointments are grouped by upcoming date with an explicit time and clinician name.','Readable dates','Write the weekday and month. Avoid ambiguous numeric dates and tiny calendar grids.','Limited scope','Viewing and reminder acknowledgement are core. Booking and rescheduling are outside this project.'],
 ['visit','12','All visit details together','Visits','Date, time, clinician and location appear in one structured, readable page.','No hidden essentials','The task can be completed without expanding several panels or reading a map.','Acknowledge accurately','Reminder preferences do not change or confirm a booking. Call support if help is needed.'],
 ['visitReminder','13','A useful appointment nudge','Visits','A reminder repeats the key visit details and allows a clear acknowledgement.','Specific feedback','“I’ve seen this” acknowledges the reminder; it does not claim attendance or booking confirmation.','Same details','The reminder and visit page use the same record, preventing conflicting times and locations.'],
 ['people','14','People before numbers','People','Saved contacts are presented with a name and relationship. The first trusted person is easy to locate.','Accessible urgency','Help is visible from the header without a hidden long press, complex gesture, or small floating action.','No accidental dialing','Selecting a contact opens their details. A distinct confirmation comes before the simulated call.'],
 ['contact','15','Recognize the right person','People','A familiar name, relationship, and number support recognition before calling.','Confirmation with context','The next step repeats the name and number before proceeding. Cancel is equally visible.','Trusted contact scope','The prototype stores fictional contact details locally on this browser. It does not monitor or message caregivers.'],
 ['call','16','Confirm before connecting','People','A separate confirmation prevents a mistaken tap from starting a call.','Balanced actions','Call and cancel are both large. A gesture cannot initiate the call.','Prototype boundary','The studio identifies this as a simulation. No phone service or real emergency number is contacted.'],
 ['settings','17','Comfort stays in your hands','Comfort','All accessibility options remain available after onboarding and can be combined.','Manual customization','No automatic layout changes or inferred impairment. Labels explain effects in everyday language.','Stable navigation','Changing text or contrast never changes the order or names of the main sections.'],
 ['missed','18','An unrecorded reminder','Edge states','A neutral state says a dose has not been recorded, without assuming it was missed.','Careful wording','The app distinguishes absence of a record from knowledge about what the person took.','A useful recovery','Offer the record and a trusted contact. The interface gives no catch-up dosing instruction.'],
 ['empty','19','Nothing scheduled','Edge states','An empty appointment list gives a clear explanation and a useful route back.','No dead end','A readable empty state helps the person distinguish “nothing here” from a loading failure.','Predictable action','Demo content can be restored outside the app through the studio; the patient sees only relevant actions.'],
 ['offline','20','Useful without a connection','Edge states','Saved reminders and contact details remain visible in the offline scenario.','Honest status','A short banner states which information is saved. It does not claim a cloud sync succeeded.','No false assurance','The call flow remains a simulation. Real calling and notification reliability need native implementation.'],
 ['editcontact','21','Edit a trusted contact','People','A small form uses large fields, explicit labels, validation and a reviewable save action.','Typing kept rare','Contact entry is a setup task. Day-to-day care does not require typing.','No silent save','Validation errors stay visible. Leaving without saving does not overwrite the existing record.'],
 ['calling','22','A clear call state','People','The selected contact stays visible while the prototype demonstrates an outgoing call.','No false connection','The screen says “Call preview”; it never pretends a person has answered.','Easy exit','A large End preview control returns to the contact. The demonstration does not access a dialer.']
].map(a=>({id:a[0],code:'S'+a[1],title:a[2],group:a[3],summary:a[4],point1:a[5],detail1:a[6],point2:a[7],detail2:a[8]}));
const byId=Object.fromEntries(screens.map(s=>[s.id,s]));
byId.help={id:'help',code:'Help',title:'Help',group:'Comfort',summary:'Optional explanations and trusted people.',point1:'Short main screens',detail1:'Secondary explanations live here.',point2:'Visible support',detail2:'Trusted contacts remain one button away.'};
let state = loadCare(DATA_KEY);
Object.defineProperty(state, 'dose', { get() { return this.doses[this.selectedDose].status; }, set(status) { this.doses[this.selectedDose].status = status; }, configurable:true });
let stack=[],wire=false,atlasWire=false,atlasFilter='All',activeTask=null,studyResults=[],swipeStart=null;
const groupRoot={Start:'home','Daily care':'meds',Visits:'visits',People:'people',Comfort:'home','Edge states':'home'};
function btn(label,action,cls='',ic=''){return '<button class="app-button '+cls+'" data-action="'+action+'">'+(ic?icon(ic):'')+label+'</button>';}
function jump(label,target,cls='',ic=''){return btn(label,'go:'+target,cls,ic);}
function read(text){return '<button class="read-btn" data-speak="'+esc(text)+'">'+icon('audio')+'Read aloud</button>';}
function badge(label,cls='',ic=''){return '<span class="app-badge '+cls+'">'+(ic?icon(ic):'')+label+'</span>';}
function big(ic){return '<div class="big-symbol">'+icon(ic)+'</div>';}
function detail(ic,label,value){return '<div class="detail-row">'+icon(ic)+'<div><small>'+label+'</small><strong>'+value+'</strong></div></div>';}
function taskCard(ic,title,sub,target,variant=''){return '<button class="task-card" data-action="go:'+target+'"><span class="task-icon '+variant+'">'+icon(ic)+'</span><span><strong>'+title+'</strong><small>'+sub+'</small></span>'+icon('arrow')+'</button>';}
function progress(n){return '<div class="app-progress">'+[1,2,3].map(i=>'<i class="'+(i<=n?'active':'')+'"></i>').join('')+'</div>';}
function content(id){return renderScreen(id,state,{esc,icon,btn,jump,badge,detail,taskCard,read,formatTime});}
function formatTime(value){return value?new Date(value).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'Not recorded';}
function appHTML(id){
const s=byId[id],section=id==='home'?'home':groupRoot[s.group];
let left=id==='home'||id==='welcome'?'<span class="mini-brand">saha</span>':'<button class="app-top-btn" data-action="back">'+icon('back')+'Back</button>';
let right='<div class="app-top-right"><button class="app-top-btn" data-action="go:help">'+icon('info')+'Help</button><button class="app-top-btn settings-top" aria-label="Comfort settings" data-action="go:settings">'+icon('sliders')+'Settings</button></div>';
return '<div class="app-top">'+left+right+'</div><div id="screen-content" class="app-body" tabindex="-1">'+content(id)+'<button class="read-btn" data-speak-screen>'+icon('audio')+'Read aloud</button><div id="foreground-reminders" aria-live="polite"></div></div><nav class="app-nav" aria-label="Main app sections">'+[['home','home','Today'],['meds','pill','Medicine'],['visits','calendar','Visits'],['people','people','People']].map(a=>'<button data-action="nav:'+a[0]+'" class="'+(section===a[0]?'active':'')+'" '+(section===a[0]?'aria-current="page"':'')+'>'+icon(a[1])+'<span>'+a[2]+'</span></button>').join('')+'</nav>';
}
function applyPhoneClasses(el,opts={}){
const cls=['phone',opts.mini?'mini-device':'',wire&&!opts.mini||opts.mini&&atlasWire?'wireframe':'',state.condition==='A'&&!opts.mini?'baseline':'',(opts.mini||state.condition!=='A')&&state.size==='large'?'large-text':(opts.mini||state.condition!=='A')&&state.size==='largest'?'largest-text':'',(opts.mini||state.condition!=='A')&&state.contrast?'high-contrast':'',(opts.mini||state.condition!=='A')&&state.roomy?'roomy':''].filter(Boolean).join(' ');
el.className=cls;
}
function render(focus=false){
  if (!byId[state.screen]) state.screen='home';
  applyPhoneClasses($('#phone')); $('#app').innerHTML=appHTML(state.screen);
  if(isStudio){
    const s=byId[state.screen];$('#screen-code').textContent=s.code;$('#screen-title').textContent=s.title;
    $('#condition-label').textContent={A:'Conventional baseline',B:'Accessible · buttons',C:'Accessible + gestures'}[state.condition];
    $('#annotation-code').textContent=s.code.slice(1)+' / 22';$('#note-title').textContent=s.title;$('#note-summary').textContent=s.summary;
    $('#note-details').innerHTML='<div class="note-block"><h3>'+s.point1+'</h3><p>'+s.detail1+'</p></div><div class="note-block"><h3>'+s.point2+'</h3><p>'+s.detail2+'</p></div>';
    $('#condition').value=state.condition;
    $('#gesture-state').textContent=state.condition==='C'&&state.gestures?'Optional swipes enabled on main sections.':'Use the visible section buttons.';
    $$('.screen-jump').forEach(b=>b.classList.toggle('active',b.dataset.target===state.screen));
  }
  $('#app').classList.toggle('no-motion',window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (activeTask) $$('#app [data-pref]:not([data-pref="visitReminder"]), #app [data-action^="size:"], #app [data-action="tryGesture"], #app [data-action="preferButtons"]').forEach(el=>el.disabled=true);
  document.title='Saha — '+byId[state.screen].title+(isStudio?' · Studio':'');
  if(focus) $('#app .app-body').focus({preventScroll:true});
  updateForegroundReminders();
  saveCare();
}
function updateForegroundReminders(){
  const region=$('#app #foreground-reminders');if(!region)return;
  const due=MEDICINES.filter(m=>state.doses[m.id].status==='postponed'&&Date.parse(state.doses[m.id].remindAt)<=Date.now());
  const html=due.map(m=>'<div class="app-note">'+m.name+' reminder is ready. Original schedule: '+m.time+'.'+btn('Review '+m.name+' reminder','medicine:'+m.id,'secondary','bell')+'</div>').join('');
  if(region.innerHTML!==html)region.innerHTML=html;
}
function go(id,source='button',replace=false){
if(!byId[id])return;
if(!replace&&state.screen!==id)stack.push(state.screen);
$('#toast').classList.remove('visible');state.screen=id;if(id==='home')state.onboarded=true;state.saved=false;state.formError='';state.contactDraft=null;
log('navigation',{to:id,source});render(true);checkTask(id);
}
function goBack(){let next=stack.pop();if(!next||next===state.screen)next=groupRoot[byId[state.screen].group]||'home';if(next===state.screen)next='home';state.screen=next;log('back',{to:next});state.formError='';state.contactDraft=null;render(true);}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');}
function log(type,data={}){
  research=loadResearch();if(researchBlocked)return;
  if(!isStudio && research.active?.phase==='running' && (type==='navigation'||type==='back')){const method=data.source==='swipe'?'swipes':'buttons';research.active.navigation[method]++;}
  const taskConfig=research.active?.config||preferences(state),condition=research.active?.condition||state.condition;
  research.events.push({...sessionContext(research),runId:research.active?.runId||null,task:research.active?.taskId||null,taskPhase:research.active?.phase||null,time:new Date().toISOString(),build:BUILD,route:isStudio?'studio':'participant',condition,config:taskConfig,gesturesEnabled:condition==='C'&&taskConfig.gestures,screen:state.screen,type,...data});
  saveResearch();
}
function speak(text){
  try {
    if(!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) throw new Error();
    window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-GB';u.rate=.86;
    u.onerror=()=>toast('Read aloud could not play. All information remains visible.');
    window.speechSynthesis.speak(u);log('read_aloud');
  } catch {toast('Read aloud is unavailable in this browser. All information remains visible.');}
}
function setView(view){if(!['prototype','atlas','flows','system','study'].includes(view))view='prototype';state.view=view;$$('.studio-view').forEach(n=>n.hidden=n.id!=='view-'+view);$$('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));if(view==='atlas')renderAtlas();if(view==='study')renderStudy();history.replaceState(null,'','#'+view);window.scrollTo({top:0,behavior:'instant'});}
function resetDemo(){
  const kept={condition:state.condition,...preferences(state)};
  Object.assign(state,defaults(),kept,{screen:'home'});stack=[];render();
}
function handle(action,el){
let [a,v]=action.split(':');
if(a==='go'){go(v);return;}if(a==='nav'){stack=[];go(v,'button',true);return;}
if(a==='back'){goBack();return;}
if(activeTask&&['size','preferButtons','tryGesture'].includes(a))return;
if(a==='size'){state.size=v;log('preference',{key:'size',value:v});render();$('#app [data-action="size:'+v+'"]')?.focus({preventScroll:true});return;}
if(a==='medicine'||a==='reminder'){if(!['A','B'].includes(v))return;state.selectedDose=v;go(state.dose==='taken'?'history':a==='reminder'?'postponed':'dose');return;}
if(a==='take'){if(changeMedicine(state,'taken')){log('taken',{doseId:state.selectedDose});go('taken');}return;}
if(a==='correct'){state.selectedDose=v;handle('undo');return;}
if(a==='undo'){if(changeMedicine(state,'undo')){log('undo',{doseId:state.selectedDose});go('history');toast('Record corrected.');}return;}
if(a==='snooze'){if(changeMedicine(state,'postponed',Number(v))){log('postponed',{doseId:state.selectedDose,delay:Number(v)});go('postponed');}return;}
if(a==='person'){state.selectedContact=Number(v);go('contact');return;}
if(a==='endCall'){log('call_preview_ended');go('contact');return;}
if(a==='seen'){state.visitSeen=true;log('visit_reminder_acknowledged');go('visit');return;}
if(a==='savePrefs'){log('preferences_saved');go('home');return;}
if(a==='preferButtons'){state.gestures=false;log('gesture_preference',{enabled:false});go('home');return;}
if(a==='tryGesture'){if(activeTask&&state.condition!=='C'){toast('Gesture practice is available in configuration C.');return;}if(state.condition!=='C')return;state.gestures=true;go('home');toast('Swipe left across the main screen to open Medicine. Buttons work too.');return;}
}
document.addEventListener('click',e=>{
const action=e.target.closest('[data-action]');if(action&&$('#app').contains(action)){handle(action.dataset.action,action);return;}
if(e.target.closest('[data-speak-screen]')){speak($('#app .app-body').innerText.replace(/Read aloud\s*$/,''));return;}
const voice=e.target.closest('[data-speak]');if(voice){speak(voice.dataset.speak);return;}
const target=e.target.closest('[data-target]');if(target){openStudioScreen(target.dataset.target);return;}
const view=e.target.closest('[data-view]');if(view){setView(view.dataset.view);return;}
const filter=e.target.closest('[data-filter]');if(filter){atlasFilter=filter.dataset.filter;renderAtlas();return;}
const start=e.target.closest('[data-start-task]');if(start){startTask(start.dataset.startTask);return;}
const result=e.target.closest('[data-task-result]');if(result){finishTask(result.dataset.taskResult);return;}
const scenario=e.target.closest('[data-scenario]');if(scenario){applyScenario(scenario.dataset.scenario);return;}
});
document.addEventListener('change',e=>{const key=e.target.dataset.pref;if(!['contrast','roomy','gestures','visitReminder'].includes(key)||(activeTask&&key!=='visitReminder'))return;state[key]=e.target.checked;log('preference',{key,value:state[key]});render();$('#app [data-pref="'+key+'"]')?.focus({preventScroll:false});});
document.addEventListener('submit',e=>{
  if(e.target.id!=='contact-form')return;e.preventDefault();
  const f=new FormData(e.target),draft={name:String(f.get('name')).trim(),relation:String(f.get('relation')).trim(),number:String(f.get('number')).trim()};
  if(!validContact(draft)){
    state.contactDraft=draft;state.formError='Enter a name, relationship and phone number (7 to 15 digits). Use digits, spaces, (), - or a starting +.';
    render();const invalid=!draft.name?'name':!draft.relation?'relation':'number';
    const field=$('#contact-'+invalid);field.setAttribute('aria-invalid','true');field.setAttribute('aria-describedby','form-error');field.focus();return;
  }
  state[state.selectedContact===1?'otherContact':'contact']=draft;log('contact_saved');go('contact');
});
if(isStudio){
$('#condition').addEventListener('change',e=>{if(activeTask){toast('Finish or stop the current task before changing condition.');e.target.value=state.condition;return;}state.condition=e.target.value;log('condition_changed');stack=[];render();});
$('#polished-btn').onclick=()=>setWire(false);$('#wire-btn').onclick=()=>setWire(true);
function setWire(value){wire=value;$('#polished-btn').classList.toggle('active',!wire);$('#polished-btn').setAttribute('aria-pressed',!wire);$('#wire-btn').classList.toggle('active',wire);$('#wire-btn').setAttribute('aria-pressed',wire);render();}
$('#reset-btn').onclick=()=>{setView('study');toast('Use the reviewed reset controls below. Participant replacement is separate from studio scenarios.');};
$('#show-reminder').onclick=()=>{if(state.dose==='taken'){toast('This dose is already recorded. Reset the demo to try a fresh reminder.');go('history');}else go('dose','studio');};
$('#present-btn').onclick=()=>{document.body.classList.add('focus-mode');setView('prototype');let exit=document.createElement('button');exit.className='outline-btn exit-focus';exit.id='exit-focus';exit.textContent='Exit app focus';exit.onclick=()=>{document.body.classList.remove('focus-mode');exit.remove();};document.body.append(exit);};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('focus-mode'))$('#exit-focus')?.click();});
}
$('#app').addEventListener('pointerdown',e=>{
  swipeStart=null;
  if(!e.isPrimary || e.button!==0 || e.target.closest('button,input,select,a,label') || !e.target.closest('.app-body') || state.condition!=='C'||!state.gestures||!['home','meds','visits','people'].includes(state.screen))return;
  swipeStart={x:e.clientX,y:e.clientY,id:e.pointerId,screen:state.screen};$('#app').setPointerCapture(e.pointerId);
});
$('#app').addEventListener('pointercancel',()=>swipeStart=null);
$('#app').addEventListener('pointermove',e=>{if(swipeStart && (Math.abs(e.clientY-swipeStart.y)>24 && Math.abs(e.clientY-swipeStart.y)>Math.abs(e.clientX-swipeStart.x)))swipeStart=null;});
$('#app').addEventListener('pointerup',e=>{
  if(!swipeStart)return;const start=swipeStart;swipeStart=null;
  if(start.id!==e.pointerId||start.screen!==state.screen)return;
  const dx=e.clientX-start.x,dy=e.clientY-start.y;
  if(state.condition!=='C'||!state.gestures||Math.abs(dx)<65||Math.abs(dx)<Math.abs(dy)*1.7)return;
  const roots=['home','meds','visits','people'],idx=roots.indexOf(state.screen),next=idx+(dx<0?1:-1);
  if(idx<0||next<0||next>=roots.length)return;stack=[];go(roots[next],'swipe',true);
});
function openStudioScreen(id){
  if(activeTask){toast('Use the participant window during a timed task.');return;}
  if(id==='taken')changeMedicine(state,'taken');
  if(id==='postponed'){if(state.dose==='taken')changeMedicine(state,'undo');changeMedicine(state,'postponed',10);}
  if(id==='missed'&&state.dose==='taken')changeMedicine(state,'undo');
  state.emptyVisits=id==='empty';state.offline=id==='offline';go(id,'studio');setView('prototype');
}
function renderNavigator(){const selected=['welcome','comfort','gesture','home','meds','dose','taken','snooze','visits','visit','people','settings'];let last='';$('#screen-list').innerHTML=selected.map(id=>{const s=byId[id],label=s.group!==last?'<div class="screen-group-label">'+s.group+'</div>':'';last=s.group;return label+'<button class="screen-jump '+(state.screen===id?'active':'')+'" data-target="'+id+'"><span class="jump-num">'+s.code.slice(1)+'</span>'+({welcome:'Welcome',comfort:'Comfort setup',gesture:'Gesture practice',home:'Today',meds:'Medicine schedule',dose:'Reminder',taken:'Recorded & undo',snooze:'Remind me later',visits:'Upcoming visits',visit:'Visit details',people:'Trusted people',settings:'Comfort settings'}[id])+'</button>';}).join('');}
function renderAtlas(){
$('#atlas-filters').innerHTML=['All','Start','Daily care','Visits','People','Comfort','Edge states'].map(g=>'<button data-filter="'+g+'" class="'+(atlasFilter===g?'active':'')+'">'+g+'</button>').join('');
$('#atlas-wire-btn').textContent=atlasWire?'Show visual designs':'Show wireframes';
const original={doses:structuredClone(state.doses),selectedDose:state.selectedDose,events:state.events,emptyVisits:state.emptyVisits,offline:state.offline};state.emptyVisits=false;state.offline=false;state.selectedDose='A';
$('#atlas-grid').innerHTML=screens.filter(s=>atlasFilter==='All'||s.group===atlasFilter).map(s=>{
state.doses=defaults().doses;
if(['taken','history'].includes(s.id))state.doses.A={status:'taken',takenAt:'2026-10-25T04:02:00Z'};
if(s.id==='postponed')state.doses.A={status:'postponed',delay:10,remindAt:'2026-10-25T04:10:00Z'};
state.events=s.id==='history'?[{type:'taken',doseId:'A',label:'Medicine A marked taken',time:'2026-10-25T04:02:00Z'}]:[];
return '<article class="atlas-card"><div class="atlas-card-title">'+s.title+'<span>'+s.code+'</span></div><div class="mini-device-wrap" inert aria-hidden="true"><div class="phone mini-device '+(atlasWire?'wireframe':'')+'"><div class="phone-status"><span>9:00</span><div class="phone-island"></div><span>● ▰</span></div><div class="app-shell">'+appHTML(s.id).replace(/id="/g,'id="atlas-'+s.id+'-').replace(/for="/g,'for="atlas-'+s.id+'-')+'</div><div class="home-indicator"></div></div></div><p>'+s.summary+'</p><button class="atlas-open" data-target="'+s.id+'">Open interactive screen '+icon('right')+'</button></article>';
}).join('');
Object.assign(state,original);
}
if(isStudio)$('#atlas-wire-btn').onclick=()=>{atlasWire=!atlasWire;renderAtlas();};
function flowStep(id,label){return '<div class="flow-step"><button data-target="'+id+'"><small>'+byId[id].code+'</small>'+label+'</button><span class="flow-arrow" aria-hidden="true">→</span></div>';}
function flowCard(title,desc,steps,branch){return '<article class="content-card"><h3>'+title+'</h3><p>'+desc+'</p><div class="flow-track">'+steps.map(a=>flowStep(...a)).join('')+'</div><div class="branch-note">'+branch+'</div></article>';}
function renderFlows(){$('#flow-content').innerHTML=
flowCard('01 / First use, at their own pace','Manual preferences are explained through their effect, not through a medical label.',[['welcome','Welcome'],['comfort','Choose comfort'],['gesture','Practice or skip'],['home','Today']],'Recovery: setup can be skipped and revisited in Comfort settings. Changing one setting does not reset other choices.')+
flowCard('02 / Record a scheduled dose','One item is presented at a time. Recording is explicit, and the result remains reversible.',[['home','Open reminder'],['dose','Review Medicine A'],['taken','Record taken'],['history','Review record']],'Recovery: Undo from the confirmation or record page returns the item to Not recorded. Reopening an already recorded item cannot create a duplicate.')+
flowCard('03 / Postpone a reminder','A delay changes notification timing, not the medicine’s prescribed schedule.',[['dose','Remind me later'],['snooze','Choose delay'],['postponed','See new reminder'],['home','Return to Today']],'Recovery: Back before choosing preserves the existing reminder. Change reminder replaces the previous delay; the original schedule is always visible.')+
flowCard('04 / Find an appointment','Date, time, clinician, and room are readable without a calendar gesture or an expanded panel.',[['home','Your next visit'],['visits','Upcoming list'],['visit','Read visit details'],['people','Ask for support']],'Alternative entry: an appointment reminder opens the same visit record. “I’ve seen this” acknowledges the reminder without confirming or changing the booking.')+
flowCard('05 / Reach a trusted person','A contact is reviewed before a distinct call confirmation, with a large cancel action.',[['people','Choose a person'],['contact','Review contact'],['call','Confirm or cancel'],['calling','Call preview']],'Recovery: Cancel returns to the contact without dialing. End preview returns to the contact. Swipe navigation cannot cross into the call confirmation.')+
'<article class="content-card"><h3>State transition specification</h3><p>Each action has one state change. These rules are shared by all three study configurations.</p><table class="spec-table"><thead><tr><th>STATE</th><th>EVENT</th><th>NEXT STATE / FEEDBACK</th></tr></thead><tbody><tr><td>Not recorded</td><td>I’ve taken it</td><td>Recorded, timestamp shown, correction available</td></tr><tr><td>Not recorded / postponed</td><td>Choose delay</td><td>One postponed reminder; scheduled time unchanged</td></tr><tr><td>Recorded</td><td>Undo / correct record</td><td>Not recorded; correction added to activity record</td></tr><tr><td>Recorded</td><td>Open reminder again</td><td>Already recorded; recording action unavailable</td></tr><tr><td>Visit reminder</td><td>I’ve seen this</td><td>Acknowledged; visit details unchanged</td></tr><tr><td>Contact details</td><td>Call</td><td>Call confirmation; no dialing yet</td></tr><tr><td>Call confirmation</td><td>Cancel / back</td><td>Contact details; no call action</td></tr><tr><td>Form with invalid data</td><td>Save</td><td>Stay on form; visible error; existing contact unchanged</td></tr><tr><td>Main section in C</td><td>Horizontal swipe</td><td>Adjacent main section; no data mutation</td></tr></tbody></table></article>';}
function renderSystem(){$('#system-content').innerHTML=
'<div class="spec-grid"><article class="content-card"><span class="spec-label">01 / THE CENTRAL IDEA</span><h3>The next useful thing.</h3><p>Today is a short action hub. It gives visual priority to the pending reminder, then the next visit and trusted people. Health charts, shopping, symptom checkers, and general wellness feeds do not compete with the core task.</p><ul class="principle-list"><li><strong>One thing at a time</strong>Medication decisions have their own screen.</li><li><strong>Same places, every time</strong>Today → Medicine → Visits → People stays fixed.</li><li><strong>Comfort is personal</strong>Text, contrast and spacing can be combined.</li></ul></article>'+
'<article class="content-card"><span class="spec-label">02 / VISUAL LANGUAGE</span><h3>Warm, clear, grown-up.</h3><p>Forest green establishes trust without a clinical dashboard. Warm off-white lowers visual clutter. Ochre marks attention gently. Patient-facing type uses a familiar system sans serif.</p><div class="swatches"><div class="swatch" style="background:#193e36;color:#fff">#193E36</div><div class="swatch" style="background:#e6eee2;color:#193e36">#E6EEE2</div><div class="swatch" style="background:#f5e4bd;color:#6e4815">#F5E4BD</div></div><p>Essential text uses dark foregrounds. Status always includes words and a symbol. The studio’s small editorial labels are outside the patient interface.</p></article></div>'+
'<article class="content-card" style="margin-top:22px"><h3>The interface contract</h3><table class="spec-table"><thead><tr><th>ELEMENT</th><th>SPECIFICATION</th><th>REASON</th></tr></thead><tbody><tr><td>Patient text</td><td>19 px default; 22 px and 25 px options, relative sizing for labels</td><td>Visible hierarchy and user-controlled enlargement; scroll rather than clipping</td></tr><tr><td>Primary actions</td><td>56 px minimum height; 66 px with roomier controls</td><td>Less precision required; substantial space between actions</td></tr><tr><td>Top controls</td><td>44 px minimum height, labeled Back and Help</td><td>Stable, reachable escape and support routes</td></tr><tr><td>Navigation</td><td>Four fixed labeled sections, single level</td><td>Recognition and predictable section order</td></tr><tr><td>Confirmation</td><td>Full persistent result; correction route in record</td><td>No reliance on a fleeting toast</td></tr><tr><td>Gesture rule</td><td>Left/right only on main-section content; buttons remain</td><td>A shortcut that does not become a requirement</td></tr><tr><td>Read aloud</td><td>Explicit Read aloud control; no autoplay</td><td>Support without forcing audio or assuming privacy</td></tr><tr><td>Motor support</td><td>Separated actions, rare typing, no long press or drag requirement</td><td>Reduce dependence on fine dexterity</td></tr><tr><td>Contrast</td><td>Dark text, strong-contrast option; no colour-only states</td><td>Legible content across visual preferences</td></tr><tr><td>Motion</td><td>No decorative loops; respects reduced-motion preference</td><td>A stable experience without attention competition</td></tr></tbody></table><p>These are design targets, not a claim of WCAG conformance or validated usability. Verify computed contrast, text reflow, focus, and real-device touch use before the participant study.</p></article>'+
'<article class="content-card"><h3>Study versions, without three separate apps</h3><table class="spec-table"><thead><tr><th>A / CONVENTIONAL</th><th>B / ACCESSIBLE BUTTONS</th><th>C / OPTIONAL GESTURES</th></tr></thead><tbody><tr><td>16 px base text<br>44 px primary action height<br>Conventional visual density<br>Buttons for navigation</td><td>19–25 px chosen text<br>56–66 px primary actions<br>Generous grouping and contrast<br>Buttons for navigation</td><td>Exactly B’s chosen settings<br>Exactly B’s content and controls<br>Optional main-section swipes<br>No gesture-only action</td></tr></tbody></table><p>A versus B evaluates the accessible package. B versus C evaluates gesture availability. Keep B and C preferences identical and distribute condition order. This baseline currently shares the navigation structure, so it does not isolate navigation simplification as a separate factor.</p></article>'+
'<article class="content-card"><h3>What we borrowed, and what we changed</h3><p>Official product documentation informed interaction patterns. The screens are original designs for this project, not reproductions or endorsements.</p><div class="references"><a class="reference" target="_blank" rel="noopener" href="https://support.apple.com/en-ie/105064"><strong>Apple Health</strong><p>Clear medication reminders, dose logging, and access to a record. Saha reduces the journey to one readable decision.</p><span>Medication documentation ↗</span></a><a class="reference" target="_blank" rel="noopener" href="https://medisafe.com/download-the-app"><strong>Medisafe</strong><p>Trusted-person support as a companion to independence. Saha keeps this to saved contacts; no monitoring or sharing is implemented.</p><span>Official app overview ↗</span></a><a class="reference" target="_blank" rel="noopener" href="https://www.mychart.org/l/en-us/explore/"><strong>MyChart</strong><p>Structured upcoming visits and visit details. Saha leaves out booking, records integration, billing and clinical messaging.</p><span>Official feature overview ↗</span></a></div></article>'+
'<article class="content-card"><h3>Build scope & honest boundaries</h3><table class="spec-table"><thead><tr><th>WORKS IN THIS PROTOTYPE</th><th>REQUIRES LATER IMPLEMENTATION</th></tr></thead><tbody><tr><td>Screen flows and actual state changes<br>Taken, postpone and correction records<br>Visit details and acknowledgement<br>Contact review, edit and validation<br>Text, contrast, spacing, optional swipe<br>Browser-supported read aloud<br>Local study events and CSV export</td><td>Reliable scheduled system notifications<br>Native calling and emergency integration<br>Authentication and real health records<br>Caregiver invitations and shared access<br>Encrypted durable storage and sync<br>Clinically verified medicine schedules<br>Validated translations and localization</td></tr></tbody></table><p>Fictional care state and preferences are stored locally in namespaced browser storage. Studio scenarios are separate from participant care data. Study tasks run in the participant window. Exports include build and selected settings. The offline screen is a scenario, not a tested offline-installable app. No automatic adaptation, diagnoses, or treatment decisions are included.</p></article>';}
const tasks=[
{id:'dose',title:'Record taken',instruction:'The scenario says you have already taken Medicine A, scheduled for 9:00 am. Record this in Saha.',start:'home',end:'taken'},
{id:'later',title:'Postpone reminder',instruction:'Set the Medicine A reminder for 20 minutes from now. Do not record it as taken.',start:'dose',end:'postponed'},
{id:'visit',title:'Find appointment details',instruction:'Find the next appointment. Tell me its full date, time, location and room.',start:'home',end:'visit',manual:true},
{id:'contact',title:'Find call confirmation',instruction:'Find Nida and reach the screen where you can confirm or cancel a call. Do not start the preview.',start:'home',end:'call'},
{id:'home',title:'Return to Today',instruction:'You are viewing appointment details. Return to Today.',start:'visit',end:'home'}
];
let pendingTaskId=null, exportSessionId=null;
function currentSession(){return research.sessions.find(s=>s.id===research.currentSessionId);}
function renderStudy(){
  research=loadResearch();studyResults=research.results;
  activeTask=research.active?{...research.active,task:tasks.find(t=>t.id===research.active.taskId)}:null;
  const session=currentSession(),a=research.active;
  if(!exportSessionId)exportSessionId=research.currentSessionId||'__unassigned';
  const warning=researchBlocked?'<div class="review-warning" role="alert">Study recording is blocked because saved data could not be read. Export the raw backup before using the reviewed delete controls.</div>':'';
  const active=a?'<article class="study-active"><h3>'+esc(tasks.find(t=>t.id===a.taskId).title)+'</h3><p>'+esc(tasks.find(t=>t.id===a.taskId).instruction)+'</p><p>Participant '+esc(a.participantCode)+' / '+a.condition+' / '+a.phase+'</p>'+
    (a.phase==='ready'?'<p>Scenario prepared. Read the instruction, then start the timer and say Begin.</p><button class="study-button" id="begin-timer">Start timer</button>':a.phase==='running'?'<p>Timer running. Assess comprehension separately from navigation.</p><button class="study-button" id="stop-timer">Stop timer and review</button>':'<p>Timer stopped. '+(a.destinationReached?'Interface destination reached. Verify the task outcome.':'Researcher stopped the attempt.')+'</p>')+
    '<div class="study-actions">'+(a.phase!=='ready'?'<button class="study-button" data-task-result="completed">Save unassisted completion</button><button class="study-button secondary" data-task-result="assisted">Save assisted completion</button>':'')+'<button class="study-button secondary" data-task-result="failed">Save failed / stopped attempt</button><button class="study-button secondary" id="help-event">Help +1</button><button class="study-button secondary" id="error-event">Error +1</button><button class="study-button secondary" id="open-participant">Open participant window</button></div></article>':'';
  const pending=pendingTaskId?'<div class="review-warning"><h3>Replace participant scenario?</h3><p>This replaces saved medicines, contacts, acknowledgement and screen at /. The session?s frozen comfort settings will be applied. Earlier study results and events are kept. Timer will remain stopped until you press Start timer.</p><button class="study-button" id="confirm-prepare">Replace scenario and prepare task</button><button class="study-button secondary" id="cancel-prepare">Cancel replacement</button></div>':'';
  $('#study-content').innerHTML=warning+active+
    '<article class="content-card"><h3>Participant session</h3><p>Use a participant code, never a name. Set comfort choices in the prototype before creating the session. New sessions keep all earlier results. Settings are frozen for every task in this session, including matched B/C trials.</p>'+
    (session?'<p><strong>Current: '+esc(session.participantCode)+'</strong> / order '+esc(session.conditionOrder)+' / session '+esc(session.id)+'</p><p>Frozen settings: '+esc(JSON.stringify(session.config))+'</p>':'<p>No coded session selected. Earlier unassigned records remain available for export.</p>')+
    '<form id="session-form" class="research-form"><label>Participant code<input name="participantCode" id="participant-code" maxlength="20" required placeholder="P01"></label><label>Condition order<select name="conditionOrder" id="condition-order">'+['ABC','ACB','BAC','BCA','CAB','CBA'].map(o=>'<option>'+o+'</option>').join('')+'</select></label><button class="study-button" '+(a||researchBlocked?'disabled':'')+'>Create new coded session</button></form><p id="session-error" role="alert"></p></article>'+
    '<div class="study-metrics"><div class="metric"><span>All saved attempts</span><strong>'+studyResults.length+'</strong></div><div class="metric"><span>Current session attempts</span><strong>'+studyResults.filter(r=>r.sessionId===research.currentSessionId).length+'</strong></div><div class="metric"><span>Build</span><strong style="font:14px var(--sans)">'+BUILD+'</strong></div></div>'+
    '<article class="content-card"><h3>Prepare, instruct, then time</h3><p>Select A/B/C in the prototype outside an active task. Prepare explicitly replaces the participant scenario. Only the separate / window is shown to the participant. Automatic stopping captures interface arrival for four tasks; researcher assessment is still required. Appointment timing stops manually after the spoken answer. Record errors/help here and notes in the observation sheet.</p>'+pending+tasks.map(t=>'<div class="study-task"><div><strong>'+esc(t.title)+'</strong><p>'+esc(t.instruction)+'</p></div><button class="study-button" data-start-task="'+t.id+'" '+(a||!session||researchBlocked?'disabled':'')+'>Prepare task</button></div>').join('')+'</article>'+
    '<article class="content-card"><h3>Studio scenarios</h3><p>These replace the studio preview only, preserving participant care and all study results.</p><div class="study-actions">'+[['pending','Fresh reminder'],['missed','Not recorded'],['visitReminder','Visit reminder'],['empty','Empty visits'],['offline','Offline design scenario']].map(([id,label])=>'<button class="study-button secondary" data-scenario="'+id+'">'+label+'</button>').join('')+'</div></article>'+
    '<article class="content-card"><h3>Export and retain sessions</h3><label for="export-session">Session to export</label><select id="export-session"><option value="__unassigned">Unassigned events</option>'+research.sessions.map(s=>'<option value="'+esc(s.id)+'" '+(s.id===exportSessionId?'selected':'')+'>'+esc(s.participantCode)+' / '+esc(s.id)+'</option>').join('')+'</select><div class="study-actions"><button class="study-button" id="export-results">Export session task CSV</button><button class="study-button secondary" id="export-events">Export session event JSON</button><button class="study-button secondary" id="export-all">Export all sessions JSON</button><button class="study-button secondary" id="export-raw">Export raw saved backup</button></div><p>Exports include session/participant code, order, build, condition, selected settings and effective gesture availability. CSV keeps assisted and failed attempts. Downloads are not automatically imported or synchronized.</p>'+
    (studyResults.length?'<table class="spec-table"><thead><tr><th>CODE / CONDITION</th><th>TASK</th><th>SECONDS</th><th>OUTCOME</th></tr></thead><tbody>'+studyResults.map(r=>'<tr><td>'+esc(r.participantCode||'UNASSIGNED')+' / '+r.condition+'</td><td>'+esc(r.task)+'</td><td>'+r.seconds.toFixed(1)+'</td><td>'+r.result+'</td></tr>').join('')+'</tbody></table>':'<p>No saved attempts.</p>')+'</article>'+resetControls();
  $('#session-form').onsubmit=e=>{
    e.preventDefault();research=loadResearch();if(researchBlocked||research.active)return;
    const f=new FormData(e.target);
    try{const session=makeSession(String(f.get('participantCode')).trim(),String(f.get('conditionOrder')),preferences(state));research.sessions.push(session);research.currentSessionId=session.id;if(!saveResearch())return;exportSessionId=session.id;log('session_created');renderStudy();}
    catch(error){$('#session-error').textContent=error.message;$('#participant-code').focus();}
  };
  $('#export-session').value=exportSessionId;
  $('#export-session').onchange=e=>exportSessionId=e.target.value;
  $('#export-results').onclick=exportCSV;
  $('#export-events').onclick=()=>{const data=selectedExport();download(exportName(data.session,'events.json'),JSON.stringify(data,null,2),'application/json');};
  $('#export-all').onclick=()=>download('saha-all-sessions-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json',JSON.stringify(loadResearch(),null,2),'application/json');
  $('#export-raw').onclick=()=>{try{download('saha-raw-research-backup.json',localStorage.getItem(STUDY_KEY)||'null','application/json');}catch{toast('Browser storage could not be read.');}};
  if(researchBlocked)for(const id of ['export-results','export-events','export-all'])$('#'+id).disabled=true;
  if($('#begin-timer'))$('#begin-timer').onclick=beginTimer;
  if($('#stop-timer'))$('#stop-timer').onclick=stopTimer;
  if($('#help-event'))$('#help-event').onclick=()=>observe('help');
  if($('#error-event'))$('#error-event').onclick=()=>observe('errors');
  if($('#open-participant'))$('#open-participant').onclick=openParticipant;
  if($('#confirm-prepare'))$('#confirm-prepare').onclick=prepareTask;
  if($('#cancel-prepare'))$('#cancel-prepare').onclick=()=>{pendingTaskId=null;renderStudy();};
  bindReset();showStorageIssue();
}
function openParticipant(){const win=window.open('/','saha-participant');if(!win)toast('Open '+location.origin+'/ in a separate participant window.');}
function startTask(id){research=loadResearch();if(researchBlocked||research.active||!currentSession())return;pendingTaskId=id;renderStudy();$('#confirm-prepare').focus();}
function prepareTask(){
  research=loadResearch();const session=currentSession(),task=tasks.find(t=>t.id===pendingTaskId);if(researchBlocked||research.active||!session||!task)return;
  const participant={...defaults(),...session.config,condition:state.condition,screen:task.start,onboarded:true};
  if(!writeStored(PREFIX+'participant',snapshot(participant)))return;
  research.active={...sessionContext(research),runId:newId(),taskId:task.id,condition:state.condition,config:{...session.config},build:BUILD,start:null,preparedAt:new Date().toISOString(),phase:'ready',help:0,errors:0,navigation:{buttons:0,swipes:0}};
  if(!saveResearch())return;activeTask={...research.active,task};pendingTaskId=null;log('task_prepared');renderStudy();openParticipant();
}
function beginTimer(){research=loadResearch();if(researchBlocked||research.active?.phase!=='ready')return;research.active.start=Date.now();research.active.phase='running';saveResearch();log('task_start');renderStudy();}
function stopTimer(){research=loadResearch();if(researchBlocked||research.active?.phase!=='running')return;research.active.stoppedAt=Date.now();research.active.phase='review';saveResearch();log('task_timer_stopped');renderStudy();}
function observe(key){research=loadResearch();if(!research.active||researchBlocked)return;research.active[key]++;saveResearch();log('observed_'+key);renderStudy();}
function checkTask(id){
  research=loadResearch();const a=research.active;if(isStudio||researchBlocked||a?.phase!=='running')return;
  const task=tasks.find(t=>t.id===a.taskId);if(!task||task.manual||task.end!==id)return;
  const valid=task.id==='dose'?state.doses.A.status==='taken':task.id==='later'?state.doses.A.delay===20&&state.doses.A.status==='postponed':task.id==='contact'?state.selectedContact===0:true;
  if(!valid){log('task_destination_incorrect');return;}
  a.phase='review';a.stoppedAt=Date.now();a.destinationReached=true;saveResearch();log('task_destination_reached');
}
function finishTask(result){
  research=loadResearch();const a=research.active;if(!a||researchBlocked)return;
  if(result==='completed'&&a.help>0)result='assisted';
  if(a.start===null&&result!=='failed')return;
  const stoppedAt=a.stoppedAt||Date.now();
  const r={...sessionContext(research),sessionId:a.sessionId,participantCode:a.participantCode,conditionOrder:a.conditionOrder,runId:a.runId,task:a.taskId,condition:a.condition,config:a.config,gesturesEnabled:a.condition==='C'&&a.config.gestures,build:a.build,startedAt:a.start===null?null:new Date(a.start).toISOString(),seconds:a.start===null?0:(stoppedAt-a.start)/1000,result,help:a.help,errors:a.errors,navigation:a.navigation,navigationMethod:a.navigation.swipes?(a.navigation.buttons?'mixed':'swipes'):(a.navigation.buttons?'buttons':'none'),destinationReached:Boolean(a.destinationReached),notStarted:a.start===null};
  research.results.push(r);research.active=null;if(!saveResearch())return;activeTask=null;log('task_finish',r);
  if(isStudio){renderStudy();toast('Attempt saved: '+result);}else render();
}
function resetControls(){return '<article class="content-card"><h3>Reviewed deletion</h3><p>Export each session and an all-sessions backup first. Deletion cannot be undone. Starting a new coded session does not require deletion.</p><button class="study-button secondary" id="clear-results">Review delete of all study sessions</button><div id="clear-review" class="review-warning" hidden><p>Delete ALL participant/session labels, task results, active session and events from this browser? Care records are kept.</p><button class="study-button" id="confirm-clear">Delete all study sessions and events</button><button class="study-button secondary" id="cancel-clear">Cancel deletion</button></div><div class="study-actions"><button class="study-button secondary" id="reset-local">Review reset of all Saha data</button></div><div id="reset-review" class="review-warning" hidden><p>Delete all Saha care state, preferences, study sessions and events for both routes on this browser? Unrelated site storage is kept.</p><button class="study-button" id="confirm-reset">Delete all saved Saha prototype data</button><button class="study-button secondary" id="cancel-reset">Cancel reset</button></div></article>';}
function bindReset(){
  $('#reset-local').onclick=()=>{$('#reset-review').hidden=false;$('#confirm-reset').focus();};
  $('#cancel-reset').onclick=()=>{$('#reset-review').hidden=true;$('#reset-local').focus();};
  $('#clear-results').onclick=()=>{$('#clear-review').hidden=false;$('#confirm-clear').focus();};
  $('#cancel-clear').onclick=()=>{$('#clear-review').hidden=true;$('#clear-results').focus();};
  $('#confirm-clear').onclick=()=>{
    research=loadResearch();if(research.active){toast('Save or stop the active task before deletion.');return;}
    researchBlocked=false;research=newResearch();if(!saveResearch())return;exportSessionId=null;pendingTaskId=null;activeTask=null;storageIssue='';renderStudy();toast('All study sessions and events deleted.');
  };
  $('#confirm-reset').onclick=()=>{
    if(loadResearch().active){toast('Save or stop the active task before resetting.');return;}
    try{for(const key of [PREFIX+'participant',PREFIX+'studio',STUDY_KEY])localStorage.removeItem(key);storageIssue='';researchBlocked=false;}catch{storageIssue='Browser storage could not be cleared.';}
    Object.assign(state,defaults(),{screen:'home'});research=newResearch();exportSessionId=null;pendingTaskId=null;activeTask=null;stack=[];render();renderStudy();toast('Saha prototype data reset.');
  };
}
function applyScenario(s){if(activeTask){toast('Save or stop the active task before changing scenarios.');return;}resetDemo();if(s==='empty')state.emptyVisits=true;if(s==='offline')state.offline=true;go(s==='pending'?'dose':s==='empty'?'visits':s,'studio');setView('prototype');}
function download(name,text,type){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function selectedExport(){research=loadResearch();const id=exportSessionId==='__unassigned'?null:exportSessionId;return {version:1,exportedAt:new Date().toISOString(),build:BUILD,session:research.sessions.find(s=>s.id===id)||null,results:research.results.filter(r=>(r.sessionId||null)===id),events:research.events.filter(e=>(e.sessionId||null)===id)};}
function exportName(session,suffix){return 'saha-'+(session?.participantCode||'UNASSIGNED')+'-'+(session?.id||'unassigned')+'-'+suffix;}
function exportCSV(){const data=selectedExport(),cols=['participantCode','sessionId','build','condition','conditionOrder','task','result','seconds','errors','help','navigationMethod','navigation','gesturesEnabled','config','startedAt','runId','destinationReached','notStarted'];const csv=cols.join(',')+'\n'+data.results.map(r=>cols.map(k=>'"'+(typeof r[k]==='object'?JSON.stringify(r[k]):String(r[k]??'')).replace(/"/g,'""')+'"').join(',')).join('\n');download(exportName(data.session,'tasks.csv'),csv,'text/csv');}
research=loadResearch();
activeTask=research.active?{...research.active,task:tasks.find(t=>t.id===research.active.taskId)}:null;
if(isStudio){initIcons();renderNavigator();renderFlows();renderSystem();render();setView(location.hash.slice(1)||'prototype');}
else { if(!state.onboarded && state.screen==='home')state.screen='welcome';render(); }
window.addEventListener('storage',e=>{
  if(e.key===DATA_KEY || e.key===null){Object.assign(state,loadCare(DATA_KEY));stack=[];render();}
  if(e.key===STUDY_KEY || e.key===null){research=loadResearch();activeTask=research.active?{...research.active,task:tasks.find(t=>t.id===research.active.taskId)}:null;if(isStudio&&state.view==='study')renderStudy();else render();}
});
window.addEventListener('hashchange',()=>{if(!isStudio)return;const v=location.hash.slice(1);if(['prototype','atlas','flows','system','study'].includes(v)&&v!==state.view)setView(v);});
setInterval(updateForegroundReminders,15000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateForegroundReminders();});

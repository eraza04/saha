import { BUILD, selectedMedicine, selectedOccurrence, selectedAppointment, selectedContact, occurrenceForDay, upcomingAppointments, sortedAppointments, careDay, dayLabel, timeLabel, appointmentReminderAt, nextDay } from './care-state.js';

// One renderer and the same record actions for A/B/C, participant and studio.
export function renderScreen(id,state,ui) {
  const {esc,icon,btn,jump,badge,detail,taskCard,formatTime}=ui;
  const dose=selectedOccurrence(state),contact=selectedContact(state),visit=selectedAppointment(state);
  const med=['dose','taken','snooze','postponed','missed'].includes(id)?state.medicines.find(m=>m.id===dose?.medicineId):selectedMedicine(state);
  const home=()=>jump('Today','home','secondary','home');
  const schedule=o=>'<p class="app-sub">Scheduled: '+esc(timeLabel(o.time))+'<br>'+esc(dayLabel(o.date))+'</p>';
  const reminderNote='<p class="app-inline-note">Fictional records only. Reminders work while this page is open; no closed-page or background alerts.</p>';
  const toggle=(label,key,sub='',disabled=false)=>'<label class="option-row"><span><strong>'+label+'</strong>'+(sub?'<small>'+sub+'</small>':'')+'</span><input class="switch" type="checkbox" data-pref="'+key+'" '+(state[key]?'checked ':'')+(disabled?'disabled ':'')+'></label>';
  const settings=onboarding=>'<h2>Comfort settings</h2><h3>Text size</h3><div class="text-options">'+[['comfortable','Standard'],['large','Large'],['largest','Largest']].map(([key,label])=>'<button data-action="size:'+key+'" aria-label="'+label+' text" aria-pressed="'+(state.size===key)+'" class="'+(state.size===key?'active':'')+'">'+label+'</button>').join('')+'</div><div class="size-demo">Your visit is at 10:30 am.</div>'+toggle('Stronger contrast','contrast')+toggle('More space','roomy')+toggle('Optional swipes','gestures','Between main sections only',state.condition!=='C')+(onboarding?jump('Continue','gesture','','right')+jump('Skip setup','home','secondary'):btn('Done','savePrefs','','check'))+jump('Swipe practice','gesture','quiet','hand');
  const field=(key,label,type='text',max=80,value='')=>'<div class="app-field"><label for="record-'+key+'">'+label+'</label><input id="record-'+key+'" name="'+key+'" type="'+type+'" '+(type==='text'||type==='tel'?'maxlength="'+max+'" ':'')+(type==='tel'?'inputmode="tel" ':'')+'autocomplete="off" value="'+esc(value)+'" aria-describedby="form-error" required></div>';
  // Cancel stays in the app header, outside this scrolling form.
  const form=(kind,fields)=>'<form id="'+kind+'-form" novalidate>'+fields+'<div id="form-error" class="field-error" role="alert">'+esc(state.formError||'')+'</div><button type="submit" class="app-button">'+icon('check')+'Save '+kind+'</button></form>';
  const visitDetails=()=>detail('calendar','Date',esc(dayLabel(visit.date)))+detail('clock','Time',esc(timeLabel(visit.time)))+detail('location','Location',esc(visit.location));
  const visitCard=a=>'<button class="task-card" data-action="appointment:'+a.id+'"><span class="task-icon ochre">'+icon('calendar')+'</span><span><strong>'+esc(a.clinician)+'</strong><small>'+esc(dayLabel(a.date))+'<br>'+esc(timeLabel(a.time))+' · '+esc(a.location)+'</small></span>'+icon('arrow')+'</button>';
  const occurrenceCard=o=>{
    const m=state.medicines.find(m=>m.id===o.medicineId);
    return '<div class="app-card" data-occurrence="'+o.id+'"><h3>'+esc(o.name)+(m.archivedAt?' · Archived':'')+'</h3>'+schedule(o)+'<p>'+(o.status==='taken'?'Recorded taken: '+formatTime(o.takenAt):'Not recorded as taken')+'</p>'+(o.status==='taken'?btn('Correct record','correct:'+o.id,'secondary','reset'):!m.archivedAt?btn('Open reminder','occurrence:'+o.id,'secondary','pill'):'')+'</div>';
  };
  const history=()=>'<h2>Medicine record</h2>'+Object.values(state.occurrences).sort((a,b)=>b.date.localeCompare(a.date)||a.time.localeCompare(b.time)).map(occurrenceCard).join('')+'<p class="app-inline-note">A correction is not an instruction to take another dose.</p><details class="optional-info"><summary>Activity history</summary>'+(state.events.length?state.events.slice().reverse().map(e=>'<div class="list-item"><div class="item-content"><strong>'+esc(e.label)+'</strong><p>'+esc(dayLabel(state.occurrences[e.occurrenceId].date))+' · '+formatTime(e.time)+'</p></div></div>').join(''):'<p>No actions recorded.</p>')+'</details>';
  if(['dose','taken','snooze','postponed','missed'].includes(id)&&(!med||!dose))return '<h2>No medicine selected</h2>'+jump('Medicine schedule','meds','','pill');
  if(['visit','visitReminder','deleteappointment','editappointment'].includes(id)&&!visit)return '<h2>No appointment selected</h2>'+jump('Visits','visits','','calendar');
  if(['contact','call','calling','editcontact'].includes(id)&&!contact)return '<h2>No contact selected</h2>'+jump('Trusted people','people','','people');
  switch(id){
    case 'welcome':return '<div class="welcome-art"><div class="welcome-orbit"><span class="welcome-center">s</span></div></div><h2>Welcome to Saha</h2><p>Medicines, visits and trusted people.</p>'+jump('Set my comfort','comfort','','sliders')+jump('Start with Today','home','secondary','home')+'<p class="app-footnote">Fictional data only. Calls are simulated.</p>';
    case 'comfort':return settings(true);
    case 'settings':return settings(false);
    case 'gesture':return '<h2>Optional swipes</h2><div class="gesture-demo">'+icon('hand')+'<p>Swipe left or right between the four main sections.</p></div><p>Buttons always work.</p>'+btn('Try on Today','tryGesture','','hand').replace('<button ','<button '+(state.condition!=='C'?'disabled ':''))+btn('Use buttons','preferButtons','secondary','grid');
    case 'home':{
      const active=state.medicines.filter(m=>!m.archivedAt).map(m=>occurrenceForDay(state,m.id)).filter(Boolean).sort((a,b)=>a.time.localeCompare(b.time));
      const o=active.find(o=>o.status!=='taken')||active[0],next=upcomingAppointments(state)[0];
      return '<h2>Today</h2><p class="app-sub">'+esc(dayLabel(careDay(state)))+'</p>'+(o?'<div class="app-card hero-card"><h3>'+esc(o.name)+'</h3>'+schedule(o)+badge(o.status==='taken'?'Recorded taken':o.status==='postponed'?'Reminder postponed':'Not recorded','','clock')+(o.status==='taken'?jump('View record','history','','clipboard'):btn('Open reminder','occurrence:'+o.id,'','pill'))+'</div>':jump('Add medicine','addmedicine','','plus'))+(next?'<h3>Next visit</h3>'+visitCard(next):taskCard('calendar','Visits','No upcoming visits','visits'))+taskCard('people','Trusted people',state.contacts.slice(0,2).map(c=>esc(c.name)).join(' · '),'people');
    }
    case 'meds':return '<h2>Medicine schedule</h2>'+jump('Add medicine','addmedicine','','plus')+state.medicines.filter(m=>!m.archivedAt).sort((a,b)=>(occurrenceForDay(state,a.id)?.time||a.time).localeCompare(occurrenceForDay(state,b.id)?.time||b.time)).map(m=>{
      const o=occurrenceForDay(state,m.id);return '<div class="app-card"><h3>'+esc(m.name)+'</h3><p class="app-sub">Daily · '+esc(timeLabel(o?.time||m.time))+'</p>'+(o?badge(o.status==='taken'?'Recorded taken':o.status==='postponed'?'Reminder postponed':'Not recorded','','clock')+(o.status==='postponed'?'<p>Reminder: '+formatTime(o.remindAt)+'</p>':'')+btn(o.status==='taken'?'View record':'Open reminder','medicine:'+m.id,'secondary','pill'):'')+(m.schedule.some(r=>r.from>careDay(state))?'<p class="app-sub">From tomorrow: '+timeLabel(m.time)+'</p>':'')+btn('Edit medicine','editmedicine:'+m.id,'quiet','edit')+'</div>';
    }).join('')+jump('View all records','history','quiet','clipboard')+reminderNote;
    case 'dose':return dose.status==='taken'?'<h2>Already recorded</h2><p>'+esc(dose.name)+'</p>'+jump('View record','history','','clipboard'):med.archivedAt?'<h2>Archived medicine</h2>'+jump('View record','history','','clipboard'):'<h2>'+esc(dose.name)+'</h2>'+schedule(dose)+'<p>Already taken?</p>'+btn('Record taken','take','','check')+jump('Postpone reminder','snooze','secondary','clock')+jump('View record','history','quiet','clipboard');
    case 'taken':return dose.status!=='taken'?history():'<h2>Recorded taken</h2><div class="success-card"><strong>'+esc(dose.name)+'</strong>'+schedule(dose)+'<p>Recorded: '+formatTime(dose.takenAt)+'</p></div>'+jump('View record','history','','clipboard')+btn('Correct record','undo','secondary','reset')+home();
    case 'snooze':return '<h2>Postpone reminder</h2><p>'+esc(dose.name)+'</p>'+schedule(dose)+[10,20,30].map(n=>btn(n+' minutes','snooze:'+n,'secondary','clock')).join('')+'<p class="app-inline-note">The medicine schedule stays unchanged.</p>'+jump('Cancel','dose','quiet','close');
    case 'postponed':return dose.status!=='postponed'?(dose.status==='taken'?history():renderScreen('dose',state,ui)):'<h2>Reminder postponed</h2><div class="success-card"><strong>'+esc(dose.name)+'</strong><p>Reminder: '+formatTime(dose.remindAt)+'</p><p>Original schedule: '+timeLabel(dose.time)+'</p><p>'+esc(dayLabel(dose.date))+'</p></div>'+home()+jump('Change reminder','snooze','secondary','clock')+jump('Record taken','dose','quiet','check')+reminderNote;
    case 'history':return history();
    case 'medicinedetail':{
      if(!med)return '<h2>No medicine selected</h2>'+jump('Medicine schedule','meds','','pill');
      const occurrence=occurrenceForDay(state,med.id),future=med.schedule.some(r=>r.from>careDay(state));
      return '<h2>'+esc(med.name)+'</h2><p>Daily reminder: '+timeLabel(med.time)+'</p>'+(future?'<p class="app-sub">New time starts tomorrow. Today: '+timeLabel(occurrence?.time||med.time)+'</p>':'')+(med.archivedAt?'<p>Archived. Historical records are kept.</p>':btn(occurrence?.status==='taken'?'View record':'Open reminder','medicine:'+med.id,'','pill')+btn('Edit medicine','editmedicine:'+med.id,'secondary','edit'))+jump('View all records','history','quiet','clipboard')+reminderNote;
    }
    case 'addmedicine':case 'editmedicine':{
      const editing=id==='editmedicine',m=editing?med:null,d=state.draft||m||{name:'',time:''};
      if(editing&&(!m||m.archivedAt))return '<h2>Medicine unavailable</h2>'+jump('Medicine schedule','meds');
      return '<h2>'+(editing?'Edit':'Add')+' medicine</h2>'+form('medicine',field('name','Medicine name','text',80,d.name)+field('time',editing?'Daily reminder time (from tomorrow)':'Daily reminder time','time',0,d.time))+(editing?'<p class="app-inline-note">Time changes start '+esc(dayLabel(nextDay(careDay(state))))+'. Existing occurrences keep their original name and time.</p>'+jump('Archive medicine','archivemedicine','danger','reset'):'')+reminderNote;
    }
    case 'archivemedicine':return '<h2>Archive medicine?</h2><p>'+esc(med?.name||'')+'</p><p>Stop future reminders. Keep all historical records and corrections.</p>'+btn('Confirm archive','confirmArchive','danger','reset')+jump('Cancel','editmedicine','secondary','close');
    case 'visits':{
      const upcoming=upcomingAppointments(state),past=sortedAppointments(state).filter(a=>!upcoming.includes(a));
      return '<h2>Visits</h2>'+jump('Add appointment','addappointment','','plus')+(upcoming.length?upcoming.map(visitCard).join(''):'<p>No upcoming visits.</p>')+(past.length?'<details class="optional-info"><summary>Past appointments</summary>'+past.map(visitCard).join('')+'</details>':'');
    }
    case 'visit':return '<h2>'+esc(visit.clinician)+'</h2>'+visitDetails()+'<p>Reminder: '+({'none':'None','at-time':'At appointment time','day-before':'1 day before'}[visit.reminder])+'</p>'+(visit.reminder==='none'?'':visit.acknowledgedReminderAt&&visit.acknowledgedReminderAt===appointmentReminderAt(visit)?'<p class="inline-feedback">Reminder acknowledged. Booking unchanged.</p>':jump('View reminder','visitReminder','secondary','bell'))+jump('Edit appointment','editappointment','secondary','edit')+jump('Delete appointment','deleteappointment','danger','close');
    case 'visitReminder':return '<h2>Visit reminder</h2><p><strong>'+esc(visit.clinician)+'</strong></p>'+visitDetails()+(visit.reminder==='none'?'<p>No reminder selected.</p>':btn('I’ve seen this','seen','','check'))+reminderNote;
    case 'addappointment':case 'editappointment':{
      const editing=id==='editappointment',d=state.draft||(editing?visit:null)||{clinician:'',date:'',time:'',location:'',reminder:'none'};
      return '<h2>'+(editing?'Edit':'Add')+' appointment</h2>'+form('appointment',field('clinician','Clinician or title','text',80,d.clinician)+field('date','Date','date',0,d.date)+field('time','Time','time',0,d.time)+field('location','Location and room','text',160,d.location)+'<div class="app-field"><label for="record-reminder">Reminder</label><select id="record-reminder" name="reminder">'+[['none','None'],['at-time','At appointment time'],['day-before','1 day before']].map(([v,t])=>'<option value="'+v+'" '+(d.reminder===v?'selected':'')+'>'+t+'</option>').join('')+'</select></div>')+reminderNote;
    }
    case 'deleteappointment':return '<h2>Delete appointment?</h2><p>'+esc(visit.clinician)+'</p>'+visitDetails()+'<p>Remove this fictional appointment from this browser. This cannot be undone and does not cancel a real booking.</p>'+btn('Confirm delete','confirmDeleteAppointment','danger','close')+jump('Cancel','visit','secondary','close');
    case 'people':return '<h2>Trusted people</h2>'+jump('Add contact','addcontact','','plus')+state.contacts.map((c,i)=>'<button class="task-card" data-action="person:'+i+'"><span class="person-avatar">'+esc(c.name[0])+'</span><span><strong>'+esc(c.name)+'</strong><small>'+esc(c.relation)+'</small></span>'+icon('arrow')+'</button>').join('');
    case 'contact':return '<h2>'+esc(contact.name)+'</h2><p>'+esc(contact.relation)+'</p><p class="contact-phone">'+esc(contact.number)+'</p>'+jump('Call preview','call','','call')+jump('Edit contact','editcontact','secondary','edit');
    case 'call':return '<h2>Call '+esc(contact.name)+'?</h2><p>'+esc(contact.relation)+'<br>'+esc(contact.number)+'</p><p>Simulation — no real call.</p>'+jump('Start preview','calling','','call')+jump('Cancel','contact','secondary','close');
    case 'calling':return '<h2>Call preview</h2><div class="call-active"><strong>'+esc(contact.name)+'</strong><p>'+esc(contact.number)+'</p><p>No call placed.</p></div>'+btn('End preview','endCall','danger','call');
    case 'addcontact':case 'editcontact':{
      const editing=id==='editcontact',d=state.draft||(editing?contact:null)||{name:'',relation:'',number:''};
      return '<h2>'+(editing?'Edit':'Add')+' contact</h2>'+form('contact',field('name','Name','text',40,d.name)+field('relation','Relationship','text',40,d.relation)+field('number','Phone number','tel',24,d.number));
    }
    case 'missed':return dose.status==='taken'?history():'<h2>Not recorded</h2><p>'+esc(dose.name)+'</p>'+schedule(dose)+'<p>This does not mean it was not taken.</p>'+jump('View record','history','','clipboard')+jump('Trusted people','people','secondary','people');
    case 'empty':return '<h2>No upcoming visits</h2>'+jump('Add appointment','addappointment','','plus')+home();
    case 'offline':return '<h2>Offline design scenario</h2><p>No offline app shell is installed.</p>'+taskCard('pill','Medicine schedule','','meds')+taskCard('calendar','Visit details','','visit')+taskCard('people','Trusted people','','people');
    case 'help':return '<h2>Help</h2>'+jump('Trusted people','people','','people')+[
      ['Medicine records','Use fictional names and schedules only. Saha gives no medicine, dose or treatment advice. Record taken reports what you tell Saha. Not recorded does not prove medicine was not taken. Correction changes only the selected dated occurrence; it is not an instruction to take another dose. Archiving stops reminders but keeps history.'],
      ['Reminders','Each active medicine has one occurrence per local calendar day. Time edits apply from tomorrow. Postponing changes only that occurrence’s reminder. Due and overdue reminders stay available while this page is open, including after refresh. The browser may delay checks. There are no background alerts when the page is closed and no clinical reliability.'],
      ['Visits and calls','Add or edit fictional appointment details and choose an in-app reminder. This does not book, reschedule or cancel a real appointment. Acknowledgement is not attendance. Calls are previews; no real call or emergency service is contacted.'],
      ['Comfort and navigation','Combine text size, contrast and space in Settings. Buttons reach every section. Optional slow horizontal swipes move between the four main sections only. They never change records or start calls.'],
      ['Saved information','Changes save in this browser when storage is available. There is no phone-to-laptop sync. Study samples are separate from your records; study resets keep personal records. Reloading needs a connection to the hosting server. Only use fictional details.'],
      ['Read aloud','Press Read aloud to hear the visible screen. Speech depends on this browser. No microphone or autoplay is used.']
    ].map(([t,p])=>'<details class="optional-info"><summary>'+t+'</summary><p>'+p+'</p></details>').join('')+'<p class="app-footnote">Build: '+esc(BUILD)+'</p>';
    default:return '';
  }
}

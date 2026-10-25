import { MEDICINES, VISIT } from './care-state.js';

// Shared by the full-screen app, studio preview and atlas. Study conditions use
// identical content and routes; their presentation is applied by app.js/CSS.
export function renderScreen(id, state, ui) {
  const { esc, icon, btn, jump, badge, detail, taskCard, read, formatTime } = ui;
  const med = MEDICINES.find(m => m.id === state.selectedDose);
  const dose = state.doses[med.id];
  const contact = state.selectedContact === 1 ? state.otherContact : state.contact;
  const home = () => jump('Today', 'home', 'secondary', 'home');
  const schedule = m => '<p class="app-sub">Scheduled: ' + m.time + '</p>';
  const visitDetails = () => detail('calendar', 'Date', VISIT.date) + detail('clock', 'Time', VISIT.time) +
    detail('location', 'Location', VISIT.place + '<br>' + VISIT.room);
  const toggle = (label, key, sub = '', disabled = false) => '<label class="option-row"><span><strong>' + label +
    '</strong>' + (sub ? '<small>' + sub + '</small>' : '') + '</span><input class="switch" type="checkbox" data-pref="' +
    key + '" ' + (state[key] ? 'checked ' : '') + (disabled ? 'disabled ' : '') + '></label>';
  const settings = onboarding => '<h2>Comfort settings</h2><h3>Text size</h3><div class="text-options">' +
    [['comfortable','Standard'],['large','Large'],['largest','Largest']].map(([key,label]) =>
      '<button data-action="size:' + key + '" aria-label="' + label + ' text" aria-pressed="' + (state.size === key) +
      '" class="' + (state.size === key ? 'active' : '') + '">' + label + '</button>').join('') + '</div>' +
    '<div class="size-demo">Your visit is at 10:30 am.</div>' + toggle('Stronger contrast','contrast') + toggle('More space','roomy') +
    toggle('Optional swipes','gestures','Between main sections only',state.condition !== 'C') +
    (onboarding ? jump('Continue','gesture','','right') + jump('Skip setup','home','secondary') : btn('Done','savePrefs','','check')) +
    jump('Swipe practice','gesture','quiet','hand');
  const history = () => '<h2>Medicine record</h2>' + MEDICINES.map(m => {
    const d = state.doses[m.id];
    return '<div class="app-card"><h3>' + m.name + '</h3>' + schedule(m) + '<p>' +
      (d.status === 'taken' ? 'Recorded taken: ' + formatTime(d.takenAt) : 'Not recorded as taken') + '</p>' +
      (d.status === 'taken' ? btn('Correct record','correct:' + m.id,'secondary','reset') : btn('Open reminder','medicine:' + m.id,'secondary','pill')) + '</div>';
  }).join('') + '<p class="app-inline-note">A correction is not an instruction to take another dose.</p>' +
    '<details class="optional-info"><summary>Activity history</summary>' + (state.events.length ? state.events.slice().reverse().map(e =>
      '<div class="list-item"><div class="item-content"><strong>' + esc(e.label) + '</strong><p>' + formatTime(e.time) + '</p></div></div>').join('') : '<p>No actions recorded.</p>') + '</details>';

  switch (id) {
    case 'welcome': return '<div class="welcome-art"><div class="welcome-orbit"><span class="welcome-center">s</span></div></div><h2>Welcome to Saha</h2><p>Medicines, visits and trusted people.</p>' +
      jump('Set my comfort','comfort','','sliders') + jump('Start with Today','home','secondary','home') + '<p class="app-footnote">Fictional data only. Calls are simulated.</p>';
    case 'comfort': return settings(true);
    case 'settings': return settings(false);
    case 'gesture': return '<h2>Optional swipes</h2><div class="gesture-demo">' + icon('hand') + '<p>Swipe left or right between the four main sections.</p></div><p>Buttons always work.</p>' +
      btn('Try on Today','tryGesture','','hand').replace('<button ', '<button '+(state.condition!=='C'?'disabled ':'')) + btn('Use buttons','preferButtons','secondary','grid');
    case 'home': {
      const d = state.doses.A;
      return '<h2>Today</h2><p class="app-sub">Sunday, 25 October 2026</p><div class="app-card hero-card"><h3>Medicine A</h3>' + schedule(MEDICINES[0]) +
        badge(d.status === 'taken' ? 'Recorded taken' : d.status === 'postponed' ? 'Reminder postponed' : 'Not recorded', '', d.status === 'taken' ? 'check' : 'clock') +
        (d.status === 'taken' ? jump('View record','history','','clipboard') : btn('Open reminder',(d.status === 'postponed' ? 'reminder:' : 'medicine:') + 'A','','pill')) + '</div>' +
        taskCard('calendar','Next visit',VISIT.date + ' · ' + VISIT.time,'visit','ochre') + taskCard('people','Trusted people',esc(state.contact.name) + ' · ' + esc(state.otherContact.name),'people');
    }
    case 'meds': return '<h2>Medicine schedule</h2>' + MEDICINES.map(m => {
      const d = state.doses[m.id];
      return '<div class="app-card"><h3>' + m.name + '</h3>' + schedule(m) + badge(d.status === 'taken' ? 'Recorded taken' : d.status === 'postponed' ? 'Reminder postponed' : 'Not recorded', '', d.status === 'taken' ? 'check' : 'clock') +
        (d.status === 'postponed' ? '<p class="app-sub">Reminder: ' + formatTime(d.remindAt) + '</p>' : '') +
        btn(d.status === 'taken' ? 'View record' : 'Open reminder','medicine:' + m.id,'secondary','pill') + '</div>';
    }).join('') + jump('View all records','history','quiet','clipboard');
    case 'dose': return dose.status === 'taken' ? '<h2>Already recorded</h2><p>' + med.name + '</p>' + jump('View record','history','','clipboard') :
      '<h2>' + med.name + '</h2>' + schedule(med) + '<p>Already taken?</p>' + btn('Record taken','take','','check') + jump('Postpone reminder','snooze','secondary','clock') + jump('View record','history','quiet','clipboard');
    case 'taken': return dose.status !== 'taken' ? history() : '<h2>Recorded taken</h2><div class="success-card"><strong>' + med.name + '</strong>' + schedule(med) + '<p>Recorded: ' + formatTime(dose.takenAt) + '</p></div>' +
      jump('View record','history','','clipboard') + btn('Correct record','undo','secondary','reset') + home();
    case 'snooze': return '<h2>Postpone reminder</h2><p>' + med.name + ' · ' + med.time + '</p>' + [10,20,30].map(n => btn(n + ' minutes','snooze:' + n,'secondary','clock')).join('') +
      '<p class="app-inline-note">The medicine schedule stays unchanged.</p>' + jump('Cancel','dose','quiet','close');
    case 'postponed': return dose.status !== 'postponed' ? (dose.status === 'taken' ? history() : renderScreen('dose',state,ui)) :
      '<h2>Reminder postponed</h2><div class="success-card"><strong>' + med.name + '</strong><p>Reminder: ' + formatTime(dose.remindAt) + '</p><p>Original schedule: ' + med.time + '</p></div>' +
      home() + jump('Change reminder','snooze','secondary','clock') + jump('Record taken','dose','quiet','check') + '<p class="app-inline-note">In-app reminder only. No background alert.</p>';
    case 'history': return history();
    case 'visits': return state.emptyVisits ? renderScreen('empty',state,ui) : '<h2>Visits</h2>' + taskCard('calendar',VISIT.clinician,VISIT.date + '<br>' + VISIT.time + ' · ' + VISIT.place,'visit');
    case 'visit': return '<h2>' + VISIT.clinician + '</h2>' + visitDetails() + toggle('Visit reminder','visitReminder','In-app only') +
      (state.visitSeen ? '<p class="inline-feedback">Reminder acknowledged. Booking unchanged.</p>' : jump('View reminder','visitReminder','secondary','bell'));
    case 'visitReminder': return '<h2>Visit reminder</h2><p><strong>' + VISIT.clinician + '</strong></p>' + visitDetails() +
      btn(state.visitSeen ? 'Acknowledged' : 'I’ve seen this','seen','','check') + jump('Visit details','visit','secondary','calendar');
    case 'people': return '<h2>Trusted people</h2>' + [state.contact,state.otherContact].map((c,i) =>
      '<button class="task-card" data-action="person:' + i + '"><span class="person-avatar">' + esc(c.name[0]) + '</span><span><strong>' + esc(c.name) + '</strong><small>' + esc(c.relation) + '</small></span>' + icon('arrow') + '</button>').join('');
    case 'contact': return '<h2>' + esc(contact.name) + '</h2><p>' + esc(contact.relation) + '</p><p class="contact-phone">' + esc(contact.number) + '</p>' +
      jump('Call preview','call','','call') + jump('Edit contact','editcontact','secondary','edit') + jump('Other people','people','quiet','people');
    case 'call': return '<h2>Call ' + esc(contact.name) + '?</h2><p>' + esc(contact.relation) + '<br>' + esc(contact.number) + '</p><p>Simulation — no real call.</p>' +
      jump('Start preview','calling','','call') + jump('Cancel','contact','secondary','close');
    case 'calling': return '<h2>Call preview</h2><div class="call-active"><strong>' + esc(contact.name) + '</strong><p>' + esc(contact.number) + '</p><p>No call placed.</p></div>' + btn('End preview','endCall','danger','call');
    case 'editcontact': {
      const draft = state.contactDraft || contact;
      return '<h2>Edit contact</h2><form id="contact-form" novalidate>' + [['name','Name'],['relation','Relationship'],['number','Phone number']].map(([key,label]) =>
        '<div class="app-field"><label for="contact-' + key + '">' + label + '</label><input id="contact-' + key + '" name="' + key + '" ' + (key === 'number' ? 'type="tel" inputmode="tel" maxlength="24"' : 'maxlength="40"') + ' autocomplete="off" value="' + esc(draft[key]) + '" aria-describedby="form-error"></div>').join('') +
        '<div id="form-error" class="field-error" role="alert">' + esc(state.formError) + '</div><button type="submit" class="app-button">' + icon('check') + 'Save contact</button></form>' + jump('Cancel','contact','secondary','close');
    }
    case 'missed': return dose.status === 'taken' ? history() : '<h2>Not recorded</h2><p>' + med.name + ' · ' + med.time + '</p><p>This does not mean it was not taken.</p>' + jump('View record','history','','clipboard') + jump('Trusted people','people','secondary','people');
    case 'empty': return '<h2>No upcoming visits</h2>' + home() + jump('Trusted people','people','secondary','people');
    case 'offline': return '<h2>Offline design scenario</h2><p>No offline app shell is installed.</p>' + taskCard('pill','Medicine schedule','','meds') + taskCard('calendar','Visit details','','visit') + taskCard('people','Trusted people','','people');
    case 'help': return '<h2>Help</h2>' + jump('Trusted people','people','','people') + [
      ['Medicine records','Record taken only reports what you tell Saha. Not recorded does not prove medicine was not taken. Correct record removes a taken entry; it is not an instruction to take another dose. Saha gives no medicine advice.'],
      ['Reminders','Postponing changes the reminder, not the prescribed medicine schedule. A due postponed reminder appears while this page is open. The browser can delay checks. There are no background alerts when this page is closed.'],
      ['Visits and calls','Visit details are fictional. Acknowledgement does not book, change or confirm attendance at a visit. Calls are previews; no telephone or emergency service is contacted.'],
      ['Comfort and navigation','Choose text size, contrast and space in Settings. These choices can be combined. Buttons reach every section. Optional slow left/right swipes move between Today, Medicine, Visits and People only. They never record medicine or start calls. Swipe availability depends on the researcher’s selected condition.'],
      ['Saved information','Use fictional details only. Changes save on this browser when storage is available. There is no phone-to-laptop sync. Reloading needs a connection to the hosting server; the offline screen is a design scenario.'],
      ['Read aloud','Press Read aloud to hear the visible screen. Speech depends on this browser. No microphone or autoplay is used.']
    ].map(([title,text]) => '<details class="optional-info"><summary>' + title + '</summary><p>' + text + '</p></details>').join('');
    default: return '';
  }
}

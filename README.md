# Saha — Phase 1 HCI submission

Saha is a running mobile-first prototype for fictional medicines, appointments and trusted contacts. It is manually customizable, with forest-green/off-white styling, short participant screens and optional Help. The studio, 22-screen atlas and interaction flows are preserved. Release build: `saha-phase1-1.2.2`, including fictional record management and the shared-column header navigation. Check Help for the build loaded in your browser.

## Run

Use Node.js LTS from this project directory:

```powershell
npm.cmd run dev
```

On macOS/Linux use `npm run dev`. Runtime has no external dependencies; installation is only needed for browser tests. Keep the terminal open and stop with Ctrl+C.

- Participant app: http://localhost:5173/
- Studio and researcher tools: http://localhost:5173/studio/
- Experimental plan: http://localhost:5173/docs/EXPERIMENTAL_PLAN.md
- Active project: `C:\Users\ezanr\orca\projects\hci-project`

The static server prints possible phone addresses. A phone on the same Wi-Fi can use the printed Wi-Fi IP URL; firewall/VPN/network isolation may prevent access. `SAHA_PORT` changes the port. The server serves files and has no care-data API or database.

Production URLs: [participant app](https://saha-lemon.vercel.app/) and [studio](https://saha-lemon.vercel.app/studio/), under the existing `neuraai1/saha` project. Releases use the Vercel CLI from a committed, pushed `master` in the private `eraza04/saha` repository; GitHub is a source backup, with no Vercel Git connection. See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for settings, account steps, upload exclusions and live verification. Unique deployment URLs can require Vercel login; verify the stable production alias before sharing it.

For local packaging, `npm.cmd run build` creates an allowlisted eight-file frontend in `dist/`; `npm.cmd run preview` serves it at http://localhost:5174/ and http://localhost:5174/studio/. Documents and exports are excluded from deployment; local studio document links remain available with `npm.cmd run dev`.

## Submission materials

The instructor's running-application requirement is demonstrated at `/`. The planned-experiment requirement is described in:

- [Experimental plan](docs/EXPERIMENTAL_PLAN.md): questions, actual A/B/C differences, recruitment, counterbalancing, procedure, measures, paired analysis and data handling.
- [Task script](docs/TASK_SCRIPT.md): neutral instructions, starts, success, timing, errors, assistance and provisional stopping rules for all five tasks.
- [Observation sheet](docs/OBSERVATION_SHEET.csv): header-only template with no participant observations.
- [Post-test interview](docs/POST_TEST_INTERVIEW.md): retrospective questions and separate standard SUS administration.
- [Demo script](docs/DEMO_SCRIPT.md): three core functions, combined settings, persistence, gestures and researcher workflow.

These describe intended experiments. No participants, results, completed pilot or approval are claimed. Check instructor consent/research requirements before recruitment. The provisional main target is 12–16 intended users, with a separate 2–3-user pilot; finalize feasibility and timing after the pilot.

## Working features and simulations

Use the visible **Add medicine**, **Add appointment** and **Add contact** buttons to create your own fictional records. Every form has labels, validation, Save and Cancel. These actions work in all A/B/C conditions.

Medicines have a name and one daily reminder time. Each medicine has a stable ID; every local calendar day has a separate occurrence ID (`medicineID~YYYY-MM-DD`). Record taken, postponement, duplicate prevention and correction apply to the selected dated occurrence. Existing occurrences retain their original name and time. Editing a medicine changes its name for future occurrences and its reminder time from tomorrow; the list shows a pending time change. Archiving requires confirmation, stops reminders/new occurrences and keeps historical records and their correction routes. There is no dose field, recommendation or treatment advice.

Appointments include clinician/title, date, time, location/room and reminder choice (None, At appointment time, 1 day before). Upcoming visits sort by date and time. Past visits remain under Past appointments. Edits preserve IDs and invalidate an old reminder acknowledgement when date, time or reminder choice changes. Deletion requires confirmation and does not cancel a real booking. Contacts can be added and edited, with validated phone numbers and simulated call confirmation/cancellation.

Every participant screen uses one persistent header aligned with the same responsive column and safe-area padding as its content. Help and Settings occupy the utility row; the explicit return sits directly above the screen title. Appointment details have one **Back to Visits** action in this header; the duplicate in-content button is removed. The header names **Back to appointment** on its reminder and **Back to Medicine** on medicine reminders and saved medicine details. Create/edit forms keep **Cancel** in that header: creation returns to the section list; editing returns to the saved record. Saving opens the saved medicine, appointment or contact with its return action. These destinations use explicit screen IDs, so refresh/direct entry do not need a navigation-history stack. Back/Cancel discard unsaved drafts without creating, deleting or acknowledging a reminder.

The participant document is locked to the visible viewport height (including embedded previews and resize); its flex containers have explicit zero minimum height and hidden overflow. Only the central content area scrolls. Header and bottom navigation remain outside it, with safe-area spacing. The header return stays visible while content scrolls. Medicine records, contacts, settings and the section lists use the same layout and explicit parent destinations. Form Cancel, correction/Undo, postponement Cancel and call cancellation remain distinct actions. Opening a different screen resets content scroll to the top and focuses the content region for keyboard/screen-reader users. Initial document load keeps the normal Skip-link tab order; same-screen preference updates retain scroll and return focus to the chosen control. Form validation still focuses the invalid field.

Manual text size (19/22/25 px), stronger contrast and more space combine. Text is not shrunk to fit. Fixed Today/Medicine/Visits/People navigation, Back, labeled Help/Settings and optional slow main-section swipes remain. Vertical scrolling and action/detail controls are excluded from gestures. Explicit Read aloud handles unavailable speech and uses no microphone or autoplay. Refresh restores saved care state/preferences where storage is available.

Secondary explanations are in Help. Essential information, confirmation/cancel/correction actions, call simulation and short reminder limitations remain visible. Not recorded is not proof medicine was not taken; correcting a record is not an instruction to take another dose.

Calls are previews; no real telephone/emergency service is contacted. Medicine/appointment details are fictional with no clinical integration. Scheduled, postponed and appointment reminders are demonstrated in the open page, approximately every 15 seconds, on opening/refresh and when the page becomes visible. Due/overdue occurrences remain available until recorded or the medicine is archived; postponement delays only that occurrence. Appointment reminders remain until acknowledged, edited or deleted. Browsers may delay checks. There are no closed-page/background notifications or claims of clinical reliability.

Personal fictional records use the device local calendar: active medicines generate one occurrence per day, including elapsed days when the page is reopened. Study samples keep the fixed fictional day Sunday, 25 October 2026 for equivalent tasks. Sample scheduled reminders use that day and the current local clock time; postponed delays use elapsed real time. This is a prototype, not a prescription system. Clock/timezone changes can affect calendar/reminder interpretation; a schedule is not clinically verified. There is no backend, account, authentication, cloud storage, cross-device sync, PWA installation or offline app shell. The offline screen is a labeled design scenario. First load/reload require the server. Speech depends on the browser/device. No clinical safety or validated accessibility claim is made.

## Storage

State is JSON in this browser profile's **localStorage**:

| Key | Contents |
|---|---|
| `saha:v1:participant` | Personal fictional medicines, dated occurrences/history, appointments, contacts, preferences and screen |
| `saha:v1:scenario` | Separate participant study samples and frozen task settings |
| `saha:v1:workspace` | JSON string `personal` or `study`, selecting which store `/` displays |
| `saha:v1:studio` | Separate studio preview/scenario care state and preferences |
| `saha:v1:research` | Coded sessions, current session, active attempt, results and events |

There is no IndexedDB, server-side data-file store, database or external storage service. Data normally survives refresh/restart on the same origin/profile; clearing site data removes it. Unsaved form drafts and in-memory Back history are not restored. Care snapshots use schema version 2 while retaining the existing storage keys. Version 1 care data migrates without deleting medicine records, events, contacts, preferences or visit acknowledgement. Its original fixed-day medicine records remain dated 25 October 2026; later personal occurrences are separate. Damaged care data is kept unchanged and writes to that store are blocked. The studio can export a raw care backup. Migration cannot recover records already overwritten by an earlier build. CSV/JSON exports are independent downloads, not automatically imported or backed up.

Phone and laptop data do **not** synchronize. Same-browser windows at the same origin exchange localStorage events; different devices/profiles do not. `localhost:5173` and a LAN-IP URL have separate storage. Use invented details only. Store exports and any separate consent/identity link under course requirements; localStorage is not protected clinical storage.

Malformed research data blocks recording rather than overwriting earlier results. Export its raw saved backup before explicitly deleting study data. Earlier valid build records without session identifiers remain UNASSIGNED and exportable. Unavailable storage produces a visible warning; changes may last only while the page is open.

## Study sessions, export and reset

1. In the studio prototype select C, choose B/C text/contrast/spacing during untimed setup, and enable Optional swipes for availability. Participants may use buttons throughout. A keeps conventional 16 px text, smaller primary actions and denser cards. B/C share presentation, content, controls and routes, except gesture availability. All three share navigation structure; the experiment does not isolate navigation simplification. The plan lists exact differences.
2. In Evaluation lab create a coded session such as P01 and its allocated condition order. Use a separate PRACTICE/DEMO code for rehearsals. No names are needed. Session settings are frozen across all tasks, even if studio preferences change later. If settings must change, create a separately labeled session.
3. Select the actual A/B/C condition in the prototype. Prepare task opens a scenario-replacement review. Confirmation replaces only `saha:v1:scenario`, selects the study workspace and opens/reuses a separate participant window. Personal data and earlier study results are retained. The participant sees a short Study sample records label, with no researcher controls. The timer is still stopped.
4. Read the instruction, press Start timer and say Begin. Show only `/` to the participant. Four tasks stop at a checked destination and await assessment; appointment retrieval stops manually after the spoken response. Verify the outcome/comprehension and save unassisted, assisted or failed. Help counters convert a claimed unassisted completion to assisted. Record errors/help and notes consistently; logs cannot detect every error or unsuccessful physical swipe.
5. Export the selected session task CSV and event JSON. Filenames include participant code and unique session ID. Contents include code/ID, order, build, condition, frozen settings, effective gesture availability, timing, outcome and navigation counts. Verify file contents, save observations/questionnaires separately under the code, and export an all-sessions JSON backup.
6. Create the next coded session without deleting the previous one. Earlier results remain visible/exportable. Separate reviewed controls delete **all study sessions/events** or reset **studio and study data**. Both explain scope and offer Cancel; neither deletes personal records/preferences or unrelated storage. Export and verify before deletion. Use **Open personal records** in the studio after finishing/stopping a task to return `/` to its personal store. Personal interactions are not appended to study event exports. **Export raw care backup** downloads the three care stores for recovery; it is separate from coded-session exports and is not automatically imported.

Researcher and participant windows must share a browser profile/origin. A laptop studio cannot run a session on a separate phone. Pilot the window arrangement; use an observer stopwatch if switching windows adds overhead, and record the timing method. Restored active-task timestamps include time away, so flag interrupted attempts. Prototype arrival timing does not establish comprehension, ingestion, adherence or health outcomes.

## Checks

```powershell
npm.cmd run check
npm.cmd test
npm.cmd ci
npm.cmd run test:browser
npm.cmd run test:deployment
```

Browser tests use installed Google Chrome via Playwright. Alternatively run `npx.cmd playwright install chromium`, set `$env:SAHA_BROWSER_CHANNEL = 'chromium'`, then run browser tests. The runner starts the server if needed. Checks cover daily occurrence identity/rollover, future edits, archive history, appointment/contact CRUD, version 1 migration, personal/study isolation, corruption without overwrite, complete journeys, form recovery, combined settings, keyboard access, touch-event slow swipes/vertical scrolling, gesture boundaries, refresh/restore, exports/reset, B/C equivalence and 320/360/390 px largest-text layouts.

Pre-release checks passed: syntax, 22 unit/build tests, 46 existing source-browser tests plus four release journeys, and 48 existing local static-preview tests plus the same four release journeys. The release journeys use actual desktop Chrome at 1280 px and phone emulation at 320/360/390 px, with largest text, contrast and spacing combined. For current layout verification, see [NAVIGATION_VERIFICATION.md](docs/NAVIGATION_VERIFICATION.md): exact local URL/build, the Create appointment -> Save reproduction, measured header/title alignment, single-return checks, viewport bounds and full-screen before/after screenshots. Regression cases cover save/return, scrolling, refresh, direct entry, keyboard focus, create/edit Cancel and distinct recovery actions at 320/360/390 px and desktop width with largest text. Saved records and reminder state are compared before/after navigation. Live release verification is recorded separately from these local navigation checks.

These are developer checks using desktop Chrome touch emulation. Physical phones, Safari, assistive technologies and intended-user/pilot studies remain to be evaluated. Automated checks are not experimental participant results.

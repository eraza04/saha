# Saha — Phase 1 HCI submission

Saha is a running mobile-first prototype for fictional medicines, appointments and trusted contacts. It is manually customizable, with forest-green/off-white styling, short participant screens and optional Help. The studio, 22-screen atlas and interaction flows are preserved. Build: `saha-phase1-1.1.0`.

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

Verified production: [participant app](https://saha-lemon.vercel.app/) and [studio](https://saha-lemon.vercel.app/studio/), under `neuraai1/saha`. All 18 live browser checks passed on 25 October 2026. These public production links need no Vercel login; the unique deployment URL is protected. See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for the release record and access details.

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

Both medicines support explicit Record taken, duplicate prevention, confirmation, record review/correction and activity history. Postpone reminder stores a new timestamp without changing the prescribed schedule. Visits show full date, time, location and room, with persistent acknowledgement. Both fictional contacts support review/edit, validated saving, error recovery, cancellation and confirmed call previews.

Manual text size (19/22/25 px), stronger contrast and more space combine. Text is not shrunk to fit. Fixed Today/Medicine/Visits/People navigation, Back, labeled Help/Settings and optional slow main-section swipes remain. Vertical scrolling and action/detail controls are excluded from gestures. Explicit Read aloud handles unavailable speech and uses no microphone or autoplay. Refresh restores saved care state/preferences where storage is available.

Secondary explanations are in Help. Essential information, confirmation/cancel/correction actions, call simulation and short reminder limitations remain visible. Not recorded is not proof medicine was not taken; correcting a record is not an instruction to take another dose.

Calls are previews; no real telephone/emergency service is contacted. Medicine/appointment details are fictional with no clinical integration. Due postponed reminders are checked in the open page, approximately every 15 seconds and when it becomes visible. Browsers may delay checks. There are no reliable background alerts when the page is closed.

The fictional care day is fixed to Sunday, 25 October 2026; records do not roll into daily prescription schedules. There is no backend, account, authentication, cloud storage, cross-device sync, PWA installation or offline app shell. The offline screen is a labeled design scenario. First load/reload require the server. Speech depends on the browser/device. No clinical safety or validated accessibility claim is made.

## Storage

State is JSON in this browser profile's **localStorage**:

| Key | Contents |
|---|---|
| `saha:v1:participant` | Participant medicine state/activity, contacts, preferences, visit acknowledgement and screen |
| `saha:v1:studio` | Separate studio preview/scenario care state and preferences |
| `saha:v1:research` | Coded sessions, current session, active attempt, results and events |

There is no IndexedDB, server-side data-file store, database or external storage service. Data normally survives refresh/restart on the same origin/profile; clearing site data removes it. Contact drafts and in-memory Back history are not restored. CSV/JSON exports are independent downloads, not automatically imported or backed up.

Phone and laptop data do **not** synchronize. Same-browser windows at the same origin exchange localStorage events; different devices/profiles do not. `localhost:5173` and a LAN-IP URL have separate storage. Use invented details only. Store exports and any separate consent/identity link under course requirements; localStorage is not protected clinical storage.

Malformed research data blocks recording rather than overwriting earlier results. Export its raw saved backup before explicitly deleting study data. Earlier valid build records without session identifiers remain UNASSIGNED and exportable. Unavailable storage produces a visible warning; changes may last only while the page is open.

## Study sessions, export and reset

1. In the studio prototype select C, choose B/C text/contrast/spacing during untimed setup, and enable Optional swipes for availability. Participants may use buttons throughout. A keeps conventional 16 px text, smaller primary actions and denser cards. B/C share presentation, content, controls and routes, except gesture availability. All three share navigation structure; the experiment does not isolate navigation simplification. The plan lists exact differences.
2. In Evaluation lab create a coded session such as P01 and its allocated condition order. Use a separate PRACTICE/DEMO code for rehearsals. No names are needed. Session settings are frozen across all tasks, even if studio preferences change later. If settings must change, create a separately labeled session.
3. Select the actual A/B/C condition in the prototype. Prepare task opens a scenario-replacement review. Confirmation replaces participant care data at `/`, retains earlier study results, and opens/reuses a separate participant window. The timer is still stopped.
4. Read the instruction, press Start timer and say Begin. Show only `/` to the participant. Four tasks stop at a checked destination and await assessment; appointment retrieval stops manually after the spoken response. Verify the outcome/comprehension and save unassisted, assisted or failed. Help counters convert a claimed unassisted completion to assisted. Record errors/help and notes consistently; logs cannot detect every error or unsuccessful physical swipe.
5. Export the selected session task CSV and event JSON. Filenames include participant code and unique session ID. Contents include code/ID, order, build, condition, frozen settings, effective gesture availability, timing, outcome and navigation counts. Verify file contents, save observations/questionnaires separately under the code, and export an all-sessions JSON backup.
6. Create the next coded session without deleting the previous one. Earlier results remain visible/exportable. Separate reviewed controls delete **all study sessions/events** or **all Saha care/preferences/study data**. Each explains scope and offers Cancel. Export and verify before deletion. Saha reset preserves unrelated site storage.

Researcher and participant windows must share a browser profile/origin. A laptop studio cannot run a session on a separate phone. Pilot the window arrangement; use an observer stopwatch if switching windows adds overhead, and record the timing method. Restored active-task timestamps include time away, so flag interrupted attempts. Prototype arrival timing does not establish comprehension, ingestion, adherence or health outcomes.

## Checks

```powershell
npm.cmd run check
npm.cmd test
npm.cmd ci
npm.cmd run test:browser
npm.cmd run test:deployment
```

Browser tests use installed Google Chrome via Playwright. Alternatively run `npx.cmd playwright install chromium`, set `$env:SAHA_BROWSER_CHANNEL = 'chromium'`, then run browser tests. The runner starts the server if needed. Checks cover medicine transitions, session retention/migration, corruption, complete journeys, form recovery, combined settings, keyboard access, touch-event slow swipes/vertical scrolling, gesture boundaries, refresh/restore, exports/reset, B/C equivalence and 320/360/390 px largest-text layouts.

These are developer checks using desktop Chrome touch emulation. Physical phones, Safari, assistive technologies and intended-user/pilot studies remain to be evaluated. Automated checks are not experimental participant results.

# Saha mobile web app: Codex implementation handoff

## Goal

Turn the existing Saha interface studio into a usable mobile-first participant app for an HCI project. The intended users are older adults with motor difficulties, mild visual difficulties, or overlapping needs. The interface is manually customizable (adaptable), not automatically adaptive.

The included index.html, app.js and style.css are the actual existing studio source, including 22 screen designs, interaction logic, wireframe rendering, and a study rehearsal tool. Inspect and reuse them before introducing a framework or recreating screens.

## Phase 1: implement now

1. Preserve a working design studio at /studio/. Make / the participant-facing mobile app, reusing the interface and care-state logic.
2. The participant app must fill the browser viewport naturally on a phone. Remove the simulated phone bezel/status bar, desktop sidebar, studio annotations, condition selector, atlas and study controls from that route.
3. Keep fixed labeled navigation: Today, Medicine, Visits, People. Keep visible Back/Home routes where needed and a clear Help route.
4. Implement medication schedule, reminder, explicit taken record, postponement, confirmation, record review and correction. Prevent duplicate taken records. Postponing changes a reminder, not the prescribed medicine schedule.
5. Implement appointment list, full date/time/location details and reminder acknowledgement. Do not imply booking, scheduling or clinical integration.
6. Implement trusted contacts, review, edit validation, call confirmation and cancellation. Keep calls simulated in Phase 1.
7. Implement manually selected text sizes, stronger contrast and more space for controls. Settings can be combined. No inferred disability or automatic rearrangement.
8. Keep gestures optional. Left/right navigates only between the four main sections; buttons perform all the same navigation. Gestures never mutate a medication record, initiate a call, or conflict with vertical scroll. Support slow deliberate swipes.
9. Explicit Read aloud is optional and should fail gracefully. Do not enable microphone recording, voice recognition, or autoplay audio.
10. Save fictional care state and preferences locally on the device/browser for this prototype. Handle corrupted/unavailable storage. Namespace data; provide a clearly labeled reset in the researcher view. Do not store real patient data.
11. Keep the A/B/C comparison and task/event export in a separate researcher/studio view. A is a reasonable conventional baseline, B has accessible controls with buttons, and C uses exactly B's selected settings plus optional gestures.
12. Use neutral language: not recorded is not proof medicine was not taken. Correcting a record is not an instruction to take another dose.
13. Keep the forest-green/off-white visual direction, clear typography and limited options. No health dashboards, symptom diagnosis, medicine recommendations, AI chatbot, shopping, streaks or unrelated features.
14. Preserve a simple local run command and document it. The current dependency-free node server is sufficient unless a specific need justifies a change.
15. Run appropriate checks. If browser testing is available, verify the core flows, actual swipes, keyboard access, form-error recovery, text reflow and phone-width layout. If browser testing is unavailable, state that accurately.
16. Add a short implementation summary and remaining limitations to README.md. Tell the user the exact active worktree path and local preview URL.

## Screen set to preserve and organize

- Welcome, comfort setup, optional gesture practice.
- Today.
- Medicine schedule, reminder details, recorded confirmation, postpone choices, postponed confirmation, activity record.
- Appointment list, appointment details, appointment reminder.
- Trusted contacts, contact details, call confirmation, call preview, contact editing.
- Comfort settings.
- Unrecorded medicine state, empty appointment list, offline-design scenario.

Distinguish a rendered scenario from a truly working platform capability.

## Target interface specifications

- Test at 360 px and 390 px viewport widths and a narrower width if feasible.
- 19 px default content base, with larger text options; relative sizing and wrapping for supporting labels.
- Primary actions at least 56 px high, roomier mode 66 px; top controls at least 44 px.
- Avoid horizontal overflow at the largest text size.
- Consistent focus states, semantic labels and no color-only status.
- Respect reduced-motion settings.
- Persistent confirmations and correction paths; no critical action depends on a temporary toast.
- No forced long press, drag, multi-finger interaction or precision slider.

## Phase 2: only after Phase 1 works

- Add PWA manifest, icons and an appropriately scoped service worker.
- Serve over HTTPS for real installability/capability testing.
- Add an offline app shell with clear cache and update behaviour.
- Test installation on the intended phones. Do not equate an offline scenario screen with actual offline capability.

## Phase 3: separate decision

Reliable background medication reminders, web push, real phone integration, caregiver invitations, remote health records, account authentication and secure clinical data handling need separate requirements and implementation/testing. Do not pretend browser setTimeout provides reliable reminders when the page is closed.

## Research boundaries

This is an exploratory usability prototype. No clinical claims, real emergency calls or claims of validated accessibility. Participants must see only the participant UI during timed tasks. Keep preferences identical between B and C and record configurations and build versions.

## Reference patterns

- Apple Health: medication reminders and explicit dose logging — https://support.apple.com/en-ie/105064
- Medisafe: trusted-person support — https://medisafe.com/download-the-app
- MyChart: upcoming appointments and structured details — https://www.mychart.org/l/en-us/explore/

These are interaction references, not designs to copy or integrations to claim.

# Local review fixes: 1.4.0

The supplied Claude screenshot review is AI-assisted feedback, not a participant study. This records the local 1.4.0 review stage before release; production status is checked separately at deployment handover. The current four-tab layout was retained rather than redesigned from a laptop screenshot.

## Behavior and data

- Medicine display states derive from the clock: Upcoming before the effective reminder time, Due now for 30 minutes, then Missed reminder. Taken only follows explicit recording. A missed reminder does not establish actual ingestion or non-ingestion. No automatic health inference is stored.
- Snooze keeps the original schedule and replaces only that occurrence's reminder time. Skip requires confirmation and marks that reminder skipped; it records no ingestion and can be restored. IDs, dated history and other records persist unchanged.
- Next up selects the earliest unresolved current-day medicine or current/upcoming visit using effective snooze timing. Today holds the other current-day reminders. Older medicine occurrences remain in the record. Automatic reminders are absent from other screens.
- Visits and appointment alerts share one current/upcoming set, including a 30-minute prototype display window after the scheduled start. Later appointments move to Past appointments and stop generating automatic banners. This is a display convention, not an attendance or clinical-duration assertion.
- Read aloud remains in the header while content scrolls. Four labeled navigation tabs remain reachable at 320 px. Helper/navigation/essential-input floors and 48 px targets are shared across conditions. Dark mode, saved drafts and optional dictation remain available.
- Call and Message on People are explicitly simulated. Calls require confirmation; message previews use escaped text, validate empty input and are excluded from snapshots/research payloads. No backend, real messaging or background reminders were added.
- Fresh sample names are Vitamin D (demo) and Cetirizine (demo). Existing saved records and legacy historical names are preserved; no doses or treatment schedules are recommended.

## Verification

New unit cases cover due/missed boundaries, explicit taken state, skip/restore persistence, snooze timing, Next up ordering and matching visit/reminder windows, including the fixed study calendar. New browser cases exercise clock advances without reload, refresh, focus retention, Today-only reminders, simulated contact actions, keyboard operation and layout at phone/desktop widths. Existing CRUD, migration, voice, draft, dark-theme, gesture, parent-return and study-data checks are retained.

Lighthouse 12.8.2 audits run locally in isolated Chrome storage at a 320 x 740 mobile viewport on Today, Medicine, Visits, People, an appointment form, dark Today, a dark medicine form and dark Settings. JSON reports and the audit summary are stored in ignored `playwright-report/review/`. These are automated scores, not full WCAG AA conformance or participant results. Source report generation keeps documents, browser profiles, credentials and research exports out of the eight-file public build.

Remaining manual work includes VoiceOver/TalkBack/NVDA sessions, physical devices and virtual keyboards/cutouts, real speech-service behavior and intended-user feedback. Calls/messages stay simulated, and reminders require the page to be open; the browser may delay checks. The latest source/packaged test counts and measured Lighthouse scores are recorded at handover.

## Recorded local checks (1 November 2026)

- `npm run check`: passed. `npm test`: all 31 unit/build checks passed on the final source, including the eight-file output allowlist.
- Full source browser run: 69 passed. Full packaged browser run: 71 passed. After the final study-clock ordering, keyboard-only case and expanded screen coverage, all 20 focused packaged `comfort.spec.js` / `review.spec.js` checks passed. These counts overlap and are not a count of independent participants or experiments.
- Lighthouse accessibility: 100/100 on each of the eight audited light/dark snapshots listed above. No failing scored accessibility audits were reported. Lighthouse does not check every WCAG requirement.
- Chrome emulation checked 320/360/390 px and desktop widths, largest text with contrast/spacing/dark mode, explicit parent returns, keyboard focus and activation, form recovery, clock transitions, refresh, gestures and saved-state preservation. The final focused run used the built frontend at `http://localhost:5175/`; that test server stops with the run. No physical phone or human screen-reader session was conducted.
- Screenshots from `http://localhost:5173/`, build `saha-phase1-1.4.0`, use largest text. At 320/390/1280 px, measured content width did not exceed its available width, all four tabs remained inside the viewport, and Read aloud stayed visible after scrolling. Full viewport images: [320 px Today](../playwright-report/review/phone-today.png), [320 px People](../playwright-report/review/phone-people.png), [390 px dark Today](../playwright-report/review/dark-phone-today.png), [desktop Today](../playwright-report/review/desktop-today.png). Screenshots/reports are local ignored artifacts, not public deployment files.
- `git diff --check`: passed. At the end of the local review task, no commit, push or deployment had been performed. Deployment was authorized in a later request. Current source preview: `http://localhost:5173/`; studio: `http://localhost:5173/studio/`. Project: `C:/Users/ezanr/orca/projects/hci-project`.

## Release preparation

On the subsequent authorized release request, syntax and all 31 unit/build checks passed again, followed by all 72 packaged Chrome browser checks (3.8 minutes). The existing Git and Vercel targets and exact 13-file source upload allowlist were rechecked before release. Deployment readiness, the pushed commit and public-route verification are reported separately in the release handover.

# Saha Phase 1 running demonstration

This is a presenter script for the course submission, separate from a participant experiment. Use invented data. Do not describe this demonstration as completed participant testing or results.

## Setup

1. In `C:\Users\ezanr\orca\projects\hci-project`, run `npm.cmd run dev` (or `npm run dev` on macOS/Linux).
2. Open the participant app at http://localhost:5173/ and the studio at http://localhost:5173/studio/. Keep the researcher window outside participant view for any timed rehearsal.
3. If previous study data exists, export the relevant session CSV/JSON and an all-sessions backup before considering reset. Reviewed reset is in Evaluation lab. It explicitly deletes local care/preferences/study data; Cancel preserves it.
4. For an ordinary demo, interact directly with the participant app. To demonstrate study tools, use a distinct `DEMO` session code, not a participant code. The fresh-scenario preparation warning explains what is replaced. Existing results remain stored.

## Function 1: medicine records and reminders

Open Medicine, select Medicine A, and point out its scheduled 9:00 am time. Say: “For this fictional scenario, the person has already taken the medicine.” Press Record taken. Show the persistent confirmation, then View record and Correct record. Confirm that its state becomes Not recorded as taken and that activity history retains the correction. Explain: “A correction changes the record. It is not an instruction to take another dose.” A recorded dose cannot receive a duplicate taken entry without an explicit correction first.

Open the reminder again, choose Postpone reminder, then 20 minutes. Show the confirmation's reminder timestamp and original 9:00 am schedule. Explain that postponement changes a reminder, not a prescription. It is an in-app demonstration: due postponed reminders are checked while the page is open, browsers can delay checks, and there are no reliable background notifications when the page is closed.

## Function 2: appointment information

Choose Visits and open Dr. Sara Ahmed. Read the actual details: Tuesday, 27 October 2026, 10:30 am, Community Health Centre, ground floor, Room 04. Open View reminder and acknowledge it. Return to the details and show the acknowledgement. Explain that this does not book, reschedule, confirm attendance or contact a clinic.

## Function 3: trusted contacts

Choose People, then Nida. Show the relationship and fictional number. Open Call preview and show the distinct confirmation. First press Cancel. Reopen it and press Start preview, then End preview. Explain that no telephone service, emergency service or actual contact is called. Optionally show Edit contact: submit a missing name or invalid number, show the persistent error, correct it and save. Cancel discards unsaved changes.

## Combined accessibility and navigation

Open Settings. Select Largest text, Stronger contrast and More space together. Do not shrink text. Demonstrate scrolling and the fixed labeled navigation at phone width. Refresh and show the saved settings and care state. Explain that choices are manual, can be combined, and do not rearrange sections.

In condition C, enable Optional swipes. Make a slow left swipe on blank Today content to reach Medicine, then use the labeled navigation buttons. Demonstrate that vertical scrolling still works. Swipes on medicine details or call confirmation do not change records or initiate a preview. Buttons provide every destination. Help contains optional explanations and a Trusted people route; Read aloud is explicit and browser-dependent.

## Study-tool rehearsal and submission materials

In the studio, set B/C comfort choices while in C and enable optional swipes for availability. Create coded DEMO session with a listed condition order. Select A, B or C in the prototype. In Evaluation lab, prepare a task, review and confirm scenario replacement, read its instruction, then Start timer. The participant sees only `/`. For destination tasks, show that arrival stops timing but waits for researcher assessment; appointment answers need manual stopping and assessment. Record help/errors and save an outcome, including assisted or failed attempts where appropriate.

Export that session's task CSV and event JSON and inspect the code, session ID, build, condition, order and settings. Creating another coded session retains earlier results. B and C receive the same frozen presentation settings and controls, with only optional gesture availability differing. The four-section navigation is shared with A, so the comparison does not isolate navigation simplification.

Show [EXPERIMENTAL_PLAN.md](EXPERIMENTAL_PLAN.md), [TASK_SCRIPT.md](TASK_SCRIPT.md), [OBSERVATION_SHEET.csv](OBSERVATION_SHEET.csv) and [POST_TEST_INTERVIEW.md](POST_TEST_INTERVIEW.md). State that recruitment, pilot and main experiments are planned; no findings or approval are claimed.

Close by explaining that data is localStorage on this browser. There is no phone/laptop synchronization, backend, account, PWA installation or real offline app shell. A phone may load the app over the same Wi-Fi using the printed network address, but its records and study session are independent. The fictional care day and records do not roll into real daily prescriptions.

# Saha Phase 1 running demonstration

This is a presenter script for the course submission, separate from a participant experiment. Use invented data. Do not describe this demonstration as completed participant testing or results.

## Setup

1. In `C:\Users\ezanr\orca\projects\hci-project`, run `npm.cmd run dev` (or `npm run dev` on macOS/Linux).
2. Open the participant app at http://localhost:5173/ and the studio at http://localhost:5173/studio/. Keep the researcher window outside participant view for any timed rehearsal.
3. If previous study data exists, export the relevant session CSV/JSON and an all-sessions backup before considering reset. Reviewed reset is in Evaluation lab. It explicitly resets studio/study data while keeping personal records and preferences; Cancel preserves everything.
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

Close by explaining that data is localStorage on this browser. There is no phone/laptop synchronization, backend, account, PWA installation or real offline app shell. A phone may load the app over the same Wi-Fi using the printed network address, but its records and study session are independent. Personal fictional medicines roll into separate local daily occurrences; study samples keep the fixed 25 October 2026 day. None are clinical prescriptions.

## Record-management demonstration (build 1.2.2)

Use Open personal records in the studio after saving/stopping any task. In Medicine choose Add medicine, enter a fictional name and daily reminder time, then Save. Show Cancel and validation. Record today as taken, review its date, edit the medicine and show that a changed time starts tomorrow. Archive it only after showing the confirmation/Cancel; open View all records to show retained history and correction.

In Visits choose Add appointment, enter a fictional clinician/title, date, time, location/room and reminder choice. Add another date and show chronological ordering. Show Edit, Save/Cancel and the separate Delete confirmation. This never changes a clinical booking. In People choose Add contact, save a fictional name, relationship and number, then demonstrate the existing edit and simulated call confirmation.

Keep Largest text, Stronger contrast and More space combined while trying the forms. All record actions are also available in A/B/C; C adds only optional main-section swipes. A scheduled in-page reminder becomes ready while the page is open and remains due after refresh. Closed-page/background reminders are unsupported. Task preparation replaces only study samples; reset studio/study data and then show that personal records remain. Exports/downloads stay local and need separate handling.

## Explicit return navigation

After saving a medicine, show its saved details and the header's Back to Medicine action. Open its reminder, scroll the content and use Back to Medicine again without recording or postponing it. After saving an appointment, show the single header Back to Visits action aligned with the title. Scroll and show that the header and bottom navigation remain fully visible, with no duplicate Back in the content. Compare the alignment on desktop and a narrow phone with largest text. Open View reminder, scroll, and use Back to appointment; this does not acknowledge the reminder. Refresh a detail/reminder page and demonstrate the same explicit return.

On create/edit forms, point out the header's persistent Cancel action before and after scrolling. Adding cancels to the relevant section list; editing cancels to that saved record. The app header and Today/Medicine/Visits/People navigation stay outside the scrolling content. New screens start at the top with content focus after in-app navigation; invalid forms focus the invalid field. These controls and destinations are the same across A/B/C.

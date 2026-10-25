# Saha task script — planned sessions

Use this script after the instructor's consent/research requirements are checked. It describes planned work and contains no participant results. Use fictional data only. The app and this script target build `saha-phase1-1.1.0`.

## Standard introduction and practice

Read: “We are testing Saha, not you. All medicines, visits and contacts here are fictional. Do not take medicine or make a real call. You can stop or take a break at any time. Please work in your usual way. I will ask about your experience after each task.”

In untimed practice, explain Today, Medicine, Visits, People, Back, Help and Settings. Give equivalent opportunities to find a section and return in each condition. In C, demonstrate one slow horizontal swipe on blank main-section content and offer practice in both directions. Say: “You may use swipes, buttons, or both. You do not have to use swipes.” Do not require a successful swipe to proceed. Record the practice provided. Agree the number/duration of practice opportunities after the pilot and apply it consistently; record extra assistance. Practice must use a separate PRACTICE code or an external practice record, not the main timed session.

Choose readable text, contrast and spacing with the participant during untimed setup. Enable optional swipes in C for availability; the participant may still use buttons throughout. Record the shared B/C settings. Create the main coded session after practice and configuration selection. Allocate its condition order as specified in the plan.

## Common task protocol

For each task, select the condition outside the participant's view. Click Prepare task, review the replacement warning and confirm. This replaces the participant scenario with fresh equivalent fictional records and the session's frozen configuration; it does not delete earlier study results. The timer is not running yet. Ensure only `/` is visible to the participant. Do not show studio controls, codes or observations during timed work.

Read the task instruction exactly. Resolve hearing or wording questions before timing without pointing to controls. Press Start timer and say “Begin.” Record any delay from switching between researcher and participant views. If the setup cannot separate that delay, use an observer stopwatch, document it and record actual participant start/stop times in the sheet. The phone and a separate laptop do not share study data.

The provisional maximum is **120 seconds per task**, to be finalized after the 2–3-user pilot and before the main study. Stop sooner if the participant requests it, becomes uncomfortable, clearly declines to continue, or a technical problem prevents progress. Stop the timer before retrospective questions. Record elapsed time, outcome and reason; retain unsuccessful attempts. A task cancelled before timing is marked `notStarted` in exports and noted separately.

One error is a discrete wrong selection, unintended state change, or an unsuccessful navigation attempt toward the task goal. A repeated action after feedback counts again; one continuous failed swipe counts once. Exploration is not automatically an error. Record the task-specific examples below and a short description. Avoid double-counting one action as multiple errors. Recognized event logs are supporting evidence, not a complete error detector.

One help event is one task-specific intervention, such as naming a control, pointing, explaining a route or physically guiding an action. If help is requested, say first: “Would you like a hint, or would you prefer to continue?” Count a supplied hint, not merely the request. Use a standardized least-to-most help sequence: repeat the goal, name the relevant section, then identify the action if requested. Any task-specific repeat/hint after timing starts is counted as assistance. General reassurance and an agreed break are noted but not task help. A correct task with any task-specific assistance is assisted completion. An incomplete/incorrect attempt at stopping is failed. Technical interruptions are flagged separately and may require a fresh explicitly labeled attempt.

For the four destination tasks the app stops on a checked interface destination but does not save success automatically. Verify the outcome, record any comprehension issue and save the researcher assessment. For appointment retrieval, stop manually after the spoken answer or the participant's indication of completion. If interface-arrival and observed completion times differ, retain both in the sheet. Ask afterward: “What were you trying to do?” and “Was anything unclear?” Avoid coaching during timing.

## Task 1 — record medicine already taken

**Read:** “The scenario says you have already taken Medicine A, scheduled for 9:00 am. Record this in Saha.”

**Start:** Today; Medicine A and B have no taken records; no postponement. **Success:** Medicine A has exactly one explicit taken record for the 9:00 am schedule, and the participant reaches its recorded confirmation. Opening a reminder alone is insufficient. **Timing:** start at Begin; automatic stop at the checked taken-confirmation destination. Verify the state before saving outcome.

**Errors:** choosing Medicine B, postponing instead, interpreting opening a reminder as recording, or correcting the entry before completing. Wrong-section selections are counted if clearly unintended. **Assistance:** apply the common help rules; naming Record taken is a hint. **Stop:** success, participant request/discomfort, technical interruption or provisional 120 seconds. The task never asks the participant to ingest medicine. Do not correct the record during this timed task; demonstrate correction separately if needed.

## Task 2 — postpone a reminder

**Read:** “Set the Medicine A reminder for 20 minutes from now. Do not record it as taken.”

**Start:** Medicine A reminder; no taken record or existing postponement. **Success:** a 20-minute postponement is confirmed, with the original 9:00 am schedule unchanged and no taken record. **Timing:** Begin to correct postponed confirmation; the app checks the selected duration. An incorrect delay does not stop timing automatically.

**Errors:** choosing 10 or 30 minutes, recording taken, changing the wrong medicine, or saying the medicine schedule changed. Record any mistaken interpretation separately from UI actions. **Assistance:** apply the common rules; naming a duration button is a hint. **Stop:** common rule and provisional 120 seconds; retain wrong-delay and unsuccessful attempts.

## Task 3 — find appointment details

**Read:** “Find the next appointment. Tell me its full date, time, location and room.”

**Start:** Today; the same fictional upcoming visit is available. **Success:** participant states Tuesday, 27 October 2026, 10:30 am, Community Health Centre, ground floor, Room 04. Accept equivalent spoken wording, such as “room four.” Record omitted/wrong components. Merely reaching visit details is not success.

**Timing:** Begin until the participant finishes the answer or says they have finished; researcher presses Stop timer and review. Verify comprehension before saving the outcome. **Errors:** wrong date/time/room/location, treating a reminder acknowledgement as booking, or unintended navigation. **Assistance:** asking for a missing detail after the participant declares completion is task-specific assistance; do not silently convert an incomplete answer into unassisted success. **Stop:** common rule and provisional 120 seconds.

## Task 4 — find call confirmation

**Read:** “Find Nida and reach the screen where you can confirm or cancel a call. Do not start the preview.”

**Start:** Today; fictional contacts are Nida (Daughter, 0300 000 0000) and Omar (Son, 0300 000 0001). **Success:** Nida's call-confirmation screen shows her name and number, with Start preview and Cancel available; no preview has started. **Timing:** Begin to the checked Nida confirmation destination. Verify the selected person before saving.

**Errors:** selecting Omar as the final contact, reaching contact details only and declaring completion, or starting a preview. No real call is possible. If the participant continues into preview after automatic stopping, record that boundary error and assess the attempt accordingly rather than accepting the destination automatically. **Assistance:** apply the common rules. **Stop:** common rule and provisional 120 seconds. After recording the result, cancel outside timing to leave a safe state.

## Task 5 — return to Today

**Read:** “You are viewing appointment details. Return to Today.”

**Start:** Dr. Sara Ahmed's appointment detail screen. **Success:** Today is visible. Any valid visible route is acceptable. **Timing:** Begin to Today arrival. **Errors:** ending in another main section or an unintended action; trying a swipe on this detail screen and finding it unavailable is recorded as an unsuccessful attempt, not a medicine/call mutation. **Assistance:** apply the common rules. **Stop:** common rule and provisional 120 seconds.

## After each condition and session

Administer the standard SUS after each condition, then use retrospective prompts from [POST_TEST_INTERVIEW.md](POST_TEST_INTERVIEW.md). Offer breaks. Keep assisted and failed attempts visible. Record actual physical swipe attempts in observation notes, including unsuccessful ones; automatic logs only count recognized navigation.

Export the selected session task CSV and event JSON. Verify participant code, session ID, build, order and B/C settings. Save observations/questionnaires separately under the same code in the course-approved location. Export an all-sessions backup. Creating the next coded session keeps earlier records; do not delete them merely to start another participant. Reviewed deletion is only for the agreed data-handling process after exports have been verified.

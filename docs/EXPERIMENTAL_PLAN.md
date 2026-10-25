# Saha: planned exploratory usability experiment

This document describes intended work for the Phase 1 HCI course submission. No recruitment, pilot sessions, participant testing, results or research approval are claimed. The running prototype and the planned experiment are separate deliverables. The current study build is `saha-phase1-1.2.2`; the build and configuration used in each actual session will be recorded.

## Aim and research questions

Saha is a manually customizable care interface for older adults. It uses fictional medicine schedules, appointment details and trusted contacts. The study will ask:

1. Does the accessible interface improve usability compared with the conventional baseline?
2. Does optional gesture navigation provide additional benefits when the accessible interface is otherwise unchanged?

The first comparison will be A versus B. The second will be B versus C. We will not assume that gestures help everyone or that faster prototype interaction improves health outcomes.

## Implemented conditions

The conditions use the same screen renderer, fictional records, task logic, wording, Help, simulated calls and record-correction routes. All conditions also allow adding/editing fictional medicines, archiving medicines while retaining dated occurrence history, appointment add/edit/delete and contact add/edit. Those management actions are not additional differences between A/B/C. All have four labeled navigation buttons in the same order: Today, Medicine, Visits, People. All conditions share the same explicit parent returns: one header return aligned directly above the content title: Back to Visits on appointment details, Back to appointment on reminder review, Back to Medicine on medicine screens/records, Back to People on contacts and Cancel on record forms. Header and content share the same responsive column; redundant in-content return buttons are removed. Distinct cancellation and correction actions are retained. The global header and bottom navigation stay outside the scrolling content. Saving opens the saved record. Returning does not acknowledge a reminder or change its contents. These navigation cues are shared and are not a condition difference. Settings are selected manually; the app does not infer disability or rearrange sections.

| Implemented feature | A: conventional baseline | B: accessible buttons | C: accessible with optional gestures |
|---|---|---|---|
| Content base size | Fixed 16 px | Selected 19, 22 or 25 px | Exactly B's selected size |
| Primary action minimum height | 44 px | 56 px; 66 px with More space | Exactly B |
| Top control minimum height | 44 px | 44 px | 44 px |
| Main navigation minimum height | 54 px | 64 px; 72 px with More space | Exactly B |
| Task card minimum height | 64 px, 12 px padding, 9 px corners | 78 px, 17/13 px padding, 14 px corners; More space uses 91 px, 20/15 px padding | Exactly B |
| General card presentation | 15 px padding, 10 px corners | 18 px padding, 18 px corners; hero cards use 20 px padding | Exactly B |
| Primary button corners | 8 px | 13 px | 13 px |
| Heading scaling | Main heading 1.5 times content size; hero heading 1.2 times | Main heading 1.58 times; hero heading 1.4 times | Exactly B |
| Text and background choices | Fixed baseline palette; selected contrast/spacing/size classes are not applied | Selected default or stronger contrast; selected spacing | Exactly B's colors and spacing |
| Small navigation/top labels | Baseline 11 px / 13 px | Relative to selected content size | Exactly B |
| Horizontal swipes | Disabled | Disabled | Optional between main sections only |

Some controls, such as form fields and several supporting controls, share dimensions across conditions. The table lists CSS minimum heights; padding, icons, wrapping and text can make actual controls taller. For example, the current Record taken button measures 50 px in A, despite its 44 px CSS minimum. A is a conventional package of smaller text/actions and denser cards, not a claim that all of its controls are 44 px. Both B and C retain the same controls and destinations; swipe-related controls are unavailable in A/B and available in C. During timed tasks, comfort choices are locked in all conditions. Navigation buttons remain available in C, and choosing only buttons is valid.

The actual styles and condition classes are in `style.css`, `participant.css` and `app.js`; shared screen content is in `participant-screens.js`. A's shell background/soft color are `#fafbfa` / `#eef2ed`; B/C use `#fbfcf8` / `#e6eee2` by default. Stronger contrast is a shared B/C option. As navigation structure is shared, this experiment does **not isolate navigation simplification**. A/B differences must be interpreted as the combined accessible presentation package.

Before creating a session, we will choose comfortable B/C settings with the participant during untimed setup. Optional swipes must be enabled in C to make them available, but their use will never be required. The session stores one frozen configuration and applies it to every task. It will not be changed between B and C. If a participant needs different settings later, we will stop, document the change and treat a restarted session separately rather than pool mismatched comparisons.

## Participants and recruitment

We intend to recruit adults aged 60 or over who report motor difficulties and/or mild visual difficulties relevant to smartphone use. We will record overlapping difficulties, smartphone experience, and usual glasses or other visual aids using participant codes. We will not infer a diagnosis from app use or require medical records. Participants may use their usual visual aids, with their use recorded consistently across conditions.

The provisional main-study target is 12–16 participants, subject to recruitment and course requirements. This is an exploratory course study. The target is not based on a statistical power calculation. We plan to pilot with 2–3 intended users before the main study. Pilot data will be labeled separately and will not be pooled with the main comparison if tasks, build or procedure change.

Before recruitment, we will check the instructor's consent, participant information, research review and data-handling requirements. No approval has been obtained or implied by this plan. Participation will be voluntary, with a right to decline questions, take breaks or stop. These are fictional tasks; no medicine will be taken and no real calls made.

## Design and controls

Each participant will try all three conditions. The six orders are ABC, ACB, BAC, BCA, CAB and CBA. We will distribute them as evenly as feasible within the recruited motor, visual and overlapping-difficulty groups. Group sizes may be small or uneven; actual allocation and deviations will be reported. Smartphone experience will also be recorded rather than treated as an unmeasured explanation.

Within each participant, we will use the same phone, browser, orientation, browser zoom, input method and environment. The researcher tools and participant window must use the same browser profile and origin to share study state. A laptop studio cannot control a separate phone's localStorage. If only one phone is available, the researcher will prepare/time tasks outside participant view and then show only the participant route; a separate stopwatch and observation sheet will record timing where switching windows adds delay. The pilot will establish a feasible setup. We will record the actual device and timing method.

Every task starts with equivalent fresh fictional records. Preparing a task replaces only the separate study samples; it retains personal records and earlier study results. The same five tasks and wording will be used in each condition, provisionally in the listed order. Repetition can produce learning; counterbalancing condition order and equivalent practice reduce, but do not remove, this limitation. We will not use concurrent think-aloud during timed tasks. Retrospective questions will follow each attempt.

We provisionally allow 5–8 minutes for consent/background, 5–8 for setup/practice, 8–10 per condition including its questionnaire, two breaks of 2–3 minutes, and 5–8 minutes for a final interview: approximately 45–60 minutes. Breaks may be longer or more frequent. We will finalize session length, task limits and stopping rules after the pilot, before main data collection.

## Tasks and timing

The exact read-aloud instructions, starting states, success criteria, task-specific errors, assistance rules and provisional 120-second stopping limit appear in [TASK_SCRIPT.md](TASK_SCRIPT.md). The five tasks are:

1. Record Medicine A as taken when the scenario explicitly states it has already been taken.
2. Postpone its reminder by 20 minutes without recording taken.
3. Find the next appointment's full date, time, location and room.
4. Find Nida and reach call confirmation, without starting a preview.
5. Return to Today from appointment details.

The researcher will prepare the state, read the instruction, press Start timer and say “Begin.” Preparing is separate from timing. For four tasks, the prototype stops its timer at a checked destination and waits for researcher outcome assessment. For the appointment task, the researcher stops after the participant provides the answer or indicates completion. The researcher may stop any running attempt manually. We will use a stopwatch when necessary and record the reason and timing method; we will not treat window-switching overhead as participant interaction time.

An interface arrival is evidence of navigation, not comprehension. The researcher must verify the correct record, reminder, selected person or spoken appointment response before saving the outcome. The app does not automatically classify these arrivals as successful experiments. Its result label `completed` means a researcher-saved unassisted completion; `assisted` and `failed` remain in the data. The observer will record wrong turns and accidental actions consistently; automatic event logs do not detect every error. Help/error buttons are counters, not automatic judgments.

## Measures

The primary measure will be unassisted task completion: correct completion without task-specific help before the stopping rule. We will report the number attempted and the number completed unassisted by condition and task, and participant-level proportions with denominators. Not-started or interrupted attempts will be identified separately with reasons rather than silently treated as ordinary timed failures.

Secondary measures will be completion time, defined errors, help count, System Usability Scale (SUS), actual gesture usage, and preference with reasons. We will retain assisted and failed attempts, including their elapsed time and stopping reason. We will distinguish time to interface arrival from researcher-assessed completion where they differ, and record a separate observed time in the observation sheet when needed.

After each condition, we intend to administer the same standard 10-item SUS with unchanged wording and response format, using a suitable approved language version if needed. We will pilot comprehension and record any reading assistance. Standard scoring subtracts 1 from odd-item responses, subtracts even-item responses from 5, and multiplies the total by 2.5; the resulting 0–100 score is not a percentage. Missing responses will be reported and not silently imputed. The instrument and scoring source is [Brooke (1996), *SUS: A quick and dirty usability scale*](https://hci-studies.org/methods-and-measures/downloads/SUS_Brooke1996.pdf).

Gesture usage will be measured as recognized swipe navigations and button navigations during each timed attempt, plus observer notes about attempted but unrecognized swipes and vertical scrolling. Event logs record recognized navigation only. They cannot establish how many physical swipe attempts failed. Preference will be discussed separately from performance; zero gesture usage in C is a valid observation.

## Procedure

1. Confirm course requirements, participant information and consent before recruitment/testing. Assign a code; keep consent and any identity link separately from observations.
2. Ask brief background questions about overlapping difficulties, phone use and usual visual aids. Record device, condition order, build and environment.
3. Provide standardized untimed practice in each condition using the same number of practice opportunities. Explain visible buttons in all conditions and optional slow swipes in C. Use a practice session code and export it separately. Freeze the main B/C comfort configuration before creating the main coded session.
4. Present each condition in its allocated order. Prepare and run each task using the task script. Record outcome, errors, assistance, navigation method, interruptions and retrospective comments.
5. Administer SUS after each condition, followed by short neutral retrospective questions. Offer a break before the next condition.
6. Conduct the final comparison interview. Export that participant's session task CSV and event JSON, the observation sheet and questionnaires. Verify code, session ID, build and settings before beginning the next coded session.

## Planned analysis

We will compare paired A/B and paired B/C observations within participants, separately for each task and overall completion proportions. We will display individual paired differences, counts, medians, ranges and distributions of time/errors/help alongside condition summaries. Any exploratory statistical test or interval method will be chosen and documented after the pilot and before main analysis, considering the small sample and missing data. We will not claim confirmatory statistical power or select tests only because they produce favorable results.

Completion-time summaries will state whether they include unassisted, assisted, failed or timed-out attempts. We will not remove difficult attempts to make a condition appear faster. Outcomes with missing measurements, interrupted sessions and configuration changes will be reported. Group comparisons will be exploratory, especially for overlapping difficulties and smartphone experience. We will describe variation, order/learning effects, recruitment bias and uncertainty, not only averages. Retrospective interview notes will be grouped into recurring reasons, with contrary views retained and quotations anonymized if consent permits.

These measures concern short prototype tasks. They cannot establish real medicine ingestion, adherence, clinical safety, appointment attendance or improved health. The fixed fictional records, simulated calls, foreground-only reminders, browser/device differences and small course sample limit generalization.

## Data handling and session separation

Only participant codes and fictional care information will enter Saha. Background answers and consent will be recorded separately under the instructor's requirements. We will decide access, retention, deletion dates and withdrawal handling before recruitment and tell participants; this document does not invent an approved retention policy.

Application state uses this browser's localStorage: `saha:v1:participant` for personal fictional records/preferences, `saha:v1:scenario` for participant study samples, `saha:v1:workspace` for the selected personal/study workspace, `saha:v1:studio` for separate studio previews, and `saha:v1:research` for coded sessions, active attempts, events and results. Version 1 care snapshots migrate to version 2 while keeping prior records and history. Personal daily occurrences use local calendar dates; study samples stay on 25 October 2026 to preserve equivalent task records. Scheduled sample reminders use that fixed day and the current local clock time; postponed delays still use elapsed real time. We will record device clock/timezone and use the same setup for each condition. There is no backend, account, database, cloud backup or cross-device sync. Different devices, browser profiles and origins have separate data. Refresh normally restores saved state; clearing site data removes it. Raw localStorage is not clinical or encrypted study storage.

The researcher creates a coded session with its condition order and frozen configuration. Each event/result is associated with a session; session exports have code/ID filenames and include build, condition and settings. Creating another session preserves earlier sessions. Earlier build records without identifiers remain explicitly UNASSIGNED. We will export the selected session's CSV and JSON after each participant, verify their contents, and save them in the course-approved restricted location. We will also export an all-sessions backup. Exports are downloads, not automatic remote backups or imports.

Task preparation explicitly warns before replacing only the study sample store and switching the participant view. It never replaces personal records, preferences or medicine history. Personal interactions are excluded from study event recording. After a session, the researcher can select Open personal records. Deleting study sessions or resetting studio/study data requires a separate reviewed confirmation; both keep personal records. A separate raw care backup includes personal data and must not be mixed with anonymized session exports. These actions will only be used after export verification and according to retention/withdrawal requirements. If study data is damaged, recording is blocked and a raw backup can be exported before an explicit reset; we will document any data loss rather than reconstruct observations. Participant-facing screens contain no study counters, timers, participant codes or researcher controls.

## Record-management extension and pilot scope

Build 1.2.2 includes fictional record management and the shared-column header. We will verify the actual loaded build in Help before a study session. We will freeze and verify one build before the pilot or main study rather than combine results from different versions. The original five timed tasks remain unchanged and use freshly prepared study samples. We will not require users to enter their own health information. During untimed practice we will explain that records are fictional, archiving retains history, and editing a time affects tomorrow rather than an existing occurrence. We may explore adding/editing a fictional record in a separately labeled pilot activity, outside the primary five-task comparison. If we later add record-management tasks to the main experiment, we will revise neutral instructions, success/error definitions and timing limits after the pilot and before recruitment.

Reminders are in-page demonstrations only. We will not close the page to test a background alert or treat a reminder as clinically reliable. Due/overdue medicine reminders do not establish missed ingestion. We will ask retrospective questions to check whether participants distinguish a dated record, a future time edit, postponement and acknowledgement. No completed evaluation of these changes is claimed.

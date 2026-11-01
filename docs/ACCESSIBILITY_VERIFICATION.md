# Accessibility extension: local build 1.3.0

This is developer verification and a manual test protocol, not participant feedback, validated accessibility or evidence of ADHD benefit. This records the local 1.3.0 development stage, when the deployed release was 1.2.2. Subsequent release status is verified separately.

## Implemented behavior

- Dark mode is manually selected in Comfort settings and persisted with care preferences. It covers the participant app and studio participant preview. Text, controls, status/reminder cards, field errors, destructive actions, focus outlines and native input color scheme adapt together. It combines with text size, spacing and stronger contrast. New study sessions freeze/export the theme, retaining legacy session data. B/C remain identical except optional gestures.
- Dictate on text fields opens a processing notice before Start microphone. English speech input is optional. Review/edit/read back the result, Use text, then explicitly Save the form. No voice command records taken, acknowledges, deletes or calls. Stop, Cancel/Escape, navigation, backgrounding and a one-minute limit stop recognition. Typing remains available on unsupported browsers, permission denial or service/microphone failure.
- Saha has no transcription backend and saves no audio. Browser providers can process audio remotely; provider processing and retention policies apply. Unaccepted text stays in the voice panel only. Accepted text becomes a local draft. Research logs contain requests, starts, text-use events, field identifiers and error categories, with no transcript payloads.
- Unfinished create/edit forms persist inside `formDrafts` in their existing care snapshot. Draft keys identify the form and edited record. Personal, studio and study stores remain separate. Refresh/navigation restore the form; Cancel/Discard/successful Save clear its draft. Draft restoration never creates a record or changes medicine status. Raw care backups include drafts.
- The scrolling content region is labeled by its heading and receives focus on screen changes. Native labeled fields, required states, focused/announced errors, save-status announcements, labeled voice controls and a polite voice live region support assistive technology. No autoplay speech or automatic microphone use was added.

## Automated coverage

`tests/comfort-state.test.mjs` covers migration defaults, record preservation, invalid theme/drafts, independent draft keys and frozen/exportable theme settings with old study configurations.

`tests/browser/comfort.spec.js` covers:

- Browser recognition substitutes for the start/review/use/save flow, permission denial, unsupported APIs, stop/cancel/Escape, ignored late results, network failure, backgrounding and timeout.
- No record mutation before explicit Save, safe rendering of transcript text, separate personal/study drafts and omitted transcripts in study events.
- Draft restore, record-specific edits, Cancel/Discard and unchanged saved originals.
- All 31 participant screens at 320/360/390/1280 px with dark mode, largest text, stronger contrast and more space; visible parent/navigation and no horizontal overflow.
- Computed contrast for rendered text/fields in normal and stronger dark palettes, with 4.5:1 minimum text contrast and 3:1 switch thumb/track contrast in the sampled screens. Disabled controls are excluded. This is a targeted computed-color check, not a complete WCAG audit.
- Programmatic content-region names/focus and voice control names/status, plus B/C presentation equality and recorded study theme.

The existing browser suites also exercise record CRUD, occurrence identity, v1 migration, reminders, form recovery, keyboard return, persistent navigation, slow touch swipes and study export/reset. Speech tests use mocked API events, not captured microphone audio. They do not measure recognition accuracy, accents, real permissions dialogs or speech-service reliability.

## Manual assistive-technology check still required

Use VoiceOver on iOS, TalkBack on Android, and/or NVDA with the intended desktop browser. These manual sessions have not been performed in this task.

1. Open the app and identify Today, the content heading and the four navigation controls using the reader.
2. Open Add medicine or Add appointment. Traverse every labeled field, Dictate control, Save and header Cancel in a logical order.
3. Submit incomplete information. Check that the error is announced, the invalid field is identified and values remain available for correction.
4. Activate Dictate. Check the processing notice and Start microphone name. Accept or decline permission deliberately. Verify the announced listening/error status.
5. Speak only fictional English text. Check recognition and correction with the participant's usual device, language/accent and environment. Read the text back, accept it and separately Save.
6. Cancel before accepting, navigate away during listening and background the page. Confirm the microphone stops and late results do not change another screen.
7. Leave a partially entered form and return/refresh. Check the restored-draft announcement and that Save/Cancel/Discard have clear, different outcomes.
8. Switch light/dark and combine the largest text, contrast and spacing. Check focus visibility, date/time pickers, zoom/reflow, virtual keyboards and the physical display's safe areas.
9. Review a saved record and use the single labeled header return. Verify the correct destination and unchanged record/reminder state.
10. Collect accessible form or spoken feedback after tasks, with consent, participant codes and recorded assistance. Do not report these planned steps as completed experiments.

## Repeat locally

```powershell
npm.cmd run check
npm.cmd test
npm.cmd run test:browser
$env:SAHA_DEPLOYMENT_URL = $null
$env:SAHA_PORT = '5175'
npm.cmd run test:deployment
```

The last command builds and tests the eight-file static frontend locally. It does not deploy. Browser testing uses Chrome and phone emulation; physical phones and screen readers require the manual work above. Generated screenshots, reports and test data remain ignored and outside public build output.

Completed local checks: syntax, 25 unit/build tests, 29 updated source accessibility/core cases and the full 65-case packaged browser suite passed. A final focused accessibility rerun covers the microphone icon refinement and all 31 screen layouts. Computed-color checks and screenshots do not replace physical-device, real speech-recognition or screen-reader evaluation.

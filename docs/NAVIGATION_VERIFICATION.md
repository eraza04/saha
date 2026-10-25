# Local header navigation verification: build 1.2.2

This records developer verification with fictional data, not participant testing. Active project: `C:\Users\ezanr\orca\projects\hci-project`. Tested source URL: `http://localhost:5173/`. The local static build is served at `http://localhost:5174/`; automated static checks use a temporary server at `http://localhost:5175/`. These navigation checks were completed locally before the separately authorized release; see DEPLOYMENT.md for the release workflow.

## Build and layout

The preceding local build was `saha-phase1-1.2.1`. Its header stretched across the browser while the central content had a 680 px maximum width. At 1280 px the header Back began at x=16 and the title at x=320. It also had two equivalent appointment return actions, including the added in-content button. Full-screen before captures reproduce this actual local build.

The current build is `saha-phase1-1.2.2`, exposed in `document.documentElement.dataset.build` and Help. Refresh existing tabs to load it: the development server does not hot-replace an already loaded app.

Header and content now use the same `.app-column` class: 100% width, maximum 680 px, centered, with matching 20 px minimum/safe-area inline padding. The header contains a utility row and then the explicit Back/Cancel row immediately above the screen title. Labels wrap without shrinking text. Top controls remain at least 44 by 44 px. The layout and destinations are shared across A/B/C; B and C retain the same presentation and controls except optional gesture availability.

The duplicate appointment Back and contact Other people return were removed. Explicit parents cover medicine screens/records, visits, contacts, settings and Help. Form Cancel, call/postponement cancellation, deletion/archive confirmation cancellation, record correction and End preview remain available. They serve separate actions/destinations. Settings retain their Done confirmation. Returns use screen IDs, independent of browser or in-memory history.

The existing viewport frame is retained: fixed outer app, `visualViewport` resize support, zero flex minimum heights, hidden document overflow and safe-area spacing. Header/nav cannot shrink; only central content scrolls. New screens reset content scrolling and receive keyboard focus after in-app navigation. Form errors still focus invalid fields. No schema migration, reset or record mutation was introduced by the layout patch.

## Reproduction and measured evidence

In isolated Chrome storage, with a repeatable clock of 25 October 2026 at 15:51:

1. Start with Today -> Visits -> Add appointment.
2. Enter Hello 1, 26 October 2026, 15:51, Tabba MTC25 and 1 day before.
3. Save. Measure the header Back against the actual title and viewport.
4. Scroll central content to the bottom; measure the fixed header/nav and every navigation button again.
5. View reminder -> Back to appointment; refresh. Verify top-of-content restoration.
6. Back to Visits must open Visits. Compare all saved medicines, occurrences, appointments, contacts and activity before/after; navigation must not acknowledge the reminder.

| Viewport and settings | Back/title left x | Header Back top/bottom | Navigation top/bottom | Equivalent appointment returns |
|---|---|---|---|---|
| 1280 x 900, Largest + More space | 320 / 320 | 65 / 110 | 810 / 900 | 1 |
| 729 x 821, Standard | 44.5 / 44.5 | 60 / 104 | 739 / 821 | 1 |
| 320 x 740, Largest + More space | 20 / 20 | 61 / 106 | 650 / 740 | 1 |
| 360 x 740, Largest + More space | 20 / 20 | 61 / 106 | 650 / 740 | 1 |
| 390 x 740, Largest + More space | 20 / 20 | 65 / 110 | 650 / 740 | 1 |

Coordinates are CSS pixels. Header Back and nav bounds are unchanged after central scrolling. At all five sizes the actual return is Visits, with record and reminder state unchanged. Captures also measure medicine reminders, records, contacts, settings and appointment reminder review in the same shared column.

## Repeat and inspect

With the source server running:

```powershell
node scripts/capture-navigation.mjs http://localhost:5173/
npm.cmd run test:browser
npm.cmd run check
npm.cmd test
$env:SAHA_DEPLOYMENT_URL = $null
$env:SAHA_PORT = '5175'
npm.cmd run test:deployment
```

The capture command writes **after** screenshots and rectangle measurements to ignored `playwright-report/aligned-navigation/`. The `before-*` captures were made on 1.2.1 before editing and are retained separately; do not run the optional `--before` flag against the current build expecting it to recreate the old layout.

- `before-desktop-largest.png` / `after-desktop-largest.png`: full 1280 x 900 viewport.
- `before-320-largest.png` / `after-320-largest.png`: full 320 x 740 viewport.
- `after-729-default.png`, `after-360-largest.png`, `after-390-largest.png` and `-scrolled` variants.
- Each viewport also has `-medicine`, `-records`, `-contact` and `-settings` full-screen captures.
- `before-layout.json` and `after-layout.json` record URL, build, rectangles, return count, focus, scroll and data-preservation outcomes.

The script asserts matching header/content column geometry, matching Back/title left edge, one equivalent return, full viewport bounds, actual return destination and unchanged data. Browser regressions also exercise all create/edit Cancel routes, after-save details, refresh and fresh-document direct entry; contacts, records, settings and confirmations; keyboard recovery; largest text combined with contrast/spacing; small viewport height and embedding under a 64 px host header. B/C presentation equivalence and gesture boundaries are checked by the existing suite.

Generated images and local test data are excluded from Git and Vercel output. Screenshots are complete viewport images without cropping or image editing. Verification uses Chrome desktop and phone touch emulation. Physical phones, Safari, assistive technologies, virtual keyboard/cutout behavior and intended-user studies remain outside these checks.

## Completed checks

Syntax checks, 22 unit/build tests, 46 source-browser tests and 48 local static-preview tests passed. After strengthening the all-screen assertions, those three source cases were rerun and passed; the final static run includes the strengthened assertions. The screenshot capture script passed for all five viewports. All 22 atlas screens plus Help are checked for one header return (none on Today/Welcome), no equivalent in-content return, Back/title alignment and persistent controls at 320/360/390 px with the largest combined settings.

The source server at `http://localhost:5173/` and persistent built preview at `http://localhost:5174/` both return build 1.2.2, with matching participant HTML/runtime modules/styles. Both `/` and `/studio/` and checked assets returned HTTP 200. `local-origins.json` records URLs, versions and response hashes. The full static suite ran locally at `http://localhost:5175/`, checked refresh/direct access and excluded files, then stopped its temporary server. This initial navigation verification preceded the separately authorized production release.

# Release Saha to the existing Vercel project

This guide targets release `saha-phase1-1.2.2`: fictional record management, preserved study tools and one aligned header return. The app adds no backend, database, authentication, PWA installation or background reminders. The build is shown in Help and `document.documentElement.dataset.build`.

## Existing target and traceability

- Team: **NEURAAI**, slug `neuraai1`, ID `team_2Ksu7ukGnNA70RBWSoFki6c1`.
- Existing project: **saha**, ID `prj_BhvogDCnEeFfGos9VinRp259pPNz`.
- Participant URL: https://saha-lemon.vercel.app/
- Studio URL: https://saha-lemon.vercel.app/studio/
- Source: private `https://github.com/eraza04/saha`, branch `master`.
- Deployment method: Vercel CLI; the project has **no Git repository connection**. Pushing backs up source and does not itself deploy this project.

Commit and push reviewed source before uploading. Use `releaseCommit=<full HEAD SHA>` deployment metadata, and verify it with Vercel's deployment record after deployment. Record the actual deployment ID/URL, SHA, readiness and live check results in the release handover. This guide's local test results do not establish that an upload is live.

The historical 1.1.0 deployment was `dpl_2KHjpjQkvcMv3xE4PSK9EyP5e65u`, with unique URL `https://saha-4wvhtqtg4-neuraai1.vercel.app`. Its source was initially uncommitted, then backed up as `30b324e481cdc3adef37e8f2103276df2931bb1e`. These identify the older release, not 1.2.2.

## Build settings and public files

| Setting | Exact value |
|---|---|
| Framework | Other (`framework: null`) |
| Root Directory | Project root, `.` |
| Build Command | `npm run build` |
| Install Command | `npm ci --omit=dev` |
| Output Directory | `dist` |
| Node.js | `22.x` |
| Environment variables | None required by the application |
| Trailing slash | `true` |
| Headers | `Cache-Control: no-cache`, `X-Content-Type-Options: nosniff` |
| Functions, databases, cron jobs | None |

`server.mjs` remains the local development/preview server. It is not deployed. Production installation omits Playwright because the build uses Node built-ins only.

`scripts/build.mjs` safely rebuilds an exact eight-file allowlist:

```text
dist/index.html
dist/studio/index.html
dist/app.js
dist/care-state.js
dist/participant-screens.js
dist/research-state.js
dist/style.css
dist/participant.css
```

`/` and `/studio/` are real static entry pages, supporting direct loading and refresh. `/studio` redirects to `/studio/`; studio views can use fragments such as `/studio/#study`. Participant screens restore from localStorage. Assets use origin-root paths. There is no catch-all rewrite, so excluded/unknown paths remain 404.

No credentials, `.env`, `.git`, `.vercel`, personal data, research exports, documents, tests, dependencies, package metadata, build scripts or server files enter public output. The generated studio removes links to excluded local documents; browser-generated study CSV/JSON downloads still work. The source studio retains its local document links. Fictional seed records and test fixtures are application source, not saved participant exports.

`.vercelignore` separately limits CLI source uploads to 13 build inputs: the eight frontend sources, `scripts/build.mjs`, `package.json`, `package-lock.json`, `vercel.json` and `.vercelignore`. It excludes documentation, `.env.local`, `.vercel`, `.git`, dependencies, generated output, exports and reports. GitHub retains project documentation privately; Vercel receives only the allowlisted inputs. Do not put credentials in frontend code or save exports into disposable `dist`.

## Checks before a release

From `C:\Users\ezanr\orca\projects\hci-project`:

```powershell
npm.cmd ci
npm.cmd run check
npm.cmd test
npm.cmd run test:browser
$env:SAHA_DEPLOYMENT_URL = $null
$env:SAHA_PORT = '5175'
npm.cmd run test:deployment
```

The browser suites require Google Chrome, or the Chromium alternative described in README. Port 5175 avoids conflicting with an already open preview at 5174. `test:deployment` builds and tests a local static server unless `SAHA_DEPLOYMENT_URL` is set; it does not upload or deploy anything.

Pre-release verification on 25 October 2026 passed syntax, 22 unit/build tests, 46 existing source-browser cases plus four new release journeys, and 48 existing static-preview cases plus those four release journeys. The four added journeys use desktop Chrome at 1280 x 900 and phone touch emulation at 320/360/390 x 740 with Largest text, Stronger contrast and More space combined. They verify medicine/appointment add/edit/save/back, reminder review, scroll, fresh-document entry, refresh persistence, actual header/title geometry, one equivalent return and fully visible navigation. The earlier suites also cover correction, archive history, v1 migration, personal/study separation, export/reset, form recovery, B/C presentation and slow-swipe boundaries. These are developer checks, not physical-phone or participant testing.

For manual source/packaged previews:

```powershell
npm.cmd run dev
# In a separate terminal, after building:
npm.cmd run preview
```

- Source: http://localhost:5173/ and http://localhost:5173/studio/
- Built preview: http://localhost:5174/ and http://localhost:5174/studio/

## Account, review and production upload

1. Use the existing Vercel login. If it has expired, run `npx.cmd --yes vercel@65.2.0 login` and complete the browser/device flow yourself. Never paste access tokens into chat or source.
2. Check identity and the link from this exact project directory:

   ```powershell
   npx.cmd --yes vercel@65.2.0 whoami
   npx.cmd --yes vercel@65.2.0 project inspect --scope neuraai1 --non-interactive
   ```

   Confirm NEURAAI/saha, the IDs above and the checked-in settings. `.vercel/project.json` is ignored local metadata. Stop on a missing link or mismatch; do not create another project or select `saha-phase1`.
3. Review/stage only application source, tests, scripts, configuration and project documentation. Check `.gitignore`, `git diff --cached --check` and `git diff --cached --name-only`. Preserve unrelated work. Commit to `master`, push normally to `origin`, and verify `origin/master` matches HEAD. Do not force-push.
4. Inspect the dry run:

   ```powershell
   npx.cmd --yes vercel@65.2.0 deploy --dry --json --scope neuraai1
   ```

   Require the exact 13-file input allowlist and eight-file build output above. Stop if private/export/document paths appear.
5. Upload production to the **existing** project, recording the pushed commit:

   ```powershell
   $releaseCommit = git rev-parse HEAD
   npx.cmd --yes vercel@65.2.0 deploy --prod --scope neuraai1 --project saha --yes --non-interactive --meta "releaseCommit=$releaseCommit"
   ```

   The normal source upload uses Vercel's checked-in build configuration. This is not a `--prebuilt` upload; the independently verified `dist` output must match what Vercel produces. Do not use `--public` or change deployment protection. Wait for READY and verify the actual production alias reported by Vercel. `vercel inspect` and `vercel api` can confirm the deployment's project, production target and commit metadata.

## Live checks and instructor access

The stable production alias was publicly accessible on the previous release. The project retains Vercel protection `all_except_custom_domains`; unique deployment URLs can redirect to Vercel Authentication. Check current unauthenticated responses at both production routes before sharing. Prefer the stable production URLs with the instructor. If protection blocks them, report that limitation; do not weaken project protection or publish a bypass secret.

Run the full suite on the actual live origin, in isolated browser contexts with fictional data:

```powershell
$env:SAHA_DEPLOYMENT_URL = 'https://saha-lemon.vercel.app'
npm.cmd run test:deployment
Remove-Item Env:SAHA_DEPLOYMENT_URL
```

Remote mode starts no local server. It now includes 52 cases: both routes/direct loading/refresh, `/studio` redirect, assets, excluded-path 404s, medicines/appointments/contacts, recovery, study tools and layout. The release journeys cover a real desktop browser context as well as phone emulation. Tests store invented records only inside their own temporary browser profiles; resets do not touch the presenter's browser data.

Verify the public `care-state.js` build and compare **all eight public output files byte-for-byte** against the tested `dist` files. Confirm `releaseCommit` matches the pushed SHA. Check header/content alignment and a single equivalent return after Save, reminder review, scrolling, refresh and entry without history. Preserve fictional medicines, appointments, contacts, dated occurrences and reminder acknowledgement state across return navigation. Save local screenshots and measurements outside deployment inputs. A bounded runtime-error query can supplement this, but a static frontend's logs do not provide continuous client-error monitoring.

## Storage and remaining limitations

All records remain browser-local JSON in localStorage: `saha:v1:participant` (personal fictional records), `saha:v1:scenario` (isolated study samples), `saha:v1:workspace` (personal/study selection), `saha:v1:studio` and `saha:v1:research`. Care version 1 migrates to version 2 without discarding prior history; damaged data is retained with writes blocked. Study reset does not erase personal records. Downloads are independent files, not cloud backups.

Vercel serves frontend files and receives no care/study data through an application API. Data does not synchronize across phones/laptops or origins. Localhost, LAN IPs, unique previews and the production alias have separate stores. A same-origin app update can migrate saved state; deploying never copies data between origins. Export before switching origins or clearing data. Use fictional details and participant codes only. The studio is publicly reachable with the site and is not access-controlled; never host identities, real health information, consent forms or research exports there.

Calls remain simulated. Reminders work only while the page is open; HTTPS does not add background notifications, clinical reliability, a PWA or offline shell. Physical iOS/Android phones, Safari, virtual keyboards/cutouts, assistive technologies and intended-user/pilot studies require separate evaluation.

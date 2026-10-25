# Deploy the reviewed Saha frontend to Vercel

The application build remains `saha-phase1-1.1.0`. This preparation changes packaging and hosting configuration, not care/study logic. It creates no database, application authentication, background reminders, PWA or server function.

## Current deployment status

Production is deployed and verified as of 25 October 2026:

- Participant app: https://saha-lemon.vercel.app/
- Studio/researcher tools: https://saha-lemon.vercel.app/studio/
- Team/project: `NEURAAI (neuraai1) / saha`
- Target/status: `production / READY`
- Deployment: `dpl_2KHjpjQkvcMv3xE4PSK9EyP5e65u`
- Build: `saha-phase1-1.1.0`, Other/static, Node 22.x; build command completed in 980 ms according to Vercel's build log.
- Source: reviewed local working-tree upload, not a committed application release. The repository's HEAD is `9cecc6c`, but the application files are currently uncommitted; that commit alone does not reproduce this deployment.

The authenticated dry run was checked against an exact 13-file source allowlist before uploading. It exposed and corrected directory-negation matching in `.vercelignore`, so `studio/index.html` and `scripts/build.mjs` are included while private documents, exports and `.env.local` remain excluded. Vercel's build log confirms 13 uploaded build inputs and eight frontend output files. No application behavior or database was changed.

All 18 browser tests passed against the actual public production origin in isolated Chrome contexts without Vercel credentials or bypass headers. These include direct access/refresh, `/studio` redirect, all assets, excluded-path 404s, medicine taken/review/correction, postponement, appointment details/acknowledgement, contacts/edit validation/call preview/cancel, combined preferences, slow touch swipes and boundaries, state restoration, session export/reset, and largest-text layouts at 320/360/390 px. All eight public frontend files also matched the local `dist` build byte-for-byte. Local syntax and all 10 unit/build tests passed before deployment. Physical-device and intended-user evaluation are still separate work.

The two production links above are publicly accessible and do not require instructor login. The unique deployment URL, `https://saha-4wvhtqtg4-neuraai1.vercel.app`, redirects unauthenticated requests to Vercel Authentication. Protection was left unchanged. Share the stable `saha-lemon.vercel.app` links with the instructor, not the unique protected deployment URL.

Post-deploy observability: a bounded production runtime-error query over five minutes returned zero records. No runtime functions are deployed. This is not continuous client-error monitoring; log drains were not inspected or configured in this task.

## Files and routes

`npm run build` runs `scripts/build.mjs` and creates a fresh, disposable `dist/` with exactly these files:

```text
dist/
  index.html
  studio/index.html
  app.js
  care-state.js
  participant-screens.js
  research-state.js
  style.css
  participant.css
```

`/` serves `index.html` (participant app). `/studio/` serves `studio/index.html` (studio/researcher tools). Vercel's `trailingSlash: true` canonicalizes `/studio` to `/studio/`; URLs for files with extensions keep their extensions. There is no catch-all rewrite to the participant HTML. Both entry pages can be opened directly and refreshed. Studio views use fragments such as `/studio/#study`; the current participant screen is restored from browser storage.

HTML references `/app.js`, `/style.css` and `/participant.css` from the origin root. JavaScript module imports resolve beside `/app.js`. This configuration expects deployment at the domain root, not under a custom subdirectory. Vercel's static routing and output-directory behavior are documented in [project configuration](https://vercel.com/docs/project-configuration/vercel-json) and [build settings](https://vercel.com/docs/builds/configure-a-build).

The build copies an explicit allowlist, never the whole project. It rejects source symlinks and a symlink substituted for `dist`, and rebuilds the generated directory from scratch. Do not store research exports in `dist`; rebuilding deletes its old contents.

No documents, participant exports, credentials, `.env` files, `.git`, `.vercel`, test reports, dependencies, package metadata, scripts or `server.mjs` enter the public output. The generated studio omits the local Experimental plan/Demo script links because documents are not deployed. The source studio and local development document links remain intact. The running studio's browser-generated CSV/JSON download buttons still work; they do not require hosted export files.

`.vercelignore` separately allowlists CLI source uploads: the eight frontend sources, `scripts/build.mjs`, `package.json`, `package-lock.json`, `vercel.json` and `.vercelignore`. Build/config/package files are uploaded for building but are not publicly served. `.gitignore` excludes `.vercel/`, credential/environment paths, export folders and `saha-*.csv`/`saha-*.json` downloads. Do not put credentials into any frontend source file: frontend JavaScript is public by design.

The CLI upload allowlist does not control a Git integration's repository clone. For this project's requirement to exclude private documents from uploads as well as output, use the CLI path below. If Git-based deployment is needed later, use a separate sanitized deployment repository containing only the allowlisted deployment inputs, or review exactly what the connected repository shares with Vercel. Never commit participant exports or credentials.

## Exact Vercel settings

`vercel.json` supplies these settings; do not replace them with a root-directory static upload or an SPA catch-all rewrite.

| Setting | Value |
|---|---|
| Framework Preset | **Other** (`framework: null`) |
| Root Directory | Project root: `.` (the folder containing `package.json` and `vercel.json`) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm ci --omit=dev` |
| Node.js Version | `22.x` (also specified in `package.json` engines) |
| Environment Variables | None required |
| Development Command | `npm run dev` for the local project; no hosted Node server |
| Trailing slash | Enabled in `vercel.json` |
| Static response headers | `Cache-Control: no-cache`, `X-Content-Type-Options: nosniff` |
| Functions, databases, cron jobs | None |

The production install omits Playwright because the build uses only Node built-ins. Development/browser checks use a normal `npm ci` with dev dependencies. `server.mjs` stays in the source tree for local development and preview, and is not deployed.

## Local preparation and preview

From `C:\Users\ezanr\orca\projects\hci-project`:

```powershell
npm.cmd ci
npm.cmd run check
npm.cmd test
npm.cmd run test:browser
npm.cmd run test:deployment
```

Browser tests require installed Google Chrome. The README describes the bundled-Chromium alternative. `test:deployment` builds `dist`, starts a temporary local preview and runs the existing core-flow suite plus deployment-specific tests. It checks direct routes/refresh, modules/styles, excluded paths, phone layouts, medicine/visit/contact flows, combined preferences, touch swipes, storage and studio export/reset. This previews the built tree; it does not emulate every Vercel platform behavior.

For manual inspection:

```powershell
npm.cmd run build
npm.cmd run preview
```

Keep that terminal open. Static preview:

- http://localhost:5174/
- http://localhost:5174/studio/

`npm.cmd run dev` continues to serve the original local project at http://localhost:5173/ and http://localhost:5173/studio/, including the local academic documents. `SAHA_PORT` overrides either server's default port. On macOS/Linux use `npm` instead of `npm.cmd`.

## Account steps and deployment

Use your own Vercel account/team. A Vercel hosting-account login is separate from application authentication; Saha itself still has no login or accounts.

1. Visit [Vercel signup](https://vercel.com/signup) or sign in at [Vercel login](https://vercel.com/login). Choose the account/team authorized for this course project. Do not paste access tokens into the project or chat.
2. Open a normal interactive terminal in the active project directory. Authenticate and check identity:

   ```powershell
   npx.cmd --yes vercel@65.2.0 login
   npx.cmd --yes vercel@65.2.0 whoami
   ```

   Complete Vercel's browser/device login yourself. Stop if the reported account is not the intended one. Commands use the CLI version checked during preparation; future versions may change prompts. See [CLI login](https://vercel.com/docs/cli/login).

3. Link the directory to a new project or the specific project you intend to update:

   ```powershell
   npx.cmd --yes vercel@65.2.0 link --yes --scope neuraai1 --project saha --non-interactive
   ```

   The application is now linked to the existing `saha` project under `neuraai1`. Confirm that exact owner/project with `vercel project inspect --non-interactive` before subsequent releases. The code directory is the project root and the framework is Other. Keep the checked-in build/output/install settings above. Do not select or create `saha-phase1`. Local link metadata is in ignored `.vercel/`.

4. In that project's Settings, confirm the table above, including Node 22.x. Inspect deployment source inputs without uploading:

   ```powershell
   npx.cmd --yes vercel@65.2.0 deploy --dry --json --scope neuraai1
   ```

   Check that documents, exports, credentials and reports are absent. If extra files appear, stop and fix the allowlist before deploying. The dry run also needs account access in the CLI path available during preparation.

5. Deploy the reviewed project:

   ```powershell
   npx.cmd --yes vercel@65.2.0 deploy --prod --scope neuraai1 --project saha --yes --non-interactive
   ```

   Review the settings against the table before running the production command. Wait for deployment readiness, then verify the actual HTTPS production alias printed by Vercel. The current verified alias is `https://saha-lemon.vercel.app`. A unique deployment URL may be protected even when the stable production alias is public. Do not use `--public`; build/source logs are not intended as a public document-sharing channel. See [CLI deployment](https://vercel.com/docs/cli/deploy).

6. Open the actual origin's `/` and `/studio/` URLs directly, then refresh both. Check `/studio` redirects to `/studio/`. If Vercel Deployment Protection requires the presenter/instructor to sign in, use an approved dashboard sharing method or the project's permitted protection setting before sharing the URL; do not add authentication to Saha or put a protection-bypass secret in application code.

7. Verify the live deployment with the same automated core checks. Use the verified production origin below; update it if the production alias changes:

   ```powershell
   $env:SAHA_DEPLOYMENT_URL = 'https://saha-lemon.vercel.app'
   npm.cmd run test:deployment
   Remove-Item Env:SAHA_DEPLOYMENT_URL
   ```

   This mode does not start a local server. It uses isolated browser contexts and invented test codes/data to test the real origin, including browser-local session exports/reset. It needs a URL reachable by the browser without an interactive Vercel protection challenge. Keep any legitimate study data out of automated test contexts.

8. Manually verify medicine reminder → record taken → review → correction; postpone → confirmation with original schedule; appointment date/time/location; contact confirmation → cancel/preview; combined preferences; refresh/restore. Ensure `/docs/EXPERIMENTAL_PLAN.md`, `/server.mjs`, `/package.json`, `/.env` and research-export paths return 404. If a check fails, resolve it before calling the deployment verified or sharing it as the submission.

9. Record the verified URL and date in your submission. A redeploy uses the same linked-project command. Before changing the production domain or clearing browser data, export study sessions and verify the downloads.

## Storage, privacy and hosting limitations

Vercel hosts the frontend files; it does not receive care records or study results through an application API. The same localStorage keys remain: `saha:v1:participant`, `saha:v1:studio`, and `saha:v1:research`. Export buttons create browser downloads. There is still no cross-device synchronization.

Storage belongs to an origin/profile. Localhost, a LAN IP, a preview deployment and the final production/custom domain have separate storage. Deploying does not migrate earlier care/study data. Use a stable production origin for a study, export before switching origins and follow the instructor's data-handling requirements. Browser-local study information is not access-controlled by Saha, and `/studio/` is publicly reachable when the site is public. Use fictional care details and participant codes, not real patient data, identities or consent documents.

Calls remain simulated. Foreground reminder checks are not background/system notifications. HTTPS hosting does not install a PWA, provide an offline app shell or make reminders reliable when the page is closed. Physical-phone, assistive-technology and intended-user evaluation remain separate from developer deployment checks.

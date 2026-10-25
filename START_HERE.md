# Saha: open this project in Orca

Phase 1 is implemented. The full-screen participant app is at `/`, and the original design studio is preserved at `/studio/`. See README.md for implementation details, checks, researcher workflow and remaining limitations. BUILD_BRIEF.md preserves the original handoff and later-phase scope.

## Requirements

- Node.js LTS and npm.
- Git for the Orca repository/worktree workflow.
- Orca with Codex signed in.

## Run the starter

From the directory containing package.json:

    npm.cmd run dev

On macOS/Linux use npm run dev. There are no external project dependencies, so npm install is not required for this starter.

Open http://localhost:5173 for the participant app or http://localhost:5173/studio/ for the design studio. Keep the server terminal open. Press Ctrl+C to stop it.

The server also prints possible local-network addresses. Use the Wi-Fi IPv4 address on a phone connected to the same network. A VPN, guest-network isolation or a firewall may prevent phone access.

## Prepare a local repository

    git init -b main
    git add .
    git commit -m "Import Saha starter"

If Git requires identity, configure your own name and email for this repository, then repeat the commit. No remote repository or GitHub account is needed for local development.

## In Orca

1. Add Repo and select this directory.
2. Create one worktree using the + next to the repo.
3. Name the task saha-mobile-app and choose local main as the starting reference.
4. Select Codex as the agent and your signed-in account.
5. Paste:

    Read START_HERE.md and BUILD_BRIEF.md. Inspect the existing source, then implement Phase 1 completely. Reuse the current Saha design and logic. Do not stop at a plan. Run the checks and tell me the exact worktree path and preview URL.

6. Start the dev server from that worktree, not from the original imported folder. Stop any older server on port 5173 first.

## Keep the workflow simple

One Codex session for development and a separate plain terminal for the server. This project does not require Colab, a GPU, Android Studio, or a ChatGPT API integration.

The Orca Codex session does not automatically know the previous ChatGPT conversation. The included source and BUILD_BRIEF.md carry the relevant design and requirements.

Before the first development task, commit the starter so the new Orca worktree includes the actual files.

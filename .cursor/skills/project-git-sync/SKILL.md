---
name: project-git-sync
description: Enforces this project's GitHub synchronization workflow. Use before making changes in the my-siami-feed project, before each task phase, and before committing or pushing work.
---

# Project Git Sync

## Required Preflight

Before making any project change in `my-siami-feed`:

1. Run `git fetch origin`.
2. Run `git status --short` and `git status -sb`.
3. Compare `HEAD` with the upstream branch using `git rev-parse HEAD` and `git rev-parse @{u}`.
4. Proceed only when the working tree is clean and `HEAD` equals upstream.

If local changes exist, inspect them first. Commit and push them only when they are safe, intentional, and do not include secrets such as `.env*` files.

If local and remote have diverged, stop and report the difference before editing.

## Phase Workflow

For multi-stage work:

1. Complete one coherent phase.
2. Run validation appropriate to the change, at minimum `npm run lint` and `npm run build` for code changes.
3. Commit with a detailed message that explains why the phase was done.
4. Push to GitHub before starting the next phase.

Never commit `.env`, `.env.local`, credentials, tokens, or generated build output.

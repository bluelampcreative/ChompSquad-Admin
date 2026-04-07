# Address PR Review Comments

Read all unresolved inline review comments on the current branch's open PR and address them locally. Do NOT commit or push anything without explicit user approval.

## Setup

Before starting, resolve the repository owner and name from the git remote:

```bash
gh repo view --json owner,name
```

Get the PR number for the current branch:

```bash
gh pr view --json number,title,state
```

If no open PR exists for the current branch, inform the user and stop.

## Step 1 — Fetch Unresolved Review Threads

Use the GitHub GraphQL API to fetch all review threads. Replace OWNER, REPO, and PR_NUMBER with the values resolved above:

```bash
gh api graphql -f query='
query {
  repository(owner: "OWNER", name: "REPO") {
    pullRequest(number: PR_NUMBER) {
      reviewThreads(first: 100) {
        nodes {
          id
          isResolved
          path
          line
          startLine
          diffSide
          comments(first: 10) {
            nodes {
              id
              databaseId
              body
              author {
                login
                __typename
              }
              createdAt
            }
          }
        }
      }
    }
  }
}'
```

Filter results to only threads where `isResolved` is `false`.

Also filter out any threads where the comment author `__typename` is `Bot` and the login matches known noise bots (e.g. `github-actions`, `dependabot`, `renovate`). **Include** comments from `copilot-pull-request-reviewer` — treat Copilot review comments the same as human reviewer comments.

If there are no unresolved threads (from human reviewers or Copilot), inform the user and stop.

## Step 2 — Analyze Before Acting

Before making any edits, output a structured plan to the terminal listing every thread you intend to address:

```
Thread 1
  File: app/login/page.tsx
  Line: 42
  Reviewer: alice
  Comment: "This should use the useAdmin hook instead of reading localStorage directly"
  Planned action: Replace direct localStorage.getItem call with getToken() from useAdmin

Thread 2
  File: lib/api/featured-recipes.ts
  Line: 18
  Reviewer: bob
  Comment: "Missing Authorization header on this fetch call"
  Planned action: Add Authorization: Bearer ${token} header via the shared fetcher utility
```

Group threads that touch the same file so edits are batched — do not make multiple passes on the same file.

## Step 3 — Clarify Ambiguous Comments

Before editing anything, identify comments that are:

- Subjective or opinion-based ("I'd prefer X" without a clear directive)
- Contradictory to another comment on the same block
- Architectural in scope (suggesting a structural refactor vs. a local fix)
- Outside your confidence threshold to address correctly

For each ambiguous thread, use AskUserQuestion to ask the user how to proceed. Never silently skip or auto-resolve a comment you are unsure about.

## Step 4 — Make the Edits

For each unresolved, unambiguous thread:

1. Use the Read tool to load the full file and understand context around the flagged line
2. Make the minimal edit necessary to address the feedback — do not refactor beyond what was asked
3. Respect the project's existing conventions:
   - All interactive pages and components must have `"use client"` at the top — no SSR
   - API calls belong in `lib/api/` modules, never inline in components
   - Auth hooks (`useAdmin`, etc.) live in `lib/hooks/`
   - Attach the JWT as `Authorization: Bearer <token>` on every admin API request
   - Use `fetch` with the thin wrapper pattern — do not introduce heavy client libraries
   - Co-locate page-level types with the page file; only extract to shared types if genuinely reused across multiple files
   - Never add `"use server"` unless a specific server action is explicitly needed
   - Follow the existing TypeScript and Tailwind patterns in the file being edited
4. If the fix requires changes in more than one file (e.g. a hook and a component that uses it), make all related changes before moving to the next thread

## Step 5 — Review Summary

After all edits are complete, output a summary to the terminal:

```
Summary of changes made:

✅ Thread 1 — app/login/page.tsx:42
   Fixed: Replaced direct localStorage.getItem with getToken() from useAdmin

✅ Thread 2 — lib/api/featured-recipes.ts:18
   Fixed: Added Authorization: Bearer ${token} header to fetch call

⏭️ Thread 3 — app/feed/page.tsx:15
   Skipped: Awaiting your decision on the architectural question above

Files modified:
  app/login/page.tsx
  lib/api/featured-recipes.ts

No commits have been made. Review the diff with:
  git diff

Run linting and type checks before committing:
  pnpm lint
  pnpm format
  pnpm build   # catches TypeScript errors

When ready to commit:
  git add -p
  git commit -m "fix: address PR review feedback"
```

## Step 6 — Do Not Commit or Push

Stop after the summary. Do not run `git add`, `git commit`, or `git push` unless the user explicitly asks you to in a follow-up message.

If the user approves and asks you to commit, follow the project's Conventional Commits format and branch conventions from CLAUDE.md:

```bash
git commit -m "fix: address PR review feedback

- <brief description of each fix>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

## Notes

- Never resolve GitHub review threads via the API — leave that for the reviewer or the user to do after confirming the fix is correct
- Never post reply comments back to the PR threads — the user may want to word those themselves
- If a suggested fix would break the build or violate obvious correctness constraints, flag it in the summary rather than blindly applying it
- If the PR has more than 20 unresolved threads, inform the user of the count and ask if they want to proceed with all of them or a subset
- After edits, remind the user to run `pnpm build` to catch any TypeScript errors before committing — do not run it automatically

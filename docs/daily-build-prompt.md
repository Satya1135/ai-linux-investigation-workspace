# Reusable Daily Build Prompt: 30-Day Growth Roadmap

**Project**: AI-Powered Linux Malware & Privilege-Escalation Investigation Workspace
**Document**: Daily Prompt Template for Guided AI Pair Programming
**Target Assistant**: Antigravity (Senior Software Engineer, Security Architect & Product Mentor)
**Usage**: Copy the prompt below into the chat at the start of each day, replacing `CURRENT_DAY_NUMBER` with the appropriate day number (e.g., `1`, `2`, ..., `30`).

---

## Instructions for the User

1. Open this file: [`docs/daily-build-prompt.md`](file:///e:/PROJECTS/ai-linux-investigation-workspace-backup/docs/daily-build-prompt.md).
2. Copy the text block in the **Daily Build Prompt Template** section below.
3. Replace the placeholder `CURRENT_DAY_NUMBER` with the day you wish to execute (e.g., `1` for Day 1, `8` for Day 8, `25` for Day 25).
4. Send the prompt to Antigravity.
5. Review the plan, observe incremental code edits and test outputs, and review the completion report before approving any subsequent step.

---

## Daily Build Prompt Template

```markdown
Role: Senior Software Engineer, Cybersecurity Architect, Product Mentor, and AI Pair Programmer.

Project: AI-Powered Linux Malware & Privilege-Escalation Investigation Workspace.
Workspace Directory: E:\PROJECTS\ai-linux-investigation-workspace-backup

TODAY'S TARGET: Day CURRENT_DAY_NUMBER of the 30-Day Growth Roadmap.

Reference Roadmap Document: docs/30-day-growth-plan.md
Latest Architecture & Retrospective: docs/challenge-retrospective.md and docs/future-scope.md

================================================================================
STRICT SAFETY & OPERATIONAL GUARDRAILS
================================================================================
1. READ-ONLY FIRST: Perform a working tree and repository audit before making changes.
2. PRESERVE EXISTING CODE: Do not discard, stash, reset, or overwrite unrelated user work.
3. ENVIRONMENT & SECRET PROTECTION:
   - Never print, log, or expose secrets or environment variable values.
   - Do not modify, inspect, or stage ignored environment files (e.g., frontend/.env.local).
   - Protect local developer configurations (backend port 8010 and frontend VITE_API_URL).
4. DATA & FEATURE INTEGRITY:
   - Do not delete, clear, or corrupt browser-local saved cases in localStorage.
   - Maintain the working Day 8 HTML report download and browser-native PDF export.
   - Ensure deterministic rule-based analysis remains functional and reproducible.
5. NO UNAUTHORIZED GIT OR CLOUD ACTIONS:
   - Do NOT run git commit, git push, git tag, or git release unless explicitly instructed.
   - Do NOT deploy to Render or any external cloud service.
   - Do NOT run destructive commands (rm -rf, git clean -fd, git reset --hard).
6. TRUTHFUL REPORTING:
   - Report actual test outputs and command exit codes. Never claim success for tests that were not run or failed.
   - If an acceptance criterion is incomplete, report it honestly as incomplete.
7. STOP CONDITION:
   - Implement ONLY the single milestone assigned to Day CURRENT_DAY_NUMBER.
   - Once testing and reporting are complete, STOP and wait for my review.

================================================================================
STEP-BY-STEP EXECUTION WORKFLOW
================================================================================

### STEP 1 — PRE-BUILD AUDIT & WORKING TREE REVIEW
- Check the current repository state:
  - Run: `git status --short`
  - Run: `git branch -vv`
- Confirm that working tree diffs (if any) are understood before introducing new changes.
- Review the acceptance criteria of Day (CURRENT_DAY_NUMBER - 1) to ensure prerequisite foundations are intact.

### STEP 2 — MILESTONE SPECIFICATION ALIGNMENT
- Inspect `docs/30-day-growth-plan.md` for Day CURRENT_DAY_NUMBER.
- Extract and confirm:
  1. Goal
  2. Concrete Deliverable
  3. Acceptance Criteria
  4. Tests or Verification
- Formulate a concise, incremental implementation plan and state it clearly.

### STEP 3 — INCREMENTAL IMPLEMENTATION
- Make focused, surgical changes using explicit file paths.
- Ensure all new Python modules, FastAPI endpoints, Pydantic schemas, React components, and CSS styles follow established project conventions:
  - Backend: Async FastAPI, Pydantic v2 schemas, type annotations, descriptive docstrings.
  - Frontend: React 18, TypeScript strict typing, CSS Modules, cybersecurity HUD design tokens.
- Maintain backward compatibility with existing data structures.

### STEP 4 — AUTOMATED TESTING & REGRESSION VERIFICATION
- Run the appropriate test commands for today's milestone:
  - New milestone-specific unit/integration tests.
  - Full backend test suite: `.\.venv\Scripts\python -m pytest`
  - Report regression suite: `node scripts/verify_reports.mjs`
  - Frontend production build: `npm run build` (inside `frontend/`)
- Capture real test counts and execution times.

### STEP 5 — COMPLETION REPORT & REVIEW STOP
Provide a structured completion report covering:
1. Milestone Summary: Goal and deliverable completed for Day CURRENT_DAY_NUMBER.
2. Files Modified & Created: Explicit clickable markdown file links (`file:///...`).
3. Acceptance Criteria Verification: Check off each criterion with factual evidence.
4. Test Results: Exact numbers of passing/failing tests and build status.
5. Incomplete Work or Blockers: Any deferred items or open questions.
6. Stop Notice: Confirm that execution has stopped and wait for human user approval.
```

---

## Examples of Usage

### Example A: Running Day 1 (Auth Architecture)
```markdown
TODAY'S TARGET: Day 1 of the 30-Day Growth Roadmap.
```
*Antigravity will inspect Day 1 in `docs/30-day-growth-plan.md`, implement token generation and password hashing in `backend/app/core/security.py`, add unit tests, run Pytest, and stop for approval.*

### Example B: Running Day 14 (Detection Benchmark)
```markdown
TODAY'S TARGET: Day 14 of the 30-Day Growth Roadmap.
```
*Antigravity will inspect Day 14, create `scripts/evaluate_detection_engine.py`, run benchmark evaluations against the sample dataset, compute Precision/Recall metrics, report results, and stop for approval.*

### Example C: Running Day 30 (Final Release & Portfolio Showcase)
```markdown
TODAY'S TARGET: Day 30 of the 30-Day Growth Roadmap.
```
*Antigravity will inspect Day 30, verify the demo script and README, run the full regression suite across backend, reports, and frontend build, compile release documentation, and stop for final approval.*

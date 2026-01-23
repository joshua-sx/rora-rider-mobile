# Ralph - Autonomous AI Agent Loop

Ralph is an autonomous AI agent loop that runs Claude Code repeatedly until all PRD items are complete. Each iteration is a fresh instance with clean context. Memory persists via git history, `progress.txt`, and `prd.json`.

Based on [Geoffrey Huntley's Ralph pattern](https://ghuntley.com/ralph/) and the [snarktank/ralph](https://github.com/snarktank/ralph) implementation.

## Prerequisites

- **Claude Code** installed and authenticated: `npm install -g @anthropic-ai/claude-code`
- **jq** installed: `brew install jq`
- A git repository (this project)

## Quick Start

**Note:** A test `prd.json` is included for verification. Replace it with your actual PRD when ready to use Ralph.

### 1. Create a PRD

Use the PRD skill to generate a detailed requirements document:

```
Load the prd skill and create a PRD for [your feature description]
```

Answer the clarifying questions. The skill saves output to `tasks/prd-[feature-name].md`.

### 2. Convert PRD to Ralph format

Use the Ralph skill to convert the markdown PRD to JSON:

```
Load the ralph skill and convert tasks/prd-[feature-name].md to prd.json
```

This creates `scripts/ralph/prd.json` with user stories structured for autonomous execution.

### 3. Run Ralph

```bash
cd scripts/ralph
./ralph.sh --tool claude [max_iterations]
```

Default is 10 iterations. Use `--tool claude` to explicitly select Claude Code (default).

Ralph will:
1. Create a feature branch (from PRD `branchName`)
2. Pick the highest priority story where `passes: false`
3. Implement that single story
4. Run quality checks (`npx tsc --noEmit`, lint, tests)
5. Commit if checks pass
6. Update `prd.json` to mark story as `passes: true`
7. Append learnings to `progress.txt`
8. Repeat until all stories pass or max iterations reached

## Key Files

| File | Purpose |
|------|---------|
| `ralph.sh` | The bash loop that spawns fresh Claude Code instances |
| `CLAUDE.md` | Prompt template for Claude Code (tailored for this project) |
| `prd.json` | User stories with `passes` status (the task list) |
| `progress.txt` | Append-only learnings for future iterations |
| `archive/` | Previous runs archived by date and feature name |

## Project-Specific Configuration

The `CLAUDE.md` prompt has been tailored for this Rora Ride project:

- **Quality checks:** Runs `npx tsc --noEmit` before committing
- **Conventions:** References `AGENTS.md` and `CLAUDE.md` in project root
- **Critical files:** Never modify `src/types/database.ts` or `convex/_generated/`
- **Approval gates:** Waits for approval before modifying `pricing.ts`, `trip-qr.ts`, or ride state machine
- **Guest mode:** Always handles both authenticated and guest flows

## Workflow Example

```bash
# 1. Generate PRD
# (In Claude Code chat)
Load the prd skill and create a PRD for "add driver rating system"

# 2. Convert to JSON
Load the ralph skill and convert tasks/prd-driver-rating.md to prd.json

# 3. Run Ralph
cd scripts/ralph
./ralph.sh --tool claude 10

# 4. Monitor progress
cat progress.txt
cat prd.json | jq '.userStories[] | {id, title, passes}'
```

## Debugging

Check current state:

```bash
# See which stories are done
cat prd.json | jq '.userStories[] | {id, title, passes}'

# See learnings from previous iterations
cat progress.txt

# Check git history
git log --oneline -10
```

## Stop Condition

When all stories have `passes: true`, Ralph outputs `<promise>COMPLETE</promise>` and the loop exits.

## Archiving

Ralph automatically archives previous runs when you start a new feature (different `branchName`). Archives are saved to `archive/YYYY-MM-DD-feature-name/`.

## Skills Installed

The following skills are installed globally in `~/.claude/skills/`:

- **prd** - Generate Product Requirements Documents
- **ralph** - Convert PRDs to Ralph JSON format

These are available in all Claude Code sessions.

## References

- [Geoffrey Huntley's Ralph article](https://ghuntley.com/ralph/)
- [snarktank/ralph GitHub repo](https://github.com/snarktank/ralph)
- [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code)

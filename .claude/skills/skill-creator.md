---
name: skill-creator
description: Create a new project skill from scratch, or improve an existing one. Use this when the user asks to "make a skill for X", "turn this workflow into a skill", "create a /command for Y", or wants to capture a repeatable process as a reusable skill file. Also use when the user wants to refine or rewrite an existing skill in .claude/skills/.
---

# Skill Creator

A lightweight workflow for creating and testing project skills. The goal is a
useful, well-triggered skill file in one or two short iterations — not a
perfect one after a long eval pipeline.

Reference: the full Anthropic skill-creator methodology (with eval scripting,
browser review, and description optimization loops) lives at
https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md.
Use it if you need rigorous benchmarking. This skill covers the 80% case.

---

## Step 1 — Capture intent

If the user has just demonstrated a workflow in this conversation, extract the
intent from what just happened — tools used, sequence of steps, any corrections
they made. Then confirm with them before writing anything.

Otherwise, ask (no more than 4 questions at once):

1. **What should this skill enable?** One clear sentence about the goal.
2. **When should it trigger?** What phrases or situations should make you reach
   for it? Be specific — vague descriptions lead to the skill being skipped.
3. **What's the output?** File edits, shell commands, a report, a conversation,
   a mix?
4. **Are there edge cases or inputs that must be handled?** Things that would
   cause a naive attempt to fail.

Wait for answers before proceeding.

---

## Step 2 — Draft the skill

Skills live in `.claude/skills/<name>.md`. Write the file with this structure:

```
---
name: skill-name          ← kebab-case, matches filename
description: ...          ← see "Writing a good description" below
---

# Skill Name

One sentence on what this skill does and why.

## Step 1 — ...
## Step 2 — ...
...
```

### Writing a good description

The description is the primary trigger — Claude decides whether to use this
skill based on it alone. Make it slightly "pushy": include not just what the
skill does but the specific contexts where it applies, even if the user hasn't
said the magic words.

Instead of: `"Sync task files with GitHub issues."`
Write: `"Audit and sync root-level task PRD files in tasks/ against GitHub
issues. Use this when completing a task, opening new tasks, or any time the
issue tracker seems out of date with the task files."`

### Writing good instructions

- Use imperative form: "Run this command", "Add this field", not "You should".
- Include concrete shell commands and file paths — not abstract descriptions.
- Explain the *why* behind non-obvious steps. Claude is smart; understanding
  the reason lets it handle edge cases better than a rigid rule.
- Avoid heavy-handed MUST/NEVER/ALWAYS for things that don't truly require it.
  Prefer explaining the consequence: "Don't create issues before the branch
  merges to main — the file URL will 404."
- End with a verification step: a command or observable state that confirms
  the skill ran correctly.
- Keep it under ~200 lines. If it's getting longer, add a `references/`
  directory and link out.

### File location

```
.claude/skills/<name>.md          ← single-file skill (most cases)

.claude/skills/<name>/            ← directory skill (if you need bundled files)
  SKILL.md
  references/
  scripts/
```

Single-file is preferred unless the skill needs reference docs or helper scripts.

---

## Step 3 — Write 2–3 test prompts

Write realistic test prompts — the kind a user would actually type. Show them
to the user before running:

> "Here are 3 prompts I want to test the skill against. Do these look right?"

Good test prompts are:
- Specific enough to have a clear expected output
- Phrased naturally (not "test the skill by doing X")
- Covering the core case + at least one edge case

After the user confirms (or adjusts), run each prompt yourself — don't spawn
subagents. You wrote the skill; simulate following it and show the output or
describe what you would do. This is less rigorous than an independent agent
but sufficient for a first pass.

---

## Step 4 — User review

Present the results inline. For each test:
- What prompt was given
- What the skill would produce (or what you did when following it)
- Whether the output looks right

Ask: "How does this look? Anything to change or add?"

---

## Step 5 — Revise

Apply the feedback. Focus on:
- **Generalize, don't over-fit.** If test case 2 failed, understand *why* and
  fix the underlying gap — don't just patch test case 2 specifically.
- **Remove dead weight.** If a section produced no useful output in any test,
  cut it.
- **Clarify ambiguity.** If you had to guess what the skill wanted, rewrite
  that section to be unambiguous.

Do one revision pass. If the user wants another round, repeat steps 3–5.
Two iterations is usually enough; if you're not converging, the scope is
probably too broad — consider splitting the skill.

---

## Step 6 — Finalize

- Confirm the file is saved to `.claude/skills/<name>.md`
- Verify it's tracked by git (`git status` — `.claude/skills/` is not ignored)
- Read the description aloud (mentally): does it unambiguously describe when
  to use this skill vs. not using it?

Done.

# Lessons Learned — Rizz IQ Website

Patterns, gotchas, and architectural decisions discovered during website
development sessions. One entry per lesson. Most recent at the top.

---

## S74 — `/review` against locked decisions, not just the diff (2026-05-10)

**Pattern:** After surgical copy or structural changes driven by a set of
explicit pre-locked decisions, run Claude Code's `/review` referencing those
decisions — not just the code diff in isolation.

**Why this matters:** Code review focuses on what changed. A locked-decision
review focuses on whether the change is *consistent* with the decisions
across all surfaces. The two passes catch different bugs.

**Concrete example from S74:** The partner page surgical update locked the
phrase "20% off first billing period" to replace "20% off first month"
(the locked decision was driven by the need to keep partner pitches honest
for Annual subscribers — $35.99 saved is the headline, not $3). The first
commit fixed the phrase in the Annual card and FAQ but left two other
surfaces untouched:

- L392 (How It Works Step 1): still said "first month"
- L524 (Who This Is For): still said "first month"

A pure diff review would have passed — every changed line was correct.
A locked-decision review caught the inconsistency immediately, because
the question became "is 'first billing period' the term used everywhere
this concept appears?" — not "is each change correct in isolation?"

**Recipe:**

1. Before the work, write the locked decisions as a numbered list
2. After the work, run `/review` with a prompt that includes those
   decisions verbatim and asks: "Does this diff achieve all decisions
   above consistently across the entire file?"
3. Catch and fix any contradictions in a follow-up commit on the same
   branch before merge

**When to apply:** Any session with 3+ locked decisions touching the same
file or set of files. Pure refactors and bug fixes don't benefit — they
have one decision (the fix) and no consistency surface to check.

---

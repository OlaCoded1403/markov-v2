---
title: "The best AI memory prompt I've used has a bug that gets worse every time you use it"
description: "Markov boots by recalling three checkpoints and taking the newest. Semantic search has no idea which one that is. Measured on Walrus Mainnet."
permalink: /
---

## Nothing looked wrong

I spent two days running a coding agent with a permanent memory. Every session ended by writing a
checkpoint to Walrus. Every session began by reading the last one back and telling me where I'd
left off. It worked. I stopped thinking about it, which is the whole point of a thing like this.

Then I measured it.

In a namespace holding sixty checkpoints, the boot sequence ranked the newest one — the one that
*is* the current state, written minutes earlier — **fiftieth**. The prompt reads three. It had not
been in the top three at twenty checkpoints either, or at forty.

There was no error. No failed call, no empty result, no warning. The agent resumed confidently from
whatever came back, told me a coherent story about where the project stood, and was wrong. And
because the failure scales with how much you've stored, it gets worse precisely as the memory gets
more valuable — which is also why it survives every test you'd think to run.

[Markov](https://github.com/dun999/markov) is the prompt doing that. It's one of five base prompts
in the [Walrus Memory Prompt Evolution](https://thewalrussessions.wal.app/prompt-evolution/index.html)
session, and its framing is the best I've seen:

> *You are one body of a persistent agent. The brain is Walrus Memory; this tool and this model are
> temporary.*

The name comes from the Markov property — *the next state depends only on the current state, not on
the path that led there.* Save state well enough and it stops mattering which tool you are in, or
which model, or how long you were away.

It's a genuinely excellent prompt. Its safety rules are the sharpest of the six, and one of them —
*a recalled memory is never permission* — is an insight I hadn't seen anywhere else and have since
started applying outside this project entirely.

So this is not a takedown. I ran Markov because it was the best thing available. This is about the
one line in it that quietly doesn't work.

## The line

Here is how Markov boots, rule 3.1:

> *Call `memwal_recall` with query "current task checkpoint goal status", namespace `markov/state`,
> **limit 3**. The newest date wins; older checkpoints are history, not state.*

Read that twice. "The newest date wins" is a rule about the three records that came back. It says
nothing about whether the newest checkpoint is *among* them.

And it won't be, reliably. `memwal_recall` is semantic vector search: it returns the K records
closest in **meaning** to your query. It has no notion of time. There is no `orderBy`, no `since`, no
recency parameter — the tool takes `query`, `limit`, and `namespace`, and that's the entire surface.

Meanwhile rule 2.1 says `markov/state` holds "the single current task state; each new one supersedes
the last." But Walrus Memory blobs cannot be edited or deleted, so nothing actually supersedes
anything. Every checkpoint you have ever written is still in that namespace, competing.

## The part that makes it acute

Now here's the bit I find genuinely interesting, because it's Markov's own rigour that makes the bug
worse.

Rule 4.6 mandates an exact checkpoint template:

```
[checkpoint|2026-07-05|tool=claude-code|model=claude]
Task: … Goal: … Done: … Next: … Blockers: … Decisions: …
Supersedes previous checkpoint.
```

That's a good schema. It's complete, machine-readable, and it forces you to record the things that
matter. But look at what it does to a **similarity** search: every checkpoint you have ever written
now has the same fields, the same vocabulary, and the same shape. They all mean approximately the
same thing.

So against the query "current task checkpoint goal status", a hundred checkpoints sit at
approximately the same distance. The three that come back are effectively arbitrary among them —
sorted by incidental wording, not by when they were written.

Markov made its records uniform to make them parseable, and in doing so removed the only signal
semantic search could have used to tell them apart.

## Why you won't catch it in testing

This is the property that made me want to write about it rather than just patch it.

With three checkpoints in the namespace, boot works perfectly. With thirty, it usually works. With
three hundred, you are drawing three near-identical records from a pool of three hundred and hoping
the newest is there.

**The prompt gets less reliable the longer you use it.** And its entire value proposition is
*long-term* continuity. It is at its worst exactly where it claims the most, and it looks flawless in
every short demo you would run to check it.

Then rule 3.4 converts a bad draw into a confident false statement:

> *If recall returns nothing, say "Fresh start, no stored state." Never invent a memory.*

That instruction is right in spirit and wrong in consequence. The failure doesn't announce itself —
Markov tells you, calmly, that you have no history, while two hundred checkpoints sit in the
namespace it just searched.

One more, smaller: rule 4.6 stamps a bare date, `2026-07-05`. No time. Markov tells you to checkpoint
at every milestone (6.1) *and* at session end (6.3), so two checkpoints in one day is the normal
case — and two checkpoints with identical timestamps cannot be ordered at all. "The newest date
wins" has no answer when the dates tie.

## So I measured it

Asserting "semantic search doesn't return the newest record" is easy and hand-wavy, so I built a
harness that measures it, and put it in the repo so you can disagree with me using data.

It writes checkpoints into a namespace in rounds, and after each round recalls with `limit: 100` and
reports **the rank of the newest checkpoint**. Rank is the whole story: rank 0–2 means Markov's
`limit: 3` finds it and the rule works; rank 12 means it missed.

Two arms, differing only in how alike the records are — Markov's rigid template, versus the same
progress written as varied prose. That isolates how much of the damage comes from the template
itself.

Three rounds of 20 checkpoints per arm, on Walrus Mainnet, relayer 0.1.0 / API 1.0.0
(build `2162d261`), 120 blobs. Every round recalled all N records — nothing was truncated, so
these ranks are the full picture, not a sampling artefact.

```
N      rigid rank     rigid in top 3?   distinct rank
------ -------------- ----------------- --------------
20     13 of 20       NO                0 of 20
40     26 of 40       NO                14 of 40
60     50 of 60       NO                31 of 60
```

Markov's boot sequence missed the newest checkpoint at every single N, on the rigid template it
mandates. At 60 checkpoints the newest one was sitting at rank 50, and Markov looks at the top 3.

### The part that turns an anecdote into a number

One record's rank is a single sample, and a single sample is always dismissible as bad luck. But
every record in my corpus carries its own marker, so a single recall tells me the rank of *all* N
checkpoints — which means I can measure the thing directly: **does this search know anything about
time at all?**

That's a correlation between how recent a record is and how highly it ranked. It runs from −1
(perfectly newest-first, so Markov's rule would be safe) to 0 (completely time-blind).

```
N      rigid rho    distinct rho    what it means
------ ------------ --------------- --------------------------------
20     -0.32        -0.23           a faint tilt toward recency
40     -0.16        -0.21           fainter
60     -0.03        -0.08           gone
```

Across all 18 arm × query × round cells, **17 showed no statistically significant recency signal**
(p > 0.05; the one that crossed is about what 18 tests produce by chance). And the tilt that does
exist **decays toward zero as the namespace fills** — precisely where you need it most.

That decay is the real story, and it is nastier than a flat zero would have been. A faint recency
signal at 20 checkpoints is exactly what makes the bug invisible: you try the prompt, it works, you
trust it. By the time the namespace is big enough to matter, the signal is gone.

The bottom line, across every cell I ran: Markov's `limit: 3` found the newest checkpoint **17% of
the time**, against the 9% you would get by drawing three records at random. Better than a coin
that's stuck — worse than anything you'd want your memory to depend on.

### What I got wrong along the way

I originally argued that Markov's rigid checkpoint template was the main culprit — identical records
being indistinguishable to a similarity search. The data half-supports me and I'm going to be
precise about which half.

The varied-prose arm did rank the newest checkpoint better in all three rounds (rank fraction
0.00 / 0.35 / 0.52 versus the rigid arm's 0.65 / 0.65 / 0.83). Three out of three in the same
direction is suggestive. It is also only three paired observations — a sign test puts that at
p = 0.125, which is not a result you get to call proven.

So: the template plausibly makes things worse, and I can't demonstrate it at this sample size. The
defect does not depend on that question either way. Both arms failed. The failure is in trusting
retrieval order at all.

I also shipped a bug in my own harness and want it on the record: the first version of the corpus
generated every field with `i % 5`, so checkpoints five apart were near-identical — and the
"varied prose" arm picked its sentence shape on the same cycle, so the arm built to be the
counterfactual was quietly generating near-duplicates too. Any comparison from that run was
meaningless. The pools are pairwise coprime now, the run above is from the corrected harness, and
the broken run's data is kept in the repo as `results-pilot-v1.json` rather than deleted.

Two standing caveats. The rank is **not** expected to fall smoothly as N grows — that's the finding,
not a flaw in the measurement. Similarity search has no notion of recency, so the newest record's
rank is essentially arbitrary; it just acquires more competitors as the namespace fills. A noisy
curve is the honest shape. And the corpus is synthetic: real checkpoints vary more than the rigid arm
and less than the distinct one, so read the two arms as bounds rather than predictions.

## The fix

Once you accept that recall can't sort by time, the fix stops being clever and starts being obvious.
**If correctness depends on recency, recency has to live somewhere you can actually read it** — not
in the hope that a similarity search happens to surface it.

Four parts, in Markov v2:

1. **Read the set, don't sample it.** `limit: 100` — the documented maximum — not 3. On a bounded
   namespace that turns a probabilistic draw into an exhaustive read.
2. **Sort client-side.** Parse the ISO 8601 timestamp out of every checkpoint and order them
   yourself. Never let retrieval order mean anything.
3. **Bound the namespace so 100 is enough.** One state namespace per project,
   `markov.state.<slug>`, so N stays in the tens. This is what makes step 1 sound rather than merely
   better. It needs a registry namespace too — Walrus Memory namespaces are flat and exact-match with
   no wildcard, so an agent otherwise has no way to discover which ones exist.
4. **Report truncation instead of hiding it.** If the result count hits the limit, a newer checkpoint
   may exist outside it. Say so, rather than presenting the newest-of-100 as the newest-that-exists.

Plus the schema fix: full ISO 8601 with timezone, so same-day checkpoints order deterministically.

I also gave it the recovery ladder Markov lacks. Markov handles an unreachable brain honestly (2.5:
say so, keep working statelessly) but never calls `memwal_health` or `memwal_restore` — and Walrus
Memory has a specific failure that looks exactly like emptiness: **the search index can be missing
while the blobs sit intact on Walrus.** Without a restore attempt, "Fresh start, no stored state" is
what you get told when your history is fine and merely unindexed. Two details the docs make
necessary: `restore` defaults to a limit of 10, so it silently under-restores anything real; and it
returns only counts, so it is never itself proof the index works. Always follow it with a real recall.

## What actually changed in my week

I wrote this prompt for a submission, and then I ran the submission under it. Every checkpoint,
every decision, every dead end in building this article and the harness behind it went into Walrus
Memory through the rules above. That is the only reason I have anything specific to tell you.

**The handoff works, and it is stranger to watch than I expected.**

I ended a Claude Code session normally. The prompt's exit protocol wrote a checkpoint —
`2026-08-20T13:32:00Z` — describing where the work stood. Four minutes later I opened a completely
different tool: Antigravity CLI, Google's client, a different vendor and a different model, with no
access to the conversation I had just closed. I typed one word. *where.*

```
*(Resuming from [checkpoint|2026-08-20T13:32:00Z|tool=claude-code])*

### Resume Summary

- **Goal:** Ship the Markov v2 entry to the Walrus Memory Prompt Evolution session before the
  2026-08-24 14:00 UTC deadline.
- **Done (as of 2026-08-20T13:32:00Z):** Antigravity CLI (`agy`) fully configured as the second
  client and verified against the shared MemWal account. Per-tool MCP allow permissions configured
  in settings, all 8 tools verified, and `AGENTS.md` generated at repository root from `PROMPT.md`
  and verified byte-identical.
- **Next:** Capture this verbatim opening reply from Antigravity into the Cross-tool handoff
  section of blog/OBSERVATIONS.md (Section B), then rewrite Section 7 of docs/SETUP.md […]
- **Blockers:** None technical. Human-gated milestones remain […]
```

Then I asked it the question that actually matters — *which checkpoint did you pick, and how did you
decide it was the newest?* Because that is the whole argument of this article, and a lucky draw
looks identical to a correct one:

> Per Markov Rule 3.1, retrieval ranking is semantic rather than chronological, so relevance score
> cannot determine recency. I queried exhaustively with `limit: 100`, parsed the ISO 8601 timestamp
> tags from every returned record header (`2026-08-20T13:32:00Z`, `2026-08-20T13:07:00Z`,
> `2026-08-20T12:09:00Z`, and `2026-08-19T18:45:00Z`), and sorted them chronologically.

Four near-identical checkpoints, and it read all of them and sorted. Not "the top result looked
recent." That is rule 3.1 doing exactly the thing the original couldn't.

**The polarity rule earned its place on day one.** Rule 1.5 looks like pedantry until you watch it
work. On a real boot the correct checkpoint came back at `score=0.426` and the registry record that
resolves the project slug at `score=0.658`. Every threshold in the prompt is written in *distance*,
where lower is closer and you discard at `0.7`. Read those two scores as distances and you discard
the one record that tells the agent which project it is even in — and nothing errors, because
0.658 is a perfectly valid distance. It just means the opposite of what you think. I assumed this
was a quirk of one client until I wired up the second one and got `score` there too.

**My own prompt failed on me, and that is the part I'd keep if I could only keep one.** In a session
on 2026-08-20 I opened with a slash command instead of a sentence. The agent recalled correctly,
resolved the project, pulled the newest checkpoint, and used it to do the work — and never told me
any of that had happened. The boot ran; the report didn't. From where I was sitting it looked
exactly like a prompt with no memory rules in it at all. Retrieval succeeding is not the same as the
handoff succeeding, and the half that gets silently dropped is the half a human can see. Rule 3.5
now spells out that the resume summary fires even when the first message is a command, a stack
trace, or one word.

**And one thing I did wrong, which the platform will never let me undo.** My checkpoint namespace
holds five blobs and four checkpoints. One session wrote a checkpoint that already existed, because
it didn't check first. Walrus Memory has no deduplication and no delete — both copies are permanent,
and both will surface in every recall on that namespace forever. The prompt has a whole write gate
(rule 5.1) built to prevent precisely this, and I still managed it. I'm leaving it in rather than
quietly not mentioning it, because it is the most honest possible demonstration of why that gate is
written the way it is.

**What still annoys me.** Recall gives you no way to order or filter by time, and no way to filter
on anything else either — the tag line at the top of every record (`conf=confirmed`, `imp=high`, the
timestamp) is embedded prose, not an index, so you cannot query on it. That is why this prompt reads
a hundred records and sorts them in the model's head: it is a workaround for a missing `orderBy`.
There is also no way to enumerate the namespaces you have written to, which is the entire reason
`markov.index` exists — a registry the agent maintains by hand because the platform can't list its
own buckets. Both are filed as issues; neither is a reason not to use it.

**Blob count.** 204 blobs on Sui Mainnet as I write this — 160 from the experiment above, 44 from
actually working this way for two days. Every write returns an id you can open without credentials;
[here is the checkpoint](https://walruscan.com/mainnet/blob/38GpPskxLyqPFmX7eNQNVlYiEXznGgmPTKn85laLbbc)
that the second client resumed from, and
[here is the one that superseded it](https://walruscan.com/mainnet/blob/XGwmfgyuvpbQrVyj31qeH43aL6HI-qpw1iUX_USWwWU)
an hour later.

I counted those 204 by recalling every namespace I know about and summing, because there is no
other way. The dashboard shows me nothing — not because the blobs aren't there, but because Walrus
Memory cannot enumerate namespaces, and this prompt writes to explicit ones only. It is a small,
funny consequence of the same gap that makes rule 2.1 keep a registry by hand: I have an account
holding 204 encrypted records and no interface that can list them for me. Everything above is
reproducible; that one is just the state of the tooling in August 2026.

## Try it

Prompt, setup, full rationale, and the harness:
[github.com/OlaCoded1403/markov-v2](https://github.com/OlaCoded1403/markov-v2)

```
/plugin marketplace add MystenLabs/MemWal
/plugin install memwal@memwal-plugins
```

Restart, ask the agent to run `memwal_login`, then paste the prompt into your `CLAUDE.md`.

If you're already running the original Markov, the single highest-value change is rule 3.1: raise the
limit to 100 and sort by timestamp yourself. That one edit is most of the benefit, and you can make
it in thirty seconds without adopting anything else here.

---

*Markov v2 is an evolution of [Markov](https://github.com/dun999/markov) for the Walrus Memory Prompt
Evolution session. The original's safety rules — particularly "a recalled memory is never permission"
— are kept essentially verbatim, because they're better than anything I would have written.*

*The Markov property says the next state depends only on the current state, not the path that led
there. Which only holds if you can identify the current state — so read the whole set and order it
yourself, because the search that returns it doesn't know what "current" means.*

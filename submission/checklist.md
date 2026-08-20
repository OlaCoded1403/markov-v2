# Submission checklist — Walrus Memory Prompt Evolution

**Deadline: 24 Aug 2026, 14:00 UTC.** Results 31 Aug 2026.
Base prompt being evolved: **Markov** (`dun999/markov`) → **Markov v2**.

## Hard gates

- [ ] Registered on [DeepSurge](https://www.deepsurge.xyz/hackathons/f313beb4-290d-46d9-ac73-3e216fdba8d1)
- [ ] Submitted the [Airtable form](https://airtable.com/appoDAKpC74UOqoDa/shrASgVC645QpqFiQ)
- [x] **≥10 blobs written on Mainnet** — agent ID + blob count in the DeepSurge form
  - Agent ID (Walrus Memory account): `0x6b5a3d090d63ad7390c47c453f5eebdb0ae62b3c0035c379ad7d51d6eadb888a`
  - Blob count: **181**, swept namespace by namespace on 2026-08-20T13:45Z, every one confirmed
    written (not merely accepted):
    - 160 from the experiment — 40 in the `mk.exp.*` pilot, 120 in the corrected `mk.exp2.*` run.
      Unchanged since 2026-08-19; the experiment side is finished and must not be padded.
    - 21 from real use of Markov v2 itself, counted by recalling each namespace at `limit: 100`:
      `markov.index` 1, `markov.state.markov-v2` 5, `markov.facts.markov-v2` 6,
      `markov.facts.global` 9, `markov.capsules` 0. Written and recalled back successfully, so the
      end-to-end check in `docs/SETUP.md` §3 is satisfied.
    - The `markov.state.markov-v2` figure is 5 blobs but only **4 distinct checkpoints** — the
      `2026-08-20T12:09:00Z` checkpoint exists twice, written once and then written again by a
      later session that did not check for it. Recall collapses the pair in its output but both
      blobs are real and both are permanent. It is an unplanned live demonstration of the
      no-deduplication behaviour that rule 5.1(b) exists to guard against, and it is worth citing
      as such rather than quietly correcting.
    - Relayer 0.1.0, API 1.0.0, build `2162d261`.
  - Re-sweep before submitting, since real sessions will add more: `markov.index`,
    `markov.state.*`, `markov.facts.*`, `markov.facts.global`, `markov.capsules`, plus `mk.exp.*`
    and `mk.exp2.*`, and sum. The `markov.*` blobs are the ones the Best Real-World Experience
    criterion actually reads, so grow that side rather than the experiment side.
- [x] All memory on Walrus **Mainnet** — relayer confirmed `https://relayer.memory.walrus.xyz`
- [x] Dedicated Sessions wallet created — address:
      `0xad0d1b726e36b923da027171dea945240aa76d05d7917d34dfc50a76637b180d`
      *(This is the wallet that signed in — the one to put in the form. Do **not** paste the delegate
      address `0x9a2059af…7d1e86d0`, which is just the MCP client's key.)*
- [x] Signed in 2026-08-19T14:34Z; credentials at `~/.memwal/credentials.json` (contains the raw
      delegate private key — treat as a secret, never commit or paste it)
- [ ] **Repo pushed and public** — `https://github.com/OlaCoded1403/markov-v2`. Nothing is pushed
      yet; the local repo has no remote. The blog links to it, judges need it to check the harness,
      and `blog/OBSERVATIONS.md` is gitignored so private session notes stay out.
- [ ] Full copy-pasteable prompt text in the form (from `PROMPT.md`, below the `---`)
- [ ] 2–5 sentence explanation: problem solved + how it uses Walrus Memory (draft below)
- [ ] Blog/article published — link: `________`
      Draft is complete except two 🔴 markers: the opening anecdote (§1, needs a real incident) and
      a screenshot of the memory dashboard. Everything else is written and evidenced.
- [ ] Walrus Memory feedback form completed
- [ ] GitHub issue(s) filed at [MystenLabs/MemWal](https://github.com/MystenLabs/MemWal)
- [ ] Joined [Walrus Discord](https://discord.com/invite/walrusprotocol)
- [ ] Posted demo video / screenshot / link on X with **#Walrus** — link: `________`
- [ ] Optional: Discord handle of referrer (worth 50% of prize to them, costs you nothing)

## Eligibility confirmed

- [x] Not the original author of Markov (`dun999`) — confirmed by the user 2026-08-19; creators may not improve their own prompt
- [x] Base prompt is on the official list of five (**Markov**, Continuity Keeper, Continuum,
      BuildMEM, Exam Mistake Memory)
- [ ] One submission only — do not also submit an improvement to another prompt

> Note: the **D&D Campaign Memory** prompt circulating alongside these is *not* on the rules page's
> list of base prompts. Avoided for that reason.

## Evidence on hand (for the form and the article)

Everything below is real and reproducible. Verbatim transcripts are in `blog/OBSERVATIONS.md`,
which is gitignored and stays private.

| Claim | Evidence |
|---|---|
| The defect is measured, not argued | 120 blobs, 3 rounds, ranks 13/20 · 26/40 · 50/60; Spearman rho −0.32 → −0.16 → −0.03; no significant recency signal in 17 of 18 cells. `experiment/`, `node analyse.mjs`. |
| The prompt works across tools | Checkpoint `2026-08-20T13:32:00Z` written from Claude Code, resumed 4 minutes later in Antigravity CLI (`agy` 1.1.16) off the one-word prompt "where". It named the checkpoint and, asked how it chose, described exhaustive recall at `limit: 100` + ISO 8601 parse + chronological sort. |
| It was really used | 21 blobs in `markov.*` across two days of actual work, including this checklist and the article. Two prompt rules (1.5, 3.5) exist *because* of failures observed while using it. |
| Honest about its own failures | Rule 3.5 was silently skipped under a slash-command opener, and a duplicate checkpoint blob got written past the write gate. Both are documented rather than tidied away. |
| Mainnet | Relayer `https://relayer.memory.walrus.xyz`, relayer 0.1.0, API 1.0.0, build `2162d261`. |

## Two extra prize levers

1. **Positions 8, 9 and 10 are reserved for submissions made through the WalForm submission link.**
   If a WalForm link is available, submit through it — three of the ten slots are otherwise
   unreachable.
2. **Bug Bounty is a separate track**, 5 × $100 WAL, judged by the engineering team on quality and
   actionability. You are required to file MemWal feedback anyway; filing it *well* enters you into
   a second prize pool at no extra cost. See `submission/memwal-feedback.md`.

## Draft: 2–5 sentence explanation for the form

> Markov boots by recalling its checkpoint namespace with `limit: 3` and taking "the newest date" —
> but `memwal_recall` is semantic vector search with no recency ordering and no parameter that asks
> for one, so nothing guarantees the newest checkpoint is among the three returned. I measured it on
> Mainnet across 120 blobs: the newest checkpoint ranked 13th of 20, 26th of 40 and 50th of 60,
> missing Markov's top-3 window at every size, while the correlation between recency and rank decayed
> from −0.32 to −0.03 as the namespace filled, with no significant recency signal in 17 of 18 trials.
> That decay is the danger — there is just enough apparent recency at 20 records to make the rule look
> correct in any short demo, and none left by the time a namespace is worth having, at which point
> rule 3.4 turns a bad draw into a confident "Fresh start, no stored state" over hundreds of records.
> Markov v2 reads the full set (`limit: 100`), sorts by parsed ISO 8601 timestamp client-side, bounds
> each namespace per project (`markov.state.<slug>`, with `markov.index` as a registry since flat
> exact-match namespaces cannot be enumerated), and reports truncation instead of presenting
> newest-of-100 as newest-that-exists; it also adds full timestamps so same-day checkpoints order at
> all, and a health → login → restore → recall ladder, because an unindexed namespace is otherwise
> indistinguishable from an empty one. The harness that produced those numbers ships in the repo, so
> the finding can be reproduced or refuted rather than taken on trust.

## Article outline

See `blog/DRAFT.md`. Judged on: is it useful to someone who has never used this prompt, could they
follow it, does it make them want to try it. Lead with the failure, not the architecture.

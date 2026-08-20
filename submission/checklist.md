# Submission checklist — Walrus Memory Prompt Evolution

**Deadline: 24 Aug 2026, 14:00 UTC.** Results 31 Aug 2026.
Base prompt being evolved: **Markov** (`dun999/markov`) → **Markov v2**.

## Hard gates

- [ ] Registered on [DeepSurge](https://www.deepsurge.xyz/hackathons/f313beb4-290d-46d9-ac73-3e216fdba8d1)
- [ ] Submitted the [Airtable form](https://airtable.com/appoDAKpC74UOqoDa/shrASgVC645QpqFiQ)
- [x] **≥10 blobs written on Mainnet** — agent ID + blob count in the DeepSurge form
  - Agent ID (Walrus Memory account): `0x6b5a3d090d63ad7390c47c453f5eebdb0ae62b3c0035c379ad7d51d6eadb888a`
  - Blob count: **166** as of 2026-08-19, every one confirmed written (not merely accepted):
    - 160 from the experiment — 40 in the `mk.exp.*` pilot, 120 in the corrected `mk.exp2.*` run.
    - 6 from real use of Markov v2 itself — 1 in `markov.index`, 3 in `markov.facts.markov-v2`,
      1 in `markov.facts.global`, 1 checkpoint in `markov.state.markov-v2`. Written and recalled
      back successfully, so the end-to-end check in `docs/SETUP.md` §3 is satisfied.
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
- [ ] Full copy-pasteable prompt text in the form (from `PROMPT.md`, below the `---`)
- [ ] 2–5 sentence explanation: problem solved + how it uses Walrus Memory (draft below)
- [ ] Blog/article published — link: `________`
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

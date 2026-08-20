# Submission checklist — Walrus Memory Prompt Evolution

**Deadline: 24 Aug 2026, 14:00 UTC.** Results 31 Aug 2026.
Base prompt being evolved: **Markov** (`dun999/markov`) → **Markov v2**.

## Hard gates

- [ ] Registered on [DeepSurge](https://www.deepsurge.xyz/hackathons/f313beb4-290d-46d9-ac73-3e216fdba8d1)
- [ ] Submitted the [Airtable form](https://airtable.com/appoDAKpC74UOqoDa/shrASgVC645QpqFiQ)
- [x] **≥10 blobs written on Mainnet** — agent ID + blob count in the DeepSurge form
  - Agent ID (Walrus Memory account): `0x6b5a3d090d63ad7390c47c453f5eebdb0ae62b3c0035c379ad7d51d6eadb888a`
  - Blob count: **185** as of 2026-08-20T15:05Z. **Re-sweep before submitting** — real sessions keep
    adding to it — with `node experiment/blob-count.mjs`, which is read-only and prints this table:

    ```
    markov.index                    1
    markov.facts.global            11
    markov.capsules                 0
    markov.state.markov-v2          6   (1 duplicate blob)
    markov.facts.markov-v2          7
    mk.exp.rigid                   20
    mk.exp.distinct                20
    mk.exp2.rigid                  60
    mk.exp2.distinct               60

    real use (markov.*)     25
    experiment (mk.exp*)   160
    TOTAL                  185
    ```

    - 160 from the experiment. Unchanged since 2026-08-19; that side is finished and must not be
      padded. 25 from real use — the `markov.*` blobs are what the Best Real-World Experience
      criterion reads, so grow that side.
    - **Count with the SDK, not the MCP tools.** MCP collapses byte-identical records in its output
      ("1 duplicate copy collapsed"), which is helpful when reading and wrong when counting. It cost
      me a misattributed duplicate before I noticed.
    - `markov.state.markov-v2` holds 6 blobs but only **5 distinct checkpoints**: the
      `2026-08-20T13:07:00Z` checkpoint exists twice, as blobs `W6Yjjh0V1hD0KfhH42BPmun9Vsd5Mz9pVz8EfMhGHTY`
      and `nOaQejkqhgWyGaEdeE4Fmhm_kb6EbClyEk2OY1QIZe8` — written once, then written again by a
      later session that did not check first. Both are real and both are permanent. An unplanned
      live demonstration of the no-deduplication behaviour rule 5.1(b) exists to guard against, and
      worth citing as such rather than quietly correcting.
    - Relayer 0.1.0, API 1.0.0, build `2162d261`.
- [x] All memory on Walrus **Mainnet** — relayer confirmed `https://relayer.memory.walrus.xyz`
- [x] Dedicated Sessions wallet created — address:
      `0xad0d1b726e36b923da027171dea945240aa76d05d7917d34dfc50a76637b180d`
      *(This is the wallet that signed in — the one to put in the form. Do **not** paste the delegate
      address `0x9a2059af…7d1e86d0`, which is just the MCP client's key.)*
- [x] Signed in 2026-08-19T14:34Z; credentials at `~/.memwal/credentials.json` (contains the raw
      delegate private key — treat as a secret, never commit or paste it)
- [x] **Repo pushed and public** — https://github.com/OlaCoded1403/markov-v2 (pushed 2026-08-20,
      commit `f86df43`). 28 files tracked; `blog/OBSERVATIONS.md`, `.claude/settings.local.json`
      and `node_modules/` are gitignored, so the private session notes stayed out. The two
      `inspect-credentials.mjs` scripts print field names with values redacted — checked before
      pushing. This URL is what `blog/DRAFT.md` links to.
- [ ] Full copy-pasteable prompt text in the form (from `PROMPT.md`, below the `---`)
- [ ] 2–5 sentence explanation: problem solved + how it uses Walrus Memory (draft below)
- [ ] Blog/article published — link: `________`
      **The draft is complete — no unfilled markers.** It opens on the measurement rather than a
      personal anecdote, which needed no evidence I don't have, and it cites blob ids instead of a
      dashboard screenshot, which the dashboard cannot produce (see issue 10).
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
| It was really used | 25 blobs in `markov.*` across two days of actual work, including this checklist and the article. Two prompt rules (1.5, 3.5) exist *because* of failures observed while using it. |
| Honest about its own failures | Rule 3.5 was silently skipped under a slash-command opener, and a duplicate checkpoint blob got written past the write gate. Both are documented rather than tidied away. |
| Mainnet | Relayer `https://relayer.memory.walrus.xyz`, relayer 0.1.0, API 1.0.0, build `2162d261`. |

### Blob receipts — publicly verifiable, no screenshot required

Every write returns a blob id. These are on Walrus Mainnet and anyone can open them without
credentials, which is stronger evidence than a dashboard screenshot: a screenshot shows what my
browser rendered, a blob id shows what the network stored. Explorer:
`https://walruscan.com/mainnet/blob/<id>`

| Namespace | What it is | Blob id |
|---|---|---|
| `markov.state.markov-v2` | Checkpoint `2026-08-20T13:32:00Z` — the one Antigravity resumed from | `38GpPskxLyqPFmX7eNQNVlYiEXznGgmPTKn85laLbbc` |
| `markov.state.markov-v2` | Checkpoint `2026-08-20T14:08:00Z` — supersedes the above | `XGwmfgyuvpbQrVyj31qeH43aL6HI-qpw1iUX_USWwWU` |
| `markov.facts.global` | The `score`-vs-`distance` finding, confirmed across two clients | `ibKPNyHaliUzfZLNtQMwytsZDhq0nwrblf8ogfJCUZk` |
| `markov.facts.global` | Antigravity headless MCP permission syntax | `h-_5GBhlOEZWjBG9OtfZhHMCP3_rdlc7iSPAGMpDRFI` |
| `markov.facts.global` | How `agy` discovers `AGENTS.md` / `GEMINI.md` | `e8jMpzqeZmNhM2d_VRJntH2_qnu24OHowTOJcLR6D-8` |
| `markov.facts.markov-v2` | Why `AGENTS.md` exists, reversing an earlier decision | `UXdpWg1TTNWHOvzBoBycHkwS1oZOGt2OxjvnQNOWNDQ` |
| `markov.facts.markov-v2` | The published repo URL | `0uhPtAsotru6BrVP3Cxiwa1VcnL6MQ_-Homo5jQn0A4` |

> **The dashboard at [memory.walrus.xyz](https://memory.walrus.xyz) shows no blobs for this
> account, and that is expected rather than alarming.** Every Markov v2 write goes to an explicit
> namespace and Walrus Memory cannot enumerate namespaces — the same gap that forces rule 2.1 to
> maintain `markov.index` by hand, filed as issue 3 in `memwal-feedback.md`. A dashboard inherits
> the handicap: with nothing to enumerate it can only show the default namespace, which Markov v2
> deliberately never writes to. The blob count above comes from recalling each known namespace at
> `limit: 100` and summing, which is the only method the platform actually supports.

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

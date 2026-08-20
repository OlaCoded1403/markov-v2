# The recency experiment

Markov boots like this (rule 3.1):

```
recall("current task checkpoint goal status", namespace="markov/state", limit=3)
→ "The newest date wins."
```

That rule is sound only if the newest checkpoint is one of the three returned. Recall is **semantic
vector search** — it ranks by similarity to the query, and there is no recency ordering and no
parameter that asks for one.

This harness measures whether the assumption holds, and how it decays as the namespace fills up.

## What it measures

Two statistics, from the same recall at `limit: 100` (the documented maximum).

**1. The rank of the newest checkpoint.** The intuitive one:

- **rank 0–2** → Markov's `limit: 3` finds it. The rule works.
- **rank 12** → `limit: 3` missed it, and Markov resumes stale state or announces "Fresh start, no
  stored state" (rule 3.4) while dozens of checkpoints sit in the namespace.
- **ABSENT** → not in the top 100 at all.

**2. The recency/rank correlation (Spearman's rho).** The load-bearing one. Rank of the newest
record is a single sample per round, and a single sample is always dismissible as luck. But every
record carries its own `ckpt-NNNN` marker, so one recall yields the rank of *all* N checkpoints, and
the correlation between how recent a record is and how highly it ranked is measurable from that
alone — N samples for the price of one call.

| rho | meaning |
|---|---|
| ≈ −1 | recall effectively returns newest-first; rule 3.1 is safe |
| ≈ 0 | rank is independent of recency |
| ≈ +1 | recall systematically buries the newest record |

Rho ≈ 0 is what turns this from an anecdote into a prediction. If rank carries no recency signal,
then recalling k of N and taking "the newest date" succeeds with probability **k/N** — 15% at 20
checkpoints, 3% at 100, 1% at 300. That is a failure rate you can compute for any namespace, rather
than a story about one unlucky boot.

## Two arms

Both hold the same underlying progress. They differ only in how alike the records are.

| Arm | Namespace | Records |
|---|---|---|
| **rigid** | `mk.exp2.rigid` | Markov rule 4.6's template verbatim — same fields, same vocabulary, same shape every time |
| **distinct** | `mk.exp2.distinct` | The same progress written as varied natural prose |

This isolates the contribution of the template itself. Markov mandates a rigid checkpoint format for
good reasons — it is machine-readable and complete — but a consequence is that every checkpoint
*means* nearly the same thing, and semantic search separates records by meaning. The `distinct` arm
is the counterfactual.

Three queries are run against each arm: Markov's boot query verbatim, plus two rephrasings, so the
result can't be dismissed as an artefact of one wording.

### Corpus independence — why the pools are coprime

`corpus.mjs` draws each field from a pool, and **the pool lengths are pairwise coprime** (7, 11, 13,
5, 9), so the field combination has period 45045 and no two checkpoints below that share a content
tuple.

This is not incidental. The first version of the corpus indexed every field with `i % 5`, so
checkpoint `i` and checkpoint `i+5` were identical apart from marker and timestamp. That inflated
the rigid arm with true near-duplicates, and — worse — the distinct arm chose its prose shape with
`i % 5` as well, locking form and content in phase so that it generated near-duplicates too. The arm
built to be the counterfactual wasn't one, and the two arms were not comparable. Results from that
version are kept in `results-pilot-v1.json` (namespaces `mk.exp.*`) and should not be cited as a
template comparison. **If you extend the pools, keep the lengths coprime.**

## Running it

Requires a Walrus Memory account on mainnet — see [`../docs/SETUP.md`](../docs/SETUP.md).

```bash
cd experiment
npm install
node inspect-credentials.mjs      # confirm credential shape before anything writes

node run.mjs --stage 20           # write 20 checkpoints per arm (40 blobs), then measure
node run.mjs --stage 20           # 40 per arm — measure again
node run.mjs --stage 20           # 60 per arm — measure again
node run.mjs --report             # print the accumulated curve

node analyse.mjs                 # significance tests over results.json — the numbers to quote
node relayer-version.mjs         # relayer/API version and build, for provenance
```

`analyse.mjs` is the one to read before writing anything up. It converts each rho into a z-score
against the null "rank is independent of recency" (under which rho has mean 0 and SD 1/sqrt(n−1)),
so the claim becomes *"no significant recency signal in 17 of 18 cells"* rather than *"the number
looks small to me"*. It also runs the sign test on the rigid-vs-prose comparison, which is what
stops that comparison being overclaimed.

Each `--stage` appends to `results.json`, so the curve builds across runs. It waits 30 seconds after
writing before measuring, because indexing lags writes by a few seconds.

Writes go through `rememberBulkAndWait`, which polls every job to completion, and the run aborts if
any blob fails to land — so the counts here are blobs that actually exist, not jobs that were
accepted. (`rememberBulk` returns job ids immediately and would happily report a write that later
failed.) Note the argument shape: it takes one array of `{text, namespace}` items, **not** an array
of strings plus a positional namespace.

**Blob cost:** `--stage N` writes `N × 2` blobs. Three rounds of 20 is 120 blobs — comfortably past
the session's 10-blob requirement, and every one is a genuine write.

## Reading the result honestly

Keep these caveats in the write-up. They are what separate a measurement from a marketing claim.

- **Rank is not expected to fall monotonically as N grows.** That *is* the finding. Similarity
  search has no notion of recency, so the newest record's rank is essentially arbitrary — it just
  has more competitors as N grows, so the chance of landing in the top 3 shrinks. A noisy curve is
  the honest shape; a clean one would be suspicious. Rho is the statistic that should be stable
  across rounds; rank is the one that should jump around.
- **The corpus is synthetic**, generated from pools of goals and outcomes. Real checkpoints vary
  more than the `rigid` arm and less than the `distinct` arm, so treat the two arms as bounds rather
  than as predictions.
- **Distances depend on the embedding model.** Report the relayer version alongside the numbers.
- **Rho is measured per arm per query**, which is 6 cells per round. If the arms differ, say by how
  much and across how many cells; a gap smaller than the spread between queries is not a finding.
- Markov v2's fix is not cleverness — it reads all 100 and sorts by timestamp, so it finds the newest
  **whenever it is returned at all**. The honest limit is the `ABSENT` case, which is exactly why v2
  also bounds namespace growth per project and reports truncation instead of hiding it.

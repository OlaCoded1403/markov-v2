# The phantom-filter experiment

A reproducible A/B test of the claim behind BuildMEM v2: that the original's `project` / `ecosystem`
/ `tags` fields do not filter anything, and that routing by namespace is what actually isolates
memory.

Same facts. Same queries. Two storage strategies. Real numbers.

## The two arms

| Arm | Strategy | Namespace(s) |
|---|---|---|
| **control** | Original BuildMEM: every project's facts as JSON in one bucket, isolation "provided" by the `project` field | `ab.control` |
| **treatment** | BuildMEM v2: prose records routed to per-project namespaces | `ab.proj.orbit`, `ab.proj.ledger`, `ab.proj.atlas` |

The control writes to `ab.control` rather than literally `default` so the experiment doesn't pollute
your real memory — the mechanic under test (all projects sharing one namespace) is identical.

## What it measures

1. **Cross-project contamination** — the headline number. For each query scoped to one project,
   what fraction of returned results belong to a *different* project? The original prompt's premise
   is that the `project` field prevents this. It does not.
2. **Precision@5** — of the top 5 results, how many are genuinely relevant to the query?
3. **Top-hit distance** — how close the best match actually is, in both arms.
4. **JSON embedding cost** — whether wrapping a fact in JSON syntax measurably degrades the
   distance to a natural-language query versus the same fact as prose.

Measurement 4 is the one that tests the *format* claim independently of the namespace claim, so the
two changes can be defended separately.

## Running it

Requires a Walrus Memory account (see [`../docs/SETUP.md`](../docs/SETUP.md)) — sign in once with
`memwal_login` and credentials land in `~/.memwal/credentials.json`.

```bash
cd experiment
npm install
node inspect-credentials.mjs   # confirms the credential shape before anything writes
node run.mjs --seed            # writes the corpus to both arms (23 facts × 2 = 46 blobs)
node run.mjs --measure         # runs the queries, prints the table, writes results.json
```

`--seed` and `--measure` are separate on purpose: indexing lags writes by seconds, so seed, wait,
then measure. Re-running `--seed` writes duplicates (MemWal never dedupes), so run it **once**.

## Honesty notes

Keep these in the write-up — they're the difference between a measurement and a marketing claim.

- The corpus is synthetic and small (23 facts across 3 projects, 8 queries). It demonstrates a *mechanism*, not a
  benchmark. Contamination in the control arm is a structural certainty, not a surprising finding —
  the point is to put a number on how bad it is at realistic scale, and to show the treatment arm
  is *structurally* immune rather than merely better.
- Distances vary with the embedding model. Report the model/relayer version alongside the numbers.
- Precision@5 is judged against a hand-labelled relevance key in `corpus.mjs`. Labels are mine and
  arguable; the labelling is included so anyone can disagree with it.
- These blobs are real mainnet writes and count toward your blob total. They are legitimate — this
  is genuine use of the memory layer — but say so plainly in the submission rather than implying
  all your blobs came from organic day-to-day work.

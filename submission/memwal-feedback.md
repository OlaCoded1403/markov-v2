# MemWal feedback — draft GitHub issues

File at [MystenLabs/MemWal](https://github.com/MystenLabs/MemWal). Required by the rules, and judged
separately for the **Bug Bounty track** (5 × $100 WAL, scored on quality and actionability by the
engineering team). File them as separate issues, not one omnibus.

Every item below came out of actually building against the API. Ordered by how strong I think they are.

---

## 1. MCP `memwal_recall` has no `maxDistance`, so the docs' own filtering guidance doesn't apply to MCP users

**Type:** API gap / docs inconsistency

`SKILL.md` → *Recall Distance and Filtering* correctly warns that there is no default relevance
threshold, and prescribes:

```ts
await memwal.recall({ query, limit, namespace, maxDistance: 0.7 });
```

But the MCP tool schema for `memwal_recall` accepts only `query`, `limit`, and `namespace`. MCP
users — which is most agent users — cannot pass `maxDistance` at all, and must filter client-side on
the returned closeness value — which on MCP is a `score` of the opposite polarity, and undocumented
as such (see issue 9).

**Impact.** The stated remedy for the most common quality problem (small namespaces returning junk
as matches) is unavailable on the most common surface. An agent following the docs will believe it
is filtering when it isn't.

**Suggested fix.** Add `maxDistance` to the MCP `memwal_recall` schema, forwarding to the same
relayer parameter. Failing that, note the MCP limitation explicitly in the Recall Distance section.

---

## 2. No metadata filtering on recall — so every agent prompt invents phantom filters

**Type:** Feature request (highest impact of anything here)

The namespace is the only filter applied at query time. There is no way to attach structured
metadata to a memory and filter on it, so agents that need more than one filtering axis have
nowhere to put the second one.

The observable consequence: **agent prompts written against this API routinely assume filtering that
does not exist.** Surveying the six base prompts in the Walrus Prompt Evolution session, several
declare `tags`, `type`, `project` or `ecosystem` fields in their record schemas and then instruct
the agent to "recall memories *tagged* with X" or "recall entries of type Y". None of those are
operations the API supports — the fields end up embedded as text, silently degrading the query
vector instead of narrowing it. Authors are not misreading the docs so much as reaching for a
primitive they expect to be there.

The workaround is to encode one axis into the namespace, but namespaces are one-dimensional: you
cannot slice by project *and* by record type without a combinatorial explosion of namespaces that
cannot be enumerated (see #3).

**Suggested fix.** Optional structured metadata plus an equality filter:

```ts
await memwal.remember(text, { namespace, metadata: { type: "failure", project: "orbit" } });
await memwal.recall({ query, namespace, filter: { type: "failure" } });
```

A `JSONB` column with a GIN index and a `WHERE metadata @> $1` clause covers the realistic cases.
This would remove the single most common category of mistake in agent prompts built on Walrus
Memory, and it composes with vector search rather than replacing it.

---

## 3. No way to enumerate namespaces, which forces every agent to maintain its own registry

**Type:** Feature request

Namespaces are flat, opaque, and exact-match — no prefix search, no wildcard. There is also no
`listNamespaces()`. So an agent that uses more than one namespace has no way to discover what it has
previously written to, and cannot answer "how many memories do I have in total" — a question the
Prompt Evolution rules themselves require entrants to answer for their blob count.

Every multi-namespace prompt in this session independently reinvents the same workaround: a
registry namespace holding pointers to the other namespaces. That's a strong signal of a missing
primitive.

**Suggested fix.** `listNamespaces()` returning `[{ namespace, count, last_written_at }]` for the
authenticated owner. Cheap server-side (`SELECT namespace, count(*) … GROUP BY namespace`), and it
removes the registry workaround entirely.

---

## 4. Recall cannot order or filter by time, which silently breaks "resume the latest state" agents

**Type:** Feature request (this one broke a shipped prompt)

`recall()` ranks purely by vector distance. There is no `orderBy`, no `since`/`until`, and no
recency signal in the response beyond whatever the author happened to write into the text. For
"remember facts about the user" this is fine. For **session continuity** — the single most common
agent-memory use case — it is a correctness problem, because those agents need *the newest record*,
not *the most similar one*.

**Observed failure.** The Markov prompt (one of this session's base prompts) boots with:

```
recall("current task checkpoint goal status", namespace="markov/state", limit=3)
→ "The newest date wins."
```

Every checkpoint it writes uses a fixed template — same fields, same vocabulary — so all of them are
near-identical in embedding space and roughly equidistant from that query. The three returned are
effectively arbitrary among however many exist. The rule holds at N=3 and fails at N=300, so the
prompt **degrades the longer it is used** and looks correct in any short test. Its own "if recall
returns nothing, say: fresh start, no stored state" rule then reports an empty history over a
namespace holding hundreds of records.

This is not one author's mistake. Reaching for "give me the latest" is the natural thing to want from
a memory API, and nothing in the surface signals that it isn't available.

**Measured on mainnet** (relayer 0.1.0, API 1.0.0, build `2162d261`, 120 blobs across three rounds;
harness and raw results in the linked repo). Each round wrote 20 more checkpoints per arm and
recalled at `limit: 100`. Every record carried a marker, so a single recall gives the rank of all N
checkpoints, and Spearman's rho between recency and rank is measurable directly:

| N | rank of newest (rigid template) | in top 3? | rho, rigid | rho, varied prose |
|---|---|---|---|---|
| 20 | 13 of 20 | no | −0.32 | −0.23 |
| 40 | 26 of 40 | no | −0.16 | −0.21 |
| 60 | 50 of 60 | no | −0.03 | −0.08 |

Reliable recency ordering needs rho near −1. **17 of 18 arm × query × round cells showed no
statistically significant recency signal** (p > 0.05), and the faint tilt that exists **decays
toward zero as the namespace grows** — from −0.32 at N=20 to −0.03 at N=60. Across all cells,
`limit: 3` retrieved the newest checkpoint 17% of the time against 9% for a random draw of three.

The decay is the actionable part for you: at small N there is just enough apparent recency for the
pattern to look correct in testing, so authors ship it. The failure only appears at the scale where
users have the most stored. That is a property of the API surface, not of any one prompt, and it is
why (1) below is worth doing even if (2) and (3) never happen.

**Suggested fix**, cheapest first:

1. Return `created_at` on every recall result. Today an agent cannot order results at all unless it
   parsed a timestamp it wrote into the text itself.
2. Add `orderBy: "recency"` (or a `sort` parameter) to `recall()`, making the query optional in that
   mode — "the 10 newest in this namespace" is a reasonable, cheap query against an indexed column.
3. Optionally `since` / `until` filters for time-bounded recall.

(1) alone would be a large improvement and is close to free. Without it, every continuity-shaped
prompt has to encode timestamps in prose and sort client-side, which only works if the record it
needs happened to be returned in the first place.

---

## 5. `restore` silently drops undecryptable blobs, so counts can't be reconciled

**Type:** Observability gap

Per *Restore Semantics*, a blob that cannot be decrypted or embedded is dropped **without counting
in `restored` or `skipped`**, making `restored + skipped` a lower bound on healthy entries rather
than an equality with `total`.

**Impact.** A wrong delegate key, malformed ciphertext, or a down embedding API all present
identically to a partially-indexed namespace. There is no way to distinguish "10 blobs are corrupt"
from "10 blobs weren't reached", and the failure is silent by design.

**Suggested fix.** Add `dropped: number` and, ideally, `dropped_reasons: Record<string, number>`
(`decrypt_failed` / `embed_failed` / …) to `RestoreResult`. Silent data loss during a *recovery*
operation is the worst place for it.

---

## 6. `restore` defaults to `limit: 10` with no cursor — silent under-restore on any real namespace

**Type:** Usability / footgun

`restore`'s default limit is 10 and the max is 100, with no pagination ("Restore is single-shot —
there is no cursor"). A namespace with 400 memories cannot be fully restored in one call, and the
default silently rebuilds 10 of them.

Since `restore` is what you reach for *when memory looks broken*, an under-restore is likely to be
read as "the memories are genuinely gone."

**Suggested fix.** Short term: raise the default, and set `truncated: true` whenever
`total > limit` (the MCP reference documents `truncated`, but `SKILL.md`'s `RestoreResult` doesn't
list it — worth reconciling). Long term: the cursor already on the roadmap.

---

## 7. Namespaces aren't normalized, and blobs can't be edited, so a typo is permanent

**Type:** Footgun

The server accepts any non-empty string verbatim — no trimming, no case folding, no Unicode
normalization. `"my-app"`, `" my-app"`, and `"My-App"` are three distinct namespaces. Combined with
append-only storage, a namespace typo is unrecoverable: those memories are permanently unreachable
from the correct namespace, and cannot be moved.

**Impact.** Agents assemble namespaces by string interpolation (`markov.state.${slug}`). One stray space
from a slug derivation silently orphans everything written in that session, and the failure is
invisible until a recall comes back empty much later.

**Suggested fix.** Either (a) an opt-in strict mode that rejects namespaces with leading/trailing
whitespace, or (b) return a `namespace_is_new: true` flag on the first write to a previously-unseen
namespace, so a client can warn "you're writing to a brand-new namespace — typo?". (b) is
non-breaking and catches the realistic case.

---

## 8. Every prompt reinvents supersession because there's no update path

**Type:** Feature request

Storage is append-only: `remember()` always creates a new entry, there is no dedup, and nothing can
be edited or deleted. Correct for a verifiable store — but it means *state that changes* has no
first-class representation, and every serious prompt in this session invents its own convention
(`supersedes:` lines, `effective_at` timestamps, `status=current` tags, an out-of-band CLI). None of
them interoperate, which undercuts the portability that is the product's main claim: two agents
sharing an account will not agree on which record is current.

**Suggested fix.** An optional `supersedes: blob_id` field on `remember()`, and a
`includeSuperseded?: boolean` (default `false`) on `recall()`. The superseded blob stays immutable
on Walrus — this is an index-level filter, not a delete — which preserves the verifiability
guarantee while making "current truth" a first-class query.

This is the one I'd most like to see. It's the difference between a memory log and a memory *state*.

---

## Docs nits (bundle as one low-priority issue)

- `SKILL.md`'s `RestoreResult` interface omits `truncated`, which the MCP reference documents.
- The Quick Start shows `remember()` + `waitForRememberJob()`, while the API table lists
  `rememberAndWait()` — worth stating which is preferred for new code.
- `SKILL.md` documents the SDK surface (`recall`, `rememberAndWait`) while every agent-facing prompt
  uses the MCP names (`memwal_recall`, `memwal_remember_bulk`). A short mapping table between the
  two surfaces would save a lot of guessing.

---

## 9. MCP `recall` returns `score` (higher = closer) while the SDK returns `distance` (lower = closer), under the docs' distance thresholds

**Type:** Bug — silent semantic inversion across surfaces

The documentation's *Recall Distance and Filtering* guidance is written in **distance** terms, and
gives concrete bands: `< 0.25` near-duplicate, `0.25–0.55` related, `≥ 0.7` unrelated. The
TypeScript SDK matches that — `recall()` results carry `distance`, lower being closer.

The Claude Code MCP plugin does not. It returns a field named `score`, and **higher means closer**.
Measured on mainnet 2026-08-19 against one namespace (relayer 0.1.0, API 1.0.0, build `2162d261`):

| query | returned `score` |
|---|---|
| `"current task checkpoint goal status"` — the record's actual subject | **0.426** |
| `"recipe for sourdough bread proving overnight"` — deliberately unrelated | **0.171** |

Same record, same namespace. The relevant query scores *higher*. The value appears to be
approximately `1 − distance`.

**Why this is worse than a naming inconsistency.** Every agent prompt written against the published
guidance thresholds on distance. Point one of those prompts at the MCP surface and the comparison
silently inverts:

- `discard if ≥ 0.7` throws away the **best** matches and keeps the noise.
- `treat < 0.25 as a duplicate` fires on the **least** similar record, so genuine duplicates look
  novel and get written again — into a store with no deduplication, where both copies then surface
  forever.

There is no error, no warning, and no type change. The agent behaves confidently and wrongly, and
the failure looks like "recall is bad" rather than "the threshold is inverted". Both of the prompts
in this session that filter on distance would misbehave on MCP.

**Suggested fix**, cheapest first:

1. Document the difference prominently in the MCP reference, including the conversion.
2. Return `distance` alongside `score` in the MCP response, so prompts written against the docs work
   unmodified.
3. Best: use one field name with one polarity across SDK, MCP, and docs, and deprecate the other
   with a release note.

(1) is nearly free and would have prevented this entirely. Note also that MCP has no `maxDistance`
parameter (issue 1 above), so MCP users must filter client-side on exactly the field whose polarity
is undocumented.

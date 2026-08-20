// Corpus generator for the recency experiment.
//
// The question: when Markov boots with `recall(..., limit: 3)` and takes "the newest date",
// is the newest checkpoint actually in those 3 results?
//
// Two arms, differing ONLY in how much the checkpoints resemble each other:
//
//   rigid      — Markov rule 4.6's exact template, filled with realistic but similar content.
//                Every record has the same fields, same vocabulary, same shape.
//   distinct   — the same underlying progress, written as varied natural prose.
//
// Comparing them isolates how much of the failure comes from the template itself, rather
// than merely from having many records.
//
// CORPUS INDEPENDENCE. Pool lengths are pairwise coprime and each field is indexed
// independently, so the field combination has period lcm(7,11,13,5,9) = 45045 — no two
// checkpoints below N=45045 share a full content tuple. An earlier version indexed every
// field with `i % 5`, which made checkpoint i and i+5 near-identical and, worse, locked the
// distinct arm's prose shape in phase with its content, so that arm silently generated
// near-duplicates too and could not act as a counterfactual. Keep the lengths coprime.

const GOALS = [
  "ship the CSV export feature on branch feat/export",
  "cut p99 latency on the search endpoint below 200ms",
  "migrate the billing tables to the new schema",
  "add SSO via the enterprise identity provider",
  "replace the polling worker with a queue consumer",
  "split the monolith's checkout path into its own service",
  "make the nightly reconciliation job idempotent",
]; // 7

const DONE = [
  "parser and unit tests green; API endpoint stubbed",
  "index rebuilt and the slow query dropped to 40ms",
  "backfill script written and dry-run against staging",
  "callback route wired and the token exchange verified",
  "consumer skeleton running against a local broker",
  "contract tests pinned against the recorded fixtures",
  "feature flag plumbed through config and defaulted off",
  "the N+1 in the serializer traced and collapsed",
  "staging data anonymised so the dry run is safe to repeat",
  "retry budget capped and surfaced as a metric",
  "the legacy adapter deleted and its callers migrated",
]; // 11

const NEXT = [
  "implement the endpoint handler in src/routes/export.ts",
  "add the composite index on (tenant_id, created_at)",
  "run the backfill against production behind a flag",
  "handle the refresh-token rotation edge case",
  "wire dead-letter handling before enabling in prod",
  "decide whether the cutover needs a read-only window",
  "benchmark the consumer against a week of replayed traffic",
  "get the schema change reviewed by the data team",
  "backfill the audit rows the first migration skipped",
  "replace the hand-rolled pagination with cursors",
  "document the rollback path before the release window",
  "reconcile the two conflicting definitions of 'active user'",
  "drop the compatibility shim once clients are off v1",
]; // 13

const BLOCKERS = [
  "none",
  "waiting on the ops team for the allowlist entry",
  "blocked on a staging database restore",
  "waiting on a vendor rate-limit increase",
  "needs a decision on the retention window before it can ship",
]; // 5

const DECISIONS = [
  "streaming output, no temp files; pnpm for all installs",
  "materialized views over Redis; refresh hourly",
  "expand-and-contract migration, no destructive step",
  "server-side session cookies, SameSite=None",
  "at-least-once delivery with idempotent handlers",
  "keep the sync path synchronous; queue only the fan-out",
  "version the payload, do not sniff its shape",
  "one writer per partition, ordering guaranteed per key",
  "fail closed on the flag; an outage must not enable it",
]; // 9

const TOOLS = ["claude-code", "codex", "cursor", "opencode"];
const MODELS = ["claude", "gpt", "gemini"];

/** ISO 8601 timestamps, one per session, marching forward ~1 day apart. */
function timestampFor(i) {
  const start = Date.UTC(2026, 4, 1, 9, 0, 0); // 2026-05-01T09:00:00Z
  const ms = start + i * 24 * 60 * 60 * 1000 + (i % 3) * 3 * 60 * 60 * 1000;
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * Marker embedded in every record so the harness can identify a specific checkpoint
 * in recall results without relying on fuzzy text matching.
 */
export const marker = (i) => `ckpt-${String(i).padStart(4, "0")}`;

/** The content for checkpoint i. Each field advances on its own coprime cycle. */
function content(i) {
  return {
    goal: GOALS[i % GOALS.length],
    done: DONE[i % DONE.length],
    next: NEXT[i % NEXT.length],
    blocker: BLOCKERS[i % BLOCKERS.length],
    decision: DECISIONS[i % DECISIONS.length],
  };
}

/** Arm A — Markov rule 4.6's template, verbatim structure. */
export function rigidCheckpoint(i) {
  const ts = timestampFor(i);
  const prev = i === 0 ? "none" : timestampFor(i - 1);
  const c = content(i);
  return (
    `[checkpoint|${ts}|tool=${TOOLS[i % TOOLS.length]}|model=${MODELS[i % MODELS.length]}]\n` +
    `Task: acme exporter (${marker(i)}).\n` +
    `Goal: ${c.goal}.\n` +
    `Done: ${c.done}.\n` +
    `Next: ${c.next}.\n` +
    `Blockers: ${c.blocker}.\n` +
    `Decisions: ${c.decision}.\n` +
    `Supersedes: ${prev}.`
  );
}

/**
 * Arm B — same progress, written as varied prose rather than a fixed template.
 * The shape index is deliberately out of phase with the content cycles (8 shapes vs
 * pools of 7/11/13/5/9), so prose form and subject matter never repeat together.
 */
export function distinctCheckpoint(i) {
  const ts = timestampFor(i);
  const c = content(i);
  const { goal: g, done: d, next: n, blocker: b } = c;
  const shapes = [
    () => `Session ${marker(i)} on ${ts}: spent the day on ${g}. Got as far as ${d}. Picking up with ${n}.`,
    () => `${marker(i)} — the work here was ${g}. What landed: ${d}. Left off before ${n}.`,
    () => `Checkpoint ${marker(i)}. Chasing ${g} this session; ${d} is behind us. Next up is ${n}.`,
    () => `Progress note ${marker(i)}, ${ts}. Objective was ${g}. Completed ${d}. Still owed: ${n}.`,
    () => `${marker(i)}: working toward ${g}. Finished ${d} — the remaining piece is ${n}.`,
    () => `Wrote this as ${marker(i)}. Today was mostly ${g}, and ${d}. Blocker: ${b}. Then ${n}.`,
    () => `A short log for ${marker(i)} (${ts}) — ${d}, which unblocks ${g}. Tomorrow: ${n}.`,
    () => `${marker(i)}, end of session. Where things stand on ${g}: ${d}. Outstanding is ${n}.`,
  ]; // 8 — coprime-ish with every content cycle above
  return shapes[i % shapes.length]();
}

/** Markov rule 3.1's boot query, verbatim. */
export const BOOT_QUERY = "current task checkpoint goal status";

/** Extra queries, to show the result isn't an artefact of one phrasing. */
export const ALT_QUERIES = [
  "what is the latest checkpoint and where did we leave off",
  "most recent session state, next step, blockers",
];

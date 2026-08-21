#!/usr/bin/env node
/**
 * Counts blobs across every namespace this account is known to use, and prints
 * the total the submission form asks for.
 *
 * Read-only. Writes nothing.
 *
 * Why this script has to exist: Walrus Memory cannot enumerate namespaces
 * (memwal-feedback.md issue 3), so nothing — not the SDK, not the MCP tools,
 * not the dashboard — can answer "how many memories do I have". The only
 * available method is to recall each namespace you already know the name of,
 * at the documented maximum limit, and sum. `markov.index` is the registry that
 * makes the `markov.*` half of that list self-describing, which is exactly the
 * job PROMPT.md rule 2.1 gives it.
 *
 * Uses the SDK rather than the MCP tools deliberately. The MCP surface collapses
 * byte-identical records in its output ("1 duplicate copy collapsed"), which is
 * helpful when reading and wrong when counting — Walrus has no deduplication, so
 * those rows are separate permanent blobs and the form wants all of them.
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { MemWal } from "@mysten-incubation/memwal";

const MAINNET = "https://relayer.memory.walrus.xyz";
const MAX_LIMIT = 100; // documented maximum
const SWEEP_QUERY = "checkpoint fact decision note project state";

/** Namespaces the experiment wrote to. Not discoverable — recorded here by hand. */
const EXPERIMENT_NS = ["mk.exp.rigid", "mk.exp.distinct", "mk.exp2.rigid", "mk.exp2.distinct"];
/** Namespaces the prompt writes to that are not per-project. */
const FLAT_NS = ["markov.index", "markov.facts.global", "markov.capsules"];

const raw = JSON.parse(readFileSync(join(homedir(), ".memwal", "credentials.json"), "utf8"));
const serverUrl = raw.relayerUrl ?? MAINNET;
if (/staging/.test(serverUrl)) {
  console.error(`Refusing to run: ${serverUrl} is testnet. The rules require mainnet.`);
  process.exit(1);
}

const memwal = MemWal.create({
  key: raw.delegatePrivateKey,
  accountId: raw.accountId,
  serverUrl,
  namespace: "markov.index",
});

const rowsOf = (res) => res?.results ?? res ?? [];

async function count(namespace) {
  try {
    const res = await memwal.recall({ query: SWEEP_QUERY, limit: MAX_LIMIT, namespace });
    return rowsOf(res);
  } catch (err) {
    console.error(`  ! ${namespace}: ${err.message}`);
    return null;
  }
}

// Slugs come out of the registry, which is the only thing that knows them.
const indexRows = await count("markov.index");
const slugs = [
  ...new Set((indexRows ?? []).flatMap((r) => [...r.text.matchAll(/slug\s+([a-z0-9-]+)/gi)].map((m) => m[1]))),
];

const targets = [
  ...FLAT_NS,
  ...slugs.flatMap((s) => [`markov.state.${s}`, `markov.facts.${s}`]),
  ...EXPERIMENT_NS,
];

console.log(`relayer: ${serverUrl}`);
console.log(`slugs in markov.index: ${slugs.length ? slugs.join(", ") : "(none found)"}\n`);

let real = 0;
let experiment = 0;
let truncated = [];
let failed = [];

for (const ns of targets) {
  const rows = ns === "markov.index" ? indexRows : await count(ns);
  if (rows === null) {
    failed.push(ns);
    continue;
  }
  const n = rows.length;
  if (n === MAX_LIMIT) truncated.push(ns);

  // Byte-identical duplicates are separate blobs. Report them, count them once each.
  const seen = new Map();
  for (const r of rows) seen.set(r.text, (seen.get(r.text) ?? 0) + 1);
  const dupes = [...seen.values()].filter((c) => c > 1).reduce((a, c) => a + c - 1, 0);

  if (EXPERIMENT_NS.includes(ns)) experiment += n;
  else real += n;

  console.log(`  ${ns.padEnd(28)} ${String(n).padStart(4)}${dupes ? `   (${dupes} duplicate blob${dupes > 1 ? "s" : ""})` : ""}`);
}

console.log(`\n  real use (markov.*)   ${String(real).padStart(4)}`);
console.log(`  experiment (mk.exp*)  ${String(experiment).padStart(4)}`);

// A namespace that errored is not a namespace that is empty — printing a total over a
// partial sweep is the same mistake the prompt's rule 8.5 exists to prevent, and it bit
// this script on 2026-08-21 when the network dropped and it cheerfully reported TOTAL 0.
if (failed.length) {
  console.log(`  TOTAL                 UNKNOWN — do not quote this run`);
  console.log(
    `\n  ! ${failed.length} namespace${failed.length > 1 ? "s" : ""} failed to respond: ${failed.join(", ")}` +
      `\n    These errored; that is not the same as being empty. Re-run before citing a count.`,
  );
  process.exitCode = 1;
} else {
  console.log(`  TOTAL                 ${String(real + experiment).padStart(4)}`);
}

if (truncated.length) {
  console.log(
    `\n  ! ${truncated.join(", ")} returned exactly ${MAX_LIMIT} rows.\n` +
      `    The count is a LOWER BOUND — recall cannot page past the limit, so split or prune.`,
  );
}

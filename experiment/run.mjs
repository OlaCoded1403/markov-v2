// Recency experiment for Markov v2.
//
// Markov rule 3.1 boots with:
//     recall("current task checkpoint goal status", ns="markov/state", limit=3)
//     "The newest date wins."
//
// That rule is only sound if the newest checkpoint is among the 3 returned. Recall is
// semantic, not chronological, so nothing guarantees it. This measures how often it holds
// as the namespace grows — and what rank the newest checkpoint actually lands at.
//
//   node run.mjs --stage N   write the next N checkpoints, then measure (repeat to build a curve)
//   node run.mjs --measure   measure only, without writing
//   node run.mjs --report    print the accumulated curve from results.json
//
// Reads credentials from ~/.memwal/credentials.json, or MEMWAL_ACCOUNT_ID / MEMWAL_KEY.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { MemWal } from "@mysten-incubation/memwal";
import { rigidCheckpoint, distinctCheckpoint, marker, BOOT_QUERY, ALT_QUERIES } from "./corpus.mjs";

// v2 namespaces. The v1 corpus indexed every field with `i % 5`, which made records
// near-duplicates and collapsed the distinct arm into a non-counterfactual. Blobs cannot be
// edited or deleted, so the corrected corpus goes to fresh namespaces rather than mixing two
// generators in one. mk.exp.* still holds the 40-blob pilot.
const ARMS = {
  rigid: { ns: "mk.exp2.rigid", build: rigidCheckpoint },
  distinct: { ns: "mk.exp2.distinct", build: distinctCheckpoint },
};
const MARKOV_LIMIT = 3; // what rule 3.1 actually asks for
const MAX_LIMIT = 100; // documented maximum, what v2 uses
const STATE_FILE = "results.json";
const MAINNET = "https://relayer.memory.walrus.xyz";

// ---------------------------------------------------------------- credentials

function loadCredentials() {
  if (process.env.MEMWAL_ACCOUNT_ID && process.env.MEMWAL_KEY) {
    return {
      accountId: process.env.MEMWAL_ACCOUNT_ID,
      key: process.env.MEMWAL_KEY,
      serverUrl: process.env.MEMWAL_SERVER_URL || MAINNET,
    };
  }
  const path = join(homedir(), ".memwal", "credentials.json");
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    console.error(
      err.code === "ENOENT"
        ? `No credentials at ${path}. Run memwal_login, then node inspect-credentials.mjs.`
        : `Could not read ${path}: ${err.message}`,
    );
    process.exit(1);
  }
  const flat = {};
  (function flatten(o, p = "") {
    for (const [k, v] of Object.entries(o)) {
      const key = p ? `${p}.${k}` : k;
      if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key);
      else flat[key] = v;
    }
  })(parsed);
  const pick = (re) => {
    const k = Object.keys(flat).find((k) => re.test(k) && typeof flat[k] === "string" && flat[k]);
    return k ? flat[k] : undefined;
  };
  const accountId = pick(/account.?id$/i) ?? pick(/account/i) ?? pick(/owner/i);
  const key = pick(/private.?key/i) ?? pick(/delegate.?key/i) ?? pick(/^key$/i) ?? pick(/secret/i);
  const serverUrl = pick(/server.?url|relayer/i) ?? MAINNET;
  if (!accountId || !key) {
    console.error("Could not find accountId / key. Run: node inspect-credentials.mjs");
    process.exit(1);
  }
  return { accountId, key, serverUrl };
}

const creds = loadCredentials();
if (/staging/.test(creds.serverUrl)) {
  console.error(`Refusing to run: ${creds.serverUrl} is testnet. The rules require mainnet.`);
  process.exit(1);
}

const memwal = MemWal.create({
  key: creds.key,
  accountId: creds.accountId,
  serverUrl: creds.serverUrl,
  namespace: ARMS.rigid.ns,
});

// --------------------------------------------------------------------- state

function loadState() {
  if (!existsSync(STATE_FILE)) {
    return { relayer: creds.serverUrl, written: 0, stages: [] };
  }
  return JSON.parse(readFileSync(STATE_FILE, "utf8"));
}
const saveState = (s) => writeFileSync(STATE_FILE, JSON.stringify(s, null, 2));

// --------------------------------------------------------------------- write

// Bulk takes {text, namespace} items in one array — not strings plus a positional
// namespace — and the plain rememberBulk() only returns job ids, so it can report
// "written" for blobs that later fail. Wait for the jobs and count what actually landed.
async function writeMany(texts, namespace) {
  if (typeof memwal.rememberBulkAndWait === "function") {
    for (let i = 0; i < texts.length; i += 20) {
      const items = texts.slice(i, i + 20).map((text) => ({ text, namespace }));
      const res = await memwal.rememberBulkAndWait(items, { timeoutMs: 300_000 });
      process.stdout.write(`  ${namespace}: +${res.succeeded}/${res.total}\n`);
      if (res.failed) {
        const why = res.results.filter((r) => r.status !== "done").map((r) => r.status);
        throw new Error(`${res.failed} of ${res.total} writes did not land (${why.join(", ")})`);
      }
    }
    return;
  }
  for (const t of texts) {
    await memwal.rememberAndWait(t, namespace, { timeoutMs: 60_000 });
    process.stdout.write(".");
  }
  process.stdout.write("\n");
}

async function stage(count) {
  const st = loadState();
  const from = st.written;
  const to = from + count;
  console.log(`Writing checkpoints ${from}..${to - 1} to both arms (${count * 2} blobs)\n`);

  for (const [name, arm] of Object.entries(ARMS)) {
    const texts = [];
    for (let i = from; i < to; i++) texts.push(arm.build(i, to));
    console.log(`${name} arm:`);
    await writeMany(texts, arm.ns);
  }

  st.written = to;
  saveState(st);
  console.log(`\nTotal checkpoints per arm: ${to}. Waiting 30s for indexing…`);
  await new Promise((r) => setTimeout(r, 30_000));
  await measure();
}

// ------------------------------------------------------------------- measure

/** Rank (0-based) of the newest checkpoint within results; -1 if absent. */
function rankOfNewest(results, newestIndex) {
  const needle = marker(newestIndex);
  return results.findIndex((r) => r.text.includes(needle));
}

/**
 * Spearman's rho between how recent a checkpoint is and how highly recall ranked it.
 *
 * This is the load-bearing statistic. The rank of the single newest checkpoint is one
 * sample per round and proves nothing on its own — it could always be luck. Every returned
 * record carries its own marker, though, so one recall yields the rank of ALL n checkpoints,
 * and the correlation between recency and rank is measurable from that alone.
 *
 *   rho ~= -1  recall effectively sorts newest-first, and Markov rule 3.1 is safe
 *   rho ~=  0  rank is independent of recency, so P(newest in top k) = k/n
 *   rho ~= +1  recall systematically buries the newest record
 *
 * Both series are permutations with no ties, so the exact form applies.
 */
function spearman(pairs) {
  const n = pairs.length;
  if (n < 3) return null;
  const sumD2 = pairs.reduce((acc, [a, b]) => acc + (a - b) ** 2, 0);
  return 1 - (6 * sumD2) / (n * (n * n - 1));
}

async function measureArm(armName, arm, newestIndex, query) {
  const res = await memwal.recall({ query, limit: MAX_LIMIT, namespace: arm.ns });
  const results = res.results ?? [];
  const rank = rankOfNewest(results, newestIndex);

  // Recover (recency order, rank) for every checkpoint that came back. Recency order is
  // the checkpoint index parsed out of the marker; rank is its position in the results.
  const pairs = [];
  results.forEach((r, position) => {
    const m = /ckpt-(\d{4})/.exec(r.text);
    if (m) pairs.push([Number(m[1]), position]);
  });
  // Re-rank the recovered indices densely, so a truncated result set is still a clean
  // permutation and rho is not distorted by the records that did not come back.
  const byRecency = [...pairs].sort((a, b) => a[0] - b[0]);
  const dense = byRecency.map(([, position], recencyOrder) => [recencyOrder, position]);
  const positions = [...new Set(dense.map(([, p]) => p))].sort((a, b) => a - b);
  const rankOf = new Map(positions.map((p, idx) => [p, idx]));
  const rho = spearman(dense.map(([recencyOrder, p]) => [recencyOrder, rankOf.get(p)]));

  return {
    arm: armName,
    query,
    returned: results.length,
    rankOfNewest: rank,
    foundWithinMarkovLimit: rank >= 0 && rank < MARKOV_LIMIT,
    foundAtAll: rank >= 0,
    topDistance: results.length ? results[0].distance : null,
    newestDistance: rank >= 0 ? results[rank].distance : null,
    recencyRankCorrelation: rho,
    matched: dense.length,
  };
}

async function measure() {
  const st = loadState();
  if (st.written === 0) {
    console.error("Nothing written yet. Run: node run.mjs --stage 20");
    process.exit(1);
  }
  const newestIndex = st.written - 1;
  const queries = [BOOT_QUERY, ...ALT_QUERIES];
  const observations = [];

  for (const [name, arm] of Object.entries(ARMS)) {
    for (const q of queries) {
      observations.push(await measureArm(name, arm, newestIndex, q));
    }
  }

  const entry = { n: st.written, observations };
  st.stages = st.stages.filter((s) => s.n !== st.written);
  st.stages.push(entry);
  st.stages.sort((a, b) => a.n - b.n);
  saveState(st);

  console.log(`\nN = ${st.written} checkpoints per arm. Newest = ${marker(newestIndex)}\n`);
  const w = [10, 46, 5, 9, 12, 10, 9];
  const line = (c) => c.map((x, i) => String(x).padEnd(w[i])).join(" ");
  console.log(line(["arm", "query", "n", "rank", "in top 3?", "distance", "rho"]));
  console.log(w.map((x) => "-".repeat(x)).join(" "));
  for (const o of observations) {
    console.log(
      line([
        o.arm,
        o.query.slice(0, 44),
        o.returned,
        o.rankOfNewest < 0 ? "ABSENT" : o.rankOfNewest,
        o.foundWithinMarkovLimit ? "yes" : "NO",
        o.newestDistance == null ? "—" : o.newestDistance.toFixed(3),
        o.recencyRankCorrelation == null ? "—" : o.recencyRankCorrelation.toFixed(3),
      ]),
    );
  }

  const bootOnly = observations.filter((o) => o.query === BOOT_QUERY);
  const rigid = bootOnly.find((o) => o.arm === "rigid");
  console.log(
    `\nMarkov rule 3.1 (limit ${MARKOV_LIMIT}, rigid template, boot query) would have ` +
      `${rigid.foundWithinMarkovLimit ? "FOUND" : "MISSED"} the newest checkpoint at N=${st.written}` +
      (rigid.rankOfNewest >= 0
        ? ` — it is at rank ${rigid.rankOfNewest} of ${rigid.returned}.`
        : " — it is not in the top 100 at all."),
  );
  console.log("Markov v2 reads all 100 and sorts by timestamp, so it finds it whenever it is returned.");

  // The rank of one checkpoint is an anecdote; the correlation is the claim.
  const rhos = observations.map((o) => o.recencyRankCorrelation).filter((r) => r != null);
  if (rhos.length) {
    const mean = rhos.reduce((a, b) => a + b, 0) / rhos.length;
    const worst = rhos.reduce((a, b) => (Math.abs(a) > Math.abs(b) ? a : b));
    console.log(
      `\nRecency/rank correlation across all ${rhos.length} arm x query cells: mean rho = ` +
        `${mean.toFixed(3)}, largest magnitude ${worst.toFixed(3)}.`,
    );
    console.log(
      `A prompt that sorts by retrieval order needs rho near -1. At rho ~= 0 the rank of the\n` +
        `newest checkpoint is independent of its being newest, so recalling ${MARKOV_LIMIT} of N and\n` +
        `taking "the newest date" succeeds with probability ${MARKOV_LIMIT}/N — ` +
        `${((MARKOV_LIMIT / st.written) * 100).toFixed(0)}% at N=${st.written}, ` +
        `${((MARKOV_LIMIT / 100) * 100).toFixed(0)}% at N=100, ` +
        `${((MARKOV_LIMIT / 300) * 100).toFixed(0)}% at N=300.`,
    );
  }
  report();
}

// -------------------------------------------------------------------- report

function report() {
  const st = loadState();
  if (!st.stages.length) return;
  console.log("\n" + "=".repeat(64));
  console.log("DEGRADATION CURVE — rank of the newest checkpoint (boot query)");
  console.log("=".repeat(64));
  const w = [6, 14, 16, 14, 10, 12, 10];
  const line = (c) => c.map((x, i) => String(x).padEnd(w[i])).join(" ");
  console.log(
    line(["N", "rigid rank", "rigid in top 3?", "distinct rank", "returned", "rigid rho", "dist rho"]),
  );
  console.log(w.map((x) => "-".repeat(x)).join(" "));
  for (const s of st.stages) {
    const r = s.observations.find((o) => o.arm === "rigid" && o.query === BOOT_QUERY);
    const d = s.observations.find((o) => o.arm === "distinct" && o.query === BOOT_QUERY);
    const fmt = (x) => (x == null ? "—" : x.toFixed(3));
    console.log(
      line([
        s.n,
        r.rankOfNewest < 0 ? "ABSENT" : r.rankOfNewest,
        r.foundWithinMarkovLimit ? "yes" : "NO",
        d.rankOfNewest < 0 ? "ABSENT" : d.rankOfNewest,
        r.returned,
        fmt(r.recencyRankCorrelation),
        fmt(d.recencyRankCorrelation),
      ]),
    );
  }
  console.log(
    "\nRank 0 means the newest checkpoint was the closest match; rank 12 means Markov's\n" +
      "limit of 3 missed it entirely. Rank is not expected to fall monotonically — that is\n" +
      "the point. Similarity search has no notion of recency, so the rank is essentially\n" +
      "arbitrary, and the chance the newest lands in the top 3 shrinks as N grows.",
  );
  console.log(`\nState in ${STATE_FILE}`);
}

// ---------------------------------------------------------------------- main

const mode = process.argv[2];
if (mode === "--stage") {
  const n = Number(process.argv[3] || 20);
  if (!Number.isInteger(n) || n < 1 || n > 100) {
    console.error("Usage: node run.mjs --stage <1-100>");
    process.exit(1);
  }
  await stage(n);
} else if (mode === "--measure") {
  await measure();
} else if (mode === "--report") {
  report();
} else {
  console.log(
    "Usage:\n" +
      "  node run.mjs --stage 20    write 20 more checkpoints per arm, then measure\n" +
      "  node run.mjs --measure     measure at the current N\n" +
      "  node run.mjs --report      print the accumulated curve",
  );
  process.exit(1);
}

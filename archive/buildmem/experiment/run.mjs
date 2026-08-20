// Phantom-filter experiment: does the original BuildMEM `project` field isolate memory?
//
//   node run.mjs --seed      write the corpus to both arms (run ONCE — no dedup exists)
//   node run.mjs --measure   run the queries and report
//
// Reads credentials from ~/.memwal/credentials.json (written by memwal_login), or from
// MEMWAL_ACCOUNT_ID / MEMWAL_KEY / MEMWAL_SERVER_URL if you prefer env vars.

import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { MemWal } from "@mysten-incubation/memwal";
import { FACTS, QUERIES, PROJECTS, asControlRecord, asTreatmentRecord } from "./corpus.mjs";

const CONTROL_NS = "ab.control";
const treatmentNs = (project) => `ab.proj.${project}`;
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
        ? `No credentials at ${path}. Run memwal_login first, then node inspect-credentials.mjs.`
        : `Could not read ${path}: ${err.message}`,
    );
    process.exit(1);
  }

  // Flatten so nested shapes work regardless of how the file is structured.
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
    console.error(
      "Could not find accountId / key in credentials.json.\n" +
        "Run: node inspect-credentials.mjs — then set MEMWAL_ACCOUNT_ID and MEMWAL_KEY by hand.",
    );
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
  namespace: CONTROL_NS,
});

// ---------------------------------------------------------------------- seed

async function writeMany(texts, namespace) {
  // Prefer bulk (20 per call max); fall back to sequential if unavailable.
  if (typeof memwal.rememberBulk === "function") {
    for (let i = 0; i < texts.length; i += 20) {
      const batch = texts.slice(i, i + 20);
      await memwal.rememberBulk(batch, namespace);
      process.stdout.write(`  ${namespace}: +${batch.length}\n`);
    }
    return texts.length;
  }
  for (const text of texts) {
    await memwal.rememberAndWait(text, namespace, { timeoutMs: 60_000 });
    process.stdout.write(".");
  }
  process.stdout.write("\n");
  return texts.length;
}

async function seed() {
  console.log(`Relayer: ${creds.serverUrl}`);
  console.log(`Seeding ${FACTS.length} facts into both arms (${FACTS.length * 2} blobs)\n`);

  console.log("control arm — every project in one namespace:");
  let written = await writeMany(FACTS.map(asControlRecord), CONTROL_NS);

  console.log("\ntreatment arm — routed per project:");
  for (const project of PROJECTS) {
    const texts = FACTS.filter((f) => f.project === project).map((f) => asTreatmentRecord(f));
    written += await writeMany(texts, treatmentNs(project));
  }

  console.log(`\nWrote ${written} blobs. Wait ~30s for indexing, then: node run.mjs --measure`);
  console.log("Do NOT re-run --seed: there is no deduplication, you will get permanent duplicates.");
}

// ------------------------------------------------------------------ measure

/** Recover which project a returned record belongs to, in either format. */
function projectOf(text) {
  const tagged = text.match(/proj=([a-z0-9-]+)/i); // treatment: [failure|proj=orbit|...]
  if (tagged) return tagged[1];
  try {
    return JSON.parse(text).project; // control: JSON object
  } catch {
    /* fall through */
  }
  const loose = text.match(/"project"\s*:\s*"([^"]+)"/);
  return loose ? loose[1] : null;
}

/** Recover the title so results can be scored against the relevance key. */
function titleOf(text) {
  try {
    const t = JSON.parse(text).title;
    if (t) return t;
  } catch {
    /* not JSON */
  }
  const afterTag = text.replace(/^\[[^\]]*\]\s*/, "");
  return afterTag.split(/\.\s/)[0].trim();
}

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const pct = (n) => `${(n * 100).toFixed(1)}%`;
const f3 = (n) => (Number.isNaN(n) ? "  —  " : n.toFixed(3));

async function recall(query, namespace, limit = 10) {
  const res = await memwal.recall({ query, limit, namespace });
  return res.results ?? [];
}

async function measure() {
  const rows = [];
  console.log(`Relayer: ${creds.serverUrl}\n`);

  for (const q of QUERIES) {
    const relevant = new Set(q.relevant);

    const [ctrl, treat] = await Promise.all([
      recall(q.query, CONTROL_NS),
      recall(q.query, treatmentNs(q.project)),
    ]);

    const score = (results) => {
      const kept = results.filter((r) => r.distance < 0.7);
      const foreign = kept.filter((r) => {
        const p = projectOf(r.text);
        return p && p !== q.project;
      });
      const top5 = kept.slice(0, 5);
      const hits = top5.filter((r) => relevant.has(titleOf(r.text)));
      const relevantDistances = kept
        .filter((r) => relevant.has(titleOf(r.text)))
        .map((r) => r.distance);
      return {
        returned: kept.length,
        contamination: kept.length ? foreign.length / kept.length : 0,
        precision5: top5.length ? hits.length / top5.length : 0,
        meanRelevantDistance: mean(relevantDistances),
        topDistance: kept.length ? kept[0].distance : NaN,
      };
    };

    rows.push({ query: q.query, project: q.project, control: score(ctrl), treatment: score(treat) });
  }

  const header = ["project", "query", "arm", "n", "contam", "P@5", "d(rel)", "d(top)"];
  const widths = [8, 46, 9, 3, 7, 6, 7, 7];
  const line = (cells) => cells.map((c, i) => String(c).padEnd(widths[i])).join(" ");

  console.log(line(header));
  console.log(widths.map((w) => "-".repeat(w)).join(" "));
  for (const r of rows) {
    for (const arm of ["control", "treatment"]) {
      const s = r[arm];
      console.log(
        line([
          arm === "control" ? r.project : "",
          arm === "control" ? r.query.slice(0, 44) : "",
          arm,
          s.returned,
          pct(s.contamination),
          pct(s.precision5),
          f3(s.meanRelevantDistance),
          f3(s.topDistance),
        ]),
      );
    }
  }

  const agg = (arm, field) => mean(rows.map((r) => r[arm][field]).filter((n) => !Number.isNaN(n)));

  console.log("\n" + "=".repeat(56));
  console.log("HEADLINE");
  console.log("=".repeat(56));
  console.log(`Cross-project contamination   control ${pct(agg("control", "contamination"))}` +
              `   treatment ${pct(agg("treatment", "contamination"))}`);
  console.log(`Precision@5                   control ${pct(agg("control", "precision5"))}` +
              `   treatment ${pct(agg("treatment", "precision5"))}`);
  console.log(`Mean distance to relevant     control ${f3(agg("control", "meanRelevantDistance"))}` +
              `   treatment ${f3(agg("treatment", "meanRelevantDistance"))}`);
  console.log(
    "\nContamination is the claim under test: the original prompt's `project` field is\n" +
      "supposed to prevent it. Treatment contamination is 0% structurally — a recall in one\n" +
      "namespace cannot return another's entries, which is the whole point.\n" +
      "\nThe distance column tests the format change independently: same fact, JSON vs prose.",
  );

  const out = {
    relayer: creds.serverUrl,
    corpusSize: FACTS.length,
    queries: rows.length,
    aggregate: {
      control: {
        contamination: agg("control", "contamination"),
        precision5: agg("control", "precision5"),
        meanRelevantDistance: agg("control", "meanRelevantDistance"),
      },
      treatment: {
        contamination: agg("treatment", "contamination"),
        precision5: agg("treatment", "precision5"),
        meanRelevantDistance: agg("treatment", "meanRelevantDistance"),
      },
    },
    rows,
  };
  writeFileSync("results.json", JSON.stringify(out, null, 2));
  console.log("\nWrote results.json");
}

// ---------------------------------------------------------------------- main

const mode = process.argv[2];
if (mode === "--seed") await seed();
else if (mode === "--measure") await measure();
else {
  console.log("Usage:\n  node run.mjs --seed\n  node run.mjs --measure");
  process.exit(1);
}

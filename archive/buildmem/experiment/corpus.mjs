// Synthetic corpus for the phantom-filter experiment.
//
// Three fictional projects with deliberately overlapping vocabulary — deploys, wallets,
// migrations, rate limits. Overlap is the point: it is what makes a single shared namespace
// fail, and it is what real founder memory looks like after two or three projects.

export const PROJECTS = ["orbit", "ledger", "atlas"];

/**
 * Each fact appears in both arms:
 *   control   -> JSON object, all projects in one namespace (original BuildMEM)
 *   treatment -> prose record, routed to that project's namespace (BuildMEM v2)
 */
export const FACTS = [
  // ---- orbit: a Next.js analytics dashboard --------------------------------
  {
    project: "orbit", ecosystem: "general", type: "failure",
    title: "Vercel deploy failed on missing env var at build time",
    detail:
      "The Vercel deploy failed because DATABASE_URL is read at module scope and is not present " +
      "during the build step. Root cause: top-level database client instantiation. Fix: move the " +
      "client construction inside the request handler so it only runs at runtime.",
    tags: ["deploy", "vercel", "env"],
  },
  {
    project: "orbit", ecosystem: "general", type: "gotcha",
    title: "Vercel edge functions cap response bodies at 4MB",
    detail:
      "Edge functions silently truncate responses larger than 4MB. The CSV export hit this at " +
      "around 12000 rows. Stream the response or move the route to a Node runtime.",
    tags: ["vercel", "limits", "export"],
  },
  {
    project: "orbit", ecosystem: "general", type: "decision",
    title: "Chose server-side pagination over client-side filtering",
    detail:
      "Decided to paginate on the server. Client-side filtering was rejected because the table " +
      "reached 40000 rows and the browser froze during sort.",
    tags: ["performance", "pagination"],
  },
  {
    project: "orbit", ecosystem: "general", type: "snippet",
    title: "Postgres connection pooling settings that stopped the timeouts",
    detail:
      "Setting pool max to 10 and idle_timeout to 20 seconds stopped the intermittent connection " +
      "timeouts under load. Took several attempts to land on these values.",
    tags: ["postgres", "config"],
  },
  {
    project: "orbit", ecosystem: "general", type: "failure",
    title: "Migration dropped a column that was still being written to",
    detail:
      "A migration dropped the legacy_id column while an old worker was still writing to it, " +
      "causing insert failures for 20 minutes. Fix: stop writers before destructive migrations.",
    tags: ["migration", "database"],
  },
  {
    project: "orbit", ecosystem: "general", type: "gotcha",
    title: "Rate limited by the analytics provider at 100 requests per minute",
    detail:
      "The upstream analytics API rate limits at 100 requests per minute per key and returns 429 " +
      "with no Retry-After header. Batch the reads and back off exponentially.",
    tags: ["rate-limit", "api"],
  },
  {
    project: "orbit", ecosystem: "general", type: "decision",
    title: "Rejected Redis caching in favour of materialized views",
    detail:
      "Chose Postgres materialized views over adding Redis. Redis was rejected to avoid operating " +
      "a second stateful service for a read pattern that refreshes hourly.",
    tags: ["caching", "architecture"],
  },
  {
    project: "orbit", ecosystem: "general", type: "failure",
    title: "Session cookies broke in Safari due to SameSite default",
    detail:
      "Safari rejected the session cookie because SameSite was unset and the callback was " +
      "cross-site. Fix: SameSite=None with Secure on the auth callback route.",
    tags: ["auth", "safari"],
  },

  // ---- ledger: a Sui payments service --------------------------------------
  {
    project: "ledger", ecosystem: "sui", type: "failure",
    title: "Mainnet deploy failed because the wallet had no SUI for gas",
    detail:
      "The mainnet deploy failed with an insufficient gas error: the deployer wallet held only WAL " +
      "and no SUI. Fix: fund the deployer with SUI for gas before publishing a package.",
    tags: ["deploy", "wallet", "gas"],
  },
  {
    project: "ledger", ecosystem: "sui", type: "gotcha",
    title: "Sui object versions make concurrent writes to one shared object serialize",
    detail:
      "Two transactions touching the same shared object serialize and the second retries. Throughput " +
      "collapsed under concurrent payments. Shard the counter across several objects.",
    tags: ["sui", "concurrency"],
  },
  {
    project: "ledger", ecosystem: "sui", type: "decision",
    title: "Chose sponsored transactions so users need no SUI",
    detail:
      "Decided to sponsor gas so end users never hold SUI. Rejected asking users to fund a wallet, " +
      "which lost roughly half of testers at onboarding.",
    tags: ["wallet", "ux", "gas"],
  },
  {
    project: "ledger", ecosystem: "sui", type: "failure",
    title: "Migration to a new package version orphaned existing objects",
    detail:
      "Publishing a new package version left existing objects pointing at the old type, so the " +
      "migration read zero balances. Fix: write an explicit upgrade path before publishing.",
    tags: ["migration", "upgrade"],
  },
  {
    project: "ledger", ecosystem: "sui", type: "gotcha",
    title: "The RPC endpoint rate limits at 50 requests per second and drops silently",
    detail:
      "The public Sui RPC rate limits around 50 requests per second and drops excess connections " +
      "without an error body, which looks like a network fault. Use a dedicated endpoint.",
    tags: ["rate-limit", "rpc"],
  },
  {
    project: "ledger", ecosystem: "sui", type: "snippet",
    title: "Gas budget that reliably lands a payment transaction",
    detail:
      "A gas budget of 20000000 MIST reliably lands the payment transaction. Lower budgets failed " +
      "intermittently once the object set grew.",
    tags: ["gas", "config"],
  },
  {
    project: "ledger", ecosystem: "sui", type: "decision",
    title: "Rejected storing balances off-chain for auditability",
    detail:
      "Chose on-chain balances despite the cost. Off-chain balances with periodic settlement were " +
      "rejected because auditors could not verify intermediate state.",
    tags: ["architecture", "audit"],
  },
  {
    project: "ledger", ecosystem: "sui", type: "failure",
    title: "Wallet signature rejected because the message was double-encoded",
    detail:
      "Signature verification failed because the message was base64 encoded twice before signing. " +
      "Fix: encode once, and assert the byte length before calling sign.",
    tags: ["wallet", "auth"],
  },

  // ---- atlas: a Walrus-backed document store -------------------------------
  {
    project: "atlas", ecosystem: "walrus", type: "gotcha",
    title: "Walrus Memory namespaces are exact-match with no wildcard",
    detail:
      "Namespaces are opaque flat strings compared with exact equality. There is no prefix search " +
      "and no wildcard, so an agent cannot enumerate namespaces and needs its own registry.",
    tags: ["walrus", "memory", "namespace"],
  },
  {
    project: "atlas", ecosystem: "walrus", type: "failure",
    title: "Deploy to production wrote blobs to the staging relayer",
    detail:
      "The production deploy pointed at the staging relayer, so a day of blobs landed on testnet " +
      "and were invisible from mainnet. Fix: assert the relayer URL at startup.",
    tags: ["deploy", "relayer", "config"],
  },
  {
    project: "atlas", ecosystem: "walrus", type: "gotcha",
    title: "Restore defaults to a limit of 10 and silently under-restores",
    detail:
      "The restore call defaults to re-indexing only 10 memories, so a large namespace looks empty " +
      "after a restore that appeared to succeed. Pass an explicit higher limit.",
    tags: ["walrus", "memory", "restore"],
  },
  {
    project: "atlas", ecosystem: "walrus", type: "decision",
    title: "Chose prose records over JSON for stored memories",
    detail:
      "Decided to store memories as prose with a tag line. JSON was rejected because recall is " +
      "semantic search over the stored text and JSON syntax dilutes the embedding.",
    tags: ["memory", "format"],
  },
  {
    project: "atlas", ecosystem: "walrus", type: "failure",
    title: "Writing the same fact twice created two permanent duplicate entries",
    detail:
      "Walrus Memory performs no deduplication, so re-running the seed script created two copies " +
      "of every memory and both surface in every later recall. Blobs cannot be deleted.",
    tags: ["memory", "dedup"],
  },
  {
    project: "atlas", ecosystem: "walrus", type: "gotcha",
    title: "Recall has no relevance threshold so small namespaces return filler",
    detail:
      "Recall returns the closest matches with no minimum relevance, so a nearly empty namespace " +
      "returns unrelated records as though they matched. Filter on distance client-side.",
    tags: ["memory", "recall", "distance"],
  },
  {
    project: "atlas", ecosystem: "walrus", type: "snippet",
    title: "Delegate key permissions that let the relayer write on our behalf",
    detail:
      "The delegate key must be registered on-chain before the relayer accepts writes. Registering " +
      "it through the dashboard and waiting for finality took two attempts to get right.",
    tags: ["walrus", "auth", "config"],
  },
];

/**
 * Queries scoped to one project. `relevant` lists the titles that a correct system should
 * return; anything from another project is contamination by definition.
 *
 * Vocabulary is chosen to collide across projects on purpose — "deploy failed", "wallet",
 * "migration", "rate limit" all appear in more than one project.
 */
export const QUERIES = [
  {
    project: "orbit",
    query: "deploy failed, root cause and fix, what broke last time",
    relevant: [
      "Vercel deploy failed on missing env var at build time",
      "Migration dropped a column that was still being written to",
    ],
  },
  {
    project: "ledger",
    query: "deploy failed, root cause and fix, what broke last time",
    relevant: [
      "Mainnet deploy failed because the wallet had no SUI for gas",
      "Migration to a new package version orphaned existing objects",
    ],
  },
  {
    project: "atlas",
    query: "deploy failed, root cause and fix, what broke last time",
    relevant: ["Deploy to production wrote blobs to the staging relayer"],
  },
  {
    project: "ledger",
    query: "wallet problems, signing and gas funding issues",
    relevant: [
      "Mainnet deploy failed because the wallet had no SUI for gas",
      "Wallet signature rejected because the message was double-encoded",
      "Chose sponsored transactions so users need no SUI",
    ],
  },
  {
    project: "orbit",
    query: "rate limiting and throttling from an upstream service",
    relevant: ["Rate limited by the analytics provider at 100 requests per minute"],
  },
  {
    project: "ledger",
    query: "rate limiting and throttling from an upstream service",
    relevant: ["The RPC endpoint rate limits at 50 requests per second and drops silently"],
  },
  {
    project: "orbit",
    query: "database migration that caused data problems",
    relevant: ["Migration dropped a column that was still being written to"],
  },
  {
    project: "atlas",
    query: "how memory storage and recall actually behaves",
    relevant: [
      "Walrus Memory namespaces are exact-match with no wildcard",
      "Restore defaults to a limit of 10 and silently under-restores",
      "Writing the same fact twice created two permanent duplicate entries",
      "Recall has no relevance threshold so small namespaces return filler",
    ],
  },
];

/** Original BuildMEM storage format: a JSON object, all projects in one namespace. */
export function asControlRecord(f) {
  return JSON.stringify({
    type: f.type,
    project: f.project,
    ecosystem: f.ecosystem,
    title: f.title,
    detail: f.detail,
    tags: f.tags,
  });
}

/** BuildMEM v2 storage format: tag line, then self-contained prose. */
export function asTreatmentRecord(f, date = "2026-08-19") {
  return (
    `[${f.type}|proj=${f.project}|eco=${f.ecosystem}|imp=med|${date}|status=current]\n` +
    `${f.title}. ${f.detail}`
  );
}

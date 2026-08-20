# Setup — Markov v2 on Walrus Mainnet

Target: memory live and writing blobs **today**, so real usage accumulates before the
Aug 24 14:00 UTC deadline. Budget ~30 minutes.

## 0. Prerequisites

- Node.js 20+ with `npx` on `PATH` (`node --version`)
- A browser on this machine (the sign-in flow needs one)
- A Sui wallet you are willing to dedicate to this — see step 1

## 1. Create a dedicated Sessions wallet

The rules require *"a dedicated wallet address created for Sessions."* Do not reuse a personal
wallet — you have to publish this address in the submission form.

1. Create a fresh wallet (Sui Wallet browser extension, or `sui client new-address ed25519`).
2. Save the address somewhere you can paste it into the DeepSurge form.
3. Fund it with a small amount of SUI and WAL if you plan to self-host a relayer. **If you use the
   hosted relayer below, you do not need to fund it** — the Foundation's relayer pays for storage.

> Record the address in `submission/checklist.md`, not in memory. Never let the agent store a seed
> phrase or private key — Markov v2 rule 9.1 forbids it, and that rule is load-bearing here.

## 2. Install the Walrus Memory plugin for Claude Code

The plugin install is preferred over MCP-only: it adds lifecycle hooks that make the agent prefer
Walrus Memory over Claude Code's built-in memory, which is exactly the behaviour Markov v2 assumes.

```
/plugin marketplace add MystenLabs/MemWal
/plugin install memwal@memwal-plugins
```

Restart Claude Code, then ask the agent to run `memwal_login` and open the URL it returns. You can
create the Walrus Memory account during that flow at [memory.walrus.xyz](https://memory.walrus.xyz).

Credentials land in `~/.memwal/credentials.json` — no keys go in any config file. That file holds a
raw delegate private key, so treat it as a secret (`chmod 600`).

<details>
<summary>MCP-only alternative (any Claude Code version, other clients)</summary>

```json
{
  "mcpServers": {
    "memwal": {
      "command": "npx",
      "args": ["-y", "@mysten-incubation/memwal-mcp"]
    }
  }
}
```

You lose the automatic-memory hooks; the tools themselves behave identically.
</details>

**Do not set `--namespace` or `MEMWAL_NAMESPACE`.** Markov v2 routes every call to an explicit
per-call namespace (rule 5.4), which takes precedence over any configured default. Setting a global
default would only mask routing bugs during the days when you most want to catch them.

Relayer defaults to `https://relayer.memory.walrus.xyz` — that is **mainnet**, which is what the
rules require. The staging URL (`relayer-staging…`) is testnet; do not use it.

## 3. Verify, in three layers

Run these in order — each isolates a different failure.

| Check | How | Healthy result |
|---|---|---|
| Server connected | `/mcp` | `memwal` listed as **Connected** |
| Relayer reachable | ask the agent to run `memwal_health`, or a `memwal_recall` at `limit: 1` if that tool is absent | returns within a few seconds |
| End to end | state a durable fact, confirm `memwal_remember` fires, then open a **new session** and confirm `memwal_recall` surfaces it | the fact comes back |

**Note which tools you actually got.** As of 2026-08-19 the Claude Code plugin exposes eight:
`memwal_recall`, `memwal_remember`, `memwal_remember_bulk`, `memwal_analyze`, `memwal_restore`,
`memwal_health`, `memwal_login`, `memwal_logout`. Other clients ship fewer — some have neither
`memwal_remember_bulk` nor `memwal_health` — and the set has changed between versions, so check
rather than assume. Markov v2 rules 5.3 and 8.1 branch on both cases. Write your list down now,
because the recovery ladder behaves differently depending on it.

The third check is the only one that proves the thing you actually care about. Do it before you
trust any of this.

## 4. Install the prompt

Copy everything below the `---` in [`../PROMPT.md`](../PROMPT.md) into your project's `CLAUDE.md`
(or Cursor rules / system prompt). Then seed the registry so the agent has a project to route to —
nothing can enumerate namespaces, so `markov.index` is the only way back to your own slugs:

> "Register this project in `markov.index`: name Walrus Forms, aliases 'walrus forms', 'WF',
> slug `walrus-forms`. Stack: Next.js, Sui Mainnet, Walrus Memory."

## 5. Confirm namespace routing works

Verify explicitly rather than assuming — a routing bug is invisible until the day you need the
record:

1. Ask the agent to write one project fact and one cross-project tooling fact.
2. Ask it to `memwal_recall` in `markov.facts.global` with a query about the *project* fact.
3. **The project fact must not appear.** If it does, both writes went to one bucket and routing is
   broken — check that the agent is passing `namespace` on every call.

Namespaces are compared byte-for-byte (rule 2.7). `markov.state.acme` and `markov.state.acme ` are
two different namespaces, and a stray trailing space orphans everything written in that session
permanently — blobs cannot be edited or moved.

## 6. Confirm the recency fix works

This is the change the whole submission rests on, so prove it rather than trusting it.

1. Write three or four checkpoints for one project across a session, so `markov.state.<slug>` holds
   several near-identical records.
2. Open a new session and let it boot.
3. **It must recall at `limit: 100` and sort by timestamp** — not recall three and take the newest
   of those. Ask it which checkpoint it picked and why; the answer should name a parsed ISO 8601
   timestamp, not a retrieval position.
4. If the returned count equals the limit, it must say so out loud (rule 3.2) instead of presenting
   newest-of-100 as newest-that-exists.

The failure this guards against does not show up at three checkpoints — that is the whole point of
the finding. See [`../experiment/`](../experiment/) for the measurement as the namespace grows.

## 7. Reach 10 blobs on mainnet

The rules gate on **≥10 blobs written on Mainnet at submission time**, with agent ID and blob count
as proof. Under Markov v2's write gate (rule 5.1) this happens naturally across two or three real
working days — the gate is deliberately strict, so do not expect 10 in an hour of ordinary work.

Do **not** pad the count with junk writes. The same judges reading your blob count are reading your
before/after evidence, and a memory full of filler is visible immediately. If you are short, work a
real session on something with genuine decisions and failures in it.

Track your count as you go — you need the number for the form:

> "How many blobs have I written across `markov.index`, `markov.state.*`, `markov.facts.*`,
> `markov.facts.global`, and `markov.capsules`?"

Because recall has no wildcard, the agent must sweep each namespace it knows about from
`markov.index` and sum them. Add `mk.exp2.rigid`, `mk.exp2.distinct`, and the `mk.exp.*` pilot if you ran the experiment.
Record the total in `submission/checklist.md`.

## Troubleshooting

**`/mcp` shows memwal failed.** Restart first — MCP servers load at startup. Then run
`npx -y @mysten-incubation/memwal-mcp --help` in a plain terminal to surface the real error; most
often Node < 20, or `npx` missing from the `PATH` Claude Code inherits. `MEMWAL_MCP_DEBUG=1` gives a
full trace.

**Agent saves but recall returns nothing.** Almost always a namespace mismatch — recall is scoped to
`account + namespace` exactly. Confirm the namespace string matches character for character
(`markov.state.acme` and `markov.state.acme ` are two different namespaces). If it matches, run
`memwal_restore <namespace> --limit 100` and recall again. Pass the limit explicitly: the default is
10, which silently under-restores any real namespace (rule 8.3).

**Recall returns records, but not the ones you meant.** There is no relevance floor — a small
namespace returns its nearest unrelated records as though they matched. Read the `distance` and
discard anything at `≥ 0.7` (rule 3.8).

**Auth error after it was working.** The delegate key was revoked from the dashboard.
`memwal_logout` then `memwal_login` mints a fresh one.

**Headless / SSH machine.** `memwal_login` needs a browser. Sign in on a desktop, then copy
`~/.memwal/credentials.json` over `scp` — never paste it into a chat.

**Restricted network.** Needs outbound HTTPS to both `relayer.memory.walrus.xyz` and
`memory.walrus.xyz`.

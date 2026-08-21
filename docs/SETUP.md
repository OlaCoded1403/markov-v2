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
— or `AGENTS.md` for Codex and Antigravity CLI, or Cursor rules, or any client's system prompt.
Copies drift; §7 step 4 has the regenerate-and-diff pattern that keeps them honest.

### Better: install it once, for every project, without copying

A per-project copy is fine for one repo and a liability across five. Both clients can load the
prompt from wherever it already lives, so there is exactly one file to maintain. Verified in both
on 2026-08-21.

**Claude Code** — put a single import in your user-level memory file, `~/.claude/CLAUDE.md`. It
loads in *every* project on the machine, absolute paths are allowed, and imports in user-scope files
are trusted without a prompt:

```markdown
@C:/Users/vibez/Documents/markov-v2/AGENTS.md
```

Confirm with `/context` — the file appears under **Memory files**. It concatenates with, rather than
replaces, whatever `CLAUDE.md` the project already has, so a repo keeps its own instructions and
gains the memory rules.

**Antigravity CLI** — pass the prompt's home as an extra workspace directory. `agy` discovers
`AGENTS.md` there even when you launch from an unrelated folder:

```bash
agy --add-dir "C:\Users\vibez\Documents\markov-v2"
```

Without it, `agy` opens with no workspace, never loads `AGENTS.md`, and answers as though it has no
memory — a failure that looks nothing like a memory failure. See §7 step 5.

**Codex and Cursor** read `AGENTS.md` from the repo root, so they still need a copy or a symlink
(`ln -s`, which on Windows needs Developer Mode).

Then seed the registry so the agent has a project to route to — nothing can enumerate namespaces,
so `markov.index` is the only way back to your own slugs:

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

## 7. Prove it in a second client — the cross-tool handoff

Rule 1.2 claims other tools and other models share the brain. Untested, that is just a sentence.
The test is cheap, and it is the single most convincing artifact this prompt can produce: write a
checkpoint in one client, resume it in another.

Everything below was run end to end on 2026-08-20 — Claude Code → Antigravity CLI, on one machine,
one MemWal account. Where something bit me, I have said so rather than smoothing it out.

**Account scoping first, because it decides what you are actually testing.** Recall is scoped to
`account + namespace` exactly. A second client signed in to a *different* account gets a legitimate
"Fresh start, no stored state" — that exercises the prompt, but it is not a handoff. The handoff
needs **one account, two tools**. On a single machine both clients read the same
`~/.memwal/credentials.json`, so the second one inherits the session with nothing to copy. Never
mail that file to anyone to fake a handoff — it is a raw delegate private key over your whole
memory, and rule 9.1 exists for exactly this temptation.

The second client used here is **[Antigravity CLI](https://antigravity.google/docs/cli)** (`agy`),
which is free on a personal Google account. Note that **Gemini CLI is no longer an option**: Google
stopped serving it for free and individual accounts on 2026-06-18, and sign-in now fails with
*"This client is no longer supported for Gemini Code Assist for individuals."* Antigravity is its
successor. Codex and Cursor work the same way if you already pay for one — only steps 1 and 2
change, and both read `AGENTS.md` just like `agy` does.

**1. Install.** Get the installer from [antigravity.google](https://antigravity.google/docs/cli) —
it is a native installer, not an npm package, and `agy update` will tell you to use the website
anyway. Run `agy` once and sign in through the browser. Then confirm the binary is actually on your
`PATH` in a *new* shell — the installer appends to it, but an already-open terminal or editor keeps
the old environment until it is restarted.

> **Windows gotcha, if the download fails.** Every curl build on Windows can fail HTTPS with
> `schannel: ... CRYPT_E_NO_REVOCATION_CHECK (0x80092012)`. That is Windows being unable to reach
> the certificate revocation responder, not a bad certificate. `--ssl-no-revoke` fixes it and still
> verifies hostname, chain and expiry. For an installer whose internal downloads you cannot pass a
> flag to, put the single line `ssl-no-revoke` in `%APPDATA%\_curlrc`, run the install, then delete
> that file.

**2. Add the MCP server.**

```bash
agy mcp add memwal -- npx -y @mysten-incubation/memwal-mcp
```

The `--` matters: without it the leading `-y` is parsed as a flag to `agy`. This writes to
`~/.gemini/config/mcp_config.json` — Antigravity reuses Gemini's config directory — or
`.agents/mcp_config.json` for a single workspace. Confirm with `agy mcp list`, which prints the
name, type, status and command of every server.

**3. Allow the tools, if you are running headless.** In the interactive TUI you approve tool calls
as they happen and there is nothing to configure. In print mode (`agy -p "…"`) there is no one to
ask, so **every MCP call is auto-denied** unless an allow-rule exists. The rule must name the
server *and* the tool:

```json
{
  "permissions": {
    "allow": [
      "mcp(memwal/memwal_recall)",
      "mcp(memwal/memwal_restore)",
      "mcp(memwal/memwal_health)",
      "mcp(memwal/memwal_remember)",
      "mcp(memwal/memwal_remember_bulk)"
    ]
  }
}
```

in `~/.gemini/antigravity-cli/settings.json`. A server-level `mcp(memwal)` is rejected — I tried it
first, and the denial message names the exact target it wanted, so read the error rather than
guessing. Leave `memwal_login` and `memwal_logout` off the list deliberately: nothing running
unattended should be able to touch your credentials.

**4. Install the prompt.** `agy` discovers its rules from `AGENTS.md` or `GEMINI.md`, walking up
from the working directory to the repository root, plus `.agents/rules/*.md`. There is **no setting
that points it at an arbitrary path**, so a prompt living in a file called `PROMPT.md` has to be
copied into `AGENTS.md` rather than referenced. This repo generates it:

```bash
{ head -9 AGENTS.md; awk 'f{print} /^---$/{f=1}' PROMPT.md; } > AGENTS.md.new && mv AGENTS.md.new AGENTS.md
diff <(awk 'f{print} /^---$/{f=1}' PROMPT.md) <(tail -n +10 AGENTS.md) && echo "in sync"
```

Copying a prompt into two places is a drift hazard, and pretending otherwise is how the copies end
up disagreeing. Keep `PROMPT.md` as the only source of truth, regenerate after every rule change,
and keep the `diff` where you will actually run it. Codex reads `AGENTS.md` too, so the same file
serves both.

**5. Run the handoff.** In Claude Code, end a session normally so the prompt's own §7 handoff writes
a checkpoint. Then open a fresh session in the second client, in the same project, and let it boot.

```bash
agy --add-dir "/path/to/your/repo" -p "where"
```

`--add-dir` is not optional cosmetics. **My first attempt opened with no workspace folder**, so
`AGENTS.md` was never loaded and the reply was a generic "you currently do not have an active
workspace folder opened" with no resume at all. Keep that failure in mind, because it is the one
this whole guide cannot protect you from: a prompt the client never read fails in a way that looks
*nothing* like a memory failure, and §8's recovery ladder will correctly report memory as healthy,
because memory is healthy.

With the workspace attached, it must open with **Goal / Done / Next / Blockers** naming the
checkpoint you just wrote, minutes old, from a tool that has never seen your conversation. Then ask
which checkpoint it picked and why. The answer has to name a parsed ISO 8601 timestamp, never a
retrieval position. Mine answered:

> Per Markov Rule 3.1, retrieval ranking is semantic rather than chronological, so relevance score
> cannot determine recency. I queried exhaustively with `limit: 100`, parsed the ISO 8601 timestamp
> tags from every returned record header […] and sorted them chronologically.

That is the artifact. Save it verbatim — it is worth more than any description of it.

**6. Record what differs between the clients.** Four things differed in practice, and two of them
are load-bearing:

- **Which `memwal_*` tools exist.** Rules 5.3 and 8.1 branch on `memwal_remember_bulk` and
  `memwal_health` being present. Ask the client to list its tools rather than assuming. Antigravity
  exposes all eight, same as the Claude Code plugin.
- **`distance` or `score`.** Every threshold in the prompt is written in distance terms; both MCP
  clients tested return `score`, which is roughly `1 − distance`. Rule 1.5 is what stops a client
  swap from silently inverting rules 3.8 and 5.1b. Check which one you got, in each client — and
  note that this is an **MCP-versus-SDK** split, not a quirk of any one client.
- **How rules are loaded**, per step 4. This is where a client swap actually breaks.
- **How tool permissions are granted**, per step 3.
## 8. Reach 10 blobs on mainnet

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

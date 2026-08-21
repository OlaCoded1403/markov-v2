# Demo runbook — recording the cross-tool handoff

The video is evidence for **Best Real-World Experience**. What makes it convincing is that the
second tool has never seen the first conversation, and says so itself. Everything here is set up and
verified; nothing needs preparing on the day.

**Demo project: `C:\Users\vibez\Documents\vibezprotocol-full`** — the local checkout of
[github.com/OlaCoded1403/vibezprotocol](https://github.com/OlaCoded1403/vibezprotocol). Two decoy
folders sit next to it, `vibezprotocol` and `vibezprotocol-backend`, with no git remote. Use `-full`.

## Already verified

- **Claude Code** loads Markov v2 in every project via one import in `~/.claude/CLAUDE.md` pointing
  at this repo's `AGENTS.md`. Checked inside the demo project on 2026-08-21: it confirmed Markov v2
  was loaded, quoted a convention from the project's *own* 170-line `CLAUDE.md` in the same answer —
  so the two concatenate rather than one replacing the other — and derived the slug `vibez-protocol`
  from rule 2.7 unprompted.
- **Antigravity CLI** loads the same file with `agy --add-dir "C:\Users\vibez\Documents\walrus"`,
  from any working directory. Checked from an empty scratch folder: it resumed the newest checkpoint.
- Neither client holds a copy of the prompt. One source of truth, two readers.
- The demo project's `CLAUDE.md` says nothing about memory, checkpoints or recall, so nothing can
  contradict the Markov rules mid-take.

---

## 0. Before you hit record

**Safety — the only thing that can really go wrong.**

- Never show `~/.memwal/credentials.json`. It holds a raw delegate private key.
- Don't run `inspect-credentials.mjs` on camera even though it redacts; the filename alone invites
  someone to ask you to open it.
- Don't open `.env` in the demo project. Your own `CLAUDE.md` warns about it.
- Blob ids, the account id `0x6b5a3d09…`, and the wallet `0xad0d1b72…` are all **safe** to show.
  They're public and they're what the form asks for.

**Capture setup.** You switch clients mid-video, and Xbox Game Bar records a single app window — it
won't follow you across applications. Two options:

- *Simplest:* run both clients as tabs in the **VS Code integrated terminal**. One window, one
  capture, and the switch is a visible tab click. Game Bar (`Win+G`) is then fine.
- *Safer:* OBS with **Display Capture**, which records whatever is on screen.

**Legibility.** Bump the terminal font to ~16–18pt (`Ctrl+Shift+=` in the VS Code terminal). Judges
may watch this in a small embedded player. Clear scrollback first (`cls`) so the take starts clean.

**Cold start.** Close any other Claude Code session open in `vibezprotocol-full`. The resume in
step 6 is only evidence if the second client is genuinely starting fresh.

**Have ready in a browser tab:** `https://walruscan.com/mainnet/blob/` — you'll paste an id onto the
end of it in step 5.

**Target length: 3 minutes.** Judges have many to watch. Everything below fits.

---

## 1. Show there is no prompt in this project — 15s

```
cd C:\Users\vibez\Documents\vibezprotocol-full
dir
```

Say: *"This is a different project. There's no Markov prompt file in it — its CLAUDE.md is its own,
about FastAPI routes and deploy steps. The memory prompt lives in another repo entirely and is
loaded by reference."*

This matters. Without it a viewer assumes you pasted the prompt in and the demo is circular.

## 2. Open Claude Code and show it already remembers — 40s

**Do not ask it to register the project.** That was already done at `2026-08-21T00:00:00Z`, and a
second write would create a permanent duplicate — memory has no dedup. Asking anyway gets a correct
refusal, which is a fine thing to film deliberately but a confusing way to open.

The state as of 2026-08-21:

| Namespace | Contents |
|---|---|
| `markov.index` | `vibez-protocol` registered |
| `markov.facts.vibez-protocol` | 4 real facts about this project |
| `markov.state.vibez-protocol` | **empty — no checkpoint has ever been written** |

That empty state namespace is the gift. The handoff in step 4 writes **the first checkpoint this
project has ever had**, so what Antigravity resumes in step 6 is unambiguously new, created minutes
earlier, on camera.

```
claude
```

Then:

> what do you already know about this project, and has anything been checkpointed for it?

It recalls `markov.index`, resolves the slug, reads `markov.facts.vibez-protocol`, and reports four
facts and no checkpoints. Say: *"I have never opened Claude in this project during this recording.
It knows the Render services, the port 8001 rule, and that the production hostname is duplicated in
four files — because a session last night wrote that to Walrus. There is no memory prompt in this
repo; it's loaded by reference from another one."*

Worth adding: *"The folder is `vibezprotocol-full`, the repo is `vibezprotocol`, the slug is
`vibez-protocol` — three strings for one project. Nothing in Walrus Memory can list the namespaces
an account has written to, so without that registry there is no route from what I call the project
to where its memory lives."*

The registry now holds two slugs, so rule 3.3's name-to-slug resolution is genuinely exercised here
rather than assumed.

**Optional, and good footage if you want it:** ask it to register the project anyway. It will decline
because rule 5.1(b) finds the existing record, and explain that re-writing would duplicate
permanently. That is the write gate catching a real duplicate live — worth 15 seconds.

## 3. Do a real piece of work — 45s

**Nothing here edits a file.** The prompt's claim is that a *decision* survives a tool switch, so an
investigation that ends in a decision is the demo. Code changes would only add risk and dead air.

Four layers of safety, in case one fails:

1. **Phrase it as a question** — "read", "tell me", "what would break". Claude answers; it has no
   reason to edit.
2. **Hard lock, if you want one:** press `Shift+Tab` to enter **plan mode** before asking. It cannot
   write files in that mode. Press it again to leave *before* step 4 — the handoff has to write to
   memory, so don't run the whole session in plan mode.
3. **The working tree is clean** (checked 2026-08-21). If anything did change, `git checkout .`
   reverts it.
4. **Render cannot see your machine.** It deploys from a pushed branch. Local edits are inert until
   `git push`, and you are not pushing during a recording.

Pick one of these — all read-only, all real, all documented in the project's own `CLAUDE.md` so
nothing is staged:

**A — asymmetric escaping (recommended).** The most interesting to watch, and a genuine decision:

> Two render paths handle project data differently — `backend/static/admin.html` escapes through
> `escHtml()` before `innerHTML`, while `frontend/script.js` interpolates project fields raw. Read
> both and tell me what an admin-authored value would have to contain to break the public page.
> Don't change anything.

The honest answer is "project data is admin-authored, so this is latent rather than exploitable" —
and the decision worth carrying is *whether that stays true if authoring is ever opened up*.

**B — the port discrepancy.** Fastest and most visual, a couple of greps:

> The READMEs say port 8000 but the app runs on 8001. Which files disagree, which is authoritative,
> and what breaks for someone following the README? Read only, don't edit.

**C — the no-migrations trap.** The deepest decision, the slowest to film:

> `init_db()` uses `create_all()`, which only creates missing tables and never alters an existing
> one. Which model changes since the Render tables were created would silently not exist in
> production? Don't change anything.

Whichever you pick, **say the decision out loud.** That sentence is what step 6 has to hand back.

> One more: in step 6 Antigravity may offer to act on the checkpoint's `Next:` line. Decline. The
> video ends on the answer in step 7, not on a change to a live project.

## 4. Hand off — 25s

Type:

> handoff

Rule 7 runs the write gate, writes any durable facts plus a checkpoint, echoes the blob ids, and
closes with *"Any Markov body can pick this up."*

Because `markov.state.vibez-protocol` is empty, this is **the first checkpoint this project has ever
had**, and its `Supersedes:` line will read `none`. Point that out — it means what the second client
resumes in step 6 cannot be anything other than the record you just watched being written.

If it tries to re-store one of the four facts already known, it should skip it and say so. Let it —
that is the gate working, and it costs five seconds.

**Read the checkpoint timestamp aloud.** That exact string is what the next client has to name, and
saying it before the switch is what makes the next shot unfalsifiable.

Then close the session (`Ctrl+C`, or `/exit`).

## 5. Show the blob on Walruscan — 15s

Paste one of the ids onto `https://walruscan.com/mainnet/blob/`.

Say: *"Mainnet, not a local database. Anyone can open this without my credentials."*

Two seconds of screen time that kills the "did you actually store anything" question.

## 6. Switch to Antigravity, cold — 40s

New terminal tab:

```
agy --add-dir "C:\Users\vibez\Documents\walrus"
```

Say: *"Different vendor, different model, no access to the conversation I just closed. The
`--add-dir` is how it finds the prompt — the prompt is not in this project."*

Then type one word:

> where

It must open with **Goal / Done / Next / Blockers** naming the checkpoint from step 4.

## 7. The question that proves it wasn't luck — 30s

> which checkpoint did you pick, and how did you decide it was the newest?

The answer names a **parsed ISO 8601 timestamp** and **exhaustive recall at `limit: 100`** — never a
retrieval position. When it did this on 2026-08-20 it said:

> *"Per Markov Rule 3.1, retrieval ranking is semantic rather than chronological, so relevance score
> cannot determine recency. I queried exhaustively with `limit: 100`, parsed the ISO 8601 timestamp
> tags from every returned record header […] and sorted them chronologically."*

Close on that. It is the entire submission in one sentence, spoken by a model from another vendor.

---

## If it goes wrong mid-take

- **Antigravity answers "you currently do not have an active workspace folder opened"** → the
  `--add-dir` was missing or mistyped. The prompt never loaded. Relaunch. Not a memory failure, and
  it looks nothing like one — which is exactly why it's worth knowing.
- **Either client says "fresh start, no stored state"** → don't re-record yet. Run the §8 ladder on
  camera: `memwal_health`, then `memwal_restore` with an explicit `limit: 100` (the default is 10 and
  silently under-restores), then recall again. Recovering live is *better footage* than a clean take.
- **A recall comes back empty in the new project** → check the slug byte for byte.
  `markov.state.vibez-protocol` and `markov.state.vibez-protocol ` are different namespaces and the
  trailing space is invisible.
- **A write seems to hang** → leave it. Rule 7.1a: a remember can take minutes, there is no
  deduplication, and a retry landing beside a slow original leaves two permanent copies. You already
  have one accidental duplicate on this account; don't film making another.

## Afterwards

1. Transcribe both verbatim replies — step 6's resume and step 7's answer — into
   `blog/OBSERVATIONS.md` section B.
2. Re-run `node experiment/blob-count.mjs` and update the count in `submission/checklist.md`,
   `blog/index.md` and `README.md` together, so the three don't disagree.
3. The video covers the X post requirement (`#Walrus`) and doubles as the demo link on the form.

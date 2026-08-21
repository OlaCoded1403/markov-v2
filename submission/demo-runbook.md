# Demo runbook — recording the cross-tool handoff

The video is evidence for **Best Real-World Experience**. What makes it convincing is that the
second tool has never seen the first conversation, and says so itself. Everything below is set up
and verified; nothing here needs preparing on the day.

## Already done

**Demo project: `C:\Users\vibez\Documents\vibezprotocol-full`** — the local checkout of
[github.com/OlaCoded1403/vibezprotocol](https://github.com/OlaCoded1403/vibezprotocol). Note there
are two decoy folders next to it, `vibezprotocol` and `vibezprotocol-backend`, which have no git
remote and are not the project. Use the `-full` one.

- **Claude Code** loads Markov v2 in every project via one import in `~/.claude/CLAUDE.md` pointing
  at this repo's `AGENTS.md`. Verified 2026-08-21 in the demo project itself: it confirmed Markov v2
  was loaded, quoted a convention out of the project's *own* 170-line `CLAUDE.md` in the same breath
  — proving the two concatenate rather than one replacing the other — and derived the slug
  `vibez-protocol` from rule 2.7 unprompted.
- **Antigravity CLI** loads the same file with `agy --add-dir "C:\Users\vibez\Documents\walrus"`,
  from any working directory. Verified from a scratch folder: it resumed the newest checkpoint.
- Neither client has a copy of the prompt. One source of truth, two readers.
- The project's own `CLAUDE.md` says nothing about memory, checkpoints or recall, so there is no
  instruction that could contradict the Markov rules and suppress the resume summary.

## Before you hit record

- Close other Claude Code sessions in the demo project, so the resume is genuinely cold.
- Have `https://walruscan.com/mainnet/blob/` open in a tab for the receipt shot.
- Pick a real task in the demo project. Do not stage a fake one — the whole entry rests on this
  being real usage, and it will read as real precisely because it is.

## Shot list — about 3 minutes

**1. Show there is no prompt in this project.** `dir` / `ls` in the demo repo. No `PROMPT.md`, and
its `CLAUDE.md` is its own. Say the prompt lives in another repo and is loaded by reference.

**2. Open Claude Code and register the project.** This exercises rule 2.7 and gives `markov.index`
a second slug, which until now it has never had:

> register this project in `markov.index`: name Vibez Protocol, aliases "vibez", "vibezprotocol",
> "vibez protocol", slug `vibez-protocol`. Stack: FastAPI backend, static frontend, deployed on
> Render.

Worth saying aloud on camera: the **folder** is `vibezprotocol-full`, the **repo** is
`vibezprotocol`, and the **slug** is `vibez-protocol`. Three different strings for one project,
which is exactly why `markov.index` exists — nothing can enumerate namespaces, so without the
registry a later session has no way to get from what you call the project to where its memory
lives. This is also the first time the registry holds more than one slug, so rule 3.3's
name-to-slug resolution is genuinely exercised here rather than assumed.

Show the `saved → blob <id>` receipt.

**3. Do a real piece of work.** Ten to twenty seconds is enough — a decision, a fix, a finding.

**4. Hand off.** Type `handoff`. Rule 7 writes the facts and a checkpoint, echoes blob ids, and ends
with *"Any Markov body can pick this up."* Read the checkpoint timestamp aloud; it is the thing the
next shot has to name.

**5. Paste one blob id into walruscan.** Mainnet, real, permanent. Two seconds of screen time and it
kills the "did you actually store anything" question.

**6. Switch to Antigravity.** Different vendor, different model, no access to the conversation you
just closed:

```bash
agy --add-dir "C:\Users\vibez\Documents\walrus"
```

Then type a single word: `where`

It must open with **Goal / Done / Next / Blockers** naming the checkpoint from step 4.

**7. Ask the question that proves it wasn't luck.**

> which checkpoint did you pick, and how did you decide it was the newest?

The answer names a parsed ISO 8601 timestamp and exhaustive recall at `limit: 100` — never a
retrieval position. That sentence is the whole submission in one line, spoken by a model from
another vendor.

## If something goes wrong on camera

- **Antigravity gives a generic "no active workspace" reply** → `--add-dir` was missing. The prompt
  never loaded. Relaunch with it.
- **Either client says "fresh start, no stored state"** → do not re-record yet. Run the §8 ladder:
  `memwal_health`, then `memwal_restore` with an explicit `limit: 100`, then recall again. The
  default restore limit is 10 and silently under-restores.
- **A recall comes back empty in the new project** → check the slug spelling. `markov.state.vibez-protocol`
  and `markov.state.vibez-protocol ` are different namespaces and the trailing space is invisible.

## Afterwards

Transcribe the two verbatim replies into `blog/OBSERVATIONS.md` section B, then re-run
`node experiment/blob-count.mjs` and update the count in `submission/checklist.md`, `blog/index.md`
and `README.md` together.

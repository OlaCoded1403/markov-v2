# Voiceover script — cross-tool handoff demo

**Recorded by me, not synthesised.** This version is written for speaking aloud, so it uses
contractions and reads "blob IDs" the way a person says it rather than the way a speech engine needs
it spelled.

Reference timing, from a machine read at a slightly slow pace: **3 minutes 23 seconds**. A human
read with natural pauses usually lands a little longer, so expect 3:30 to 3:45 on the timeline.

`submission/make-voiceover.ps1` still exists and still works — useful for re-checking timing after
an edit, not for the final audio.

| Segment | Reference length |
|---|---|
| 1 · no prompt here | 20s |
| 2 · it already remembers | 37s |
| 3 · real work | 30s |
| 4 · handoff | 25s |
| 5 · walruscan | 15s |
| 6 · antigravity | 30s |
| 7 · how did you choose | 37s |
| 8 · close | 10s |

Bold marks where the emphasis falls. A slash `/` is a breath — not a full stop, just somewhere to
take air without it sounding like you ran out.

---

## Segment 1 — no prompt here

This is my portfolio site. Live on Render, / and nothing to do with AI memory.

There is **no memory prompt anywhere in this repository.** It lives in a different folder entirely,
and both tools load it by reference. / Watch what the agent already knows.

## Segment 2 — it already remembers

I ask what it knows. / It goes out to Walrus, finds a registry entry, resolves the project name to a
slug, and returns four facts a session wrote last night. / Including that my production hostname is
quietly duplicated across four different files.

Then it checks whether any state was saved. **None was.** / And it doesn't take that at face value —
it runs a restore to confirm the records genuinely aren't there, / rather than telling me my history
is gone when it might only be unindexed.

## Segment 3 — real work

Now, real work. / Two parts of this site render the same data differently. The admin page escapes
it. The public page doesn't. / I ask what would actually break.

It finds five unescaped fields, and which ones are exploitable. / I decide to leave it — because I'm
the only author of that data — and I set the condition that would change my mind. / **That decision
is what I want to survive.**

## Segment 4 — handoff

I type handoff. / It writes what it learned to Walrus, then a checkpoint: the goal, what was done,
what comes next, / and the decision, with its reasoning. It returns blob IDs as receipts.

Look at the last line. / **Supersedes: none.** The first checkpoint this project has ever had.

## Segment 5 — walruscan

Here's that blob on the Walrus explorer. / Sui mainnet. Encrypted, permanent, / and anyone can open
it without my credentials.

This is **not** a database sitting on my laptop.

## Segment 6 — antigravity

Now a different tool entirely. / Antigravity — Google's command line agent. Different vendor,
different model, / no access to the conversation I just closed. It loads the same prompt from that
other folder.

I ask where we left off on Vibez Protocol. / And it opens with goal, done, next and blockers —
**naming the checkpoint written minutes ago inside another company's product.**

## Segment 7 — how did you choose

But resuming could just be luck. / So I ask it how it chose.

It says retrieval here is semantic, **not chronological** — that recency is invisible to similarity
ranking. / So it recalled the entire set with a limit of one hundred, / checked the returned count
against that limit to be certain nothing had been truncated, / parsed the timestamp out of every
record, / and sorted them itself.

That's the bug I found in the original prompt, and the fix for it — / described back to me by a
model that has never seen my conversation.

## Segment 8 — close

Markov v2. / The prompt, the setup guide, and the harness that measured the original failure are all
in the repository.

---

## Recording it

**Room matters more than the microphone.** Record somewhere with soft furnishings — a room with
curtains and a bed beats a kitchen. Hard parallel surfaces are what make audio sound amateur, not
the mic.

**Phone earbuds usually beat a laptop mic**, because they sit close to your mouth and away from fan
noise. Keep the mic slightly off to the side rather than straight in front, so plosives — the puff
on P and B — don't thump.

**Record one segment per take.** Eight short files are far easier to fix than one long one, and it
matches how the script is already cut. Leave two seconds of silence at the start and end of each so
you have room to trim.

**Record five seconds of pure silence** before you start and keep it. That's "room tone" — CapCut's
noise reduction uses it, and it also patches gaps without an audible dead spot.

**Read it once out loud before recording.** Anything that trips you up is a sentence that works on
paper and not in a mouth — change it, it's your script.

**Don't read it word for word.** Know the beat of each segment and say it. Slightly imperfect and
natural beats polished and stiff, especially here: the whole entry is about having actually done the
thing.

Then do the whole set in one sitting, so tone and level stay consistent across the segments.

## Notes for CapCut

- Insert real pauses between segments; the footage needs room, especially over the Walruscan shot.
- **Segment 7 is the payoff.** If one part gets subtitles burned in, make it that one — quoting the
  agent's own words on screen while you read them.
- Keep the terminal output legible at final resolution. If viewers can't read it, the narration is
  doing all the work, and the point is that the tools said this, not me.
- If time has to come out, cut segment 3 hardest — the *decision* matters, the vulnerability detail
  doesn't. Never cut segment 7.

# Voiceover script — cross-tool handoff demo

Written for text-to-speech. No markdown, no symbols, no URLs or blob ids read aloud — those get
shown, not spoken. 402 words.

Timed with the Windows speech engine at a slightly slow narration pace: **3 minutes 23 seconds** of
speech, so roughly 3:45 once you leave gaps between segments. CapCut's voices usually run a little
faster than this, so expect nearer 3:10. Per-segment timings are in the table below — cut the audio
to the footage, not the other way round.

Regenerate the proofing audio any time with:

```
powershell -ExecutionPolicy Bypass -File submission\make-voiceover.ps1
```

It writes one WAV per segment plus a combined file into `submission/voiceover-audio/`, which is
gitignored. That audio is for **proofing only** — checking pace, catching mangled words, confirming
the script fits. Generate the real thing in CapCut from the text below.

| Segment | Length | Words |
|---|---|---|
| 1 · no prompt here | 19.9s | 44 |
| 2 · it already remembers | 36.6s | 87 |
| 3 · real work | 30.3s | 71 |
| 4 · handoff | 24.7s | 49 |
| 5 · walruscan | 14.7s | 29 |
| 6 · antigravity | 29.9s | 58 |
| 7 · how did you choose | 36.8s | 94 |
| 8 · close | 9.7s | 20 |

One line to check before you generate: segment 6 says "minutes ago". Replace it if the real gap
between your handoff and the Antigravity resume was notably longer.

---

## Segment 1 — no prompt here

This is my portfolio site. Live on Render, and nothing to do with AI memory. There is no memory
prompt anywhere in this repository. It lives in a different folder entirely, and both tools load it
by reference. Watch what the agent already knows.

## Segment 2 — it already remembers

I ask what it knows. It goes out to Walrus, finds a registry entry, resolves the project name to a
slug, and returns four facts a session wrote last night. Including that my production hostname is
quietly duplicated across four different files.

Then it checks whether any state was saved. None was. And it does not take that at face value. It
runs a restore to confirm the records genuinely are not there, rather than telling me my history is
gone when it might only be unindexed.

## Segment 3 — real work

Now real work. Two parts of this site render the same data differently. The admin page escapes it.
The public page does not. I ask what would actually break.

It finds five unescaped fields, and which ones are exploitable. I decide to leave it, because I am
the only author of that data, and I set the condition that would change my mind. That decision is
what I want to survive.

## Segment 4 — handoff

I type handoff. It writes what it learned to Walrus, then a checkpoint: the goal, what was done,
what comes next, and the decision with its reasoning. It returns blob I Ds as receipts.

Look at the last line. Supersedes, none. The first checkpoint this project has ever had.

## Segment 5 — walruscan

Here is that blob on the Walrus explorer. Sui mainnet. Encrypted, permanent, and anyone can open it
without my credentials. This is not a database sitting on my laptop.

## Segment 6 — antigravity

Now a different tool entirely. Antigravity, Google's command line agent. Different vendor, different
model, no access to the conversation I just closed. It loads the same prompt from that other folder.

I ask where we left off on Vibez Protocol. It opens with goal, done, next and blockers, naming the
checkpoint written minutes ago inside another company's product.

## Segment 7 — how did you choose

But resuming could just be luck. So I ask it how it chose.

It says retrieval here is semantic, not chronological, and that recency is invisible to similarity
ranking. So it recalled the entire set with a limit of one hundred, checked the returned count
against that limit to be certain nothing had been truncated, parsed the timestamp out of every
record, and sorted them itself.

That is the bug I found in the original prompt, and the fix for it, described back to me by a model
that has never seen my conversation.

## Segment 8 — close

Markov v2. The prompt, the setup guide, and the harness that measured the original failure are all
in the repository.

---

## Notes for CapCut

- Pick a calm, mid-paced voice. This is an explanation, not an advertisement.
- Insert real pauses between segments rather than relying on the engine's sentence gaps — the
  footage needs room, especially over the Walruscan shot.
- **Segment 7 is the payoff.** If one part gets subtitles burned in, make it that one, quoting the
  agent's own words on screen while the voice reads them.
- Keep the terminal output legible at final resolution. If viewers cannot read it, the narration is
  doing all the work, and the whole point is that the tools said this, not me.
- If you need to lose time, cut segment 3 hardest — the *decision* matters, the vulnerability detail
  does not. Never cut segment 7.

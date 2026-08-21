# Voiceover script — cross-tool handoff demo

Written for text-to-speech. No markdown, no symbols, no URLs read aloud. Roughly 430 words, which
lands near three minutes at a normal narration pace. Timings are a guide — cut the audio to the
footage, not the other way round.

Adjust one thing before recording: segment 6 says "minutes ago". Replace it with the real gap
between your handoff and the Antigravity resume if it is notably longer.

---

## Segment 1 — 0:00 to 0:20

This is my portfolio site. A real project, live on Render, nothing to do with AI memory. And there
is no memory prompt anywhere in this repository. The prompt I am about to show you lives in a
completely different folder, and both tools load it by reference. So watch what the agent already
knows about a project it has supposedly never seen.

## Segment 2 — 0:20 to 0:55

I have asked it what it knows. It goes out to Walrus, finds a registry entry, resolves the project
name to a slug, and pulls back four facts that a session wrote last night. Where the site is
deployed. Which port the backend has to run on locally, and why. And that my production hostname is
quietly duplicated across four different files.

Then it checks whether any state has been saved. None has. And it does not simply take the empty
result at face value. It runs a restore against the namespace to confirm the records genuinely are
not there, rather than concluding my history is gone when it might only be unindexed.

## Segment 3 — 0:55 to 1:25

Now some real work. Two parts of this site render the same data in different ways. The admin page
escapes it. The public page does not. I ask it to read both and tell me what would actually break.

It finds five unescaped fields and works out which ones would need what to be exploited. I decide to
leave it as it is, because I am the only person who authors that data, and I set the condition that
would change my mind. That decision, and the reason behind it, is the thing I want to survive.

## Segment 4 — 1:25 to 1:50

I type handoff. The prompt writes what it learned to Walrus, then writes a checkpoint: the goal, what
was done, what comes next, and the decision with its reasoning attached. It returns blob IDs as
receipts.

Look at the last line. Supersedes, none. This is the first checkpoint this project has ever had.

## Segment 5 — 1:50 to 2:10

Here is that blob on the Walrus explorer. Sui mainnet. Encrypted, permanent, and anyone can open it
without my credentials. This is not a database sitting on my laptop.

## Segment 6 — 2:10 to 2:45

Now a completely different tool. Antigravity, Google's command line agent. A different vendor and a
different model. It has no access to the conversation I just closed. It loads the same prompt from
that other folder.

I ask where we left off on Vibez Protocol. And it opens with goal, done, next and blockers, naming
the checkpoint that was written minutes ago inside another company's product.

## Segment 7 — 2:45 to 3:15

But resuming could just be luck. So I ask it how it chose.

It says retrieval here is semantic, not chronological, and that recency is invisible to similarity
ranking. So it recalled the entire set with a limit of one hundred, checked the returned count
against that limit to be certain nothing had been truncated, parsed the timestamp out of every
record, and sorted them itself.

That is the bug I found in the original prompt, and the fix for it, described back to me by a model
that has never seen my conversation.

## Segment 8 — 3:15 to 3:30

Markov v2. The prompt, the setup guide, and the harness that measured the original failure are all
in the repository.

---

## Notes for CapCut

- Pick a calm, mid-paced voice. This is an explanation, not an advertisement.
- Insert a real pause between segments rather than relying on the TTS engine's sentence gaps —
  the footage needs room to breathe, especially over the Walruscan shot.
- Segment 7 is the payoff. If one part gets subtitles burned in, make it that one, quoting the
  agent's own words on screen while the voice reads them.
- Do not read blob IDs or URLs aloud. Show them.
- Keep the terminal output legible at whatever size the video ends up. If the text is unreadable the
  narration is doing all the work, and the whole point is that the tools said this, not me.

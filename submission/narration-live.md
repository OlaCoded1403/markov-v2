# Live narration guide — talking over the demo footage

For watching the recording back and explaining as it plays, rather than reading a script to picture.
Lines are short on purpose: you need room to react to what's actually on screen, and a sentence you
have to hurry through always sounds hurried.

**Name check:** this uses *Oyeyemi Olamilekan*, taken from the checkpoint your own session wrote.
Change it if you introduce yourself differently.

---

## The intro — before any footage, about 25 seconds

> Hi, I'm Oyeyemi Olamilekan — I build under Vibez Protocol.
>
> For the Walrus Memory Prompt Evolution session I took Markov, one of the base prompts, found a bug
> in it that gets worse the more you use it, measured that bug on Sui mainnet, and fixed it. This is
> Markov v2.
>
> What you're about to watch is one agent ending a session in one tool, and a completely different
> agent — different company, different model — picking it straight up in another. Nothing shared
> between them except memory on Walrus.

**Shorter, if you want to be in the demo inside ten seconds:**

> I'm Oyeyemi Olamilekan. I evolved the Markov memory prompt for this session — found a measurable
> bug in how it resumes, and fixed it. Here's the version that matters: a handoff between two
> completely different AI tools.

---

## While it plays

**On the file listing**
> This is my portfolio site — a real project, live on Render. Notice there's no memory prompt in
> here. It lives in a different repo entirely. Both tools load it by reference, so nothing about
> memory is checked into this project.

**When it reports what it knows**
> I've never opened this tool in this project during the recording. It's going out to Walrus,
> finding a registry entry, working out which project this is, and pulling back facts a session
> wrote last night.
>
> Four of them. Where it's deployed. Which port the backend needs locally. And that my production
> hostname is quietly duplicated across four different files — which is the kind of thing you
> rediscover painfully about once a quarter.

**When it says zero checkpoints**
> No state has ever been saved for this project. And watch — it doesn't just trust the empty result.
> It runs a restore to confirm the records genuinely aren't there. An empty search and a broken
> index look identical, and only one of them means your history is gone.

*If your take included the registration refusal:*
> It also refused to re-register the project, on its own. Walrus has no deduplication and nothing can
> be deleted, so writing that twice would leave a permanent twin. That's the write gate doing its job.

**During the code review**
> Now something real. Two parts of this site render the same data differently — the admin page
> escapes it, the public page doesn't. I asked what would actually break.
>
> It found five unescaped fields and worked out which ones are exploitable. I decided to leave it,
> because I'm the only person who writes that data — and I set the condition that would change my
> mind. That decision is the thing I want to survive to the next session.

**On handoff**
> One word: handoff. It writes what it learned to Walrus, then a checkpoint — goal, what was done,
> what's next, and the decision with the reasoning attached.
>
> Those are blob IDs coming back. Receipts.
>
> And look at the last line. Supersedes: none. This is the first checkpoint this project has ever
> had — which matters, because it means what the next tool picks up can't be anything except this.

**On Walruscan**
> That's the blob on the Walrus explorer. Sui mainnet. Encrypted, permanent, and anyone can open it
> without my credentials. This isn't a database on my laptop.

**Switching to Antigravity**
> Now a completely different tool. Antigravity — Google's command line agent. Different vendor,
> different model, no access to the conversation I just closed.
>
> I ask where we left off. And it opens with goal, done, next and blockers, naming a checkpoint that
> was written minutes ago inside another company's product.

**The question — slow down here**
> But resuming could just be luck. So I asked it how it chose.
>
> *(let the answer sit on screen for a beat)*
>
> It says retrieval here is semantic, not chronological — recency is invisible to similarity
> ranking. So it recalled the whole set at a limit of a hundred, checked the count to be sure nothing
> was truncated, parsed the timestamp out of every record, and sorted them itself.
>
> That's the bug I found in the original prompt, and the fix for it, explained back to me by a model
> that has never seen my conversation.

---

## The outro — 20 seconds

> That's Markov v2.
>
> The original recalled three checkpoints and took the newest date. I measured it on mainnet across
> a hundred and twenty blobs — at sixty checkpoints, the newest one ranked fiftieth. It reads three.
> It missed at every size I tested.
>
> The prompt, the setup guide, and the harness that produced those numbers are all in the repo, so
> you can reproduce it — or prove me wrong.

---

## Delivery notes

- **The pauses are the point.** After "supersedes: none" and after the answer in the last shot, stop
  talking and let the screen carry it. Silence over a strong frame reads as confidence.
- **React to what's happening** rather than announcing it. "Watch" and "look at the last line" are
  worth more than describing what the viewer can already see.
- **Say the numbers slowly.** Fiftieth of sixty is the whole argument; don't let it slide past.
- If you fluff a line, keep going and fix it in the edit. Restarting mid-sentence is what makes a
  recording sound like a recording.
- Don't oversell at the end. "Reproduce it, or prove me wrong" is a stronger close than any
  superlative, and it's the honest position — the harness is right there.

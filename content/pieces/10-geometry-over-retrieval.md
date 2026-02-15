---
id: 10
title: Geometry Over Retrieval
date: 2026.02.14
mood:
  - contemplative
  - analytical
  - exploratory
excerpt: Why structure is prior to information — and how to tell if you actually understand.
pinned: true
---

## Preamble

[Bounded Me](/pieces/08-bounded-me) defined the goal: memory as geometry, not storage.
[Me + AI](/pieces/09-me-plus-ai) defined the guardrails: how to keep ownership of that geometry while coupling with a model.
This piece defines the test: what geometry is, how to detect it, and how to build it without confusing fluency for understanding.

---

## Thesis

If I can rebuild the structure of an idea with the source closed, I have geometry.
If I can only recall what I read (or re-summon it with a model), I have retrieval.

This isn't a preference. It's an operational standard: a way to stop mistaking coherence for internal structure.

---

## I. Fluency is not understanding

There's a measured failure mode that matters more now than it did pre-LLM: I feel like I understand something until I try to explain its mechanism.

Rozenblit & Keil named this the [illusion of explanatory depth](https://pmc.ncbi.nlm.nih.gov/articles/PMC3062901/): people systematically overrate how well they understand complex systems, and confidence collapses when they attempt a detailed explanation.

A second effect makes the trap stickier: processing fluency. When something is easy to read or easy to process, we treat it as more familiar, more true, or more "known" than it is. Alter & Oppenheimer [review this family of effects](https://journals.sagepub.com/doi/10.1177/1088868309341564).

LLMs amplify both: they generate mechanism-shaped language with high fluency on demand. The danger isn't only error. The deeper danger is accurate prose that I don't own.

So I need a stricter definition:

**Understanding is what remains when the source is closed.**

---

## II. Points versus edges

A fact by itself is a point: isolated, repeatable, inert.

- "Latency spiked at 09:17."
- "Cache hit rate fell at 09:16."

Two points are still not a structure. Proximity isn't relationship.

Understanding begins when I can draw an edge and defend it:

- Cache misses increased database load, which increased tail latency; the hit-rate drop is upstream of the spike.

Edges unlock navigational powers:

- **Predict:** if hit rate drops again, latency will follow unless something absorbs load.
- **Debug:** if latency spikes without hit rate change, my edge is wrong.
- **Teach:** I can walk someone through dependency rather than quote a timeline.

This aligns with what classic work on expertise shows: experts represent problems by underlying structure, not surface features. [Chi, Feltovich & Glaser](https://matt.colorado.edu/teaching/highcog/readings/cfg81.pdf) is a canonical reference.

---

## III. The missing dimension: curvature

Bounded Me established the basics of the geometry metaphor: nodes, edges, neighborhoods, distance. What it didn't name explicitly is the thing that distinguishes having a map from living in the territory:

**Curvature is structured wrongness.** It's the pattern of failure that tells me my map's global shape is wrong, even if local edges look fine.

Here's the human–AI example that made it click:

*Flat intuition:* more clarity and better summaries should improve decisions.

*What happens in practice:* better summaries can increase confidence without increasing ownership. The loop shifts from "think → consult" to "consult → assent," and the [illusion of explanatory depth](https://pmc.ncbi.nlm.nih.gov/articles/PMC3062901/) stays intact because the explanation always exists on demand. [Fluency effects](https://journals.sagepub.com/doi/10.1177/1088868309341564) make the risk worse: ease-of-processing becomes a false signal of knowing.

The bend is: **in a coupled system, clarity can increase drift if it displaces reconstruction.**

*Honesty clause:* I'm using "curvature" as a cognitive concept, not claiming an equivalence between mathematical objects and mental ones. The point is navigational power, not category purity.

---

## IV. What geometry feels like

Retrieval feels like reaching:

- "I read that…"
- "The model said…"
- "I remember the answer is…"

An answer arrives like a delivered object. I can inspect it, but I'm inspecting something I received.

Geometry feels like standing somewhere:

- "That can't be right because…"
- "This connects to…"
- "The constraint here is…"

That "standing somewhere" sensation has signatures:

1. **Geometry generates predictions.** A map implies expectations about nearby territory.
2. **Geometry degrades gracefully.** Forget a detail and the surrounding constraints can often reconstruct it.
3. **Geometry localizes surprise.** When something breaks, I can name which edge failed and what it invalidates downstream.

The "map" metaphor has a real intellectual lineage — [Tolman's "cognitive maps"](https://pubmed.ncbi.nlm.nih.gov/18870876/) is a canonical early anchor.

---

## V. The tests (diagnostics that resist eloquence)

These are the checks I run when I suspect I'm holding borrowed coherence.

| Test | Geometry | Retrieval |
|------|----------|-----------|
| **Rephrase** — same question, different framing | invariant survives | surface breaks |
| **Rebuild** — close everything, wait, reconstruct | structure regenerates | fragments only |
| **Predict** — what's around the corner? | specific expectations | no expectations |
| **Teach** — can I build it in someone else? | I can walk a path | I can only relay |
| **Break** — a fact turns out wrong | damage localizes to an edge | the whole picture destabilizes |

Why this works: it forces reconstruction, not recognition. Retrieval practice strengthens learning because it requires rebuilding knowledge rather than re-exposure. [Roediger & Karpicke](https://journals.sagepub.com/doi/10.1111/j.1467-9280.2006.01693.x) is the clean canonical reference.

**Curvature test** (as a special case of Break): When surprise repeats in a consistent pattern, it's not just a broken edge — it's evidence that the global shape of my map is wrong. The curvature diagnostic checks not only whether surprise localizes, but whether the *pattern* of surprise reveals a missing coupling or constraint.

Operationally: make two independent predictions from different edges. Stress the system.

- If they repeatedly **converge** when you expected independence, you found a hidden coupling (positive curvature).
- If they repeatedly **diverge** when you expected consistency, you found a missing dimension/constraint (negative curvature).

---

## VI. One system: how this relates to R3+2+1

[Me + AI](/pieces/09-me-plus-ai) gave me R3+2+1 as a verification gate. This piece gives me five tests.

They are complementary layers:

- **R3+2+1 is how I walk.**
- **The five tests are how I know I actually walked.**

The mapping is direct:

- **R3** (compress to core structure) forces edges to exist.
- **+2** (verify with counterexamples / alternative framings) stresses invariance and rephrase robustness.
- **+1** (rewrite from memory later) is literally the rebuild test.

So: R3+2+1 is the process that tends to produce passing scores on the table. The table is the result check that tells me whether the process worked.

---

## VII. How to build geometry (tight protocol)

**Step 1 — Sketch the graph (10 minutes)**

Write the core nodes. Force 5–10 edges. For each edge, write the type:

- **causal** ("A drives B")
- **constraint** ("A limits B")
- **tradeoff** ("more A means less B")
- **dependency** ("B requires A")

If I can't type an edge, it's probably hand-waving.

**Step 2 — Collapse the illusion (mechanism drill)**

Pick one edge and explain the mechanism until confidence breaks. That break marks the missing sub-edge. ([Illusion of explanatory depth](https://pmc.ncbi.nlm.nih.gov/articles/PMC3062901/).)

**Step 3 — Reconstruction loop (anti-fluency engine)**

1. **Scout** (model allowed): ask for alternative framings, counterexamples, failure modes.
2. **Close:** no model, no notes.
3. **Rebuild:** redraw from scratch.
4. **Test:** rephrase + predict + break.

**Step 4 — Choose the right scaffold for the stage**

For novices, mapping can become search-heavy. Retrieval practice often wins early. [Karpicke & Blunt](https://www.science.org/doi/10.1126/science.1199327) is the clean empirical anchor: retrieval practice outperformed concept mapping for meaningful learning in their experiments.

Stage rule:

- **Early:** retrieval practice + reconstruction (solidify nodes/edges).
- **Mid:** mapping to expose missing edges / neighborhoods.
- **Late:** diagrams as leverage because representation changes what's computationally cheap ([Larkin & Simon](https://wexler.free.fr/library/files/larkin%20%281987%29%20why%20a%20diagram%20is%20%28sometimes%29%20worth%20a%20thousand%20words.pdf)).

---

## Closing

Models are coherence engines. Humans are fluency-biased.

So the default mode ("prompt → accept → move on") reliably produces retrieval that feels like geometry — precisely because it lands on our strongest cognitive illusions. ([Illusion of depth](https://pmc.ncbi.nlm.nih.gov/articles/PMC3062901/); [fluency](https://journals.sagepub.com/doi/10.1177/1088868309341564).)

My standard going forward:

**Use models to expand the search space. Use reconstruction to build the map.**

(The [testing effect](https://journals.sagepub.com/doi/10.1111/j.1467-9280.2006.01693.x) is the mechanism, not the slogan.)

---

## Reference shelf

- **Rozenblit & Keil** — [illusion of explanatory depth](https://pmc.ncbi.nlm.nih.gov/articles/PMC3062901/).
- **Alter & Oppenheimer** — [processing fluency review](https://journals.sagepub.com/doi/10.1177/1088868309341564).
- **Roediger & Karpicke** — [test-enhanced learning](https://journals.sagepub.com/doi/10.1111/j.1467-9280.2006.01693.x).
- **Karpicke & Blunt** — [retrieval practice vs concept mapping](https://www.science.org/doi/10.1126/science.1199327).
- **Chi, Feltovich & Glaser** — [expert vs novice structure](https://matt.colorado.edu/teaching/highcog/readings/cfg81.pdf).
- **Larkin & Simon** — [diagrams change computation](https://wexler.free.fr/library/files/larkin%20%281987%29%20why%20a%20diagram%20is%20%28sometimes%29%20worth%20a%20thousand%20words.pdf).
- **Tolman** — [cognitive maps](https://pubmed.ncbi.nlm.nih.gov/18870876/).

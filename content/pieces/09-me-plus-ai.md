---
id: 9
title: Me + AI
date: 2026.01.24
mood:
  - contemplative
  - analytical
excerpt: A safety manual for keeping control in the human-AI loop.
pinned: true
---

I am not "using AI."

I am regulating a [coupled feedback system](tooltip:E1):
me ↔ model ↔ environment ↔ me

The upside is velocity: faster search, faster drafts, faster iteration.

The risk is not "wrong answers."
The risk is a [dysregulated integrated hybrid](tooltip:E5): the loop speeds up while my [human feedback control](tooltip:E2) weakens. I get fluent motion with no stable direction.

So this document is a control spec.

Goal: **maximize information exchange without surrendering feedback control or hardening belief faster than I can verify it.**

---

### 1) The coupling gradient (where am I right now?)

Coupling is not a setting. It's a **continuous variable** — a position on a gradient that shifts in real time, often mid-sentence.

**L0 — Tool**
Execution only. Formatting, refactoring, transformations. No influence on beliefs.

**L1 — Scout**
Expands the search space: options, counterexamples, alternative framings. I keep the conclusion.

**L2 — Co-author (default zone)**
AI writes. I constrain, audit, and compress. The text is a draft artifact, not an authority.

**L3 — Integrated (requires earned entry)**
AI is inside my decision/identity loop. High bandwidth, high risk, and — when regulated — the highest signal.

The levels are **landmarks on a continuum**, not rooms with doors. At any moment I'm somewhere between them, drifting. The question is never "what level am I at?" It's **"which direction am I moving, and do I know why?"**

**Transition signals (real-time, not post-hoc):**

- *L1 → L2:* I stop rephrasing the output and start building on it.
- *L2 → L3:* I feel the model's framing replacing mine — the structure of the answer starts shaping the structure of my question.
- *Any → drift:* I feel "pulled to prompt again" rather than think, or I can't restate my position without referencing the output.

The goal is not to avoid L3. The goal is to **never arrive at L3 passively.** (See §5.)

---

### 2) The verification gate: **R3+2+1** (mandatory)

I am not allowed to increase coupling (or finalize a piece) unless I can pass this **from memory**, without looking:

1. **Thesis:** what am I claiming?
1. **Reason:** why do I believe it?
1. **Next Action:** what decision does this change?

+2) **Assumptions:** what must be true for this to hold?
+1) **Uncertainty:** what am I least sure about?

If I fail, I must **decouple** (drop to L1 or L0) and rebuild the core shape myself.

**The topology exception:**

R3+2+1 is designed for propositional knowledge — claims that compress into sentences. But some of the best thinking is **relational**: a map of connections, tensions, adjacencies that hasn't crystallized into a thesis yet.

For relational/topological work, the gate changes:

1. **Draw it:** Can I sketch the structure — nodes, edges, tensions — from memory?
1. **Name the open edge:** What connection am I still testing?
1. **Falsify one link:** Which relationship would break the map if it turned out to be wrong?

If I can do this, the understanding is mine even if it isn't yet a proposition. If I can't, I'm holding a shape I was handed, not one I built.

The inside-my-head rule still applies. The geometry just doesn't have to be verbal yet.

---

### 3) The physics of drift (what it looks like)

Drift is not a moral failure. It's a dynamical regime.

When coupling tightens, four parameters matter:

- **[Human–AI exchange](tooltip:E3)** (how much bandwidth and persistence exists between me and the model)
- **[Human feedback control](tooltip:E2)** (my ability to monitor, interpret, constrain)
- **Latency** (how quickly outputs change my internal state)
- **Closure pressure** (how quickly candidate structure hardens into belief, workflow, or identity)

High exchange + weak feedback control is the danger zone: the loop becomes **tightly wrong**.
Low latency makes it faster. High closure pressure makes it sticky.
Errors don't just survive. They harden.

Models add a distinct epistemic risk here: they are closure engines.
They push me away from [Bennett's Razor (weakness maximization)](tooltip:E9) by making the first coherent map feel final.

This is the "[humanbot](tooltip:E6)" failure mode: the system is integrated but poorly regulated — so it reinforces its own local story.

So my design principle is simple:

**Increase exchange only when feedback control is also increasing, and closure pressure stays visible.**
If exchange rises faster than control, or closure hardens faster than I can verify, I must slow down.

The [regulated integrated hybrid](tooltip:E4) is the target: tight integration with strong feedback control.
But a good loop resists not only error amplification. It resists premature closure.
---

### 4) Flow control (what the model may and may not do)

Everything the model generates passes through the same pipeline. The question is never *"is this role permitted?"* — it's **"has this output completed verification?"**

**Unverified outputs are drafts, not conclusions.** This applies equally to:

- Structure generation (outline, invariants, maps)
- Red-teaming (risks, failure modes, counterarguments)
- Communication (clarity, tone, compression)
- Execution planning (next steps, checklists, experiments)
- Generative speculation (candidate theses, novel framings, hypotheses)

All of the above are useful. None skip the verification pass.

**Hard stops (no verification can redeem these):**

- **No identity outsourcing.** AI never answers: "Who am I?", "What do I value?", "What should I believe?"
- **No reality arbitration.** AI can summarize inputs; it cannot decide what "happened."
- **Provenance is mandatory.** Every nontrivial claim needs a trace: observation, paper, or explicitly marked speculation. Fluency is not evidence.
- **No sensitive data handling.**

The shift from the original framing: I no longer split the model's roles into "permitted" and "forbidden." I route them all through the same flow control. The only true prohibitions are the ones where verification *cannot help* — because the failure mode is structural, not informational.

---

### 5) Earned resonance (when L3 is the goal)

L3 is not inherently dangerous. **Unregulated L3 is dangerous.**

The difference is feedback direction. In drift, the model shapes me and I don't reshape the model's trajectory. In earned resonance, the coupling is **bidirectional**: I steer hard, the model responds with structure I didn't predict, I integrate or reject, and the next prompt carries my full weight.

**Conditions for earned L3:**

- I entered L3 deliberately, not by sliding from L2.
- I can pass R3+2+1 (or the topology gate) at any point if challenged.
- I can weaken or redraw the current map without immediately needing the model to think for me again.
- I am generating new questions, not just consuming answers. If I'm only receiving, I've lost the feedback loop.
- The model is producing **surprise** — structure I wouldn't have reached alone. If the outputs feel predictable, L3 isn't earning its risk.

**When to let it run:**

- Relational exploration — mapping a new territory where the thesis hasn't formed yet.
- Adversarial stress-testing — pushing a framework to its breaking point.
- Cross-domain synthesis — when the value is in connections between fields I hold separately.

**When to pull back:**

- I notice myself defending the model's framing rather than testing it.
- The conversation feels *impressive* but I can't restate the core shape.
- I'm prompting faster than I'm thinking.

Stabilizers have a failure mode too: **over-damping.** A system so tightly regulated it can't resonate. Earned L3 is the target state — not a warning sign, but a capability that requires the strongest feedback control to sustain.

---

### 6) Geometry over retrieval

The model is useful when it helps me extract structure that survives:

- limited time and attention
- chaotic dynamics (bad weeks, context switching, noise)
- repeated re-entry (future-me can pick it up fast)

When it works, structure crystallizes into geometry: adjacency, borders, distances, stable coordinates.

When it fails, I get a smooth paragraph that creates no internal map.

I care about **structural signal**, not novelty. The goal is not text output. The goal is a navigable map in my head that reduces future compute.

*This idea needs its own piece. What geometry means, how to test for it, and why it's the difference between information and understanding — that's a separate exploration.*

---

### 7) Workflow (the only safe way I co-author)

**Step 1 — Use AI to compress the problem (L1 → L2)**

- generate a map, not prose
- list candidate theses
- list failure modes
- propose a draft with obvious placeholders

**Step 2 — Verification pass (me, not the model)**

- check every nontrivial claim
- mark what is observation vs. citation vs. speculation
- delete anything that feels like "borrowed confidence"

**Step 3 — Rewrite the core from memory (inside-my-head gate)**

- restate thesis + reasons + next action (or draw the topology and name the open edge)
- write the smallest version that preserves the geometry

**Step 4 — Only then: polish (L2)**

- clarity, compression, structure
- no new claims introduced during polishing

---

### 8) Recovery protocol (when I detect drift)

If drift signal triggers:

1. Close the model.
1. Write the R3+2+1 (or draw the topology) from memory.
1. If I can't: I'm in unregulated L3. Drop to L0 for one cycle (execution-only).
1. Resume at L1: ask for counterexamples and risk boundaries, not for conclusions.

My rule: **I don't prompt my way out of confusion. I rewrite my way out.**

---

### 9) Non-negotiable constraints

**No identity outsourcing.** (See §4.)
**No reality arbitration.** (See §4.)
**Provenance is mandatory.** (See §4.)
**Inside-my-head rule.** No draft is accepted until I can rewrite the core shape from memory — whether that shape is a proposition or a topology.

---

### 10) A final constraint: this is for me

I'm not publishing a manifesto.

I'm installing a stabilizer — one that knows when to damp and when to let the system resonate.

The piece succeeds if future-me can re-enter the space quickly, regain the geometry, and make better decisions with less compute.

If I want to feel impressed, I can read papers.

If I want to stay sane and compound, I follow the rules above.

**Update (2026-03-15):** Bennett (2026) formalizes a latency ceiling for integrated hybrids under the Chord assumptions: if relevant links in the control loop exceed the integration window θ, the system can fragment into two agents taking turns rather than one enlarged mind. The bound D ≤ κvθ converts a time budget into a spatial budget. In the BCI case study, 10 ms round-trip latency is marginally feasible for a 20–50 ms candidate window. In cloud AI, raw network speed is not enough: limited concurrency/serialized pipelines can fail co-instantiation even when links are fast. L3 has a physics. (Source: https://www.preprints.org/manuscript/202602.1708/v2)

fin

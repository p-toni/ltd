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

I am not “using AI.”

I am regulating a [coupled feedback system](tooltip:E1):

Update (2026-02-08): Recent research emphasizes the critical role of understanding the interaction between AI systems and human decision-making. It highlights that maintaining control in these human-AI loops is essential for effective outcomes. As AI systems become more integrated into decision-making processes, the need for clear feedback mechanisms and awareness of the potential for dysregulation grows. This underscores the importance of the control metrics outlined in this document, ensuring that human agency remains central in the face of rapidly evolving AI capabilities. (Source: https://www.eecs.mit.edu/research/artificial-intelligence-decision-making/)

Update (2026-02-08): The full realization of the potential of human–AI collaboration continues to face several challenges. These challenges include ensuring effective decision-making and maintaining control within the human-AI loop. Understanding these obstacles can enhance the strategies outlined in this document for regulating AI interactions, emphasizing the need for robust frameworks that support human oversight and feedback. By addressing these issues, we can better navigate the complexities of AI-assisted decision-making and maximize the benefits while mitigating risks. (Source: https://pmc.ncbi.nlm.nih.gov/articles/PMC11373149/)

me ↔ model ↔ environment ↔ me

The upside is velocity: faster search, faster drafts, faster iteration.

The risk is not “wrong answers.”
The risk is a [dysregulated integrated hybrid](tooltip:E5): the loop speeds up while my [human feedback control](tooltip:E2) weakens.

Update (2026-02-08): Understanding feedback mechanisms is crucial for regulating the human-AI loop effectively. A feedback mechanism is a loop system wherein the system responds to a perturbation, allowing for adjustments based on the output. This concept is vital in maintaining control over the interaction between human and AI, ensuring that the feedback loop remains balanced and effective. By recognizing how feedback mechanisms operate, one can better navigate the complexities of AI integration and avoid potential pitfalls associated with dysregulated systems. (Source: https://www.biologyonline.com/dictionary/feedback-mechanism)

 I get fluent motion with no stable direction.

So this document is a control spec.

Goal: **maximize information exchange without surrendering feedback control.**

---

### 1) The coupling scale (what mode am I in?)

**L0 — Tool**
Execution only. Formatting, refactoring, transformations. No influence on beliefs.

**L1 — Scout**
Expands the search space: options, counterexamples, alternative framings. I keep the conclusion.

**L2 — Co-author (default zone)**
AI writes. I constrain, audit, and compress. The text is a draft artifact, not an authority.

**L3 — Integrated (high alert)**
AI is inside my decision/identity loop. It changes what I feel is true before I can restate why.

**Drift signal (hard stop):**
If I feel “pulled to prompt again” rather than think, or if I can’t tell which thoughts are mine vs. the output, I have lost control.

---

### 2) The control metric: **R3+2+1** (mandatory)

I am not allowed to increase coupling (or finalize a piece) unless I can pass this **from memory**, without looking:

1. **Thesis:** what am I claiming?
2. **Reason:** why do I believe it?
3. **Next Action:** what decision does this change?

+2) **Assumptions:** what must be true for this to hold?
+1) **Uncertainty:** what am I least sure about?

If I fail, I must **decouple** (drop to L1 or L0) and rebuild the core shape myself.

---

### 3) Non-negotiable hard rules

**No identity outsourcing**
AI never answers: “Who am I?”, “What do I value?”, “What should I believe?”

**No reality arbitration**
AI can summarize inputs; it cannot decide what “happened.”

**Provenance is mandatory**
Every nontrivial claim needs a trace: observation, paper, or explicitly marked speculation.
Fluency is not evidence.

**Geometry over retrieval**
The goal is not text output.
The goal is a navigable map in my head that reduces future compute.

**Inside-my-head rule**
No draft is accepted until I can rewrite the core shape from memory.

---

### 4) Roles I permit (and roles I forbid)

**Permitted roles**

* Structure generation (outline, invariants, maps)
* Red-teaming (finding risks, failure modes, counterarguments)
* Communication (clarity, tone, compression)
* Execution planning (next steps, checklists, experiments)

**Forbidden roles**

* Unverified fact generation
* Policy guessing (“what would they do?”) as a substitute for evidence
* Handling sensitive data
* Making decisions without a second loop (a verification pass + my rewrite)

---

### 5) The physics of drift (what it looks like)

Drift is not a moral failure. It’s a dynamical regime.

When coupling tightens, three parameters matter:

* **[Human–AI exchange](tooltip:E3)** (how much bandwidth and persistence exists between me and the model)
* **[Human feedback control](tooltip:E2)** (my ability to monitor, interpret, constrain)
* **Latency** (how quickly outputs change my internal state)

High exchange + weak feedback control is the danger zone: the loop becomes **tightly wrong**.
Errors don’t get corrected. They get amplified.

This is the “[humanbot](tooltip:E6)” failure mode: the system is integrated but poorly regulated—so it reinforces its own local story.

So my design principle is simple:

**Increase exchange only when feedback control is also increasing.**
If exchange rises faster than control, I must slow down.

The [regulated integrated hybrid](tooltip:E4) is the target: tight integration with strong feedback control.

---

### 6) Information: what I’m trying to extract

I care about **structural signal**, not novelty.

The model is useful when it helps me extract structure that survives:

* limited time and attention
* chaotic dynamics (bad weeks, context switching, noise)
* repeated re-entry (future-me can pick it up fast)

When it works, structure crystallizes into geometry: adjacency, borders, distances, stable coordinates.

When it fails, I get a smooth paragraph that creates no internal map.

---

### 7) Workflow (the only safe way I co-author)

**Step 1 — Use AI to compress the problem (L1 → L2)**

* generate a map, not prose
* list candidate theses
* list failure modes
* propose a draft with obvious placeholders

**Step 2 — Verification pass (me, not the model)**

* check every nontrivial claim
* mark what is observation vs. citation vs. speculation
* delete anything that feels like “borrowed confidence”

**Step 3 — Rewrite the core from memory (inside-my-head gate)**

* restate thesis + reasons + next action
* write the smallest version that preserves the geometry

**Step 4 — Only then: polish (L2)**

* clarity, compression, structure
* no new claims introduced during polishing

---

### 8) Recovery protocol (when I detect drift)

If drift signal triggers:

1. Close the model.
2. Write the R3+2+1 from memory.
3. If I can’t: I’m in L3. I must drop to L0 for one cycle (execution-only).
4. Resume at L1: ask for counterexamples and risk boundaries, not for conclusions.

My rule: **I don’t prompt my way out of confusion. I rewrite my way out.**

---

### 9) A final constraint: this is for me

I’m not publishing a manifesto.

I’m installing a stabilizer.

The piece succeeds if future-me can re-enter the space quickly, regain the geometry, and make better decisions with less compute.

If I want to feel impressed, I can read papers.

If I want to stay sane and compound, I follow the rules above.

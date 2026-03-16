export type TooltipDefinition = {
  id: string
  paper: string
  title: string
  body: string
}

export type PaperSource = {
  id: string
  label: string
  url: string
}

export const PAPER_SOURCES: Record<string, PaperSource> = {
  A: {
    id: 'A',
    label: 'arXiv 2601.03220',
    url: 'https://arxiv.org/html/2601.03220v1',
  },
  B: {
    id: 'B',
    label: 'arXiv 2309.00010',
    url: 'https://arxiv.org/abs/2309.00010',
  },
  C: {
    id: 'C',
    label: 'arXiv 2510.26745',
    url: 'https://arxiv.org/html/2510.26745',
  },
  D: {
    id: 'D',
    label: 'arXiv 2402.06184',
    url: 'https://arxiv.org/html/2402.06184v1',
  },
  E: {
    id: 'E',
    label: 'arXiv 2601.12837',
    url: 'https://arxiv.org/html/2601.12837v1',
  },
  F: {
    id: 'F',
    label: 'Rozenblit & Keil 2002',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3062901/',
  },
  G: {
    id: 'G',
    label: 'Alter & Oppenheimer 2009',
    url: 'https://journals.sagepub.com/doi/10.1177/1088868309341564',
  },
  H: {
    id: 'H',
    label: 'Roediger & Karpicke 2006',
    url: 'https://journals.sagepub.com/doi/10.1111/j.1467-9280.2006.01693.x',
  },
  I: {
    id: 'I',
    label: 'Karpicke & Blunt 2011',
    url: 'https://www.science.org/doi/10.1126/science.1199327',
  },
  J: {
    id: 'J',
    label: 'Chi, Feltovich & Glaser 1981',
    url: 'https://doi.org/10.1207/s15516709cog0502_2',
  },
  K: {
    id: 'K',
    label: 'Larkin & Simon 1987',
    url: 'https://doi.org/10.1111/j.1551-6708.1987.tb00863.x',
  },
  L: {
    id: 'L',
    label: 'Tolman 1948',
    url: 'https://pubmed.ncbi.nlm.nih.gov/18870876/',
  },
  M: {
    id: 'M',
    label: 'Bennett 2026 (preprints)',
    url: 'https://www.preprints.org/manuscript/202602.1708/v2',
  },
  N: {
    id: 'N',
    label: 'Bennett 2023 (AGI)',
    url: 'https://doi.org/10.1007/978-3-031-33469-6_5',
  },
  O: {
    id: 'O',
    label: 'Dehaene & Naccache 2001',
    url: 'https://doi.org/10.1016/S0010-0277(00)00123-2',
  },
  P: {
    id: 'P',
    label: 'Lamme 2006',
    url: 'https://doi.org/10.1016/j.tics.2006.09.001',
  },
  Q: {
    id: 'Q',
    label: 'Melloni et al. 2007',
    url: 'https://doi.org/10.1523/JNEUROSCI.4623-06.2007',
  },
  R: {
    id: 'R',
    label: 'Massimini et al. 2005',
    url: 'https://doi.org/10.1126/science.1117256',
  },
  S: {
    id: 'S',
    label: 'Casali et al. 2013',
    url: 'https://doi.org/10.1126/scitranslmed.3006294',
  },
  T: {
    id: 'T',
    label: 'Dennett & Kinsbourne 1992',
    url: 'https://doi.org/10.1017/S0140525X00068229',
  },
}

export const TOOLTIP_DEFINITIONS: Record<string, TooltipDefinition> = {
  A1: {
    id: 'A1',
    paper: 'A',
    title: 'Epiplexity (bounded-learnable structure)',
    body: "Information as 'extractable structure' for a computationally bounded observer, distinct from randomness that stays unpredictable under the budget.",
  },
  A2: {
    id: 'A2',
    paper: 'A',
    title: 'Bounded observer lens',
    body: "The useful content of data depends on the learner's compute and time limits; the same data can differ in value depending on what can be learned under constraints.",
  },
  A3: {
    id: 'A3',
    paper: 'A',
    title: 'A practical proxy',
    body: 'Epiplexity can be estimated via training dynamics (for example, loss-curve-based coding proxies): how much structured signal the model absorbed during learning.',
  },
  A4: {
    id: 'A4',
    paper: 'A',
    title: "Computation can 'create information'",
    body: "Under bounded observers, deterministic computation can generate new learnable structure, even when classical definitions say information can't increase.",
  },
  A5: {
    id: 'A5',
    paper: 'A',
    title: 'Computationally bounded observer',
    body: 'Core move: distinguish unbounded simulation from bounded learning that exploits emergent structure.',
  },
  A6: {
    id: 'A6',
    paper: 'A',
    title: 'Epiplexity',
    body: 'Structural information extractable by computationally bounded observers, separating structure from unpredictable randomness.',
  },
  A7: {
    id: 'A7',
    paper: 'A',
    title: 'Area under the loss curve',
    body: 'Practical heuristic: model description length or absorbed information can be visualized as area under the loss curve above final loss.',
  },
  B1: {
    id: 'B1',
    paper: 'B',
    title: 'Information as flux',
    body: 'In wave scattering, Fisher information can be described locally via a density and a flux, satisfying a continuity-style relationship.',
  },
  B2: {
    id: 'B2',
    paper: 'B',
    title: 'Sources, sinks, leakage',
    body: 'The flow framing highlights where information concentrates or dissipates (sources/sinks), a useful metaphor for where my loop loses signal.',
  },
  B3: {
    id: 'B3',
    paper: 'B',
    title: 'Continuity equation',
    body: 'Information-flux metaphor made literal: define Fisher-information flux and a continuity equation with sources and sinks.',
  },
  B4: {
    id: 'B4',
    paper: 'B',
    title: 'Information flux',
    body: 'Fisher information flow as a vectorial flux field, analogous (but not identical) to energy flow.',
  },
  C1: {
    id: 'C1',
    paper: 'C',
    title: 'Geometric memorization',
    body: 'Deep sequence models can internalize a global geometry of a structure, making multi-step reasoning feel like navigation rather than repeated lookup.',
  },
  C2: {
    id: 'C2',
    paper: 'C',
    title: 'Global structure from local facts',
    body: 'In tasks like path-finding on path-star graphs, models can succeed after memorizing only local edges, suggesting embeddings reflect global topology.',
  },
  C3: {
    id: 'C3',
    paper: 'C',
    title: 'Geometric memory',
    body: 'A neat representation can materialize from memorizing incompressible atomic facts, implying geometric parametric memory of global relationships.',
  },
  D1: {
    id: 'D1',
    paper: 'D',
    title: 'Trainability boundary',
    body: 'Training behaves like iterating an update rule: some hyperparameters lead to stable convergence; nearby ones lead to divergence or failure.',
  },
  D2: {
    id: 'D2',
    paper: 'D',
    title: 'Fractal boundary intuition',
    body: 'The stable/unstable boundary can be fractal: zooming in reveals persistent intricacy, explaining why tiny changes can flip outcomes.',
  },
  D3: {
    id: 'D3',
    paper: 'D',
    title: 'Trainability boundary (fractal)',
    body: 'Boundary between stable vs divergent training is fractal, sensitive to tiny hyperparameter changes across many scales.',
  },
  E1: {
    id: 'E1',
    paper: 'E',
    title: 'Coupled feedback system',
    body: 'A framing: what matters is the stability and viability of composite systems formed through sustained human-AI coupling, not AI in isolation.',
  },
  E2: {
    id: 'E2',
    paper: 'E',
    title: 'Human feedback control',
    body: 'Axis in the morphospace: ability to monitor, interpret, and constrain the coupled system.',
  },
  E3: {
    id: 'E3',
    paper: 'E',
    title: 'Human-AI exchange',
    body: 'Axis: richness, bandwidth, and persistence of information flow across the interface.',
  },
  E4: {
    id: 'E4',
    paper: 'E',
    title: 'Regulated integrated hybrid',
    body: 'Tight integration where human feedback control remains strong; shorter loops can improve robustness.',
  },
  E5: {
    id: 'E5',
    paper: 'E',
    title: 'Dysregulated integrated hybrid',
    body: 'High coupling plus weakened human control; loops amplify errors, dependencies, and delusions.',
  },
  E6: {
    id: 'E6',
    paper: 'E',
    title: 'Humanbot',
    body: 'Example region: over-attachment plus persistent reinforcement can weaken feedback control despite high coupling.',
  },
  F1: {
    id: 'F1',
    paper: 'F',
    title: 'Illusion of explanatory depth',
    body: 'People systematically overrate how well they understand complex systems; confidence collapses when they attempt a detailed mechanistic explanation.',
  },
  F2: {
    id: 'F2',
    paper: 'F',
    title: 'Mechanism drill',
    body: 'Asking "how does this actually work?" until confidence breaks can reveal where a mechanistic sub-edge is missing in your understanding.',
  },
  G1: {
    id: 'G1',
    paper: 'G',
    title: 'Processing fluency',
    body: 'When something is easy to read or process, we treat it as more familiar, more true, or more "known" than it is. Ease becomes a false signal of understanding.',
  },
  H1: {
    id: 'H1',
    paper: 'H',
    title: 'Test-enhanced learning',
    body: 'Retrieval practice strengthens learning because it forces reconstruction of knowledge rather than re-exposure to it.',
  },
  I1: {
    id: 'I1',
    paper: 'I',
    title: 'Retrieval practice vs concept mapping',
    body: 'In the cited experiment, retrieval practice outperformed concept mapping for meaningful learning; reconstruction can beat externally supplied structure.',
  },
  J1: {
    id: 'J1',
    paper: 'J',
    title: 'Expert vs novice representations',
    body: 'Experts organize problems by underlying structure (deep features); novices organize by surface features. More knowledge isn\'t the difference — organization is.',
  },
  K1: {
    id: 'K1',
    paper: 'K',
    title: 'Diagrams change computation',
    body: 'Diagrams aren\'t just memory aids; they change what\'s computationally cheap by making spatial relationships explicit and searchable.',
  },
  L1: {
    id: 'L1',
    paper: 'L',
    title: 'Cognitive maps',
    body: 'Tolman\'s canonical argument: organisms build internal spatial representations ("cognitive maps") rather than just learning stimulus-response chains.',
  },
  E7: {
    id: 'E7',
    paper: 'E',
    title: 'Voids in the cognition morphospace',
    body: 'Large regions of possible cognitive organization that nothing has evolved or been engineered to fill — not because they are impossible, but because evolution is path-dependent and engineering is path-dependent. Voids reflect evolutionary contingencies, physical constraints, and design limitations.',
  },
  E8: {
    id: 'E8',
    paper: 'E',
    title: 'Solid vs liquid brains',
    body: 'Solid brains: persistent wiring, high bandwidth, small fixed diameter (vertebrate brains). Liquid brains: mobile agents, lower bandwidth, self-repairing topologies (slime molds, ant colonies, immune systems). Human-AI hybrids are neither: a solid brain coupled to a system with no fixed wiring and no spatial continuity.',
  },
  E9: {
    id: 'E9',
    paper: 'N',
    title: "Bennett's Razor (weakness maximization)",
    body: "Counter to Occam's Razor: the optimal hypothesis is the weakest — least committed — that still generalizes, not the shortest. Compression is neither necessary nor sufficient for generalization. Prefer the least-committed map that still navigates over the tightest one you can construct.",
  },
  E10: {
    id: 'E10',
    paper: 'E',
    title: 'Hybrid niche',
    body: 'Human-AI cognition is not just a dyad of two agents; it stabilizes inside a designed niche of interfaces, memory surfaces, objectives, and feedback channels that shape what kinds of coupling are possible.',
  },
  M1: {
    id: 'M1',
    paper: 'M',
    title: 'Spacetime consciousness bound',
    body: 'Under the Chord assumptions (co-instantiation plus within-window exchange), a unified conscious moment satisfies D ≤ κvθ: diameter D is bounded by signal-propagation ceiling v, integration window θ, and exchange architecture κ. For cloud-hosted AI, low network latency alone is insufficient: limited concurrency or serialized updates can fail co-instantiation.',
  },
  M2: {
    id: 'M2',
    paper: 'M',
    title: 'Chord postulate (co-instantiation)',
    body: 'A unified mind requires co-instantiation: all contributing components must be simultaneously active — not serialized — with exchange completing within the integration window θ. Two agents taking turns do not form one mind, even if the turns are fast.',
  },
  M3: {
    id: 'M3',
    paper: 'M',
    title: 'Integration window θ',
    body: 'The time budget within which signals must converge for a candidate unified conscious moment. In the paper\'s BCI case study, a 20–50 ms range is used to evaluate feasibility. For a human-AI hybrid, links that exceed the chosen θ can force turn-taking dynamics rather than a unified moment.',
  },
  O1: {
    id: 'O1',
    paper: 'O',
    title: 'Global workspace framing',
    body: 'Conscious access is associated with wide availability/broadcast across specialized processors, not isolated local activation.',
  },
  P1: {
    id: 'P1',
    paper: 'P',
    title: 'Recurrent processing requirement',
    body: 'Feedforward activation alone is not sufficient; recurrent exchange is central in accounts of conscious perception.',
  },
  Q1: {
    id: 'Q1',
    paper: 'Q',
    title: 'Synchrony and conscious perception',
    body: 'Long-range synchronization episodes correlate with conscious perception more than local activity alone.',
  },
  R1: {
    id: 'R1',
    paper: 'R',
    title: 'Connectivity breakdown in sleep',
    body: 'During non-REM sleep, cortical responses can remain local while large-scale effective connectivity collapses.',
  },
  S1: {
    id: 'S1',
    paper: 'S',
    title: 'Perturbational complexity index',
    body: 'PCI tracks consciousness level across conditions and is designed to be less dependent on report or task behavior.',
  },
  T1: {
    id: 'T1',
    paper: 'T',
    title: 'Time and the observer',
    body: 'Classic analysis of how temporal structure and observer framing constrain claims about conscious moments.',
  },
  SYN1: {
    id: 'SYN1',
    paper: 'A+C+D+B',
    title: 'Synthesis (A+C+D+B)',
    body: 'Not a quote. A: extractable structure for bounded learners (epiplexity). C: learned global geometry (geometric memory). D: sensitive/fractal trainability boundary (stability under dynamics). B: information density/flux with a continuity equation (flow).',
  },
  SYN1A: {
    id: 'SYN1A',
    paper: 'A',
    title: 'A — Epiplexity',
    body: 'Structural information defined relative to computationally or time-bounded observers.',
  },
  SYN1C: {
    id: 'SYN1C',
    paper: 'C',
    title: 'C — Geometric memorization',
    body: 'Evidence that models form global geometric structure enabling reasoning-like navigation.',
  },
  SYN1D: {
    id: 'SYN1D',
    paper: 'D',
    title: 'D — Fractal trainability boundary',
    body: "Training stability can be extremely sensitive; this clause compresses 'stays in the convergent basin.'",
  },
  SYN1B: {
    id: 'SYN1B',
    paper: 'B',
    title: 'B — Fisher information flow',
    body: 'Information can be represented as local density plus flux with a continuity equation and sources/sinks.',
  },
}

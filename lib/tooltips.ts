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

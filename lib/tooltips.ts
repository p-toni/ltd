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

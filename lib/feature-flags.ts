export const ENABLE_MOBILE_LAYOUT = process.env.NEXT_PUBLIC_ENABLE_MOBILE_LAYOUT === 'true'

// Bounded Learning System Feature Flags
export const FEATURE_FLAGS = {
  // Phase 1: Geometric Navigation & Loop Tracking
  ENABLE_CONCEPT_GRAPH: true,
  ENABLE_LOOP_TRACKING: true,
  ENABLE_FLOW_VISUALIZATION: true,
  ENABLE_HYPERPARAM_DASHBOARD: true,

  // Phase 2: Bounded Extraction Features
  ENABLE_BOUNDED_READER: true, // Fragment-by-fragment mode
  ENABLE_EXTRACTION_TIMER: true, // Session timer
  ENABLE_COGNITIVE_LOAD: true, // Paragraph complexity indicators
  ENABLE_TRAINABILITY_WARNING: true, // Fractal edge detection
  ENABLE_EXTRACTION_METRICS: true, // Right sidebar panel

  // Phase 3: Advanced Metrics & Theoretical Features
  ENABLE_EPIPLEXITY_ESTIMATION: true, // Prequential coding proxy
  ENABLE_PIECE_MAP: true, // Grid overview
  ENABLE_COMPOUNDING_INDICATORS: true, // Citation/re-entry tracking
  ENABLE_REENTRY_FREQUENCY: true, // Mental map centers
  ENABLE_CITATION_NETWORK: true, // Citation graph visualization
  ENABLE_CONCEPT_VELOCITY: true, // Knowledge building rate

  // Future/Experimental
  ENABLE_INSTRUMENT_COMMANDS: false, // System commands (not implemented yet)
} as const

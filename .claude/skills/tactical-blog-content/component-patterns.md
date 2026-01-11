# Component Architecture & Patterns

## Component Hierarchy Overview

### Core Blog Components
```
TacticalBlog (main entry point)
├── TacticalBlogProvider (state management)
│   └── TacticalBlogDesktop (desktop layout)
├── TacticalBlogWrapper (responsive wrapper)
└── TacticalBlogMobile (mobile layout - feature flagged)
```

### State Management Pattern
The blog uses a context-based state management system:
- `TacticalBlogProvider` centralizes piece data and selection state
- Components consume state via custom hooks
- State includes current piece, navigation state, and UI preferences

## Key Component Files

### Primary Layout Components
- `components/tactical-blog.tsx` - Main entry point with feature flag logic
- `components/tactical-blog-provider.tsx` - Context provider for state management
- `components/tactical-blog-desktop.tsx` - Desktop-specific layout implementation
- `components/tactical-blog-wrapper.tsx` - Responsive wrapper component
- `components/tactical-blog-mobile.tsx` - Mobile layout (when enabled)

### Supporting Components
- `components/theme-provider.tsx` - Dark/light theme management
- `components/ui/` - Shared UI primitives based on Radix UI

## Design System Integration

### Radix UI Foundation
The project extensively uses Radix UI primitives:
- **Navigation**: `@radix-ui/react-navigation-menu`
- **Dialogs**: `@radix-ui/react-dialog` for chat interface
- **Tooltips**: `@radix-ui/react-tooltip` for enhanced UX
- **Scroll Areas**: `@radix-ui/react-scroll-area` for content scrolling
- **Tabs**: `@radix-ui/react-tabs` for content organization

### Custom Component Structure
```typescript
// Typical component pattern
interface ComponentProps {
  pieces: Piece[]           // Content data
  initialPieceId?: number   // Optional initial state
}

export function Component({ pieces, initialPieceId }: ComponentProps) {
  // Component implementation
}
```

## TypeScript Integration

### Core Types
```typescript
// From lib/pieces.ts
export interface Piece {
  id: number
  title: string
  date: string
  mood: Mood[]
  excerpt: string
  content: string
  wordCount: number
  publishedAt: number
  readTime: string
  readTimeMinutes: number
  pinned: boolean
  slug: string
}

export interface PieceFragment {
  id: string
  pieceId: number
  pieceTitle: string
  pieceSlug: string
  order: number
  text: string
  wordCount: number
}
```

### Component Type Patterns
- Always type component props interfaces
- Use strict TypeScript configuration
- Leverage type inference for state management
- Export types for reuse across components

## Responsive Design Patterns

### Feature Flag System
```typescript
import { ENABLE_MOBILE_LAYOUT } from '@/lib/feature-flags'

// Conditional rendering based on feature flags
if (!ENABLE_MOBILE_LAYOUT) {
  return <TacticalBlogDesktop />
}
return <TacticalBlogWrapper />
```

### Layout Switching Strategy
- Desktop-first approach with mobile as progressive enhancement
- Separate component trees for different breakpoints
- Shared state management across layout variants
- Feature flags for controlled rollout

## State Management Patterns

### Context Provider Pattern
```typescript
// Provider setup
const BlogContext = createContext<BlogState>()

export function TacticalBlogProvider({ children, pieces, initialPieceId }) {
  const [state, setState] = useState(initialState)

  return (
    <BlogContext.Provider value={{ state, actions }}>
      {children}
    </BlogContext.Provider>
  )
}

// Consumer hook
export function useBlogContext() {
  const context = useContext(BlogContext)
  if (!context) {
    throw new Error('useBlogContext must be used within TacticalBlogProvider')
  }
  return context
}
```

### State Structure
- Current piece selection
- Navigation state (open/closed)
- UI preferences (theme, layout)
- Chat interface state
- Loading states for async operations

## AI Chat Integration Patterns

### Chat Interface Components
- Embedded chat drawer/dialog
- Message history management
- Provider selection (Anthropic/OpenAI)
- API key management (client-side storage)
- Streaming response handling

### Fragment Display
- Reference highlighting in chat responses
- Deep linking to specific pieces
- Context preservation across conversations
- Source attribution for AI responses

## Development Best Practices

### Component Organization
```
components/
├── tactical-blog*.tsx    # Main blog components
├── theme-provider.tsx    # Theme management
├── ui/                   # Reusable UI primitives
│   ├── button.tsx
│   ├── card.tsx
│   └── ...
└── chat/                 # Chat-specific components (if separated)
```

### Naming Conventions
- Use descriptive, specific names (`TacticalBlogDesktop` vs `BlogDesktop`)
- Follow React component naming (PascalCase)
- Use consistent file naming (kebab-case for files)
- Prefix related components (`tactical-blog-*`)

### Performance Considerations
- Lazy loading for non-critical components
- Memo usage for expensive renders
- Efficient state updates to minimize re-renders
- Bundle splitting for mobile vs desktop components

## Testing Patterns

### Component Testing
```typescript
import { render, screen } from '@testing-library/react'
import { TacticalBlog } from './tactical-blog'

describe('TacticalBlog', () => {
  const mockPieces = [/* test data */]

  it('renders desktop layout when mobile is disabled', () => {
    render(<TacticalBlog pieces={mockPieces} />)
    // Test assertions
  })
})
```

### Mock Data Patterns
- Create reusable mock piece data
- Test edge cases (empty states, single pieces)
- Verify responsive behavior switches
- Test state management integration

## Styling Integration

### Tailwind CSS 4 Usage
- Design tokens for consistent spacing/colors
- Utility classes for responsive design
- Custom CSS properties for theme variables
- Component-specific styling patterns

### teenage.engineering Aesthetic
- Minimal color palette
- Focus on typography and spacing
- Subtle animations and transitions
- Functional over decorative elements

## Extension Points

### Adding New Features
1. **New Content Types**: Extend `Piece` interface and validation
2. **UI Components**: Add to `components/ui/` following Radix patterns
3. **Layout Variants**: Create new layout components following naming conventions
4. **State Extensions**: Extend context provider with new state slices

### Integration Guidelines
- Maintain type safety throughout
- Follow existing component patterns
- Preserve responsive design principles
- Keep teenage.engineering aesthetic consistency
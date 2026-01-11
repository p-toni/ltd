# Design Guidelines & Aesthetic Principles

## teenage.engineering Design Philosophy

The Tactical Blog draws inspiration from teenage.engineering's design philosophy: **maximum function, minimum form**. Every element serves a purpose, nothing is purely decorative.

### Core Principles

1. **Functional Minimalism**: Strip away unnecessary elements
2. **Intentional Hierarchy**: Clear information architecture
3. **Subtle Interactions**: Meaningful but unobtrusive feedback
4. **Consistent Typography**: Limited typeface selection for coherence
5. **Purposeful Color**: Restrained palette focused on readability

## Visual Design System

### Typography Hierarchy
```css
/* Primary text styling approach */
.font-sans              /* Default sans-serif for UI elements */
.antialiased           /* Smooth text rendering */

/* Hierarchy levels */
h1: Large, primary headings for piece titles
h2: Section headers within pieces
h3: Subsection organization
body: Readable text optimized for long-form content
small: Metadata, dates, auxiliary information
```

### Color Philosophy
- **Monochromatic Base**: Grays and blacks for primary content
- **Accent Sparingly**: Minimal color use for states and highlights
- **Theme Support**: Dark/light mode with consistent contrast
- **Accessibility First**: WCAG compliant contrast ratios

### Spacing System
Following Tailwind's spacing scale with emphasis on:
- **Generous White Space**: Let content breathe
- **Consistent Margins**: Predictable spacing patterns
- **Vertical Rhythm**: Harmonious line spacing and paragraph breaks
- **Component Padding**: Consistent internal spacing

## Component Design Patterns

### Navigation Design
- **Minimal Chrome**: Focus on content, not interface
- **Clear Hierarchy**: Recent pieces prioritized
- **Scannable Format**: Easy to quickly find relevant content
- **State Indication**: Clear active/hover/focus states

### Content Presentation
```typescript
// Typical content layout structure
<article className="prose">
  <header>
    <h1>{piece.title}</h1>
    <meta>{piece.date} • {piece.readTime} • {piece.mood.join(', ')}</meta>
  </header>
  <div className="content">
    {/* Rendered markdown content */}
  </div>
</article>
```

### Interactive Elements
- **Subtle Hover States**: Minimal but noticeable feedback
- **Focus Indicators**: Clear keyboard navigation support
- **Loading States**: Unobtrusive progress indication
- **Error States**: Helpful but non-intrusive error messaging

## Responsive Design Strategy

### Breakpoint Philosophy
- **Mobile First**: Start with constraints, enhance progressively
- **Content Priority**: Ensure readability at all sizes
- **Touch Targets**: Appropriately sized interactive elements
- **Layout Adaptation**: Components that work across devices

### Layout Patterns
```css
/* Responsive container patterns */
.container-fluid        /* Full width with padding */
.container-reading      /* Optimized reading width */
.container-nav          /* Navigation-specific constraints */
```

### Feature Flag Integration
```typescript
// Conditional layout rendering
if (!ENABLE_MOBILE_LAYOUT) {
  return <DesktopLayout />
}
return <ResponsiveLayout />
```

## Tailwind CSS 4 Integration

### Custom Design Tokens
- **Color Variables**: CSS custom properties for theme consistency
- **Spacing Scale**: Consistent spacing throughout application
- **Animation Easing**: Subtle, purposeful motion
- **Typography Scale**: Harmonious size relationships

### Utility Class Patterns
```typescript
// Common class combinations
const cardStyles = "bg-background border border-border rounded-lg p-6"
const buttonStyles = "bg-primary text-primary-foreground hover:bg-primary/90"
const textStyles = "text-foreground/80 leading-relaxed"
```

## Animation & Micro-interactions

### Motion Principles
- **Purposeful**: Animations should serve a functional purpose
- **Subtle**: Avoid distracting or excessive motion
- **Performance**: Use transform and opacity for smooth animations
- **Accessible**: Respect `prefers-reduced-motion` settings

### Common Animation Patterns
```css
/* Fade transitions for content changes */
.fade-in {
  animation: fadeIn 0.2s ease-in-out;
}

/* Subtle hover effects */
.hover-lift:hover {
  transform: translateY(-1px);
  transition: transform 0.1s ease;
}

/* Loading state animations */
.pulse {
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

## Content Layout Principles

### Reading Experience
- **Optimal Line Length**: 60-75 characters per line
- **Comfortable Spacing**: Generous line height for readability
- **Scannable Structure**: Clear headings and paragraph breaks
- **Visual Hierarchy**: Size and weight convey importance

### Markdown Styling
```css
/* Prose styling for markdown content */
.prose {
  @apply text-foreground/90 leading-relaxed;
}

.prose h2 {
  @apply text-2xl font-semibold mt-8 mb-4;
}

.prose p {
  @apply mb-4;
}

.prose code {
  @apply bg-muted px-1 py-0.5 rounded text-sm font-mono;
}
```

## UI Component Guidelines

### Radix UI Integration
- **Accessibility First**: Leverage Radix's accessibility features
- **Custom Styling**: Apply teenage.engineering aesthetic to primitives
- **Consistent Behavior**: Use Radix components for predictable interactions
- **Theme Integration**: Ensure components work with light/dark themes

### Custom Component Creation
```typescript
// Component structure template
interface ComponentProps {
  variant?: 'default' | 'minimal'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Component({
  variant = 'default',
  size = 'md',
  className,
  ...props
}: ComponentProps) {
  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  )
}
```

## Theme System

### Dark/Light Mode
- **System Preference**: Detect and respect OS theme
- **Manual Override**: Allow user preference selection
- **Consistent Contrast**: Maintain readability in both modes
- **Smooth Transitions**: Seamless theme switching

### CSS Custom Properties
```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --accent: 240 4.8% 95.9%;
}

[data-theme="dark"] {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --accent: 240 3.7% 15.9%;
}
```

## Performance Considerations

### Image Optimization
- **Next.js Image**: Use optimized image component
- **Lazy Loading**: Load images as needed
- **Responsive Images**: Serve appropriate sizes
- **Format Selection**: Modern formats with fallbacks

### Font Loading
- **System Fonts**: Prefer system font stacks
- **Font Display**: Use `font-display: swap` for custom fonts
- **Preloading**: Preload critical fonts
- **Variable Fonts**: Use variable fonts when beneficial

### CSS Optimization
- **Critical CSS**: Inline critical styles
- **Unused CSS**: Remove unused styles in production
- **CSS Minimization**: Compress CSS for production
- **Caching**: Leverage browser caching for assets

## Accessibility Standards

### WCAG Compliance
- **Color Contrast**: Meet AA standard contrast ratios
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper semantic markup
- **Focus Management**: Logical tab order and visible focus

### Semantic HTML
```html
<!-- Proper semantic structure -->
<main>
  <article>
    <header>
      <h1>Piece Title</h1>
      <p>Metadata information</p>
    </header>
    <section>
      <h2>Section Title</h2>
      <p>Content...</p>
    </section>
  </article>
</main>
```

### ARIA Integration
- **Labels**: Descriptive labels for interactive elements
- **Roles**: Appropriate ARIA roles when needed
- **States**: Dynamic state communication
- **Live Regions**: Announce dynamic content changes

## Quality Assurance

### Design Review Checklist
- [ ] Follows teenage.engineering minimalism principles
- [ ] Consistent with existing component patterns
- [ ] Maintains visual hierarchy and readability
- [ ] Works in both light and dark themes
- [ ] Responsive across target breakpoints
- [ ] Accessible to keyboard and screen reader users
- [ ] Performance optimized (images, animations, CSS)
- [ ] Uses design system tokens consistently

### Testing Approaches
- **Visual Regression**: Automated screenshot testing
- **Accessibility Audit**: Regular a11y testing
- **Performance Monitoring**: Core Web Vitals tracking
- **Cross-Browser Testing**: Consistent experience across browsers
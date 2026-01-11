# Tactical Blog Content Management Skill

This Claude skill provides comprehensive guidance for managing and developing the Tactical Blog - a Next.js 15 application with markdown-based content, AI chat integration, and a teenage.engineering-inspired design aesthetic.

## What This Skill Covers

### Content Management
- **Markdown Piece Creation**: Proper frontmatter structure, metadata validation, and content formatting
- **Content Organization**: File naming conventions, content structure, and piece metadata management
- **AI Embeddings**: Fragment generation, embedding workflows, and retrieval optimization

### Development Workflows
- **Component Architecture**: Understanding the tactical-blog component hierarchy and UI patterns
- **TypeScript Integration**: Type safety for pieces, fragments, and UI components
- **Testing Strategies**: Component testing, content validation, and integration tests

### Design System
- **teenage.engineering Aesthetics**: Design principles, component patterns, and visual consistency
- **Responsive Layouts**: Mobile vs desktop patterns, layout switching, and responsive components
- **UI Component Usage**: Radix UI integration, custom components, and design token usage

## When to Use This Skill

This skill activates when working with:
- Creating new blog pieces or modifying existing content
- Component development or UI modifications
- Content metadata or frontmatter issues
- AI chat integration or embedding workflows
- Design system questions or aesthetic considerations
- TypeScript type definitions for content or components

## Progressive Loading

Start with this overview, then load specific resource files as needed:
- `content-management.md` - Detailed content creation and management workflows
- `component-patterns.md` - Component architecture and development patterns
- `ai-integration.md` - Chat system and embedding management
- `design-guidelines.md` - Visual design principles and component usage
- `troubleshooting.md` - Common issues and debugging strategies

## Quick Reference

### Content Structure
```yaml
---
id: 8
title: Your Piece Title
date: 2025.01.20
mood:
  - contemplative
  - analytical
excerpt: Brief description for navigation
pinned: false # optional, defaults to false
---

Your markdown content here...
```

### Key Directories
- `content/pieces/` - All blog post markdown files
- `components/tactical-blog*.tsx` - Main blog UI components
- `lib/pieces.ts` - Content loading and processing logic
- `app/pieces/[slug]/` - Individual piece routing

### Development Commands
- `pnpm dev` - Development server with hot reload
- `pnpm build` - Production build with static generation
- `pnpm test` - Run Vitest test suite
- `pnpm lint` - ESLint validation

This skill ensures content creators and developers can work efficiently with the Tactical Blog's unique architecture and maintain its design aesthetic while leveraging its AI-powered features.
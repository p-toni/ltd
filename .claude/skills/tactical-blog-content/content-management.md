# Content Management Guide

## Creating New Blog Pieces

### File Naming Convention
- Format: `##-descriptive-slug.md` (e.g., `08-building-tactile-interfaces.md`)
- Use zero-padded numbers for proper sorting
- Keep slugs short, descriptive, and URL-friendly
- Use lowercase and hyphens only

### Frontmatter Structure

Every piece requires a valid frontmatter header:

```yaml
---
id: 8                    # Unique integer ID (required)
title: Building Tactile Interfaces  # Full title (required)
date: 2025.01.20         # YYYY.MM.DD format (required)
mood:                    # Array of valid moods (required)
  - contemplative
  - analytical
excerpt: Brief description that appears in navigation and previews  # Required
pinned: false            # Optional: keeps piece at top regardless of date
---
```

### Valid Mood Values
- `contemplative` - Reflective, philosophical pieces
- `analytical` - Data-driven, technical analysis
- `exploratory` - Investigative, experimental content
- `critical` - Evaluative, assessment-focused pieces

Multiple moods can be combined to reflect the piece's character.

### Content Guidelines

#### Markdown Support
- **Headers**: Use `#`, `##`, `###` for hierarchy
- **Lists**: Both ordered and unordered
- **Code blocks**: Fenced with language specification
- **Tables**: Standard markdown table syntax
- **Blockquotes**: Use `>` for quotations
- **Links**: `[text](url)` format
- **Emphasis**: `*italic*` and `**bold**`

#### teenage.engineering Design Principles
- **Minimal but functional**: Every element should serve a purpose
- **Clear hierarchy**: Use headers to create logical flow
- **Focused content**: Avoid unnecessary decoration or filler
- **Intentional formatting**: Use formatting sparingly but effectively

#### Content Length Considerations
- **Word count**: Automatically calculated and displayed
- **Read time**: Auto-generated at 220 words per minute
- **Fragment generation**: Content split into chunks for AI retrieval
- **Optimal length**: 800-2000 words for good engagement and fragmentation

### Content Processing Pipeline

#### 1. Validation
The system validates:
- Required frontmatter fields are present
- ID is unique and numeric
- Date format is correct (YYYY.MM.DD)
- Mood values are from allowed set
- Title and excerpt are non-empty strings

#### 2. Content Processing
- Word count calculation
- Read time estimation
- Publication timestamp generation
- Slug creation from filename

#### 3. Fragment Generation
For AI chat integration:
- Content split on double newlines (`\n\n`)
- Fragments must be ≥48 characters (configurable)
- Each fragment gets unique ID: `piece-XXX-fragment-YYY`
- Fragments preserve piece metadata for context

### Sorting and Display Logic

Pieces are sorted by:
1. **Pinned status**: Pinned pieces always appear first
2. **Publication date**: Newest first
3. **ID**: Higher ID as tiebreaker

Only the 5 most recent pieces appear in navigation to maintain UI focus.

## Content Organization Best Practices

### Topic Clustering
Group related pieces by using consistent:
- Mood combinations for thematic coherence
- Naming patterns for series (e.g., `09-interfaces-part-1.md`)
- Cross-references in content for related reading

### Metadata Consistency
- Use consistent terminology in titles
- Keep excerpts to 1-2 sentences (≤100 characters)
- Choose mood combinations that accurately reflect content tone
- Be judicious with pinning - reserve for truly important pieces

### Version Control
- Commit content changes separately from code changes
- Use descriptive commit messages for content updates
- Consider the impact of ID changes on existing links
- Update embeddings after significant content modifications

## AI Integration Considerations

### Fragment Optimization
- Write with paragraph breaks to create meaningful fragments
- Avoid overly short paragraphs that become unusable fragments
- Include context in each section so fragments make sense standalone
- Use clear topic sentences that help with retrieval

### Embedding Workflow
After adding or significantly modifying content:
1. Run `pnpm ts-node scripts/embed-pieces.ts` to regenerate embeddings
2. Test AI chat responses to ensure new content is retrievable
3. Verify fragment quality in the embeddings output

### Search Optimization
Structure content to be discoverable:
- Use clear, searchable terminology
- Include relevant technical terms naturally
- Write descriptive headers that could match user queries
- Create content that answers likely user questions

## Quality Assurance

### Pre-Publish Checklist
- [ ] Frontmatter validates correctly
- [ ] Content renders properly in markdown preview
- [ ] Word count and read time are reasonable
- [ ] Fragments will be meaningful for AI retrieval
- [ ] Links and references work correctly
- [ ] Mood reflects content accurately
- [ ] Excerpt is compelling and accurate

### Common Pitfalls
- **Invalid mood values**: Stick to the four allowed moods
- **Date format errors**: Use YYYY.MM.DD format exactly
- **Duplicate IDs**: Each piece needs a unique numeric ID
- **Empty frontmatter fields**: All required fields must have values
- **Poor fragment boundaries**: Avoid very short paragraphs
- **Inconsistent tone**: Match mood metadata to actual content tone
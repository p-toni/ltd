# AI Chat Integration & Embedding System

## Overview

The Tactical Blog features a sophisticated AI-powered chat system that can search through and reference blog content. The system uses embeddings to enable semantic search across piece fragments.

## Embedding Architecture

### Fragment Generation System
Content is automatically fragmented for optimal AI retrieval:

```typescript
// From lib/pieces.ts
export interface PieceFragment {
  id: string              // Unique fragment ID (piece-XXX-fragment-YYY)
  pieceId: number         // Reference to parent piece
  pieceTitle: string      // Parent piece title for context
  pieceSlug: string       // Parent piece URL slug
  order: number           // Fragment order within piece
  text: string            // Fragment content
  wordCount: number       // Word count for this fragment
}
```

### Fragmentation Rules
- **Split Pattern**: Double newlines (`\n\n`) create natural boundaries
- **Minimum Length**: 48 characters (configurable via `DEFAULT_FRAGMENT_MIN_LENGTH`)
- **Context Preservation**: Each fragment retains parent piece metadata
- **ID Format**: `piece-001-fragment-001` (zero-padded for sorting)

### Embedding Generation Script
Location: `scripts/embed-pieces.ts`

**Prerequisites**:
- Hugging Face token with access to `nvidia/NV-Embed-v2`
- Set `HF_TOKEN` environment variable

**Usage**:
```bash
pnpm ts-node scripts/embed-pieces.ts
```

**What it does**:
1. Loads all pieces and generates fragments
2. Connects to Hugging Face Inference API
3. Generates embeddings using NV-Embed-v2 model
4. Stores embeddings for retrieval system

## Chat Interface Implementation

### Provider System
The chat supports multiple AI providers:
- **Anthropic**: Claude models
- **OpenAI**: GPT models

### API Key Management
- Client-side storage only (not sent to server)
- Provider selection persisted in local storage
- Security: Keys never leave the browser

### Chat Flow
1. User selects provider and enters API key
2. User submits question
3. System performs semantic search on fragments
4. Relevant fragments sent as context to AI
5. AI response streams back with references
6. References link back to original pieces

## API Route Structure

### Chat Endpoint: `/app/api/chat/route.ts`
Handles streaming chat responses with retrieval-augmented generation (RAG):

```typescript
export async function POST(request: Request) {
  // 1. Parse user message and provider info
  // 2. Perform semantic search on embeddings
  // 3. Format context from relevant fragments
  // 4. Call AI provider API
  // 5. Stream response back to client
}
```

### Request Format
```json
{
  "message": "User question",
  "provider": "anthropic" | "openai",
  "apiKey": "provider-api-key",
  "conversationHistory": [...] // Optional previous messages
}
```

### Response Format
- **Streaming**: Server-sent events for real-time responses
- **References**: Embedded links to source pieces
- **Error Handling**: Graceful fallbacks for API failures

## Retrieval System

### Semantic Search Process
1. **Query Embedding**: User question converted to embedding vector
2. **Similarity Calculation**: Cosine similarity against fragment embeddings
3. **Ranking**: Top-K most relevant fragments selected
4. **Context Assembly**: Selected fragments formatted for AI context

### Context Formatting
```typescript
const contextFormat = `
Based on the following content from the blog:

[Piece: ${fragment.pieceTitle}]
${fragment.text}

[End of context]

Please answer the user's question using this information...
`;
```

## Development Workflow

### Setting Up AI Integration

1. **Environment Setup**:
```bash
# Required environment variables
HF_TOKEN=your_huggingface_token
```

2. **Generate Initial Embeddings**:
```bash
pnpm ts-node scripts/embed-pieces.ts
```

3. **Test Chat Interface**:
- Start development server: `pnpm dev`
- Navigate to chat interface
- Select provider and enter API key
- Test with questions about your content

### Content Update Workflow
When adding or modifying pieces:

1. **Add/Edit Content**: Create or modify markdown files
2. **Regenerate Embeddings**: Run embed script
3. **Test Retrieval**: Verify new content is discoverable
4. **Deploy Updates**: Push changes with new embeddings

## Optimization Strategies

### Fragment Quality
- **Paragraph Structure**: Write with clear paragraph breaks
- **Self-Contained Sections**: Each section should make sense independently
- **Context Clues**: Include relevant keywords and context in each section
- **Optimal Length**: 100-500 words per fragment for best retrieval

### Embedding Performance
- **Batch Processing**: Generate embeddings in batches for efficiency
- **Caching Strategy**: Store embeddings to avoid regeneration
- **Model Selection**: NV-Embed-v2 chosen for quality/speed balance
- **Dimension Optimization**: Use appropriate embedding dimensions

### Search Quality
- **Query Preprocessing**: Clean and normalize user queries
- **Similarity Thresholds**: Filter out low-relevance results
- **Context Window**: Balance context quantity vs quality
- **Reference Attribution**: Always cite source pieces

## Troubleshooting

### Common Issues

**Embeddings Not Generating**:
- Verify HF_TOKEN is valid and has model access
- Check network connectivity to Hugging Face API
- Ensure content directory exists and has markdown files

**Poor Search Results**:
- Regenerate embeddings after content changes
- Check fragment quality (length, coherence)
- Verify embedding model is consistent
- Test with different query phrasings

**Chat Interface Errors**:
- Validate API keys for selected provider
- Check provider API status and quotas
- Verify request format matches expected schema
- Monitor network requests for debugging

**Fragment Issues**:
- Ensure minimum fragment length is appropriate
- Check for very short paragraphs that get filtered
- Verify fragment boundaries make semantic sense
- Test that fragments contain sufficient context

### Debugging Tools

**Fragment Inspection**:
```typescript
// Manually inspect generated fragments
const fragments = await getPieceFragments({ minLength: 48 })
console.log(fragments.map(f => ({ id: f.id, text: f.text.slice(0, 100) })))
```

**Embedding Verification**:
```bash
# Check if embeddings were generated
# Look for embedding storage files or database entries
```

**API Testing**:
```bash
# Test chat endpoint directly
curl -X POST /api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test question","provider":"anthropic","apiKey":"..."}'
```

## Security Considerations

### API Key Handling
- **Client-Side Only**: Keys stored in browser, never sent to your server
- **No Logging**: Avoid logging requests that contain API keys
- **Rotation**: Users can easily change keys if compromised

### Content Privacy
- **Public Content**: Only public blog content is indexed
- **No Personal Data**: Fragment system doesn't include personal information
- **Attribution**: All AI responses clearly cite sources

### Rate Limiting
- **Provider Limits**: Respect AI provider rate limits
- **Client Throttling**: Implement reasonable request throttling
- **Error Handling**: Graceful degradation when limits exceeded
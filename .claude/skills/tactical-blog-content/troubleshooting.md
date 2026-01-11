# Troubleshooting Guide

## Content Management Issues

### Frontmatter Validation Errors

**Error**: `Invalid or missing "id" in filename.md`
- **Cause**: Missing, non-numeric, or duplicate ID in frontmatter
- **Solution**: Ensure each piece has unique numeric ID
- **Check**: Verify no other pieces use the same ID

**Error**: `Invalid "date" value in filename.md`
- **Cause**: Incorrect date format in frontmatter
- **Solution**: Use exact format `YYYY.MM.DD` (e.g., `2025.01.20`)
- **Common mistakes**: Using hyphens (`2025-01-20`) or slashes (`01/20/2025`)

**Error**: `Invalid or missing "mood" in filename.md`
- **Cause**: Mood value not in allowed set or missing
- **Solution**: Use only valid moods: `contemplative`, `analytical`, `exploratory`, `critical`
- **Format**: Can be single string or array of strings

```yaml
# Correct mood formats
mood: contemplative

# OR
mood:
  - contemplative
  - analytical
```

### Content Loading Issues

**Problem**: Pieces not appearing in navigation
- **Check 1**: Ensure markdown files are in `content/pieces/` directory
- **Check 2**: Verify frontmatter validation passes
- **Check 3**: Check if older pieces are being filtered (only 5 most recent shown)
- **Debug**: Use development server logs to see parsing errors

**Problem**: Piece content not rendering
- **Check 1**: Verify markdown syntax is correct
- **Check 2**: Ensure no conflicting HTML in markdown
- **Check 3**: Test markdown parsing with online tools
- **Check 4**: Check for unclosed code blocks or malformed tables

### Fragment Generation Problems

**Problem**: Pieces not appearing in AI chat results
- **Cause**: Content not generating usable fragments
- **Solution**: Ensure paragraphs are ≥48 characters
- **Fix**: Add more descriptive content or merge short paragraphs

**Problem**: Fragment context missing
- **Cause**: Very short content sections
- **Solution**: Write with clear paragraph breaks and sufficient context
- **Best practice**: Each section should be understandable independently

## Development Environment Issues

### TypeScript Errors

**Error**: Type mismatch on `Piece` interface
- **Location**: Usually in component props or state management
- **Solution**: Ensure imported types match `lib/pieces.ts` definitions
- **Check**: Verify all required fields are present

**Error**: Missing module declarations
- **Cause**: New dependencies or file imports
- **Solution**: Add proper type declarations or update `tsconfig.json`
- **Common**: Markdown parsing or AI integration modules

### Build Failures

**Error**: Next.js build fails on content parsing
- **Debug**: Run `pnpm build` to see specific errors
- **Check**: Validate all markdown files parse correctly
- **Solution**: Fix frontmatter validation errors before building

**Error**: TypeScript compilation errors
- **Command**: `pnpm exec tsc --noEmit` to check without building
- **Fix**: Address type errors in the compilation output
- **Common**: Missing types for new components or props

### Development Server Issues

**Problem**: Hot reload not working for content changes
- **Cause**: Markdown files not in Next.js watch patterns
- **Solution**: Restart development server after content changes
- **Workaround**: Use `pnpm dev` instead of cached version

**Problem**: Styles not applying correctly
- **Check 1**: Ensure Tailwind classes are spelled correctly
- **Check 2**: Verify dark/light theme CSS variables
- **Check 3**: Check for CSS conflicts or specificity issues
- **Debug**: Use browser dev tools to inspect computed styles

## AI Integration Troubleshooting

### Embedding Generation Failures

**Error**: `HF_TOKEN not found` or authentication errors
- **Solution**: Ensure Hugging Face token is set in environment
- **Check**: Verify token has access to `nvidia/NV-Embed-v2` model
- **Command**: `export HF_TOKEN=your_token_here`

**Error**: Network timeouts or API errors
- **Cause**: Hugging Face API connectivity or rate limits
- **Solution**: Retry with backoff or check API status
- **Debug**: Test API access with curl:
```bash
curl -H "Authorization: Bearer $HF_TOKEN" \
  https://api-inference.huggingface.co/models/nvidia/NV-Embed-v2
```

**Problem**: Embeddings script runs but no output
- **Check**: Ensure content directory exists and has valid markdown
- **Debug**: Add console logs to see what pieces are being processed
- **Verify**: Check embedding storage location and format

### Chat Interface Issues

**Error**: "Provider not supported" or API key errors
- **Check 1**: Verify API key format for selected provider
- **Check 2**: Ensure provider service is operational
- **Check 3**: Test API key with provider's direct API

**Problem**: No relevant results in chat responses
- **Cause**: Poor embedding quality or search threshold too high
- **Solution**: Regenerate embeddings with updated content
- **Debug**: Test search with different query phrasings

**Error**: Streaming responses fail or timeout
- **Check 1**: Network connectivity and provider API status
- **Check 2**: API key permissions and quotas
- **Check 3**: Request format matches expected schema

### Performance Issues

**Problem**: Slow embedding generation
- **Cause**: Large content volume or API rate limits
- **Solution**: Implement batching or caching strategies
- **Optimize**: Process only changed content when possible

**Problem**: Chat responses slow
- **Debug**: Check fragment search performance
- **Optimize**: Reduce context size or improve search relevance
- **Monitor**: Watch for API latency patterns

## Component Development Issues

### Styling Problems

**Problem**: Components not matching design system
- **Check**: Ensure using Tailwind design tokens consistently
- **Verify**: Component follows teenage.engineering aesthetic principles
- **Debug**: Compare with existing component implementations

**Problem**: Responsive layout breaking
- **Test**: Check all target breakpoints
- **Debug**: Use browser dev tools responsive mode
- **Fix**: Ensure mobile-first approach and proper breakpoint usage

**Problem**: Theme switching not working
- **Check**: CSS custom properties defined correctly
- **Verify**: Theme provider wraps application properly
- **Debug**: Inspect theme attribute on document root

### State Management Issues

**Error**: Context provider errors
- **Cause**: Component used outside provider boundary
- **Solution**: Ensure all consuming components wrapped by provider
- **Check**: Provider placement in component hierarchy

**Problem**: State updates not triggering re-renders
- **Debug**: Check React dev tools for state changes
- **Verify**: State mutations happen immutably
- **Fix**: Use proper state update patterns

## Deployment Issues

### Vercel Deployment Failures

**Error**: Build fails in production environment
- **Check**: All environment variables set in Vercel dashboard
- **Debug**: Review build logs for specific errors
- **Test**: Run production build locally first

**Problem**: Static generation fails
- **Cause**: Dynamic content or missing data at build time
- **Solution**: Ensure all content accessible during build
- **Check**: All required markdown files present

**Error**: API routes not working
- **Check**: Route file naming and export structure
- **Verify**: API route functions handle all expected cases
- **Debug**: Test API routes locally before deployment

## Debugging Strategies

### Systematic Approach

1. **Isolate the Problem**: Reproduce in minimal case
2. **Check Logs**: Development server and browser console
3. **Verify Data**: Ensure data flows correctly through system
4. **Test Components**: Isolate components from broader system
5. **Check Dependencies**: Verify package versions and compatibility

### Useful Debug Commands

```bash
# Check TypeScript compilation
pnpm exec tsc --noEmit

# Lint for code issues
pnpm lint

# Test content parsing
pnpm ts-node -e "
  import { getPieces } from './lib/pieces';
  getPieces().then(pieces => console.log(pieces.length, 'pieces loaded'));
"

# Test embeddings generation
pnpm ts-node scripts/embed-pieces.ts

# Build production version locally
pnpm build
pnpm start
```

### Browser Developer Tools

**Network Tab**: Monitor API calls and response times
**Console**: Check for JavaScript errors and warnings
**Elements**: Inspect DOM structure and CSS application
**React Dev Tools**: Monitor component state and props

## Getting Help

### Documentation References
- **Next.js**: Official documentation for framework issues
- **Tailwind CSS**: Utility class reference and customization
- **Radix UI**: Component API and accessibility patterns
- **TypeScript**: Type system and compilation issues

### Debugging Information to Include
When seeking help, include:
- Exact error messages and stack traces
- Steps to reproduce the issue
- Environment details (Node version, OS, browser)
- Relevant code snippets
- What you've already tried

### Common Issue Patterns
- **Content not loading**: Usually frontmatter validation
- **Styles not applying**: Often Tailwind configuration or theme issues
- **TypeScript errors**: Type mismatches or missing declarations
- **Build failures**: Environment differences or missing dependencies
- **API issues**: Authentication, rate limits, or network problems
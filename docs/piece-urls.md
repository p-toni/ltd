# Piece URLs

Each entry in `content/pieces/*.md` now has a dedicated route:

- Homepage (`/`) still loads the full Tactical Blog interface.
- `/pieces/[slug]` preselects a specific piece (e.g. `/pieces/07-co-owning-the-loop`) while keeping the same reading experience.

The slug comes from the filename (e.g. `07-co-owning-the-loop.md` → `07-co-owning-the-loop`). When you publish a new piece:

1. Use the `NN-title.md` pattern so the slug is predictable.
2. Share the canonical URL `https://toni.ltd/pieces/<slug>`—it loads the same UI with the piece already focused.

If a slug is missing you will get a 404 (`notFound()`), so keep filenames unique.***

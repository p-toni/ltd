# Capability Map - Toni.LTD

This map tracks UI actions and their agent equivalents for parity. Update it whenever you add UI capabilities.

| UI Action | UI Location | Agent Action | Notes | Status |
| --- | --- | --- | --- | --- |
| Open a piece | Desktop list, Mobile list | `open_piece` | Agent opens by piece id | ✅
| Filter by mood | Desktop boundary panel | `set_mood_filter` | Agent can set `all` or a mood | ✅
| Toggle excerpts | Desktop boundary panel | `toggle_excerpts` | Agent can toggle or set explicit value | ✅
| Toggle compact view | Desktop boundary panel | `toggle_compact` | Agent can toggle or set explicit value | ✅
| Switch theme | Desktop top bar | `set_theme` | Light/Dark | ✅
| Switch engine | Desktop core panel | `set_engine` | Discover/Focus | ✅
| Ask synthesizer | Desktop drawer, Mobile chat | `handleChatSubmit` (retrieval) | Retrieval + citations | ✅
| Ask agent | Desktop drawer + console, Mobile chat | `handleAgentSubmit` | Agent actions + response | ✅
| Navigate next/prev | Desktop hotkeys, Mobile swipe | `open_piece` | Agent can open specific piece | ✅

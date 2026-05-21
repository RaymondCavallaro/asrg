# Technical Architecture

The current prototype is a dependency-free static browser app so it can run on GitHub Pages.

## Flow

```text
UI command
-> World Core
-> logs, proxy cards, topology propagation
-> Reader
-> Presenter
-> UI
```

## Current Modules

- `src/core/world.js`: authoritative world state and command handling.
- `src/core/reader.js`: situated field and log access.
- `src/core/presenter.js`: template narrative presentation.
- `src/core/aiContext.js`: player-facing settings and revelation constraints for future AI calls.
- `src/core/actions.js`: contextual action availability.
- `src/core/storyNodes.js`: selectable story-object view model.
- `src/core/nodeManager.js`: system node, topology edge, and story node creation.
- `src/game/generation.js`: seeded story config and generation slack.
- `src/game/cards.js`: action, proxy, and injector cards.
- `src/ui/render.js`: DOM rendering and event binding.
- `src/i18n.js`: UI localization strings.

## Constraints

- No build step is required.
- No backend is required.
- No external AI service is required.
- The world state remains serializable.
- Browser local storage is used for saves.

# AI Integration Notes

AI is optional. It should enhance presentation, not own the simulation.

## Presenter Backends

Possible modes:

- Template presenter.
- Local browser AI through WebLLM or a similar runtime.
- User-provided API key.
- Later server/proxy mode if needed.

## Adapter Boundary

Input:

- AI presentation context, including locale, language name, player-facing settings, theme, AI mode, and revelation rules
- filtered reader output
- accessible logs
- selected story node
- scene context
- prince perspective
- allowed revelation constraints

The adapter must always receive language settings before generating player-facing text. If the locale is `pt-BR`, the AI should answer in Brazilian Portuguese unless a specific story object intentionally preserves an in-world proper name.

Output:

- player-facing text
- optional scene cues
- optional advisor or character lines

AI output must not:

- mutate ACES state
- invent unsupported truth
- reveal inaccessible hidden facts
- create new actors or crises outside approved injector/generation paths

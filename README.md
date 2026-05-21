# ASRG Prototype

An early static prototype for an adaptive narrative governance simulation.

The current build is intentionally browser-only and dependency-free so it can run on GitHub Pages without a backend or build step.

## Run

Open `index.html` in a browser, or serve the folder with any static file server.

The prototype currently includes:

- six managed nodes
- sparse topology
- ACES profiles with qualitative bands
- proxy-card effects
- minimal injector seeds
- epistemic logs
- generic region reader
- advisor interpretations
- template Presenter
- AI mode configuration placeholders
- local browser save

## Architecture

The UI sends commands to the authoritative world core. The UI does not mutate world truth directly.

```text
Player action
-> Action Interpreter / command
-> ACES World Core
-> logs, proxy cards, topology propagation
-> Reader
-> Presenter
-> UI
```

This keeps the door open for later TypeScript/Vite migration, WebLLM, user-supplied API keys, and server-client multiplayer.

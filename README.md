# Notice - Deprecation

This repository has been folded into ARSG.

ARSG now contains:
- the original ASRG governance simulation
- BHG adaptive pressure experiments
- shared runtime/protocol infrastructure
- proto-ARS runtime architecture

This repo remains archived for historical/reference purposes.

# ASRG Prototype

An early static prototype for an adaptive narrative governance text game.

The current build is intentionally browser-only and dependency-free so it can run on GitHub Pages without a backend or build step.

## Run

Open `index.html` in a browser, or serve the folder with any static file server.

The prototype currently includes:

- six managed nodes
- sparse topology
- hidden realm-pressure profiles with qualitative presentation
- proxy-card effects
- minimal injector seeds
- epistemic logs
- generic region reader
- advisor interpretations
- template Presenter
- generated session names and places
- context-sensitive actions for council and exploration scenes
- visible action turn costs
- present-only people lists
- personal interaction records
- node manager separation for system nodes, topology edges, and story nodes
- simple achievement unlock for a hidden counselor
- seeded JSON story dictionary with schema, configured threats, delayed threats, hidden unlocks, and explicit generation slack
- story-node browser for people, places, logs, threats, and achievements
- visible action composition tags
- achievements screen with visible, hidden, locked, and unlocked states
- hidden debug dashboard for inspecting raw world state
- English and Brazilian Portuguese UI localization
- AI mode configuration placeholders
- local browser save

Project planning is split under `docs/`, with `CONCEPTUAL_PLAN.md` kept as the short conceptual core.

## Architecture

The UI sends commands to the authoritative world core. The UI does not mutate world truth directly.

```text
Player action
-> Action Interpreter / command
-> World Core
-> logs, proxy cards, topology propagation
-> Reader
-> Presenter
-> UI
```

This keeps the door open for later TypeScript/Vite migration, WebLLM, user-supplied API keys, and server-client multiplayer.

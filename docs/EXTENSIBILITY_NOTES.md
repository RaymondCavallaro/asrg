# Extensibility Notes

These ideas should remain outside the conceptual core until the loop is proven.

## Future Directions

- richer story-pack editor
- imported custom material
- AI-assisted topology drafting
- CSP/rules validation
- visible card composability
- multiplayer/server-client structure
- multiple observer roles
- richer localization
- configurable genre packs

## Constraint Layer

A future CSP/rules layer can sit between generation and world mutation:

```text
candidate generated material
-> realism, tone, preference, topology, and chronology checks
-> accepted draft
-> world mutation
```

## Multiplayer Shape

The current local architecture already treats the world core as authoritative. Later, that can become a server boundary:

```text
client command
-> authoritative world engine
-> filtered reading per observer
-> client presentation
```

No real networking is part of the MVP.

export function createSystemNode(definition, frame) {
  return {
    kind: "system-node",
    ...definition,
    representative: frame?.representatives?.[definition.id] || definition.representative,
    profile: { ...definition.profile },
  };
}

export function createTopologyEdge(definition) {
  return {
    kind: "topology-edge",
    ...definition,
  };
}

export function createStoryNode(log) {
  return {
    kind: "story-node",
    id: `story-${log.id}`,
    logId: log.id,
    turn: log.turn,
    title: log.title,
    involvedNodes: [...(log.involvedNodes || [])],
    involvedCharacters: [...(log.involvedCharacters || [])],
    source: log.source,
    actionId: log.actionId,
  };
}

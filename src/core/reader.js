import { averageProfile, bandFor, dominantMetrics, metricLabel } from "./aces.js";

const VISIBILITY_RANK = {
  hidden: 0,
  private: 1,
  factional: 2,
  local: 3,
  institutional: 4,
  public: 5,
};

export function readRegion(world, { centerNodeId, radius = 1, observerId = "player" }) {
  const nodeIds = collectRegionNodeIds(world, centerNodeId, radius);
  const nodes = world.nodes.filter((node) => nodeIds.has(node.id));
  const edges = world.edges.filter((edge) => nodeIds.has(edge.from) || nodeIds.has(edge.to));
  const profile = averageProfile(nodes);
  const logs = world.logs
    .filter((log) => log.involvedNodes.some((nodeId) => nodeIds.has(nodeId)))
    .filter((log) => canObserverSee(log, observerId))
    .slice(-8)
    .reverse();

  const dominant = dominantMetrics(profile).map((item) => ({
    metric: item.key,
    label: metricLabel(item.key),
    value: item.value,
    band: bandFor(item.key, item.value),
  }));

  const unstableEdges = edges
    .filter((edge) => edge.trust < 42 || edge.distortion > 48 || edge.secrecy > 68)
    .slice(0, 4);

  return {
    observerId,
    centerNodeId,
    radius,
    nodes,
    edges,
    profile,
    dominant,
    logs,
    unstableEdges,
  };
}

function collectRegionNodeIds(world, centerNodeId, radius) {
  const found = new Set([centerNodeId]);
  let frontier = new Set([centerNodeId]);

  for (let step = 0; step < radius; step++) {
    const next = new Set();
    for (const edge of world.edges) {
      if (frontier.has(edge.from)) next.add(edge.to);
      if (frontier.has(edge.to)) next.add(edge.from);
    }
    for (const nodeId of next) found.add(nodeId);
    frontier = next;
  }

  return found;
}

function canObserverSee(log, observerId) {
  if (observerId !== "player") return true;
  return VISIBILITY_RANK[log.visibility] >= 1 && log.visibility !== "hidden";
}

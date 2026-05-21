import { applyAcesDelta, clampAces } from "./aces.js";
import { initialEdges, initialNodes, prince, advisors } from "../game/seed.js";
import { actionCards, injectorCards, proxyCards } from "../game/cards.js";

export function createInitialWorld() {
  return {
    version: 1,
    turn: 1,
    nodes: initialNodes.map((node) => ({ ...node, profile: { ...node.profile } })),
    edges: initialEdges.map((edge) => ({ ...edge })),
    prince: { ...prince, traits: { ...prince.traits } },
    advisors,
    logs: [
      makeLog({
        turn: 1,
        title: "A thin winter begins",
        summary: "The first reports of the season describe ordinary markets, careful merchants, and quiet unease around flour prices.",
        domainTags: ["food", "winter", "market"],
        acesTags: ["tension", "optionality"],
        involvedNodes: ["population", "merchants"],
        visibility: "public",
        knowledge: "public",
        source: "setup",
      }),
    ],
    aiConfig: {
      mode: "template",
      provider: "",
      endpoint: "",
      hasApiKey: false,
    },
    lastProxyLogIds: [],
  };
}

export function dispatchCommand(world, command) {
  const working = cloneWorld(world);

  if (command.type === "set-ai-config") {
    working.aiConfig = {
      mode: command.mode,
      provider: command.provider || "",
      endpoint: command.endpoint || "",
      hasApiKey: Boolean(command.apiKey),
    };
    return working;
  }

  if (command.type !== "play-action") {
    return working;
  }

  const action = actionCards.find((card) => card.id === command.actionId);
  if (!action) return working;

  working.turn += 1;
  applyNodeEffects(working, action.effects);
  applyEdgeEffects(working, action.edgeEffects);

  const actionLog = makeLog({
    ...action.log,
    turn: working.turn,
    source: "player",
    actionId: action.id,
    structural: action.structural,
  });
  working.logs.push(actionLog);

  runInjector(working);
  applyProxyCards(working);
  runFieldGenerator(working);
  updateMemoryLoad(working);

  return working;
}

function cloneWorld(world) {
  return {
    ...world,
    nodes: world.nodes.map((node) => ({ ...node, profile: { ...node.profile } })),
    edges: world.edges.map((edge) => ({ ...edge })),
    prince: { ...world.prince, traits: { ...world.prince.traits } },
    logs: world.logs.map((log) => ({ ...log, structural: log.structural ? { ...log.structural } : undefined })),
    aiConfig: { ...world.aiConfig },
    lastProxyLogIds: [...(world.lastProxyLogIds || [])],
  };
}

function makeLog(input) {
  const id = input.id || `log-${input.turn}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    turn: input.turn,
    title: input.title,
    summary: input.summary,
    domainTags: input.domainTags || [],
    acesTags: input.acesTags || [],
    involvedNodes: input.involvedNodes || [],
    visibility: input.visibility || "local",
    knowledge: input.knowledge || "rumor",
    reliability: input.reliability ?? 0.7,
    truthStatus: input.truthStatus || "partial",
    source: input.source || "system",
    actionId: input.actionId,
    structural: input.structural,
  };
}

function applyNodeEffects(world, effects = {}) {
  for (const [nodeId, delta] of Object.entries(effects)) {
    const node = world.nodes.find((item) => item.id === nodeId);
    if (node) node.profile = applyAcesDelta(node.profile, delta);
  }
}

function applyEdgeEffects(world, effects = []) {
  for (const effect of effects) {
    const edge = findEdge(world, effect.from, effect.to);
    if (!edge) continue;
    for (const key of ["conductance", "trust", "distortion", "dependency", "secrecy"]) {
      if (typeof effect[key] === "number") edge[key] = clampAces(edge[key] + effect[key]);
    }
  }
}

function findEdge(world, from, to) {
  return world.edges.find((edge) => {
    return (edge.from === from && edge.to === to) || (edge.from === to && edge.to === from);
  });
}

function runInjector(world) {
  for (const card of injectorCards) {
    if (world.turn > 1 && world.turn % card.everyTurns === 0) {
      const alreadyInjected = world.logs.some((log) => log.source === `injector:${card.id}` && log.turn === world.turn);
      if (alreadyInjected) continue;
      world.logs.push(makeLog({
        ...card,
        turn: world.turn,
        source: `injector:${card.id}`,
      }));
    }
  }
}

function applyProxyCards(world) {
  const processed = new Set(world.lastProxyLogIds || []);
  const newLogs = world.logs.filter((log) => !processed.has(log.id));

  for (const log of newLogs) {
    for (const proxy of proxyCards) {
      const matched = proxy.triggerTags.some((tag) => log.domainTags.includes(tag));
      if (!matched) continue;

      const filteredEffects = {};
      for (const nodeId of log.involvedNodes) {
        if (proxy.effects[nodeId]) filteredEffects[nodeId] = proxy.effects[nodeId];
      }
      if (Object.keys(filteredEffects).length === 0) continue;

      applyNodeEffects(world, filteredEffects);
    }
    processed.add(log.id);
  }

  world.lastProxyLogIds = Array.from(processed).slice(-80);
}

function runFieldGenerator(world) {
  const deltas = Object.fromEntries(world.nodes.map((node) => [node.id, {}]));

  for (const edge of world.edges) {
    const a = world.nodes.find((node) => node.id === edge.from);
    const b = world.nodes.find((node) => node.id === edge.to);
    if (!a || !b) continue;

    const flow = Math.max(1, Math.round(edge.conductance / 30));
    const distortion = Math.max(0, Math.round(edge.distortion / 35));
    const dependency = Math.max(0, Math.round(edge.dependency / 40));

    if (a.profile.tension - b.profile.tension > 12) addDelta(deltas[b.id], "tension", flow);
    if (b.profile.tension - a.profile.tension > 12) addDelta(deltas[a.id], "tension", flow);

    if (edge.trust < 40) {
      addDelta(deltas[a.id], "legitimacy", -1);
      addDelta(deltas[b.id], "legitimacy", -1);
      addDelta(deltas[a.id], "memoryLoad", distortion);
      addDelta(deltas[b.id], "memoryLoad", distortion);
    }

    if (edge.dependency > 60) {
      addDelta(deltas[a.id], "concentration", dependency);
      addDelta(deltas[b.id], "optionality", -1);
    }
  }

  for (const [nodeId, delta] of Object.entries(deltas)) {
    const node = world.nodes.find((item) => item.id === nodeId);
    if (node) node.profile = applyAcesDelta(node.profile, delta);
  }
}

function addDelta(delta, key, amount) {
  delta[key] = (delta[key] || 0) + amount;
}

function updateMemoryLoad(world) {
  for (const node of world.nodes) {
    const unresolved = world.logs.filter((log) => {
      return log.involvedNodes.includes(node.id) && log.knowledge !== "verified" && log.visibility !== "public";
    }).length;
    if (unresolved >= 3) {
      node.profile = applyAcesDelta(node.profile, { memoryLoad: 1 });
    }
  }
}

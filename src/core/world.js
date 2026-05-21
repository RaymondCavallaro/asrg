import { applyAcesDelta, clampAces } from "./aces.js";
import { initialEdges, initialNodes, prince, advisors } from "../game/seed.js";
import { actionCards, injectorCards, proxyCards } from "../game/cards.js";
import {
  configuredThreatOptions,
  counselorOptions,
  defaultStoryConfig,
  delayedThreatOptions,
  generateStartFrame,
  hiddenUnlockOptions,
  themeOptions,
} from "../game/generation.js";
import { createStoryNode, createSystemNode, createTopologyEdge } from "./nodeManager.js";

export function createInitialWorld() {
  const storyConfig = defaultStoryConfig();
  const frame = generateStartFrame(storyConfig);
  return buildWorldFromFrame(storyConfig, frame);
}

function buildWorldFromFrame(storyConfig, frame, previous = {}) {
  const openingLog = makeLog({
    turn: 0,
    title: "The prince takes the winter chair",
    summary: `Theme: ${frame.theme.name}. Your father is too ill to sit council. The castle wakes under thin snow, ${frame.winterPressure}, and every faction arrives with a different version of the same calm. Beneath that calm: ${frame.generatedThreat}. The known danger is ${frame.configuredThreat.name}.`,
    domainTags: ["food", "winter", "market"],
    acesTags: ["tension", "optionality"],
    involvedNodes: ["court", "population", "merchants", "church", "military"],
    involvedCharacters: frame.characters.filter((person) => person.publicFace).map((person) => person.id),
    visibility: "public",
    knowledge: "public",
    source: "setup",
  });

  return {
    version: 1,
    started: false,
    turn: 0,
    currentSceneId: "opening",
    currentPlaceId: "",
    locale: previous.locale || "pt-BR",
    storyConfig,
    generatedFrame: frame,
    achievements: previous.achievements || [],
    storyNodes: [createStoryNode(openingLog)],
    characters: [...frame.characters, frame.hiddenCounselor],
    places: frame.places,
    nodes: initialNodes.map((node) => createSystemNode(node, frame)),
    edges: initialEdges.map((edge) => createTopologyEdge(edge)),
    prince: { ...prince, name: frame.princeName, traits: { ...(previous.prince?.traits || prince.traits) } },
    advisors: advisors.map((advisor) => ({
      ...advisor,
      name: frame.representatives[advisor.nodeId] || advisor.name,
    })),
    logs: [openingLog],
    aiConfig: previous.aiConfig || {
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

  if (command.type === "start-game") {
    working.started = true;
    working.currentSceneId = "opening";
    return working;
  }

  if (command.type === "set-story-config") {
    if (working.started) return working;
    const nextConfig = normalizeStoryConfig({ ...working.storyConfig, [command.key]: command.value });
    const nextFrame = generateStartFrame(nextConfig);
    return buildWorldFromFrame(nextConfig, nextFrame, working);
  }

  if (command.type === "set-story-config-json") {
    if (working.started) return working;
    const nextConfig = normalizeStoryConfig(command.config || {});
    const nextFrame = generateStartFrame(nextConfig);
    return buildWorldFromFrame(nextConfig, nextFrame, working);
  }

  if (command.type === "adjust-trait") {
    if (working.started) return working;
    const current = working.prince.traits[command.trait] ?? 50;
    const next = clampAces(current + command.amount);
    const min = working.prince.traitMin ?? 30;
    const max = working.prince.traitMax ?? 80;
    if (next < min || next > max) return working;

    const total = traitTotal(working.prince.traits);
    const budget = working.prince.traitBudget ?? total;
    if (command.amount > 0 && total + command.amount > budget) return working;
    working.prince.traits[command.trait] = next;
    return working;
  }

  if (command.type === "set-ai-config") {
    working.aiConfig = {
      mode: command.mode,
      provider: command.provider || "",
      endpoint: command.endpoint || "",
      hasApiKey: Boolean(command.apiKey),
    };
    return working;
  }

  if (command.type === "set-locale") {
    working.locale = command.locale === "pt-BR" ? "pt-BR" : "en";
    return working;
  }

  if (command.type === "visit-place") {
    const place = working.places.find((item) => item.id === command.placeId);
    if (!place) return working;
    working.turn += 1;
    working.currentPlaceId = place.id;
    working.currentSceneId = `place:${place.id}:${working.turn}`;
    working.logs.push(makeLog({
      turn: working.turn,
      title: `Walk through ${place.name}`,
      summary: `The prince left the council's direct table and read the realm from ${place.name}.`,
      domainTags: ["place", "observation"],
      acesTags: ["participation", "memoryLoad"],
      involvedNodes: place.nearbyNodes,
      involvedCharacters: characterIdsForNodes(working, place.nearbyNodes),
      visibility: "private",
      knowledge: "witnessed",
      source: "player",
    }));
    syncStoryNodes(working);
    runInjector(working);
    applyProxyCards(working);
    runFieldGenerator(working);
    updateMemoryLoad(working);
    return working;
  }

  if (command.type !== "play-action") {
    return working;
  }

  if (command.actionId === "return-council") {
    if (!working.currentPlaceId) return working;
    working.turn += 1;
    working.currentPlaceId = "";
    working.currentSceneId = `council-return:${working.turn}`;
    working.logs.push(makeLog({
      turn: working.turn,
      title: "Return to the winter council",
      summary: "The prince returned from the castle's side passages with impressions that are not yet official evidence.",
      domainTags: ["council", "observation"],
      acesTags: ["memoryLoad", "participation"],
      involvedNodes: ["court", "population"],
      involvedCharacters: characterIdsForNodes(working, ["court", "population"]),
      visibility: "private",
      knowledge: "witnessed",
      source: "player",
    }));
    syncStoryNodes(working);
    runInjector(working);
    checkAchievements(working);
    return working;
  }

  if (command.actionId === "council-speak") {
    return handleCouncilSpeak(working, command);
  }

  if (command.actionId === "study-story-node") {
    return handleStoryNodeStudy(working, command);
  }

  if (command.actionId === "sense-place" || command.actionId === "speak-local") {
    return handlePlaceAction(working, command.actionId, command);
  }

  const action = actionCards.find((card) => card.id === command.actionId);
  if (!action) return working;
  if (working.currentPlaceId) return working;

  working.turn += action.durationTurns || 1;
  working.currentSceneId = action.scene?.id || action.id;
  working.currentPlaceId = "";
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
  syncStoryNodes(working);

  runInjector(working);
  applyProxyCards(working);
  runFieldGenerator(working);
  updateMemoryLoad(working);
  checkAchievements(working);

  return working;
}

function traitTotal(traits) {
  return Object.values(traits).reduce((sum, value) => sum + value, 0);
}

function cloneWorld(world) {
  return {
    ...world,
    started: Boolean(world.started),
    currentSceneId: world.currentSceneId || "opening",
    currentPlaceId: world.currentPlaceId || "",
    locale: world.locale || "pt-BR",
    storyConfig: cloneJson(world.storyConfig || defaultStoryConfig()),
    generatedFrame: world.generatedFrame ? { ...world.generatedFrame } : null,
    achievements: [...(world.achievements || [])],
    storyNodes: (world.storyNodes || []).map((node) => ({ ...node, involvedNodes: [...(node.involvedNodes || [])], involvedCharacters: [...(node.involvedCharacters || [])] })),
    characters: (world.characters || []).map((person) => ({ ...person })),
    places: (world.places || []).map((place) => ({ ...place, details: { ...place.details }, nearbyNodes: [...place.nearbyNodes] })),
    nodes: world.nodes.map((node) => ({ ...node, profile: { ...node.profile } })),
    edges: world.edges.map((edge) => ({ ...edge })),
    prince: { ...world.prince, traits: { ...world.prince.traits } },
    logs: world.logs.map((log) => ({
      ...log,
      involvedCharacters: [...(log.involvedCharacters || [])],
      structural: log.structural ? { ...log.structural } : undefined,
    })),
    aiConfig: { ...world.aiConfig },
    lastProxyLogIds: [...(world.lastProxyLogIds || [])],
  };
}

function handlePlaceAction(world, actionId, command = {}) {
  const place = world.places.find((item) => item.id === world.currentPlaceId);
  if (!place) return world;

  world.turn += 1;
  world.currentSceneId = `place-action:${actionId}:${place.id}:${world.turn}`;
  const speaking = actionId === "speak-local";
  world.logs.push(makeLog({
    turn: world.turn,
    title: speaking ? `Quiet conversation in ${place.name}` : `Careful reading of ${place.name}`,
    summary: speaking
      ? `The prince asked one quiet question in ${place.name}, looking for what people know before they dare report it.`
      : `The prince stayed longer in ${place.name}, letting objects and silences arrange themselves into a warning.`,
    domainTags: speaking ? ["conversation", "place", "rumor"] : ["observation", "place", "evidence"],
    acesTags: ["memoryLoad", "participation"],
    involvedNodes: place.nearbyNodes,
    involvedCharacters: command.characterId ? [command.characterId] : characterIdsForNodes(world, place.nearbyNodes),
    visibility: "private",
    knowledge: speaking ? "rumor" : "witnessed",
    source: "player",
    actionId,
  }));
  syncStoryNodes(world);
  runInjector(world);
  applyProxyCards(world);
  runFieldGenerator(world);
  updateMemoryLoad(world);
  checkAchievements(world);
  return world;
}

function handleCouncilSpeak(world, command) {
  const person = world.characters.find((item) => item.id === command.characterId) || world.characters.find((item) => item.mainCounselor);
  if (!person || world.currentPlaceId) return world;
  world.turn += 1;
  world.currentSceneId = `council-speak:${person.id}:${world.turn}`;
  world.logs.push(makeLog({
    turn: world.turn,
    title: `${person.name} speaks in council`,
    summary: `${person.name} framed the danger publicly from the authority of ${person.institution}.`,
    domainTags: ["council", "institution", "speech"],
    acesTags: ["legitimacy", "participation", "memoryLoad"],
    involvedNodes: [person.nodeId, "court"],
    involvedCharacters: [person.id],
    visibility: "institutional",
    knowledge: "witnessed",
    source: "player",
    actionId: "council-speak",
  }));
  syncStoryNodes(world);
  runInjector(world);
  applyProxyCards(world);
  runFieldGenerator(world);
  updateMemoryLoad(world);
  checkAchievements(world);
  return world;
}

function handleStoryNodeStudy(world, command) {
  const title = command.storyNodeTitle || "a story node";
  const type = command.storyNodeType || "story";
  world.turn += 1;
  world.currentSceneId = `story-node:${command.storyNodeId || "unknown"}:${world.turn}`;
  world.logs.push(makeLog({
    turn: world.turn,
    title: `Focused attention on ${title}`,
    summary: `The prince held ${title} as a ${type} question long enough for the council to compare it against recent memory.`,
    domainTags: ["story-node", "attention", type],
    acesTags: ["memoryLoad", "reconstructability"],
    involvedNodes: inferStoryNodeInvolvedNodes(world, command.storyNodeId),
    involvedCharacters: inferStoryNodeInvolvedCharacters(world, command.storyNodeId),
    visibility: world.currentPlaceId ? "private" : "institutional",
    knowledge: "witnessed",
    source: "player",
    actionId: "study-story-node",
  }));
  syncStoryNodes(world);
  runInjector(world);
  applyProxyCards(world);
  runFieldGenerator(world);
  updateMemoryLoad(world);
  checkAchievements(world);
  return world;
}

function inferStoryNodeInvolvedNodes(world, storyNodeId = "") {
  if (storyNodeId.startsWith("person:")) {
    const person = world.characters.find((item) => `person:${item.id}` === storyNodeId);
    return person ? [person.nodeId] : ["court"];
  }
  if (storyNodeId.startsWith("place:")) {
    const place = world.places.find((item) => `place:${item.id}` === storyNodeId);
    return place?.nearbyNodes || ["court"];
  }
  if (storyNodeId.startsWith("log:")) {
    const log = world.logs.find((item) => `log:${item.id}` === storyNodeId);
    return log?.involvedNodes || ["court"];
  }
  if (storyNodeId.startsWith("threat:")) return world.generatedFrame.configuredThreat.involvedNodes || ["court"];
  if (storyNodeId.startsWith("delayed-threat:")) return world.generatedFrame.delayedThreat.involvedNodes || ["court"];
  return ["court"];
}

function inferStoryNodeInvolvedCharacters(world, storyNodeId = "") {
  if (storyNodeId.startsWith("person:")) {
    const person = world.characters.find((item) => `person:${item.id}` === storyNodeId);
    return person ? [person.id] : [];
  }
  if (storyNodeId.startsWith("log:")) {
    const log = world.logs.find((item) => `log:${item.id}` === storyNodeId);
    return log?.involvedCharacters || [];
  }
  return characterIdsForNodes(world, inferStoryNodeInvolvedNodes(world, storyNodeId));
}

function checkAchievements(world) {
  const unlockId = world.generatedFrame.hiddenUnlock.id;
  const privateReadings = world.logs.filter((log) => {
    return log.source === "player" && ["speak-local", "sense-place"].includes(log.actionId);
  });
  unlockAchievement(world, {
    id: "focused-story-node",
    title: "Focused the Thread",
    summary: "The prince turned a selected story node into recorded attention.",
    unlocks: ["clearer-story-node-reading"],
  }, world.logs.some((log) => log.actionId === "study-story-node"));

  const hasUnlocked = world.achievements.some((achievement) => achievement.id === unlockId);
  if (hasUnlocked) return;

  const visitedPlaces = new Set(world.logs.filter((log) => log.domainTags.includes("place")).flatMap((log) => log.involvedNodes));
  if (privateReadings.length < 2 || visitedPlaces.size < 3) return;

  const hidden = world.characters.find((person) => person.id === "person-hidden-counselor");
  if (hidden) {
    hidden.hidden = false;
    hidden.publicFace = true;
    hidden.mainCounselor = true;
  }
  unlockAchievement(world, {
    id: world.generatedFrame.hiddenUnlock.id,
    title: world.generatedFrame.hiddenUnlock.achievementTitle,
    summary: world.generatedFrame.hiddenUnlock.description,
    unlocks: ["hidden-counselor"],
  }, true);
  const unlockLog = makeLog({
    turn: world.turn,
    title: "A hidden counselor reveals herself",
    summary: `${hidden?.name || "A hidden counselor"} now attends the edge of council, carrying knowledge from rooms that official power forgot to count.`,
    domainTags: ["achievement", "councilor", "hidden"],
    acesTags: ["participation", "memoryLoad"],
    involvedNodes: ["court", "blackMarket"],
    involvedCharacters: hidden ? [hidden.id] : [],
    visibility: "private",
    knowledge: "witnessed",
    source: "achievement",
  });
  world.logs.push(unlockLog);
  syncStoryNodes(world);
}

function unlockAchievement(world, achievement, condition) {
  if (!condition) return false;
  if (world.achievements.some((item) => item.id === achievement.id)) return false;
  world.achievements.push({
    ...achievement,
    turn: world.turn,
  });
  return true;
}

function syncStoryNodes(world) {
  const existing = new Set((world.storyNodes || []).map((node) => node.logId));
  for (const log of world.logs) {
    if (existing.has(log.id)) continue;
    world.storyNodes.push(createStoryNode(log));
    existing.add(log.id);
  }
}

function characterIdsForNodes(world, nodeIds) {
  return world.characters
    .filter((person) => nodeIds.includes(person.nodeId))
    .map((person) => person.id);
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
    involvedCharacters: input.involvedCharacters || [],
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
  injectConfiguredDelayedThreat(world);

  for (const card of injectorCards) {
    if (world.turn > 1 && world.turn % card.everyTurns === 0) {
      const alreadyInjected = world.logs.some((log) => log.source === `injector:${card.id}` && log.turn === world.turn);
      if (alreadyInjected) continue;
      world.logs.push(makeLog({
        ...card,
        turn: world.turn,
        source: `injector:${card.id}`,
      }));
      syncStoryNodes(world);
    }
  }
}

function injectConfiguredDelayedThreat(world) {
  const threat = world.generatedFrame?.delayedThreat;
  if (!threat || world.turn < threat.entersOnTurn) return;
  const source = `configured-threat:${threat.id}`;
  const alreadyInjected = world.logs.some((log) => log.source === source);
  if (alreadyInjected) return;
  world.logs.push(makeLog({
    turn: world.turn,
    title: threat.name,
    summary: `${threat.description} It enters the story now because the configured turn has arrived.`,
    domainTags: ["threat", "delayed", "external"],
    acesTags: ["tension", "legitimacy", "memoryLoad"],
    involvedNodes: threat.involvedNodes || ["court", "population"],
    involvedCharacters: characterIdsForNodes(world, threat.involvedNodes || ["court", "population"]),
    visibility: "local",
    knowledge: "rumor",
    source,
  }));
  syncStoryNodes(world);
}

function normalizeStoryConfig(config) {
  const defaults = defaultStoryConfig();
  const delayedThreatTurn = Math.max(3, Math.min(20, Number(config.delayedThreatTurn) || 6));
  const rawCounselors = Array.isArray(config.counselorNodeIds) ? config.counselorNodeIds : ["court", "church"];
  const counselorNodeIds = [];
  for (const nodeId of rawCounselors) {
    if (counselorOptions.some((item) => item.nodeId === nodeId) && !counselorNodeIds.includes(nodeId)) {
      counselorNodeIds.push(nodeId);
    }
  }
  for (const fallback of ["court", "church", "military", "merchants", "blackMarket", "population"]) {
    if (counselorNodeIds.length >= 2) break;
    if (!counselorNodeIds.includes(fallback)) counselorNodeIds.push(fallback);
  }
  return {
    ...defaults,
    ...config,
    themeId: validOption(config.themeId, themeOptions, defaults.themeId),
    counselorNodeIds: counselorNodeIds.slice(0, 2),
    configuredThreatId: validOption(config.configuredThreatId, configuredThreatOptions, defaults.configuredThreatId),
    delayedThreatId: validOption(config.delayedThreatId, delayedThreatOptions, defaults.delayedThreatId),
    delayedThreatTurn,
    hiddenUnlockId: validOption(config.hiddenUnlockId, hiddenUnlockOptions, defaults.hiddenUnlockId),
    generationSlack: normalizeGenerationSlack(config.generationSlack, defaults.generationSlack),
  };
}

function normalizeGenerationSlack(input = {}, defaults = {}) {
  const raw = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const pools = raw.representativePools && typeof raw.representativePools === "object" && !Array.isArray(raw.representativePools)
    ? raw.representativePools
    : {};
  return {
    ...defaults,
    ...raw,
    princeNames: validStringList(raw.princeNames, defaults.princeNames),
    representativePools: Object.fromEntries(
      Object.entries(defaults.representativePools || {}).map(([nodeId, names]) => [nodeId, validStringList(pools[nodeId], names)])
    ),
    winterPressures: validStringList(raw.winterPressures, defaults.winterPressures),
    generatedThreats: validStringList(raw.generatedThreats, defaults.generatedThreats),
    placeNamePrefixes: validStringList(raw.placeNamePrefixes, defaults.placeNamePrefixes),
    placeNameCores: validStringList(raw.placeNameCores, defaults.placeNameCores),
    allowGeneratedPlaceNames: raw.allowGeneratedPlaceNames !== false,
    allowGeneratedCounselorNames: raw.allowGeneratedCounselorNames !== false,
    allowGeneratedThreatSeed: raw.allowGeneratedThreatSeed !== false,
    descriptionMode: String(raw.descriptionMode || defaults.descriptionMode || "field-sensed"),
  };
}

function validStringList(input, fallback = []) {
  if (!Array.isArray(input)) return [...fallback];
  const values = input.map((item) => String(item).trim()).filter(Boolean);
  return values.length ? values : [...fallback];
}

function validOption(value, options, fallback) {
  return options.some((item) => item.id === value) ? value : fallback;
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
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

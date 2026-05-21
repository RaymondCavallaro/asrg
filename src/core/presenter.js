import { actionCards } from "../game/cards.js";
import { buildAiPresentationContext } from "./aiContext.js";
import { getAvailableActions } from "./actions.js";
import { getRelevantStoryNodes, getStoryNodePersonId } from "./storyNodes.js";

export function presentReading(world, reading, selectedStoryNodeId = "") {
  const center = world.nodes.find((node) => node.id === reading.centerNodeId);
  const scene = buildScene(world, center, reading);
  const advisorLines = world.advisors.map((advisor) => advisorLine(advisor, reading));
  const sceneCues = buildSceneCues(world, reading);
  const { storyNodes, selectedStoryNode } = getRelevantStoryNodes(world, reading, selectedStoryNodeId);
  const selectedPersonId = getStoryNodePersonId(selectedStoryNode);
  const actions = getAvailableActions(world, reading, selectedPersonId, selectedStoryNode);
  const aiContext = buildAiPresentationContext(world, reading, selectedStoryNode);

  return {
    scene,
    advisorLines,
    sceneCues,
    actions,
    storyNodes,
    selectedStoryNode,
    selectedPersonId,
    aiContext,
    aiModeNotice: aiModeNotice(world.aiConfig),
  };
}

function buildScene(world, center, reading) {
  const place = world.places.find((item) => item.id === world.currentPlaceId);
  if (place && world.currentSceneId.startsWith(`place:${place.id}:`)) {
    return buildPlaceScene(world, place, reading);
  }

  if (place && world.currentSceneId.startsWith("place-action:")) {
    return buildPlaceActionScene(world, place, reading);
  }

  if (world.currentSceneId.startsWith("council-return:")) {
    return buildCouncilReturnScene(world, center, reading);
  }

  if (world.currentSceneId.startsWith("council-speak:")) {
    return buildCouncilSpeakScene(world, center, reading);
  }

  if (world.currentSceneId.startsWith("story-node:")) {
    return buildStoryNodeScene(world, center, reading);
  }

  const lastAction = [...world.logs].reverse().find((log) => log.source === "player");
  const action = lastAction ? actionCards.find((card) => card.id === lastAction.actionId) : null;
  if (action?.scene && world.currentSceneId === action.scene.id) {
    return personalizeScene(action.scene, world);
  }

  const openingLog = world.logs.find((log) => log.turn === 0);
  return {
    id: "opening",
    title: "The first winter council",
    body: [
      `You are ${world.prince.name}, and this morning the throne is not empty exactly. It is worse: your father still lives, but cannot rise from his bed.`,
      "Beyond the council doors, snow makes the city look gentler than it is. The merchants say supply is orderly. The kitchen says flour arrives with old dust. The chapel asks permission to open its stores. The general wants visible patrols before the market invents its own law.",
      `This story is ${world.generatedFrame.theme.name}: ${world.generatedFrame.theme.description}`,
      `One danger is already named: ${world.generatedFrame.configuredThreat.name}. Another has not yet become policy, only a strange sign: ${world.generatedFrame.generatedThreat}.`,
      `${world.generatedFrame.delayedThreat.name} is configured to enter on turn ${world.generatedFrame.delayedThreat.entersOnTurn}. Until then, it waits outside the room.`,
      openingLog?.summary || "The realm waits to learn what kind of ruler has entered the room."
    ],
    result: `${center.representative} is the nearest face of this pressure. No one is asking you to solve the kingdom. Not yet. They are asking where your attention falls first.`,
    focusNodeId: center.id,
  };
}

function buildStoryNodeScene(world, center, reading) {
  const latest = [...world.logs].reverse().find((log) => log.actionId === "study-story-node");
  const recent = reading.logs.find((log) => log.id !== latest?.id);
  return {
    id: "story-node-study",
    title: latest?.title || "A story node comes into focus",
    body: [
      latest?.summary || "The prince holds one piece of the story still long enough for its edges to become visible.",
      recent
        ? `The comparison pulls nearby memory toward "${recent.title}".`
        : "No single record answers it. The value is in noticing what refuses to connect.",
      "Attention is not neutral in a court. What the prince studies becomes safer to name and harder to ignore.",
    ],
    result: "The world has not yielded a verdict, but the selected story node now has a turn of attention in the record.",
    focusNodeId: latest?.involvedNodes?.[0] || center.id,
  };
}

function buildCouncilSpeakScene(world, center, reading) {
  const latest = [...world.logs].reverse().find((log) => log.actionId === "council-speak");
  const personId = latest?.involvedCharacters?.[0];
  const person = world.characters.find((item) => item.id === personId);
  return {
    id: "council-speak",
    title: person ? `${person.name} takes the room` : "A counselor takes the room",
    body: [
      person
        ? `${person.name} rises with the careful posture of ${person.institution}.`
        : "A counselor rises with the careful posture of an institution pretending to be one voice.",
      "Speaking in council changes the statement. It is no longer a private worry, nor a corridor rumor. It becomes something witnesses can remember against you later.",
      latest ? latest.summary : "The room listens, and because everyone listens, everyone edits what they will admit they heard.",
    ],
    result: "The same words would have meant something else alone. In public, they become alignment, pressure, and future blame.",
    focusNodeId: person?.nodeId || center.id,
  };
}

function personalizeScene(scene, world) {
  const merchant = representative(world, "merchants");
  const merchantShort = shortName(merchant);
  const church = representative(world, "church");
  const military = representative(world, "military");
  const population = representative(world, "population");

  const replace = (text) => text
    .replaceAll("Guildmaster Varro", merchant)
    .replaceAll("Varro", merchantShort)
    .replaceAll("Archbishop Sera", church)
    .replaceAll("Captain Rusk", military)
    .replaceAll("Cook Elian", population);

  return {
    ...scene,
    body: scene.body.map(replace),
    result: replace(scene.result),
  };
}

function representative(world, nodeId) {
  return world.nodes.find((node) => node.id === nodeId)?.representative || "someone";
}

function shortName(name) {
  return name.split(" ").at(-1) || name;
}

function buildCouncilReturnScene(world, center, reading) {
  const latest = reading.logs[0];
  return {
    id: "council-return",
    title: "Back beneath the painted rafters",
    body: [
      "The council table is exactly where you left it. That is the first lie of power: rooms pretend nothing happened while you were away.",
      `Your advisers turn as you enter. ${center.representative} watches your face before asking what you learned.`,
      latest ? `The newest trace in your mind is "${latest.title}." It is not yet law, accusation, or policy. It is a thing the realm accidentally showed you.` : "You return with impressions, and impressions have weight before they have names.",
    ],
    result: "Formal action is possible again. What you sensed elsewhere can now become pressure, mercy, investigation, or denial.",
    focusNodeId: center.id,
  };
}

function buildPlaceScene(world, place, reading) {
  const mood = placeMood(reading);
  const recent = reading.logs.find((log) => log.source !== "player") || reading.logs[0];
  const detail = place.details[mood] || place.details.calm;
  const person = generatedPerson(world, place, reading);
  const clue = generatedClue(world, reading, recent);

  return {
    id: `place:${place.id}`,
    title: place.name,
    body: [
      detail,
      `${person.name} is here, ${person.description}. ${person.line}`,
      clue,
    ],
    result: "This is not a formal report. It is the realm leaking through stone, steam, posture, and habit.",
    focusNodeId: place.nearbyNodes[0],
  };
}

function buildPlaceActionScene(world, place, reading) {
  const speaking = world.currentSceneId.startsWith("place-action:speak-local");
  const recent = reading.logs[0];
  const person = generatedPerson(world, place, reading);
  return {
    id: `place-action:${place.id}`,
    title: speaking ? `A quiet question in ${place.name}` : `A longer look at ${place.name}`,
    body: speaking
      ? [
          `${person.name} does not answer immediately. In a castle, even silence checks who owns the walls.`,
          `${person.line} When you do not interrupt, the answer becomes less polished and more useful.`,
          recent ? `The conversation bends toward "${recent.title}", though no one calls it evidence yet.` : "What emerges is small: a pause, a glance, a corrected word. Small things travel far in winter.",
        ]
      : [
          `You stay until the place stops performing itself. ${place.details[placeMood(reading)] || place.details.calm}`,
          "Objects begin to sort themselves into loyalties: who touched what, who avoided which door, which work was done twice.",
          recent ? `Everything points back, softly, to "${recent.title}".` : "No single clue rises. Instead, the room lowers its mask by a finger's width.",
        ],
    result: speaking ? "You have not forced truth. You have made a little more room for it." : "Observation changes nothing official, but it changes what future official words can mean.",
    focusNodeId: place.nearbyNodes[0],
  };
}

function placeMood(reading) {
  if (reading.profile.tension >= 58) return "tense";
  if (reading.profile.optionality <= 40 || reading.profile.legitimacy <= 44) return "hungry";
  if (reading.unstableEdges.some((edge) => edge.secrecy > 65 || edge.distortion > 48)) return "secret";
  return "calm";
}

function generatedPerson(world, place, reading) {
  const names = ["Mira", "Tovan", "Elric", "Sella", "Borin", "Nessa"];
  const roles = {
    "old-well-yard": ["scullery runner", "flour porter", "laundry girl"],
    "chapel-kitchen": ["novice", "soup server", "widow volunteer"],
    "ledger-stair": ["junior clerk", "wax boy", "porter"],
    "barracks-gate": ["tired recruit", "gate corporal", "armorer's helper"],
  };
  const localRoles = roles[place.id] || ["passerby"];
  const seed = (world.turn + place.id.length + reading.logs.length) % names.length;
  const metric = reading.dominant[0]?.metric || "tension";
  const lines = {
    legitimacy: "They lower their voice before saying the crown's name.",
    tension: "They keep glancing toward the nearest exit.",
    optionality: "They speak as if every choice has already been sold to someone else.",
    concentration: "They mention one office, one gate, one signature too often.",
    memoryLoad: "They answer today's question with yesterday's injury.",
  };
  return {
    name: names[seed],
    description: `a ${localRoles[seed % localRoles.length]}`,
    line: lines[metric] || "They seem to know more through habit than through proof.",
  };
}

function generatedClue(world, reading, recent) {
  const perception = world.prince.traits.perception;
  const edge = reading.unstableEdges[0];
  if (perception >= 60 && edge) {
    return `You notice the path between ${edgeName(world, edge.from)} and ${edgeName(world, edge.to)} carrying too much silence for an ordinary day.`;
  }
  if (recent) {
    return `The place keeps returning to one trace: "${recent.title}." No one says it plainly, but the room is arranged around it.`;
  }
  return "Nothing declares itself. That is also a kind of answer.";
}

function edgeName(world, nodeId) {
  return world.nodes.find((node) => node.id === nodeId)?.name || nodeId;
}

function advisorLine(advisor, reading) {
  const watched = reading.dominant.find((item) => advisor.watches.includes(item.metric)) || reading.dominant[0];
  const recent = reading.logs[0];

  const prefix = {
    steward: "Ledgers do not lie, Your Grace, but clerks often teach them silence.",
    spymaster: "The contradiction matters more than the official report.",
    general: "A hungry square is still a square. Wait too long and it becomes terrain.",
    archbishop: "People obey longer when suffering still has meaning.",
  }[advisor.id] || "The pattern deserves attention.";

  const logPart = recent ? ` I would begin with "${recent.title}."` : "";
  return {
    advisorId: advisor.id,
    name: advisor.name,
    role: advisor.role,
    text: `${prefix}${toneFor(watched.metric, watched.band)}${logPart}`,
  };
}

function toneFor(metric, band) {
  const phrases = {
    legitimacy: {
      depleted: " The room no longer believes the crown is listening.",
      weak: " The crown is being obeyed more than trusted.",
      mixed: " The crown still has room to speak.",
      strong: " The crown's word carries warmth today.",
      dominant: " The crown could spend trust, if it must.",
    },
    tension: {
      quiet: " The street is quiet enough to hear what it refuses to say.",
      contained: " The city is holding its breath, not yet its knife.",
      present: " The mood is workable, but not soft.",
      pressured: " The market is close to choosing its own explanation.",
      volatile: " A small spark would find dry straw.",
    },
    concentration: {
      quiet: " Power is still spread widely enough to bend.",
      contained: " A few hands are becoming too necessary.",
      present: " The realm is leaning on narrow supports.",
      pressured: " One locked gate could stop too much motion.",
      volatile: " Too many roads now pass through too few doors.",
    },
    memoryLoad: {
      quiet: " Old injuries are not speaking loudly today.",
      contained: " Some old injuries are waiting for a familiar shape.",
      present: " The present is beginning to borrow words from the past.",
      pressured: " People are remembering in factions.",
      volatile: " The past has entered the room as an adviser.",
    },
  };
  return phrases[metric]?.[band] || ` The sign is ${band}, but it should be read through people, not tables.`;
}

function buildSceneCues(world, reading) {
  const cues = [];
  const tension = reading.profile.tension;
  const legitimacy = reading.profile.legitimacy;
  const memory = reading.profile.memoryLoad;
  const perception = world.prince.traits.perception;

  if (tension >= 60) cues.push("People keep their voices low, but the silences arrive too quickly.");
  if (legitimacy <= 42) cues.push("Formal greetings are still correct. The warmth has thinned.");
  if (memory >= 55) cues.push("Old incidents return in new words, as if the region has not finished remembering them.");
  if (perception >= 55 && reading.unstableEdges.length > 0) {
    const edge = reading.unstableEdges[0];
    cues.push(`You notice the ${edge.type} channel carrying more distortion than trust.`);
  }
  if (cues.length === 0) cues.push("The room is readable, but not yet honest.");

  return cues;
}

function aiModeNotice(config) {
  if (config.mode === "local") return "Local Browser AI is selected, but this prototype currently uses template presentation until WebLLM is wired in.";
  if (config.mode === "custom") return config.hasApiKey
    ? "Custom API mode is selected. The key is acknowledged locally, but calls are not wired yet."
    : "Custom API mode is selected. Add a key later to enable cloud presentation.";
  return "Template Presenter mode is active. No external AI is required.";
}

export function describeNode(node) {
  return `${node.representative}: ${node.description}`;
}

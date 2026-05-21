import { t } from "../i18n.js";
import { getPersonLogs, getPresentPeople } from "./people.js";

export function getRelevantStoryNodes(world, reading, selectedStoryNodeId = "") {
  const locale = world.locale || "pt-BR";
  const nodes = [
    currentPlaceNode(world, reading, locale),
    ...getPresentPeople(world).map((person) => personNode(world, person, locale)),
    ...reading.logs.slice(0, 5).map((log) => logNode(world, log, locale)),
    threatNode(world, locale),
    delayedThreatNode(world, locale),
    ...world.achievements.map((achievement) => achievementNode(achievement, locale)),
  ].filter(Boolean);

  const selected = nodes.find((node) => node.id === selectedStoryNodeId) || nodes[0] || null;
  return { storyNodes: nodes, selectedStoryNode: selected };
}

export function getStoryNodePersonId(storyNode) {
  return storyNode?.personId || "";
}

function currentPlaceNode(world, reading, locale) {
  if (!world.currentPlaceId) return null;
  const place = world.places.find((item) => item.id === world.currentPlaceId);
  if (!place) return null;
  const dominant = reading.dominant[0];
  return {
    id: `place:${place.id}`,
    type: "place",
    typeLabel: t(locale, "storyTypePlace"),
    title: place.name,
    subtitle: place.tagline,
    details: [
      place.details.calm,
      dominant ? `${dominant.label}: ${dominant.band}.` : "",
      locale === "pt-BR"
        ? `Sistemas proximos: ${place.nearbyNodes.map((nodeId) => nodeName(world, nodeId)).join(", ")}.`
        : `Nearby systems: ${place.nearbyNodes.map((nodeId) => nodeName(world, nodeId)).join(", ")}.`,
    ].filter(Boolean),
    logs: reading.logs.filter((log) => log.involvedNodes.some((nodeId) => place.nearbyNodes.includes(nodeId))).slice(0, 4),
  };
}

function personNode(world, person, locale) {
  const logs = getPersonLogs(world, person.id).slice(0, 5);
  return {
    id: `person:${person.id}`,
    type: "person",
    typeLabel: t(locale, "storyTypePerson"),
    personId: person.id,
    title: person.name,
    subtitle: person.role,
    details: [
      locale === "pt-BR" ? `${person.name} e a face atual de ${person.institution}.` : `${person.name} is the current face of ${person.institution}.`,
      person.mainCounselor
        ? (locale === "pt-BR" ? "Esta pessoa pode moldar a fala formal do conselho." : "This person can shape formal council speech.")
        : (locale === "pt-BR" ? "Esta pessoa esta visivel pela situacao atual, mas nao e uma voz principal do conselho." : "This person is visible through the current situation, but not a main council voice."),
      locale === "pt-BR" ? `Sistema ligado: ${nodeName(world, person.nodeId)}.` : `Linked system: ${nodeName(world, person.nodeId)}.`,
    ],
    logs,
  };
}

function logNode(world, log, locale) {
  return {
    id: `log:${log.id}`,
    type: "log",
    typeLabel: t(locale, "storyTypeLog"),
    title: log.title,
    subtitle: `${locale === "pt-BR" ? "Turno" : "Turn"} ${log.turn} / ${log.visibility} / ${log.knowledge}`,
    details: [
      log.summary,
      log.involvedNodes.length
        ? (locale === "pt-BR" ? `Sistemas tocados: ${log.involvedNodes.map((nodeId) => nodeName(world, nodeId)).join(", ")}.` : `Systems touched: ${log.involvedNodes.map((nodeId) => nodeName(world, nodeId)).join(", ")}.`)
        : "",
      log.involvedCharacters.length
        ? (locale === "pt-BR" ? `Pessoas tocadas: ${log.involvedCharacters.map((personId) => personName(world, personId)).join(", ")}.` : `People touched: ${log.involvedCharacters.map((personId) => personName(world, personId)).join(", ")}.`)
        : "",
    ].filter(Boolean),
    logs: [log],
  };
}

function threatNode(world, locale) {
  const threat = world.generatedFrame?.configuredThreat;
  if (!threat) return null;
  return {
    id: `threat:${threat.id}`,
    type: "threat",
    typeLabel: t(locale, "storyTypeThreat"),
    title: threat.name,
    subtitle: threat.description,
    details: [
      threat.description,
      locale === "pt-BR" ? `Caminho solto: ${threat.pathNodes?.join(" -> ") || "nao especificado"}.` : `Loose path: ${threat.pathNodes?.join(" -> ") || "not specified"}.`,
      locale === "pt-BR" ? `Sistemas tocados: ${(threat.involvedNodes || []).map((nodeId) => nodeName(world, nodeId)).join(", ")}.` : `Systems touched: ${(threat.involvedNodes || []).map((nodeId) => nodeName(world, nodeId)).join(", ")}.`,
    ],
    logs: world.logs.filter((log) => (threat.involvedNodes || []).some((nodeId) => log.involvedNodes.includes(nodeId))).slice(-4).reverse(),
  };
}

function delayedThreatNode(world, locale) {
  const threat = world.generatedFrame?.delayedThreat;
  if (!threat) return null;
  return {
    id: `delayed-threat:${threat.id}`,
    type: "threat",
    typeLabel: t(locale, "storyTypeThreat"),
    title: threat.name,
    subtitle: locale === "pt-BR" ? `Entra no turno ${threat.entersOnTurn}` : `Enters on turn ${threat.entersOnTurn}`,
    details: [
      threat.description,
      world.turn >= threat.entersOnTurn
        ? (locale === "pt-BR" ? "Esta ameaca entrou na historia." : "This threat has entered the story.")
        : (locale === "pt-BR" ? "Esta ameaca esta configurada, mas ainda nao entrou na sala." : "This threat is configured, but has not entered the room yet."),
      locale === "pt-BR" ? `Sistemas tocados: ${(threat.involvedNodes || []).map((nodeId) => nodeName(world, nodeId)).join(", ")}.` : `Systems touched: ${(threat.involvedNodes || []).map((nodeId) => nodeName(world, nodeId)).join(", ")}.`,
    ],
    logs: world.logs.filter((log) => log.source === `configured-threat:${threat.id}`),
  };
}

function achievementNode(achievement, locale) {
  return {
    id: `achievement:${achievement.id}`,
    type: "achievement",
    typeLabel: t(locale, "storyTypeAchievement"),
    title: achievement.title,
    subtitle: `${t(locale, "unlockedOnTurn")} ${achievement.turn}`,
    details: [achievement.summary],
    logs: [],
  };
}

function nodeName(world, nodeId) {
  return world.nodes.find((node) => node.id === nodeId)?.name || nodeId;
}

function personName(world, personId) {
  return world.characters.find((person) => person.id === personId)?.name || personId;
}

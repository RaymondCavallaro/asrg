import { actionCards } from "../game/cards.js";
import { bandFor, metricLabel } from "./aces.js";

export function presentReading(world, reading) {
  const center = world.nodes.find((node) => node.id === reading.centerNodeId);
  const lead = buildLead(center, reading);
  const advisorLines = world.advisors.map((advisor) => advisorLine(advisor, reading));
  const sceneCues = buildSceneCues(world, reading);
  const actions = actionCards.map((card) => ({
    id: card.id,
    label: card.label,
    detail: card.detail,
    structural: card.structural,
  }));

  return {
    lead,
    advisorLines,
    sceneCues,
    actions,
    aiModeNotice: aiModeNotice(world.aiConfig),
  };
}

function buildLead(center, reading) {
  const first = reading.dominant[0];
  const second = reading.dominant[1];
  return `${center.name} feels ${first.band} around ${first.label.toLowerCase()}. ${second.label} reads as ${second.band}, but the causes remain partly filtered through reports and rumor.`;
}

function advisorLine(advisor, reading) {
  const watched = reading.dominant.find((item) => advisor.watches.includes(item.metric)) || reading.dominant[0];
  const recent = reading.logs[0];

  const prefix = {
    steward: "The numbers are beginning to describe a behavior, not an accident.",
    spymaster: "The contradiction matters more than the report.",
    general: "Pressure without a channel becomes a security problem.",
    archbishop: "People obey longer when suffering still has meaning.",
  }[advisor.id] || "The pattern deserves attention.";

  const logPart = recent ? ` The latest useful trace is "${recent.title}."` : "";
  return {
    advisorId: advisor.id,
    name: advisor.name,
    role: advisor.role,
    text: `${prefix} I read ${metricLabel(watched.metric).toLowerCase()} as ${watched.band}.${logPart}`,
  };
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
  const top = ["legitimacy", "tension", "optionality", "concentration"]
    .map((metric) => `${metricLabel(metric)}: ${bandFor(metric, node.profile[metric])}`)
    .join(" / ");
  return `${node.representative}: ${top}`;
}

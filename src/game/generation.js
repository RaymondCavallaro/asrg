import { generatePlaces } from "./places.js";

const princeNames = ["Alaric", "Edric", "Cassian", "Rowan", "Marek"];

const representatives = {
  court: ["Steward Maran", "Chancellor Vale", "Lady Seneschal Orra"],
  population: ["Cook Elian", "Baker Toma", "Washerwoman Sella"],
  merchants: ["Guildmaster Varro", "Factor Brenn", "Mistress Caldra"],
  church: ["Archbishop Sera", "Prior Elowen", "Canon Mirel"],
  military: ["General Odran", "Captain Rusk", "Marshal Tovan"],
  blackMarket: ["Tavern Broker Nessa", "Dock Rat Ivo", "Smuggler Aunt Mire"],
};

const winterPressures = [
  "flour arrives with old dust around the mouth of the sacks",
  "the outer villages send carts later than the bells expect",
  "market prayers have become shorter and sharper",
  "the castle kitchens count twice before serving once",
];

export const themeOptions = [
  {
    id: "winter-court",
    name: "Winter Court",
    description: "Medieval palace governance under hunger, ritual, and brittle legitimacy.",
  },
  {
    id: "modern-feudal",
    name: "Modern Feudal City",
    description: "A crown, ministries, cameras, old blood, and modern logistics in the same cold capital.",
  },
  {
    id: "border-principality",
    name: "Border Principality",
    description: "A small realm where trade roads, refugees, and neighboring powers press against the castle.",
  },
];

export const counselorOptions = [
  { id: "court", name: "Court Steward", nodeId: "court", institution: "Chancery and treasury offices" },
  { id: "church", name: "High Cleric", nodeId: "church", institution: "Church kitchens, shrines, and moral courts" },
  { id: "military", name: "Military Captain", nodeId: "military", institution: "Barracks, patrol routes, and gate authority" },
  { id: "merchants", name: "Merchant Factor", nodeId: "merchants", institution: "Guild ledgers, warehouses, and trade roads" },
  { id: "blackMarket", name: "Shadow Broker", nodeId: "blackMarket", institution: "Taverns, smugglers, coded debts, and favors" },
  { id: "population", name: "Household Witness", nodeId: "population", institution: "Kitchens, servants, market families, and rumor" },
];

export const configuredThreatOptions = [
  {
    id: "grain-conspiracy",
    name: "The Sealed Granaries",
    description: "Someone is redirecting grain before the city can count it.",
    pathNodes: ["missing wagons", "false ledgers", "warehouse seals", "public accusation"],
    involvedNodes: ["merchants", "population", "blackMarket"],
  },
  {
    id: "succession-whisper",
    name: "The Spare Heir Whisper",
    description: "A claim about succession begins as a joke and travels like doctrine.",
    pathNodes: ["court joke", "chapel genealogy", "noble dinner", "public doubt"],
    involvedNodes: ["court", "church", "military"],
  },
  {
    id: "border-tribute",
    name: "The Border Tribute Demand",
    description: "A neighboring power tests whether the prince can be made to pay for peace.",
    pathNodes: ["foreign letter", "merchant panic", "military argument", "winter ultimatum"],
    involvedNodes: ["court", "military", "merchants"],
  },
];

export const delayedThreatOptions = [
  {
    id: "fever-caravan",
    name: "The Fever Caravan",
    description: "A caravan reaches the city with sick children and contradictory papers.",
    involvedNodes: ["population", "church", "merchants"],
  },
  {
    id: "foreign-claimant",
    name: "The Foreign Claimant",
    description: "A polished envoy arrives with a genealogy and soldiers waiting beyond the river.",
    involvedNodes: ["court", "military", "church"],
  },
  {
    id: "machine-audit",
    name: "The Ministry Audit",
    description: "Modern inspectors arrive with seals, cameras, and authority older law does not understand.",
    involvedNodes: ["court", "merchants", "population"],
  },
];

export const hiddenUnlockOptions = [
  {
    id: "hidden-rooms-counselor",
    achievementTitle: "Heard the Hidden Rooms",
    hiddenCounselorNames: ["The Quiet Auditor", "Mistress Under-Stairs", "The Candle Clerk"],
    description: "A hidden counselor emerges if the prince learns from rooms and people outside formal council.",
  },
  {
    id: "ledger-ghost-counselor",
    achievementTitle: "Found the Ledger Ghost",
    hiddenCounselorNames: ["The Red Ink Clerk", "The Missing Notary", "The Archive Widow"],
    description: "A hidden counselor emerges through repeated evidence, ledgers, and institutional memory.",
  },
  {
    id: "street-ear-counselor",
    achievementTitle: "Won the Street Ear",
    hiddenCounselorNames: ["The Alley Listener", "The Breadline Aunt", "The Bell-Step Child"],
    description: "A hidden counselor emerges through public mood, rumor, hunger, and street-level trust.",
  },
];

const generatedThreats = [
  "a children's counting rhyme begins naming warehouses before adults do",
  "someone is buying candle wax faster than the chapel can burn it",
  "a dead courier's boots are found dry after a night of snow",
  "market singers all forget the same verse on the same morning",
];

const generationSlack = {
  princeNames,
  representativePools: representatives,
  winterPressures,
  generatedThreats,
  placeNamePrefixes: ["Old", "Lower", "North", "Candlelit", "Winter", "Forgotten"],
  placeNameCores: ["Well Yard", "Ledger Stair", "Chapel Kitchen", "Barracks Gate", "Archive Niche", "Servant Passage"],
  allowGeneratedPlaceNames: true,
  allowGeneratedCounselorNames: true,
  allowGeneratedThreatSeed: true,
  descriptionMode: "field-sensed-medieval-governance",
};

export const storyConfigSchema = {
  type: "object",
  required: [
    "themeId",
    "counselorNodeIds",
    "configuredThreatId",
    "delayedThreatId",
    "delayedThreatTurn",
    "hiddenUnlockId",
    "generationSlack",
  ],
  properties: {
    themeId: {
      type: "string",
      enum: themeOptions.map((item) => item.id),
    },
    counselorNodeIds: {
      type: "array",
      minItems: 2,
      maxItems: 2,
      uniqueItems: true,
      items: {
        type: "string",
        enum: counselorOptions.map((item) => item.nodeId),
      },
    },
    configuredThreatId: {
      type: "string",
      enum: configuredThreatOptions.map((item) => item.id),
    },
    delayedThreatId: {
      type: "string",
      enum: delayedThreatOptions.map((item) => item.id),
    },
    delayedThreatTurn: {
      type: "integer",
      minimum: 3,
      maximum: 20,
    },
    hiddenUnlockId: {
      type: "string",
      enum: hiddenUnlockOptions.map((item) => item.id),
    },
    generationSlack: {
      type: "object",
      description: "Explicit loose material the generator may draw from when creating a session.",
      properties: {
        princeNames: { type: "array", items: { type: "string" } },
        representativePools: {
          type: "object",
          description: "Dictionary from managed node id to possible character names.",
          properties: Object.fromEntries(
            counselorOptions.map((item) => [item.nodeId, { type: "array", items: { type: "string" } }])
          ),
          additionalProperties: false,
        },
        winterPressures: { type: "array", items: { type: "string" } },
        generatedThreats: { type: "array", items: { type: "string" } },
        placeNamePrefixes: { type: "array", items: { type: "string" } },
        placeNameCores: { type: "array", items: { type: "string" } },
        allowGeneratedPlaceNames: { type: "boolean" },
        allowGeneratedCounselorNames: { type: "boolean" },
        allowGeneratedThreatSeed: { type: "boolean" },
        descriptionMode: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
};

export function defaultStoryConfig() {
  return {
    themeId: "winter-court",
    counselorNodeIds: ["court", "church"],
    configuredThreatId: "grain-conspiracy",
    delayedThreatId: "fever-caravan",
    delayedThreatTurn: 6,
    hiddenUnlockId: "hidden-rooms-counselor",
    generationSlack,
  };
}

export function generateStartFrame(config = defaultStoryConfig()) {
  const slack = { ...generationSlack, ...(config.generationSlack || {}) };
  const availablePrinceNames = validList(slack.princeNames, princeNames);
  const availableWinterPressures = validList(slack.winterPressures, winterPressures);
  const availableGeneratedThreats = validList(slack.generatedThreats, generatedThreats);
  const representativePools = mergeRepresentativePools(slack.representativePools);
  const princeName = availablePrinceNames[randomIndex(availablePrinceNames)];
  const selectedRepresentatives = Object.fromEntries(
    Object.entries(representativePools).map(([nodeId, names]) => [
      nodeId,
      slack.allowGeneratedCounselorNames === false ? names[0] : names[randomIndex(names)],
    ])
  );
  const configuredThreat = configuredThreatOptions.find((threat) => threat.id === config.configuredThreatId) || configuredThreatOptions[0];
  const delayedThreat = delayedThreatOptions.find((threat) => threat.id === config.delayedThreatId) || delayedThreatOptions[0];
  const hiddenUnlock = hiddenUnlockOptions.find((unlock) => unlock.id === config.hiddenUnlockId) || hiddenUnlockOptions[0];
  const theme = themeOptions.find((item) => item.id === config.themeId) || themeOptions[0];
  return {
    theme,
    princeName: `Prince ${princeName}`,
    winterPressure: availableWinterPressures[randomIndex(availableWinterPressures)],
    generatedThreat: slack.allowGeneratedThreatSeed === false ? configuredThreat.description : availableGeneratedThreats[randomIndex(availableGeneratedThreats)],
    hiddenCounselor: {
      id: "person-hidden-counselor",
      nodeId: "blackMarket",
      name: hiddenUnlock.hiddenCounselorNames[randomIndex(hiddenUnlock.hiddenCounselorNames)],
      role: "hidden counselor",
      institution: "unofficial rooms, copied keys, and remembered conversations",
      publicFace: false,
      mainCounselor: false,
      hidden: true,
    },
    hiddenUnlock,
    configuredThreat,
    delayedThreat: {
      ...delayedThreat,
      entersOnTurn: Number(config.delayedThreatTurn) || 6,
    },
    representatives: selectedRepresentatives,
    characters: buildCharacters(selectedRepresentatives, config),
    places: generatePlaces(slack),
  };
}

function buildCharacters(selectedRepresentatives, config) {
  const main = new Set(config.counselorNodeIds || []);
  return Object.entries(selectedRepresentatives).map(([nodeId, name]) => ({
    id: `person-${nodeId}`,
    nodeId,
    name,
    role: characterRole(nodeId, name),
    institution: counselorOptions.find((item) => item.nodeId === nodeId)?.institution || "informal influence",
    publicFace: true,
    mainCounselor: main.has(nodeId),
  }));
}

function characterRole(nodeId, name) {
  if (name.includes("Cook") || name.includes("Baker") || name.includes("Washerwoman")) return "common witness";
  return {
    court: "councilor of court",
    merchants: "merchant representative",
    church: "religious counselor",
    military: "military counselor",
    blackMarket: "shadow contact",
    population: "voice of the household",
  }[nodeId] || "local figure";
}

function randomIndex(items) {
  return Math.floor(Math.random() * items.length);
}

function validList(input, fallback) {
  if (!Array.isArray(input)) return fallback;
  const values = input.map((item) => String(item).trim()).filter(Boolean);
  return values.length ? values : fallback;
}

function mergeRepresentativePools(input = {}) {
  return Object.fromEntries(
    Object.entries(representatives).map(([nodeId, names]) => [nodeId, validList(input[nodeId], names)])
  );
}

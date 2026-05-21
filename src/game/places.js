export const placeTemplates = [
  {
    id: "old-well-yard",
    name: "Old Well Yard",
    tagline: "A servant shortcut behind the kitchens.",
    nearbyNodes: ["population", "court", "merchants"],
    details: {
      calm: "Meltwater gathers around the old stones. Servants cross the yard quickly, but not fearfully.",
      tense: "The yard is too quiet for a place with so many doors. Even the bucket chain moves without its usual gossip.",
      hungry: "A boy scrapes frozen paste from the rim of a flour cart and pretends he dropped a glove.",
      secret: "Two kitchen girls stop speaking as soon as your shadow touches the well stones.",
    },
  },
  {
    id: "chapel-kitchen",
    name: "Chapel Kitchen",
    tagline: "Steam, charity, doctrine, and hungry hands.",
    nearbyNodes: ["church", "population", "court"],
    details: {
      calm: "The chapel kitchen smells of onions, smoke, and washed wool. The line outside moves with patient dignity.",
      tense: "Every bowl is counted twice. The nun at the ladle smiles with her mouth and measures with her eyes.",
      hungry: "The soup is stretched thin enough to show the bottom of the ladle.",
      secret: "A novice hides a second ledger beneath a tray of winter herbs.",
    },
  },
  {
    id: "ledger-stair",
    name: "Ledger Stair",
    tagline: "The narrow stair between treasury offices and merchant rooms.",
    nearbyNodes: ["court", "merchants", "blackMarket"],
    details: {
      calm: "Ink dries on copied contracts. Clerks pass one another without looking up.",
      tense: "The stair smells of candle smoke and scraped wax. Someone has been sealing letters in a hurry.",
      hungry: "A porter carries empty sacks upward and full silence downward.",
      secret: "A folded note has been pressed behind a loose stair nail.",
    },
  },
  {
    id: "barracks-gate",
    name: "Barracks Gate",
    tagline: "Where royal command becomes boots in the street.",
    nearbyNodes: ["military", "population", "court"],
    details: {
      calm: "The gate yard rings with ordinary drill. The soldiers complain about cold more than orders.",
      tense: "Men check straps that were already checked. The captain lets them.",
      hungry: "A recruit eats slowly, guarding half his bread for someone not in uniform.",
      secret: "A patrol list has three names scratched out and rewritten in a different hand.",
    },
  },
];

const placeNamePrefixes = ["Old", "Lower", "North", "Candlelit", "Winter", "Forgotten"];
const placeNameCores = ["Well Yard", "Ledger Stair", "Chapel Kitchen", "Barracks Gate", "Archive Niche", "Servant Passage"];

export function generatePlaces(slack = {}) {
  const prefixes = validList(slack.placeNamePrefixes, placeNamePrefixes);
  const cores = validList(slack.placeNameCores, placeNameCores);
  const allowGeneratedNames = slack.allowGeneratedPlaceNames !== false;

  return placeTemplates.map((template, index) => {
    const prefix = prefixes[(index + Math.floor(Math.random() * prefixes.length)) % prefixes.length];
    const core = cores[(index + Math.floor(Math.random() * cores.length)) % cores.length];
    return {
      ...template,
      name: !allowGeneratedNames || index < 2 ? template.name : `${prefix} ${core}`,
    };
  });
}

function validList(input, fallback) {
  if (!Array.isArray(input)) return fallback;
  const values = input.map((item) => String(item).trim()).filter(Boolean);
  return values.length ? values : fallback;
}

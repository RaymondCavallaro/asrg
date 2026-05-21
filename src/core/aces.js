export const ACES_KEYS = [
  "legitimacy",
  "optionality",
  "reconstructability",
  "tension",
  "concentration",
  "adaptability",
  "participation",
  "conductance",
  "memoryLoad",
];

const METRIC_LABELS = {
  legitimacy: "Legitimacy",
  optionality: "Optionality",
  reconstructability: "Reconstructability",
  tension: "Tension",
  concentration: "Concentration",
  adaptability: "Adaptability",
  participation: "Participation",
  conductance: "Conductance",
  memoryLoad: "Memory Load",
};

const BAND_WORDS = {
  lowBad: ["depleted", "weak", "mixed", "strong", "dominant"],
  highBad: ["quiet", "contained", "present", "pressured", "volatile"],
};

const HIGH_BAD = new Set(["tension", "concentration", "memoryLoad"]);

export function metricLabel(metric) {
  return METRIC_LABELS[metric] || metric;
}

export function clampAces(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function bandIndex(value) {
  if (value < 20) return 0;
  if (value < 40) return 1;
  if (value < 60) return 2;
  if (value < 80) return 3;
  return 4;
}

export function bandFor(metric, value) {
  const words = HIGH_BAD.has(metric) ? BAND_WORDS.highBad : BAND_WORDS.lowBad;
  return words[bandIndex(value)];
}

export function applyAcesDelta(profile, delta) {
  const next = { ...profile };
  for (const [metric, amount] of Object.entries(delta || {})) {
    next[metric] = clampAces((next[metric] ?? 50) + amount);
  }
  return next;
}

export function averageProfile(nodes) {
  const total = Object.fromEntries(ACES_KEYS.map((key) => [key, 0]));
  for (const node of nodes) {
    for (const key of ACES_KEYS) {
      total[key] += node.profile[key] ?? 50;
    }
  }
  const count = Math.max(nodes.length, 1);
  return Object.fromEntries(ACES_KEYS.map((key) => [key, Math.round(total[key] / count)]));
}

export function dominantMetrics(profile, limit = 3) {
  return ACES_KEYS.map((key) => {
    const value = profile[key] ?? 50;
    const pressure = key === "tension" || key === "concentration" || key === "memoryLoad"
      ? Math.abs(value - 35)
      : Math.abs(value - 55);
    return { key, value, pressure };
  })
    .sort((a, b) => b.pressure - a.pressure)
    .slice(0, limit);
}

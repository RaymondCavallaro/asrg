import { languageName } from "../i18n.js";

export function buildAiPresentationContext(world, reading, selectedStoryNode = null) {
  const locale = world.locale || "pt-BR";
  return {
    locale,
    languageName: languageName(locale),
    instruction: locale === "pt-BR"
      ? "Responda ao jogador em portugues brasileiro. Preserve nomes proprios e termos do mundo quando fizer sentido."
      : "Respond to the player in English. Preserve proper names and in-world terms when useful.",
    aiMode: world.aiConfig?.mode || "template",
    provider: world.aiConfig?.provider || "",
    endpoint: world.aiConfig?.endpoint || "",
    theme: {
      id: world.generatedFrame?.theme?.id,
      name: world.generatedFrame?.theme?.name,
      description: world.generatedFrame?.theme?.description,
    },
    storyConfig: {
      themeId: world.storyConfig?.themeId,
      configuredThreatId: world.storyConfig?.configuredThreatId,
      delayedThreatId: world.storyConfig?.delayedThreatId,
      delayedThreatTurn: world.storyConfig?.delayedThreatTurn,
      hiddenUnlockId: world.storyConfig?.hiddenUnlockId,
      descriptionMode: world.storyConfig?.generationSlack?.descriptionMode,
    },
    scene: {
      turn: world.turn,
      currentSceneId: world.currentSceneId,
      currentPlaceId: world.currentPlaceId,
      selectedStoryNodeId: selectedStoryNode?.id || "",
      selectedStoryNodeType: selectedStoryNode?.type || "",
      centerNodeId: reading.centerNodeId,
    },
    revelationRules: [
      "Do not reveal hidden truth unless it appears in the filtered reader output.",
      "Do not mutate world state.",
      "Do not invent new actors, threats, or facts outside approved generation/injector paths.",
      "Present uncertainty as uncertainty.",
      "Keep player-facing ACES information qualitative unless debug mode asks for raw state.",
    ],
    playerFacingSettings: {
      useRawAcesNumbers: false,
      actionCompositionVisible: true,
      achievementsVisible: true,
      debugDashboardAvailable: true,
    },
  };
}

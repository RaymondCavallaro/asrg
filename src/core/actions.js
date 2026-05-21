import { actionCards } from "../game/cards.js";
import { getPresentPeople } from "./people.js";

export function getAvailableActions(world, reading, selectedPersonId = "", selectedStoryNode = null) {
  const locale = world.locale || "pt-BR";
  if (world.currentPlaceId) {
    const place = world.places.find((item) => item.id === world.currentPlaceId);
    const dominant = reading.dominant[0]?.band || "uneasy";
    const present = getPresentPeople(world);
    const selected = present.find((person) => person.id === selectedPersonId) || present[0];
    return [
      selectedStoryNode ? storyNodeAction(selectedStoryNode, locale) : null,
      {
        id: "sense-place",
        label: locale === "pt-BR" ? `Ler ${place?.name || "este lugar"} com mais cuidado` : `Read ${place?.name || "this place"} more carefully`,
        detail: locale === "pt-BR"
          ? `Deixe a sala falar por habito, postura, objetos e pelo humor ${dominant} ao redor.`
          : `Let the room speak through habit, posture, objects, and the ${dominant} mood around you.`,
        kind: "observation",
        durationTurns: 1,
      },
      selected ? {
        id: "speak-local",
        label: locale === "pt-BR" ? `Falar com ${selected.name}` : `Speak with ${selected.name}`,
        detail: locale === "pt-BR"
          ? `Faca uma pergunta discreta para ${selected.role}, sem transformar isso em investigacao oficial.`
          : `Ask ${selected.role} a quiet question without turning it into an official inquiry.`,
        kind: "conversation",
        characterId: selected.id,
        durationTurns: 1,
      } : null,
    ].filter(Boolean);
  }

  const present = getPresentPeople(world);
  const selected = present.find((person) => person.id === selectedPersonId) || present[0];
  const presentIds = new Set(present.map((person) => person.id));
  const used = new Set(world.logs.map((log) => log.actionId).filter(Boolean));
  const councilActions = actionCards
    .filter((card) => (card.log.involvedCharacters || []).some((id) => presentIds.has(id)))
    .filter((card) => card.repeatable || !used.has(card.id))
    .map((card) => ({
      id: card.id,
      label: councilLabel(world, card, locale),
      detail: councilDetail(world, card, locale),
      structural: card.structural,
      kind: "council",
      durationTurns: card.durationTurns || 1,
    }));
  if (selectedStoryNode) {
    councilActions.unshift(storyNodeAction(selectedStoryNode, locale));
  }
  if (selected) {
    councilActions.unshift({
      id: "council-speak",
      label: locale === "pt-BR" ? `Pedir que ${selected.name} fale diante de todos` : `Ask ${selected.name} to speak before everyone`,
      detail: locale === "pt-BR"
        ? `Deixe ${selected.role} enquadrar o perigo em publico, com a instituicao por tras ouvindo.`
        : `Let ${selected.role} frame the danger in public, with the institution behind them listening.`,
      kind: "council",
      characterId: selected.id,
      durationTurns: 1,
    });
  }
  return councilActions;
}

function storyNodeAction(storyNode, locale) {
  return {
    id: "study-story-node",
    label: locale === "pt-BR" ? `Examinar ${storyNode.title}` : `Study ${storyNode.title}`,
    detail: locale === "pt-BR"
      ? `Transforme este nó da história em foco de atenção, comparação e memória.`
      : `Turn this story node into a focus of attention, comparison, and memory.`,
    kind: "story-node",
    storyNodeId: storyNode.id,
    storyNodeTitle: storyNode.title,
    storyNodeType: storyNode.type,
    durationTurns: 1,
  };
}

function councilLabel(world, card, locale) {
  const rep = (nodeId) => world.nodes.find((node) => node.id === nodeId)?.representative || "someone";
  const labels = locale === "pt-BR" ? {
    "question-guildmaster": `Convocar ${rep("merchants")} em privado`,
    "support-soup-kitchens": `Pedir misericordia publica a ${rep("church")}`,
    "increase-patrols": `Enviar ${rep("military")} discretamente pelo mercado`,
    "listen-to-cook": `Deixar ${rep("population")} continuar falando`,
  } : {
    "question-guildmaster": `Summon ${rep("merchants")} privately`,
    "support-soup-kitchens": `Ask ${rep("church")} for public mercy`,
    "increase-patrols": `Send ${rep("military")} quietly through the market`,
    "listen-to-cook": `Let ${rep("population")} continue speaking`,
  };
  return labels[card.id] || card.label;
}

function councilDetail(world, card, locale) {
  const rep = (nodeId) => world.nodes.find((node) => node.id === nodeId)?.representative || "them";
  const details = locale === "pt-BR" ? {
    "question-guildmaster": `Questione ${rep("merchants")} sobre carregamentos de grao desaparecidos, mantendo o tom cordial.`,
    "support-soup-kitchens": `Apoie as cozinhas sob ${rep("church")} e torne o gesto visivel sem chama-lo de panico.`,
    "increase-patrols": `Aumente a ordem visivel, mas instrua ${rep("military")} a escutar antes de intimidar.`,
    "listen-to-cook": `Atrase a agenda do conselho e deixe ${rep("population")} terminar o relato dos sacos de farinha.`,
  } : {
    "question-guildmaster": `Question ${rep("merchants")} about missing grain shipments while keeping the tone cordial.`,
    "support-soup-kitchens": `Support the kitchens under ${rep("church")} and make the gesture visible without calling it panic.`,
    "increase-patrols": `Increase visible order, but instruct ${rep("military")} to listen before intimidating anyone.`,
    "listen-to-cook": `Delay the council schedule and let ${rep("population")} finish the account of the flour sacks.`,
  };
  return details[card.id] || card.detail;
}

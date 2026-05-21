import { createInitialWorld, dispatchCommand } from "./core/world.js";
import { readRegion } from "./core/reader.js";
import { presentReading } from "./core/presenter.js";
import { loadGame, saveGame } from "./storage/save.js";
import { renderApp } from "./ui/render.js";
import { actionCards } from "./game/cards.js";

const saved = loadGame();
let world = saved?.places && saved?.characters && saved?.storyConfig && saved?.storyNodes ? saved : createInitialWorld();
let selectedNodeId = "population";
let selectedStoryNodeId = "";
let screen = world.started ? "game" : "setup";

if (!world.started && !world.storyConfig.generationSlack) {
  world = dispatchCommand(world, { type: "set-story-config-json", config: world.storyConfig });
  saveGame(world);
}

if (!world.locale) {
  world = dispatchCommand(world, { type: "set-locale", locale: "pt-BR" });
  saveGame(world);
}

function getViewModel() {
  const activePlace = world.places.find((place) => place.id === world.currentPlaceId);
  const centerNodeId = activePlace?.nearbyNodes[0] || selectedNodeId;
  const reading = readRegion(world, {
    centerNodeId,
    radius: 1,
    observerId: "player",
  });
  const presentation = presentReading(world, reading, selectedStoryNodeId);
  if (presentation.selectedStoryNode && selectedStoryNodeId !== presentation.selectedStoryNode.id) {
    selectedStoryNodeId = presentation.selectedStoryNode.id;
  }

  return {
    world,
    screen,
    selectedNodeId,
    selectedStoryNodeId,
    places: world.places,
    reading,
    presentation,
  };
}

function handleCommand(command) {
  if (command.type === "set-screen") {
    screen = command.screen === "game" && !world.started ? "setup" : command.screen;
    render();
    return;
  }

  if (command.type === "select-node") {
    selectedNodeId = command.nodeId;
    render();
    return;
  }

  if (command.type === "select-story-node") {
    selectedStoryNodeId = command.storyNodeId;
    render();
    return;
  }

  if (command.type === "reset") {
    world = createInitialWorld();
    selectedNodeId = "population";
    selectedStoryNodeId = "";
    screen = "setup";
    saveGame(world);
    render();
    return;
  }

  if (command.type === "set-ai-config" || command.type === "set-locale" || command.type === "set-story-config" || command.type === "set-story-config-json" || command.type === "adjust-trait" || command.type === "start-game") {
    world = dispatchCommand(world, command);
    selectedStoryNodeId = "";
    if (command.type === "start-game") screen = "game";
    saveGame(world);
    render();
    return;
  }

  if (command.type === "visit-place") {
    const place = world.places.find((item) => item.id === command.placeId);
    if (place?.nearbyNodes[0]) selectedNodeId = place.nearbyNodes[0];
    selectedStoryNodeId = "";
  }

  if (command.type === "play-action") {
    const action = actionCards.find((card) => card.id === command.actionId);
    if (action?.scene?.focusNodeId) selectedNodeId = action.scene.focusNodeId;
  }

  const selectedPersonId = presentationPersonId();
  const finalCommand = (command.actionId === "speak-local" || command.actionId === "council-speak") && selectedPersonId
    ? { ...command, characterId: selectedPersonId }
    : command;
  world = dispatchCommand(world, finalCommand);
  saveGame(world);
  render();
}

function presentationPersonId() {
  const activePlace = world.places.find((place) => place.id === world.currentPlaceId);
  const centerNodeId = activePlace?.nearbyNodes[0] || selectedNodeId;
  const reading = readRegion(world, {
    centerNodeId,
    radius: 1,
    observerId: "player",
  });
  return presentReading(world, reading, selectedStoryNodeId).selectedPersonId || "";
}

function render() {
  renderApp(document.getElementById("app"), getViewModel(), handleCommand);
}

render();

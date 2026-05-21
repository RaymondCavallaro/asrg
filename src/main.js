import { createInitialWorld, dispatchCommand } from "./core/world.js";
import { readRegion } from "./core/reader.js";
import { presentReading } from "./core/presenter.js";
import { loadGame, saveGame } from "./storage/save.js";
import { renderApp } from "./ui/render.js";

const saved = loadGame();
let world = saved || createInitialWorld();
let selectedNodeId = "population";

function getViewModel() {
  const reading = readRegion(world, {
    centerNodeId: selectedNodeId,
    radius: 1,
    observerId: "player",
  });
  const presentation = presentReading(world, reading);

  return {
    world,
    selectedNodeId,
    reading,
    presentation,
  };
}

function handleCommand(command) {
  if (command.type === "select-node") {
    selectedNodeId = command.nodeId;
    render();
    return;
  }

  if (command.type === "reset") {
    world = createInitialWorld();
    selectedNodeId = "population";
    saveGame(world);
    render();
    return;
  }

  if (command.type === "set-ai-config") {
    world = dispatchCommand(world, command);
    saveGame(world);
    render();
    return;
  }

  world = dispatchCommand(world, command);
  saveGame(world);
  render();
}

function render() {
  renderApp(document.getElementById("app"), getViewModel(), handleCommand);
}

render();

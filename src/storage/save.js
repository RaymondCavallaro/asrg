const SAVE_KEY = "asrg.prototype.save.v1";

export function saveGame(world) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(world));
}

export function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(SAVE_KEY);
    return null;
  }
}

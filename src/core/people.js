export function getPresentPeople(world) {
  if (!world.currentPlaceId) {
    return world.characters.filter((person) => person.mainCounselor && !person.hidden);
  }

  const place = world.places.find((item) => item.id === world.currentPlaceId);
  if (!place) return [];

  return world.characters.filter((person) => !person.hidden && place.nearbyNodes.includes(person.nodeId));
}

export function getPersonLogs(world, personId) {
  return world.logs
    .filter((log) => (log.involvedCharacters || []).includes(personId))
    .slice()
    .reverse();
}

export function findPerson(world, personId) {
  return world.characters.find((person) => person.id === personId) || null;
}

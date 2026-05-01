/**
 * Builds a flat snake-draft sequence of team IDs with length `picksPerTeam * teamIds.length`.
 */
export function buildSnakeDraftTeamSequence(
  teamIds: string[],
  picksPerTeam: number,
): string[] {
  if (teamIds.length === 0 || picksPerTeam <= 0) return [];
  const slots: string[] = [];
  for (let round = 0; round < picksPerTeam; round += 1) {
    const forward = round % 2 === 0;
    const order = forward ? teamIds : [...teamIds].reverse();
    slots.push(...order);
  }
  return slots;
}

export function shuffleTeamIds(teamIds: string[]): string[] {
  const copy = [...teamIds];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const swap = copy[i];
    copy[i] = copy[j]!;
    copy[j] = swap!;
  }
  return copy;
}

import { FixtureStatus } from "@/generated/prisma/enums";
import type { TournamentRunSummary } from "@/services/tournament-run-service";

type MatchParticipant = TournamentRunSummary["matches"][number]["participants"][number];
type FixtureMatch = TournamentRunSummary["matches"][number];

export function getFixtureSideLabel(params: {
  match: FixtureMatch;
  side: "SIDE_ONE" | "SIDE_TWO";
  fallbackTeamName?: string | null;
}): string {
  const names = params.match.participants
    .filter((participant) => participant.side === params.side)
    .map((participant) => participant.player.name.trim())
    .filter((name) => name.length > 0);

  if (names.length > 0) {
    return names.join(" + ");
  }

  if (params.fallbackTeamName) {
    return `${params.fallbackTeamName} pairing pending`;
  }

  return "Pairing pending";
}

export function getFixtureSidePlayers(
  match: FixtureMatch,
  side: "SIDE_ONE" | "SIDE_TWO",
): MatchParticipant[] {
  return match.participants.filter((participant) => participant.side === side);
}

export function fixtureStatusLabel(status: FixtureStatus): string {
  switch (status) {
    case FixtureStatus.SCHEDULED:
      return "Scheduled";
    case FixtureStatus.IN_PROGRESS:
      return "In progress";
    case FixtureStatus.COMPLETED:
      return "Completed";
    case FixtureStatus.CANCELLED:
      return "Cancelled";
    default:
      return status;
  }
}

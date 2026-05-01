import type { PlayerCategory } from "@/generated/prisma/enums";
import { PLAYER_CATEGORY_LABEL } from "@/constants/player-labels";

export interface SquadRuleMaxRow {
  category: PlayerCategory;
  maxCount: number;
}

export interface ValidateSquadRulesAgainstRosterParams {
  teamCount: number;
  picksPerTeam: number;
  totalPlayers: number;
  playersPerCategory: Partial<Record<PlayerCategory, number>>;
  rules: SquadRuleMaxRow[];
  /**
   * When false (e.g. auto-set from roster), skip `teams × picksPerTeam ≤ totalPlayers`.
   * Category caps are independent of snake length; blocking reconcile on draft length prevented auto-fill.
   */
  requireDraftSlotsVsRoster?: boolean;
}

/**
 * Ensures saved caps fit the player pool per category and that the snake draft does not require
 * more players than exist on the roster (`teams × picksPerTeam`). Category caps are not tied to
 * `picksPerTeam`; tighter composition limits are enforced again when picks are made (draft slots).
 */
export function validateSquadRulesAgainstRoster(
  params: ValidateSquadRulesAgainstRosterParams,
): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const {
    teamCount,
    picksPerTeam,
    totalPlayers,
    playersPerCategory,
    rules,
    requireDraftSlotsVsRoster = true,
  } = params;

  if (teamCount <= 0) {
    errors.push(
      "Add at least one team before saving pick limits. Pick limits depend on how many franchises share the player pool.",
    );
  }

  if (totalPlayers <= 0) {
    errors.push(
      "Add players to this tournament before saving pick limits. There must be a roster to draft from.",
    );
  }

  const totalPickSlots = teamCount * picksPerTeam;
  if (
    requireDraftSlotsVsRoster &&
    teamCount > 0 &&
    picksPerTeam > 0 &&
    totalPlayers > 0 &&
    totalPickSlots > totalPlayers
  ) {
    errors.push(
      `Not enough players for this draft length: ${teamCount} teams × ${picksPerTeam} picks each needs ${totalPickSlots} players in total. You have ${totalPlayers}. Add more players or lower picks per team.`,
    );
  }

  for (const rule of rules) {
    if (teamCount > 0 && rule.maxCount > 0) {
      const label = PLAYER_CATEGORY_LABEL[rule.category];
      const pool = playersPerCategory[rule.category] ?? 0;
      const minimumPlayersNeeded = teamCount * rule.maxCount;
      if (minimumPlayersNeeded > pool) {
        errors.push(
          `${label}: with ${teamCount} teams and up to ${rule.maxCount} pick(s) per team from this group, you need at least ${minimumPlayersNeeded} players in this group. You have ${pool}. Add more players or lower this cap.`,
        );
      }
    }
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true };
}

export function formatSquadValidationErrors(errors: string[]): string {
  return errors.join("\n\n");
}

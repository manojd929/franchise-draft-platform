import type { DraftPhase, Gender } from "@/generated/prisma/enums";

export interface DraftTeamDto {
  id: string;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
  colorHex: string | null;
  ownerUserId: string | null;
}

export interface DraftPlayerDto {
  id: string;
  name: string;
  photoUrl: string | null;
  rosterCategoryId: string;
  rosterCategoryName: string;
  rosterCategoryColorHex: string | null;
  gender: Gender;
  notes: string | null;
  isUnavailable: boolean;
  isLocked: boolean;
  /** True when roster row backs a commissioner-provisioned franchise-owner login (`Player.linkedOwnerUserId`). Never draftable in normal flows. */
  runsFranchiseLogin: boolean;
  assignedTeamId: string | null;
  hasConfirmedPick: boolean;
}

export interface DraftOrderSlotDto {
  slotIndex: number;
  teamId: string;
}

export interface SquadRuleDto {
  rosterCategoryId: string;
  rosterCategoryName: string;
  rosterCategoryColorHex: string | null;
  maxCount: number;
}

export interface DraftLogEntryDto {
  id: string;
  action: string;
  message: string | null;
  createdAt: string;
}

export interface DraftSnapshotDto {
  tournamentId: string;
  slug: string;
  name: string;
  draftPhase: DraftPhase;
  currentSlotIndex: number;
  picksPerTeam: number;
  draftOrderLocked: boolean;
  overrideValidation: boolean;
  pickTimerSeconds: number | null;
  /**
   * When LIVE, normally only players in this roster group can be nominated.
   * Null means commissioner left the spotlight open (all roster groups eligible).
   */
  auctionSpotlightRosterCategoryId: string | null;
  auctionSpotlightRosterCategoryName: string | null;
  auctionSpotlightRosterCategoryColorHex: string | null;
  pendingPickPlayerId: string | null;
  pendingPickTeamId: string | null;
  teams: DraftTeamDto[];
  players: DraftPlayerDto[];
  draftSlots: DraftOrderSlotDto[];
  squadRules: SquadRuleDto[];
  picksCount: number;
  draftSlotsTotal: number;
  activity: DraftLogEntryDto[];
  lastConfirmedPick: {
    playerName: string;
    teamName: string;
    rosterCategoryName: string;
    rosterCategoryColorHex: string | null;
  } | null;
}

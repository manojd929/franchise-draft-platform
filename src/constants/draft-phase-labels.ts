import type { DraftPhase } from "@/generated/prisma/enums";

/** Short, plain labels for people who are not fluent in English. */
export const DRAFT_PHASE_LABEL: Record<DraftPhase, string> = {
  SETUP: "Setup",
  READY: "Ready",
  LIVE: "Live",
  PAUSED: "Paused",
  FROZEN: "Stopped",
  LOCKED: "Locked",
  COMPLETED: "Finished",
};

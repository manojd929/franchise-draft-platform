-- Commissioner runs Admin only; cannot hold franchise ownership on their own tournament.
UPDATE "Team" AS t
SET "ownerUserId" = NULL
FROM "Tournament" AS tor
WHERE t."tournamentId" = tor."id"
  AND t."deletedAt" IS NULL
  AND tor."deletedAt" IS NULL
  AND t."ownerUserId" IS NOT NULL
  AND t."ownerUserId" = tor."createdById";

-- Adds the OWNER_LOGIN_PROVISIONED action to DraftLogAction so
-- `createLeagueOwnerAccount` can write an audit row every time an organizer
-- provisions (or links) an owner login for their tournament.
--
-- Idempotent: `ADD VALUE IF NOT EXISTS` is a no-op if the migration is
-- rerun. Postgres 12+ (Supabase minimum) supports this syntax and requires
-- it be run outside a transaction, which is the default for Prisma raw
-- migration files.
ALTER TYPE "DraftLogAction" ADD VALUE IF NOT EXISTS 'OWNER_LOGIN_PROVISIONED';

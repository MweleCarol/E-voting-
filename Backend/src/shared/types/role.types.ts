/**
 * The full set of role names seeded into the system (see prisma/seed.ts).
 * Kept here, not derived from the database at compile time, because
 * TypeScript types are static — role.cache.ts is the runtime source of
 * truth. If these two ever drift apart, that IS a real bug; keep them
 * in sync by hand whenever a role is added or renamed.
 */

// src/shared/types/role.types.ts
export const ROLE_NAMES = [
  'SYSTEM_ADMIN',
  'ELECTION_OFFICER',
  'VERIFICATION_OFFICER',
  'STUDENT',
  'AUDITOR',
  'OBSERVER',
] as const;

export type RoleName = (typeof ROLE_NAMES)[number];
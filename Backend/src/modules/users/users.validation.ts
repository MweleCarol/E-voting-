import { z } from 'zod';
import { UserStatus } from '@generated/prisma/client'; // adjust to your actual generated-client import path
import { ROLE_NAMES } from '@shared/types/role.types';

// ---------------------------------------------------------------------------
// Shared fields — two real call sites (CSV row, single-create), the
// same threshold used elsewhere in this project to justify extraction.
// ---------------------------------------------------------------------------

const baseAccountFieldsSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  fullName: z.string().trim().min(2, 'Full name is too short').max(120),
});

// ---------------------------------------------------------------------------
// Bulk Student CSV Import
// ---------------------------------------------------------------------------

/**
 * Validates ONE parsed CSV row. Every field arrives as a string — that's
 * what a CSV is — so yearOfStudy is coerced from "3" to 3 here, not
 * assumed to already be numeric upstream.
 *
 * admissionNo and school are deliberately loose (non-empty, trimmed) rather
 * than pattern-matched. I don't know DeKUT's actual admission-number format
 * or canonical school-name list — tighten these once you've confirmed them
 * against a real registrar export, not against a guessed regex that might
 * reject valid rows on day one.
 */
export const studentCsvRowSchema = baseAccountFieldsSchema.extend({
  admissionNo: z.string().trim().min(1, 'Admission number is required'),
  school: z.string().trim().min(1, 'School is required'),
  yearOfStudy: z.coerce
    .number({ error: 'Year of study must be a number' })
    .int()
    .min(1)
    .max(6, 'Year of study must be between 1 and 6'), // assumption: longest program is 6 years — confirm against DeKUT's actual programs
});

export type StudentCsvRowParsed = z.infer<typeof studentCsvRowSchema>;

// ---------------------------------------------------------------------------
// Single User Creation
// ---------------------------------------------------------------------------

/**
 * Mirrors ROLE_NAMES minus STUDENT (role.types.ts). Written out by hand
 * rather than derived via .filter(), because z.enum() needs a literal,
 * non-empty tuple at compile time — a filtered array loses that
 * literal-ness and would need an unsafe `as` cast to satisfy it anyway,
 * defeating the point of deriving it. Six roles, changed rarely — update
 * this list by hand if a role is ever added or removed.
 */
const SINGLE_CREATABLE_ROLE_NAMES = [
  'SYSTEM_ADMIN',
  'ELECTION_OFFICER',
  'VERIFICATION_OFFICER',
  'AUDITOR',
  'OBSERVER',
] as const;

export const createSingleUserSchema = baseAccountFieldsSchema.extend({
  role: z.enum(SINGLE_CREATABLE_ROLE_NAMES, {
    error: `Role must be one of: ${SINGLE_CREATABLE_ROLE_NAMES.join(', ')}`,
  }),
});

export type CreateSingleUserParsed = z.infer<typeof createSingleUserSchema>;

// ---------------------------------------------------------------------------
// List / Query Users
// ---------------------------------------------------------------------------

/**
 * UserStatus already has a real Prisma-generated enum object to draw
 * from — unlike RoleName, which has no equivalent because Role is plain
 * table data, not a database-level enum. That asymmetry is exactly why
 * roles needed a hand-maintained array a moment ago and statuses don't:
 * Object.values(UserStatus) already IS the single source of truth.
 */
const userStatusValues = Object.values(UserStatus) as [UserStatus, ...UserStatus[]];

export const listUsersQuerySchema = z.object({
  status: z.enum(userStatusValues).optional(),
  role: z.enum(ROLE_NAMES).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100, 'pageSize cannot exceed 100').default(20),
});

export type ListUsersQueryParsed = z.infer<typeof listUsersQuerySchema>;


export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user id'),
});
export type UserIdParam = z.infer<typeof userIdParamSchema>;
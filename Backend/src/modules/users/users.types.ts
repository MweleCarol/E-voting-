import type { UserStatus } from '@generated/prisma/client'; // adjust to your actual generated-client import path
import type { RoleName } from '@shared/types/role.types';

/**
 * Roles the single-create endpoint may provision.
 * STUDENT is excluded — students only ever arrive via bulk import, never
 * single-create, because only bulk import attaches the required Student row.
 */
export type SingleCreatableRole = Exclude<RoleName, 'STUDENT'>;

// ---------------------------------------------------------------------------
// Bulk Student Import
// ---------------------------------------------------------------------------

/** One row exactly as parsed from the CSV — untrusted, every field a string. */
export interface RawStudentCsvRow {
  email: string;
  fullName: string;
  admissionNo: string;
  school: string;
  yearOfStudy: string;
}

/** Same row after Zod validation — yearOfStudy is now a real number, not a string that merely looks like one. */
export interface ValidatedStudentRow {
  email: string;
  fullName: string;
  admissionNo: string;
  school: string;
  yearOfStudy: number;
}

/**
 * Outcome of importing ONE row. A discriminated union, not a generic
 * "success: boolean, error?: string" shape — same pattern auth.types.ts
 * used for login results. The payoff: a switch over `status` is checked
 * exhaustively by the compiler, so adding a new outcome later forces you
 * to update every place that handles it, instead of silently falling
 * through somewhere.
 */
export type StudentImportRowResult =
  | { status: 'created'; row: number; userId: string; email: string }
  | { status: 'skipped'; row: number; email: string; reason: 'duplicate_email' | 'duplicate_admission_no' }
  | { status: 'failed'; row: number; email?: string; reason: string };

export interface BulkImportSummary {
  totalRows: number;
  created: number;
  skipped: number;
  failed: number;
  results: StudentImportRowResult[];
}

// ---------------------------------------------------------------------------
// Single User Creation (officers, admin, auditor, observer)
// ---------------------------------------------------------------------------

export interface CreateSingleUserInput {
  email: string;
  fullName: string;
  role: SingleCreatableRole;
}

export interface CreateSingleUserResult {
  id: string;
  email: string;
  fullName: string;
  role: SingleCreatableRole;
  status: UserStatus;
}

// ---------------------------------------------------------------------------
// Listing / Lookup
// ---------------------------------------------------------------------------

export interface ListUsersQuery {
  status?: UserStatus;
  role?: RoleName;
  page?: number;
  pageSize?: number;
}

export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  role: RoleName;
  status: UserStatus;
  createdAt: Date;
}

export interface PaginatedUsers {
  data: UserSummary[];
  total: number;
  page: number;
  pageSize: number;
}
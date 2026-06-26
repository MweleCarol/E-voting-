// src/modules/users/users.service.ts
import { parse } from 'csv-parse/sync';
import { UserStatus } from '@generated/prisma/client'; // adjust to your actual import path
import { getRoleId } from '@shared/cache/role.cache';
import { ConflictError, ValidationError, NotFoundError } from '@shared/errors';
import type { RoleName } from '@shared/types/role.types';
import { studentCsvRowSchema } from './users.validation.js';
import type { CreateSingleUserParsed, ListUsersQueryParsed } from './users.validation.js';
import {
  createStudentUser,
  createSingleUser,
  listUsers,
  findUserDetailById,
} from './users.repository';
import type {
  StudentImportRowResult,
  BulkImportSummary,
  CreateSingleUserResult,
  PaginatedUsers,
  UserSummary,
} from './users.types';

const EXPECTED_CSV_COLUMNS = ['email', 'fullName', 'admissionNo', 'school', 'yearOfStudy'] as const;

// ---------------------------------------------------------------------
// Bulk Student Import
// ---------------------------------------------------------------------

export async function bulkImportStudents(csvBuffer: Buffer): Promise<BulkImportSummary> {
  const rawRows = parse(csvBuffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  if (rawRows.length === 0) {
    throw new ValidationError('CSV file contains no data rows.');
  }

  // Structural check FIRST — catches "wrong file entirely" with one clear
  // message, instead of every row individually failing for the same reason.
  // Assumes headers match these exact names — a real constraint on what the
  // registrar's export must look like; revisit if that assumption breaks.
  const actualColumns = Object.keys(rawRows[0]);
  const missingColumns = EXPECTED_CSV_COLUMNS.filter((c) => !actualColumns.includes(c));
  if (missingColumns.length > 0) {
    throw new ValidationError(`CSV is missing required column(s): ${missingColumns.join(', ')}`);
  }

  const studentRoleId = await getRoleId('STUDENT'); // resolved once, outside the loop

  const results: StudentImportRowResult[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const spreadsheetRow = i + 2; // +2: row 1 is the header in the admin's actual file
    const raw = rawRows[i];

    const parsed = studentCsvRowSchema.safeParse(raw);
    if (!parsed.success) {
      results.push({
        status: 'failed',
        row: spreadsheetRow,
        email: raw.email,
        reason: parsed.error.issues.map((iss) => `${iss.path.join('.')}: ${iss.message}`).join('; '),
      });
      continue;
    }

    const outcome = await createStudentUser({ ...parsed.data, roleId: studentRoleId });

    if ('conflict' in outcome) {
      results.push({
        status: 'skipped',
        row: spreadsheetRow,
        email: parsed.data.email,
        reason: outcome.conflict === 'email' ? 'duplicate_email' : 'duplicate_admission_no',
      });
    } else {
      results.push({ status: 'created', row: spreadsheetRow, userId: outcome.id, email: parsed.data.email });
    }
  }

  return {
    totalRows: rawRows.length,
    created: results.filter((r) => r.status === 'created').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    failed: results.filter((r) => r.status === 'failed').length,
    results,
  };
}

// ---------------------------------------------------------------------
// Single User Creation
// ---------------------------------------------------------------------

export async function createSingleUserAccount(
  input: CreateSingleUserParsed,
): Promise<CreateSingleUserResult> {
  const roleId = await getRoleId(input.role);

  const outcome = await createSingleUser({ email: input.email, fullName: input.fullName, roleId });

  if ('conflict' in outcome) {
    // Single-create has exactly one caller waiting on exactly one HTTP
    // response — unlike bulk import, there's no "report" to assemble.
    // A thrown error is the right signal here, not a result the
    // controller has to inspect to decide what happened.
    throw new ConflictError('A user with this email already exists.');
  }

  return {
    id: outcome.id,
    email: input.email,
    fullName: input.fullName,
    role: input.role,
    status: UserStatus.PENDING_ACTIVATION,
  };
}

// ---------------------------------------------------------------------
// Listing / Lookup
// ---------------------------------------------------------------------

export async function getUsersList(query: ListUsersQueryParsed): Promise<PaginatedUsers> {
  const { rows, total } = await listUsers(query);

  const data: UserSummary[] = rows.map((r) => ({
    id: r.id,
    email: r.email,
    fullName: r.fullName,
    role: r.role.name as RoleName, // safe: every seeded role.name is a RoleName member; nothing else writes to this table
    status: r.status,
    createdAt: r.createdAt,
  }));

  return { data, total, page: query.page, pageSize: query.pageSize };
}

export async function getUserDetail(userId: string): Promise<UserSummary> {
  const row = await findUserDetailById(userId);
  if (!row) {
    throw new NotFoundError('User not found.');
  }
  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    role: row.role.name as RoleName,
    status: row.status,
    createdAt: row.createdAt,
  };
}
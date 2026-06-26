// src/modules/users/users.repository.ts
import { prisma } from '@database/client';
import { Prisma, UserStatus } from '@generated/prisma/client.js'; // adjust to your actual import path
import type { RoleName } from '@shared/types/role.types';



// ---------------------------------------------------------------------
// Bulk Student Import
// ---------------------------------------------------------------------

/**
 * One CSV row -> one User + one Student, as a single nested create.
 * Atomic by construction (see explanation above) — no manual
 * $transaction array needed, unlike auth.repository.ts's activation
 * flow, which combines two genuinely independent operations.
 *
 * roleId arrives already resolved. This function has no business
 * knowing role NAMES — same discipline as every other repository
 * function in this codebase.
 */
export async function createStudentUser(input: {
  email: string;
  fullName: string;
  admissionNo: string;
  school: string;
  yearOfStudy: number;
  roleId: string;
}): Promise<{ id: string } | { conflict: 'email' | 'admissionNo' }> {
  try {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        fullName: input.fullName,
        passwordHash: null,
        status: UserStatus.PENDING_ACTIVATION,
        roleId: input.roleId,
        student: {
          create: {
            admissionNo: input.admissionNo,
            school: input.school,
            yearOfStudy: input.yearOfStudy,
          },
        },
      },
      select: { id: true },
    });
    return { id: user.id };
  } catch (err) {
    const conflict = classifyUniqueConflict(err);
    if (conflict) return { conflict };
    throw err; // anything else is a real, unexpected failure — let it propagate, don't swallow it
  }
}

// ---------------------------------------------------------------------
// Single User Creation (officers, admin, auditor, observer)
// ---------------------------------------------------------------------

export async function createSingleUser(input: {
  email: string;
  fullName: string;
  roleId: string;
}): Promise<{ id: string } | { conflict: 'email' }> {
  try {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        fullName: input.fullName,
        passwordHash: null,
        status: UserStatus.PENDING_ACTIVATION,
        roleId: input.roleId,
      },
      select: { id: true },
    });
    return { id: user.id };
  } catch (err) {
    const conflict = classifyUniqueConflict(err);
    if (conflict === 'admissionNo') {
      // Unreachable in practice — this path never writes a Student row.
      // If it ever actually fires, that's a real bug worth surfacing loudly,
      // not silently mapping to a result type that implies it's normal.
      throw err;
    }
    if (conflict === 'email') return { conflict: 'email' };
    throw err;
  }
}

/**
 * Shared P2002 interpretation for both create functions — same "two
 * real call sites" threshold already used to justify extracting
 * baseAccountFieldsSchema in users.validation.ts.
 *
 * NOT YET VERIFIED against this project's actual Prisma 7 +
 * @prisma/adapter-pg setup — see the empirical check below before
 * trusting this against real CSV data.
 */
interface DriverAdapterUniqueConstraintMeta {
  driverAdapterError?: {
    cause?: {
      constraint?: { fields?: string[] };
    };
  };
}

function classifyUniqueConflict(err: unknown): 'email' | 'admissionNo' | null {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== 'P2002') {
    return null;
  }
  const meta = err.meta as DriverAdapterUniqueConstraintMeta | undefined;
  const fields = meta?.driverAdapterError?.cause?.constraint?.fields ?? [];

  // .includes(), not exact equality — Prisma's field naming here is
  // genuinely ambiguous between the logical field name (admissionNo)
  // and the physical column (admission_no) on a driver-adapter setup
  // this new; safer to match loosely than guess wrong a third time.
  if (fields.some((f) => f.includes('email'))) return 'email';
  if (fields.some((f) => f.includes('admission'))) return 'admissionNo';
  return null;
}

// ---------------------------------------------------------------------
// Listing / Lookup
// ---------------------------------------------------------------------

export interface ListUsersFilter {
  status?: UserStatus;
  role?: RoleName;
  page: number;
  pageSize: number;
}

const userSummarySelect = {
  id: true,
  email: true,
  fullName: true,
  status: true,
  createdAt: true,
  role: { select: { name: true } },
} as const;

/**
 * Filtering by role NAME needs no role-cache lookup at all — Prisma
 * turns a relation filter into a join/subquery against the live Role
 * table at query time. Contrast with the create functions above:
 * writes need a resolved roleId because the FK column demands one;
 * reads can go through the relation directly. Different sides of the
 * same table, genuinely different requirements.
 */
export async function listUsers(filter: ListUsersFilter) {
  const where: Prisma.UserWhereInput = {
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.role ? { role: { name: filter.role } } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userSummarySelect,
      skip: (filter.page - 1) * filter.pageSize,
      take: filter.pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return { rows, total };
}

export async function findUserDetailById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: userSummarySelect,
  });
}
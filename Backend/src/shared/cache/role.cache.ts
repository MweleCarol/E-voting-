import { prisma } from '@database/client'; // adjust to wherever your shared prisma client export actually lives
import { RoleName } from '@shared/types/role.types';

/**
 * In-memory role name -> role id cache.
 *
 * Roles are seeded once and are effectively static configuration for the
 * lifetime of the running process — not business data that changes per
 * request the way User.status does. Loading them once and trusting the
 * cache avoids a DB round trip on every authorization check, at the
 * (accepted) cost of needing a process restart if a role is ever renamed
 * or added outside a seed run.
 */
let roleNameToId: Map<string, string> | null = null;
let loadingPromise: Promise<Map<string, string>> | null = null;

async function loadRoleCache(): Promise<Map<string, string>> {
  const roles = await prisma.role.findMany({ select: { id: true, name: true } });
  const map = new Map(roles.map((r) => [r.name, r.id]));
  roleNameToId = map;
  return map;
}

/**
 * Resolves a role name (e.g. "SYSTEM_ADMIN") to its database id.
 * Lazily warms the cache on first call.
 */
export async function getRoleId(name: RoleName): Promise<string> {
  if (!roleNameToId) {
    // Without this guard, several requests arriving during the cold-start
    // window would each fire their own findMany() before any of them
    // finishes — a small "thundering herd" on startup. Sharing one
    // in-flight promise means concurrent callers all await the same load.
    loadingPromise ??= loadRoleCache();
    await loadingPromise;
    loadingPromise = null;
  }
  const id = roleNameToId!.get(name);
  if (!id) {
    // A route referencing a role name that was never seeded is a
    // misconfiguration bug, not a user-facing error — fail loudly.
    throw new Error(`Unknown role name: "${name}". Check seed.ts and route configuration.`);
  }
  return id;
}

export async function getRoleIds(names: RoleName[]): Promise<string[]> {
  return Promise.all(names.map(getRoleId));
}

/** Test/dev utility only — not used during normal request handling. */
export function invalidateRoleCache(): void {
  roleNameToId = null;
  loadingPromise = null;
}
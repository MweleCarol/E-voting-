/**
 * Shared Enums — Prisma Enum Re-exports
 *
 * Architecture pattern: Anti-Corruption Layer
 * Layer: Shared Infrastructure
 *
 * WHY re-export instead of importing from generated Prisma client directly?
 *
 * The generated Prisma client lives at `../generated/prisma`. Its output path
 * is an implementation detail of the ORM layer — it could change if you
 * switch from Prisma to another ORM, regenerate to a different path, or
 * restructure the project.
 *
 * If every module imports directly from `@/generated/prisma`, and that path
 * changes, you have 40+ files to update. If every module imports from
 * `@shared/enums`, you update one line here.
 *
 * This is the Anti-Corruption Layer pattern — you don't let generated/external
 * types leak into your domain layer. Your domain speaks your terms; the
 * generated types are translated at the boundary.
 *
 * Additionally: some of these enums may need augmentation or documentation
 * that you can't add to the generated file (which must never be manually edited).
 * This file is the right place for that.
 *
 * USAGE in any module:
 *   import { ElectionStatus, UserStatus } from '@shared/enums';
 *   // NOT: import { ElectionStatus } from '@/generated/prisma';
 */

export {
  UserStatus,
  ElectionStatus,
  CandidateStatus,
  ApprovalActionType,
  ApprovalStatus,
  ApprovalDecision,
} from '@generated/prisma/client';

/**
 * Election state machine — valid transitions only.
 *
 * This is documentation-as-code. It records which transitions are valid
 * so any developer working on the elections module has the full picture
 * without reading through the service logic.
 *
 * DRAFT → PENDING_APPROVAL
 * PENDING_APPROVAL → SCHEDULED (after required approvals)
 * PENDING_APPROVAL → DRAFT (if rejected)
 * SCHEDULED → ACTIVE (manual trigger or scheduled job)
 * ACTIVE → CLOSED (manual trigger or scheduled job)
 * CLOSED → RESULTS_PENDING (tally initiated)
 * RESULTS_PENDING → ARCHIVED (after results published)
 *
 * No state can skip ahead. No state can go backward.
 * The ElectionStateError is thrown when a transition is attempted out of order.
 */
export const VALID_ELECTION_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PENDING_APPROVAL'],
  PENDING_APPROVAL: ['SCHEDULED', 'DRAFT'],
  SCHEDULED: ['ACTIVE'],
  ACTIVE: ['CLOSED'],
  CLOSED: ['RESULTS_PENDING'],
  RESULTS_PENDING: ['ARCHIVED'],
  ARCHIVED: [], // terminal state
};

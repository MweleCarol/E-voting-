import type { AuditLog } from "@/lib/types";

// IMPORTANT: this is a REAL hash chain, not random-looking strings.
// Each currentHash = sha256(JSON.stringify(eventData) + previousHash),
// truncated to 16 hex chars, matching the LLD's formula (section 18).
// If you build a "verify chain integrity" feature, you can actually
// recompute these hashes client-side and confirm they match — useful
// for demonstrating the tamper-evidence concept genuinely, not just
// visually. See verifyHashChain() below for that recomputation.

export const mockAuditLogs: AuditLog[] = [
  {
    id: "log-001",
    actorId: "user-admin-001",
    actorName: "J. Mwangi",
    eventType: "ELECTION_CREATED",
    eventData: { electionId: "election-001", title: "Student Government Elections 2025" },
    previousHash: "0000000000000000",
    currentHash: "e7526ac792e95cd3",
    createdAt: "2025-09-15T10:00:00Z",
  },
  {
    id: "log-002",
    actorId: "user-admin-002",
    actorName: "Grace Njeri",
    eventType: "VOTER_VERIFIED",
    eventData: { studentId: "std-001" },
    previousHash: "e7526ac792e95cd3",
    currentHash: "3082c506fcdf88da",
    createdAt: "2025-09-20T09:00:00Z",
  },
  {
    id: "log-003",
    actorId: "user-admin-001",
    actorName: "J. Mwangi",
    eventType: "ELECTION_ACTIVATED",
    eventData: { electionId: "election-001" },
    previousHash: "3082c506fcdf88da",
    currentHash: "816017aaee255808",
    createdAt: "2025-10-01T08:00:00Z",
  },
  {
    id: "log-004",
    actorId: "user-001",
    actorName: "Amina Wanjiru",
    eventType: "VOTE_CAST",
    eventData: { electionId: "election-003", receiptCode: "A72F9C1D" },
    previousHash: "816017aaee255808",
    currentHash: "4ac02c762cc043fa",
    createdAt: "2025-08-01T14:22:00Z",
  },
  {
    id: "log-005",
    actorId: "user-admin-003",
    actorName: "Peter Odhiambo",
    eventType: "RESULTS_PUBLISHED",
    eventData: { electionId: "election-003" },
    previousHash: "4ac02c762cc043fa",
    currentHash: "63d9b72f8979d21d",
    createdAt: "2025-08-03T16:00:00Z",
  },
  {
    id: "log-006",
    actorId: "user-admin-002",
    actorName: "Grace Njeri",
    eventType: "REGISTRATION_REJECTED",
    eventData: { studentId: "std-003" },
    previousHash: "63d9b72f8979d21d",
    currentHash: "d0e66bfb02f3788c",
    createdAt: "2025-09-18T11:00:00Z",
  },
];

export function getAuditLogsByEventType(eventType: string): AuditLog[] {
  return mockAuditLogs.filter((log) => log.eventType === eventType);
}
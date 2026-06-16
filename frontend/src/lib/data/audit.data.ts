export const mockAuditLogs: AuditLog[] = [
  {
    id: "log-001",
    actorId: "user-admin-001",
    actorName: "J. Mwangi",
    eventType: "ELECTION_CREATED",
    eventData: { electionId: "election-001", title: "Student Government Elections 2025" },
    previousHash: "0000000000000000",
    currentHash: "a3f8c2d1e4b7f9a0",
    createdAt: "2025-09-15T10:00:00Z"
  },
  {
    id: "log-002",
    actorId: "user-001",
    actorName: "Amina Wanjiru",
    eventType: "VOTE_CAST",
    eventData: { electionId: "election-001", receiptCode: "A72F9C1D" },
    previousHash: "a3f8c2d1e4b7f9a0",
    currentHash: "b9e2f1c3d5a8e0f2",
    createdAt: "2025-10-01T11:42:00Z"
  }
];
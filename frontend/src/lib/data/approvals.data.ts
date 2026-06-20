import type { ApprovalRequest } from "@/lib/types";

// Covers all four ApprovalActionType cases from the LLD (creation,
// activation, closure, result publication) and all three quorum
// states: still pending (1 of 2 needed approvals in), fully approved,
// and rejected outright.

export const mockApprovalRequests: ApprovalRequest[] = [
  {
    id: "approval-001",
    actionType: "ELECTION_ACTIVATION",
    requestedBy: "user-admin-001",
    status: "PENDING",
    targetId: "election-005",
    targetLabel: "Hostel Welfare Committee Elections",
    createdAt: "2025-11-02T09:00:00Z",
    approvals: [
      {
        id: "a1",
        officerId: "user-admin-002",
        officerName: "Grace Njeri",
        decision: "APPROVED",
        timestamp: "2025-11-02T10:00:00Z",
      },
      {
        id: "a2",
        officerId: "user-admin-003",
        officerName: "Peter Odhiambo",
        decision: "PENDING",
        timestamp: null,
      },
    ],
  },
  {
    id: "approval-002",
    actionType: "ELECTION_CREATION",
    requestedBy: "user-admin-001",
    status: "APPROVED",
    targetId: "election-001",
    targetLabel: "Student Government Elections 2025",
    createdAt: "2025-09-14T09:00:00Z",
    approvals: [
      {
        id: "a3",
        officerId: "user-admin-002",
        officerName: "Grace Njeri",
        decision: "APPROVED",
        timestamp: "2025-09-14T11:00:00Z",
      },
      {
        id: "a4",
        officerId: "user-admin-003",
        officerName: "Peter Odhiambo",
        decision: "APPROVED",
        timestamp: "2025-09-14T15:00:00Z",
      },
    ],
  },
  {
    id: "approval-003",
    actionType: "RESULT_PUBLICATION",
    requestedBy: "user-admin-001",
    status: "APPROVED",
    targetId: "election-003",
    targetLabel: "Sports Council Elections 2025",
    createdAt: "2025-08-03T09:00:00Z",
    approvals: [
      {
        id: "a5",
        officerId: "user-admin-002",
        officerName: "Grace Njeri",
        decision: "APPROVED",
        timestamp: "2025-08-03T10:00:00Z",
      },
      {
        id: "a6",
        officerId: "user-admin-003",
        officerName: "Peter Odhiambo",
        decision: "APPROVED",
        timestamp: "2025-08-03T13:00:00Z",
      },
    ],
  },
  {
    id: "approval-004",
    actionType: "ELECTION_CLOSURE",
    requestedBy: "user-admin-001",
    status: "REJECTED",
    targetId: "election-004",
    targetLabel: "Postgraduate Students Association Elections",
    createdAt: "2025-11-20T09:00:00Z",
    approvals: [
      {
        id: "a7",
        officerId: "user-admin-002",
        officerName: "Grace Njeri",
        decision: "REJECTED",
        timestamp: "2025-11-20T12:00:00Z",
      },
      {
        id: "a8",
        officerId: "user-admin-003",
        officerName: "Peter Odhiambo",
        decision: "PENDING",
        timestamp: null,
      },
    ],
  },
];

export function getPendingApprovalRequests(): ApprovalRequest[] {
  return mockApprovalRequests.filter((r) => r.status === "PENDING");
}

export function getApprovalRequestsByOfficer(officerId: string): ApprovalRequest[] {
  return mockApprovalRequests.filter((r) =>
    r.approvals.some((a) => a.officerId === officerId)
  );
}
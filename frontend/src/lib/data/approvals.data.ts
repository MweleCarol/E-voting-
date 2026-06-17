import { ApprovalRequest } from "@/lib/types";

export const mockApprovalRequests: ApprovalRequest[] = [
  {
    id: "approval-001",
    actionType: "ELECTION_ACTIVATION",
    requestedBy: "user-admin-001",
    status: "PENDING",
    targetId: "election-001",
    targetLabel: "Student Government Elections 2025",
    createdAt: "2025-09-28T09:00:00Z",
    approvals: [
      { id: "a1", officerId: "user-admin-002", officerName: "Grace Njeri", decision: "APPROVED", timestamp: "2025-09-28T10:00:00Z" },
      { id: "a2", officerId: "user-admin-003", officerName: "Peter Odhiambo", decision: "PENDING", timestamp: null }
    ]
  }
];
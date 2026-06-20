import type { Election } from "@/lib/types";

// These exist only for admin-facing screens (election management,
// approvals). Students should never see DRAFT/PENDING_APPROVAL
// elections — keeping them in a separate file makes that boundary
// explicit at the data layer, not just enforced by filtering logic
// that's easy to forget to apply consistently.

export const mockAdminOnlyElections: Election[] = [
  {
    id: "election-004",
    title: "Postgraduate Students Association Elections",
    description: "Draft — not yet submitted for approval.",
    status: "DRAFT",
    startDate: "2025-12-01T08:00:00Z",
    endDate: "2025-12-02T18:00:00Z",
    createdBy: "user-admin-001",
    createdAt: "2025-11-25T10:00:00Z",
    positions: [
      { id: "pos-005", title: "PGSA Chair", electionId: "election-004" },
    ],
  },
  {
    id: "election-005",
    title: "Hostel Welfare Committee Elections",
    description: "Awaiting 2-of-3 officer approval to activate.",
    status: "PENDING_APPROVAL",
    startDate: "2025-11-15T08:00:00Z",
    endDate: "2025-11-16T18:00:00Z",
    createdBy: "user-admin-001",
    createdAt: "2025-11-01T10:00:00Z",
    positions: [
      { id: "pos-006", title: "Welfare Chair", electionId: "election-005" },
    ],
  },
  {
    id: "election-006",
    title: "Student Government Elections 2024",
    description: "Previous year's elections, retained for audit reference.",
    status: "ARCHIVED",
    startDate: "2024-10-01T08:00:00Z",
    endDate: "2024-10-03T18:00:00Z",
    createdBy: "user-admin-001",
    createdAt: "2024-09-15T10:00:00Z",
    positions: [
      { id: "pos-007", title: "President", electionId: "election-006" },
    ],
  },
];

// Convenience combining both pools for admin views that need the
// complete picture across every lifecycle state.
export function getAllElectionsForAdmin(studentFacingElections: Election[]): Election[] {
  return [...studentFacingElections, ...mockAdminOnlyElections];
}
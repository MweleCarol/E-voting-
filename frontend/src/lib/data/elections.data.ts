import type { Election } from "@/lib/types";

// Three elections covering the three states most screens need to
// handle: ACTIVE (votable now), SCHEDULED (upcoming), CLOSED (has a
// past vote + published results). DRAFT/PENDING_APPROVAL/ARCHIVED are
// covered separately in elections-admin.data.ts for admin-only views.

export const mockElections: Election[] = [
  {
    id: "election-001",
    title: "Student Government Elections 2025",
    description: "Annual elections for the Student Government Association executive committee.",
    status: "ACTIVE",
    startDate: "2025-10-01T08:00:00Z",
    endDate: "2025-10-03T18:00:00Z",
    createdBy: "user-admin-001",
    createdAt: "2025-09-15T10:00:00Z",
    positions: [
      { id: "pos-001", title: "President", electionId: "election-001" },
      { id: "pos-002", title: "Vice President", electionId: "election-001" },
    ],
  },
  {
    id: "election-002",
    title: "School of Computing — Representative Elections",
    description: "Elections for school-level student representatives.",
    status: "SCHEDULED",
    startDate: "2025-11-10T08:00:00Z",
    endDate: "2025-11-11T18:00:00Z",
    createdBy: "user-admin-001",
    createdAt: "2025-10-20T10:00:00Z",
    positions: [
      { id: "pos-003", title: "School Representative", electionId: "election-002" },
    ],
  },
  {
    id: "election-003",
    title: "Sports Council Elections 2025",
    description: "Elections for sports council leadership.",
    status: "CLOSED",
    startDate: "2025-08-01T08:00:00Z",
    endDate: "2025-08-02T18:00:00Z",
    createdBy: "user-admin-002",
    createdAt: "2025-07-20T10:00:00Z",
    positions: [
      { id: "pos-004", title: "Sports Secretary", electionId: "election-003" },
    ],
  },
];

export function getElectionById(id: string): Election | null {
  return mockElections.find((e) => e.id === id) ?? null;
}
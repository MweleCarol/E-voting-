import type { Candidate } from "@/lib/types";

// Covers: a contested race (pos-001, 2 approved candidates), an
// uncontested race (pos-002, 1 approved candidate), a still-pending
// candidacy (pos-003), a rejected candidacy (for admin candidate
// management screens), and the closed election's winning candidate
// (pos-004, referenced by results.data.ts).

export const mockCandidates: Candidate[] = [
  // pos-001 — President, election-001 (ACTIVE) — contested
  {
    id: "cand-001",
    studentId: "std-002",
    positionId: "pos-001",
    manifesto:
      "I will champion student welfare, improve campus facilities, and ensure transparent governance. My three priorities: mental health support, academic resources, and inter-school collaboration.",
    status: "APPROVED",
    student: {
      fullName: "Brian Kamau",
      admissionNo: "D021/0042/2022",
      school: "School of Engineering Technology",
      yearOfStudy: 3,
    },
  },
  {
    id: "cand-002",
    studentId: "std-003",
    positionId: "pos-001",
    manifesto:
      "As a three-year student leader, I bring experience and a proven track record. I will focus on industry linkages, internship opportunities, and student safety.",
    status: "APPROVED",
    student: {
      fullName: "Cynthia Achieng",
      admissionNo: "D021/0089/2021",
      school: "School of Business & Economics",
      yearOfStudy: 4,
    },
  },

  // pos-002 — Vice President, election-001 (ACTIVE) — uncontested
  {
    id: "cand-003",
    studentId: "std-004",
    positionId: "pos-002",
    manifesto:
      "I want to strengthen the link between students and administration, with a focus on transparent budget reporting and faster resolution of student grievances.",
    status: "APPROVED",
    student: {
      fullName: "David Mutiso",
      admissionNo: "D021/0117/2023",
      school: "School of Computing & Information Technology",
      yearOfStudy: 2,
    },
  },

  // pos-003 — School Representative, election-002 (SCHEDULED) — pending review
  {
    id: "cand-004",
    studentId: "std-002",
    positionId: "pos-003",
    manifesto: "Draft manifesto — awaiting verification officer approval before the election opens.",
    status: "PENDING",
    student: {
      fullName: "Brian Kamau",
      admissionNo: "D021/0042/2022",
      school: "School of Engineering Technology",
      yearOfStudy: 3,
    },
  },

  // A rejected candidacy — for admin candidate management screens to
  // have a non-trivial example to render (rejection reason workflow).
  {
    id: "cand-005",
    studentId: "std-003",
    positionId: "pos-003",
    manifesto: "Submitted manifesto pending review.",
    status: "REJECTED",
    student: {
      fullName: "Cynthia Achieng",
      admissionNo: "D021/0089/2021",
      school: "School of Business & Economics",
      yearOfStudy: 4,
    },
  },

  // pos-004 — Sports Secretary, election-003 (CLOSED) — winner, referenced by results.data.ts
  {
    id: "cand-006",
    studentId: "std-004",
    positionId: "pos-004",
    manifesto:
      "I will revive inter-school sports tournaments and push for better funding for athletics equipment.",
    status: "APPROVED",
    student: {
      fullName: "David Mutiso",
      admissionNo: "D021/0117/2023",
      school: "School of Computing & Information Technology",
      yearOfStudy: 2,
    },
  },
  {
    id: "cand-007",
    studentId: "std-002",
    positionId: "pos-004",
    manifesto: "I will prioritize female athlete representation and gym facility upgrades.",
    status: "APPROVED",
    student: {
      fullName: "Brian Kamau",
      admissionNo: "D021/0042/2022",
      school: "School of Engineering Technology",
      yearOfStudy: 3,
    },
  },
];

export function getCandidatesByPositionId(positionId: string): Candidate[] {
  return mockCandidates.filter((c) => c.positionId === positionId);
}

export function getCandidatesByElectionPositions(positionIds: string[]): Candidate[] {
  return mockCandidates.filter((c) => positionIds.includes(c.positionId));
}
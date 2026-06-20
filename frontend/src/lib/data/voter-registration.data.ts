import type { VoterRegistration } from "@/lib/types";

export const mockVoterRegistrations: VoterRegistration[] = [
  {
    id: "vr-001",
    studentId: "std-001",
    verified: true,
    status: "VERIFIED",
    verifiedBy: "user-admin-002",
    verifiedAt: "2025-09-20T09:00:00Z",
  },
  {
    id: "vr-002",
    studentId: "std-002",
    verified: false,
    status: "PENDING",
    verifiedBy: null,
    verifiedAt: null,
  },
  {
    id: "vr-003",
    studentId: "std-003",
    verified: false,
    status: "REJECTED",
    verifiedBy: "user-admin-002",
    verifiedAt: "2025-09-18T11:00:00Z",
  },
  {
    id: "vr-004",
    studentId: "std-004",
    verified: true,
    status: "VERIFIED",
    verifiedBy: "user-admin-002",
    verifiedAt: "2025-09-19T14:30:00Z",
  },
];

export function getVoterRegistrationByStudentId(studentId: string): VoterRegistration | null {
  return mockVoterRegistrations.find((r) => r.studentId === studentId) ?? null;
}

export function getPendingVoterRegistrations(): VoterRegistration[] {
  return mockVoterRegistrations.filter((r) => r.status === "PENDING");
}
import type { AuthenticatedUser } from "@/lib/types";

// One realistic mock user per role, used by DevRoleSwitcher. Admission
// numbers follow DeKUT's real format (D021/XXXX/20XX).

export const mockUsersByRole: Record<AuthenticatedUser["role"], AuthenticatedUser> = {
  STUDENT: {
    id: "user-001",
    email: "amina.wanjiru@dkut.ac.ke",
    role: "STUDENT",
    student: {
      id: "std-001",
      admissionNo: "D021/0001/2021",
      fullName: "Amina Wanjiru",
      school: "School of Computing & Information Technology",
      yearOfStudy: 4,
    },
  },
  CANDIDATE: {
    id: "user-002",
    email: "brian.kamau@dkut.ac.ke",
    role: "CANDIDATE",
    student: {
      id: "std-002",
      admissionNo: "D021/0042/2022",
      fullName: "Brian Kamau",
      school: "School of Engineering Technology",
      yearOfStudy: 3,
    },
  },
  ELECTION_OFFICER: {
    id: "user-admin-001",
    email: "j.mwangi@dkut.ac.ke",
    role: "ELECTION_OFFICER",
    student: null,
  },
  VERIFICATION_OFFICER: {
    id: "user-admin-002",
    email: "g.njeri@dkut.ac.ke",
    role: "VERIFICATION_OFFICER",
    student: null,
  },
  AUDITOR: {
    id: "user-admin-003",
    email: "p.odhiambo@dkut.ac.ke",
    role: "AUDITOR",
    student: null,
  },
  OBSERVER: {
    id: "user-admin-004",
    email: "observer@dkut.ac.ke",
    role: "OBSERVER",
    student: null,
  },
  SYSTEM_ADMIN: {
    id: "user-admin-005",
    email: "sysadmin@dkut.ac.ke",
    role: "SYSTEM_ADMIN",
    student: null,
  },
};

// Extra student/candidate records referenced by candidates.data.ts and
// elections that aren't part of the 7 role-switcher identities above
// (e.g. opposing candidates in a race). Not selectable via DevRoleSwitcher
// directly, but their IDs are used consistently across mock files.
export const mockExtraStudents = {
  cynthia: {
    id: "std-003",
    admissionNo: "D021/0089/2021",
    fullName: "Cynthia Achieng",
    school: "School of Business & Economics",
    yearOfStudy: 4,
  },
  david: {
    id: "std-004",
    admissionNo: "D021/0117/2023",
    fullName: "David Mutiso",
    school: "School of Computing & Information Technology",
    yearOfStudy: 2,
  },
};

export const mockCurrentUser: AuthenticatedUser = mockUsersByRole.STUDENT;
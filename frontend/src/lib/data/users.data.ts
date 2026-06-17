import type { AuthenticatedUser } from "@/lib/types";

// One realistic mock user per role. The DevRoleSwitcher cycles through
// these by key. Keep admissionNo format consistent with DeKUT's real
// pattern (D021/XXXX/20XX) for academic defensibility in screenshots/demo.

export const mockUsersByRole: Record<AuthenticatedUser["role"], AuthenticatedUser> = {
  STUDENT: {
    id: "user-001",
    email: "amina.wanjiru@dkut.ac.ke",
    role: "STUDENT",
    student: {
      id: "std-001",
      admissionNo: "D021/0001/2021",
      fullName: "Amina Wanjiru",
      school: "School of Computing & IT",
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
      school: "School of Engineering",
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

// Default user when the app boots with no session — kept as STUDENT
// to match the primary user journey you're building first.
export const mockCurrentUser: AuthenticatedUser = mockUsersByRole.STUDENT;
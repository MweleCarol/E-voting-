export const mockCurrentUser: AuthenticatedUser = {
  id: "user-001",
  email: "amina.wanjiru@dkut.ac.ke",
  role: "STUDENT",
  student: {
    id: "std-001",
    admissionNo: "D021/0001/2021",
    fullName: "Amina Wanjiru",
    school: "School of Computing & IT",
    yearOfStudy: 4
  }
};

export const mockAdminUser: AuthenticatedUser = {
  id: "user-admin-001",
  email: "j.mwangi@dkut.ac.ke",
  role: "ELECTION_OFFICER",
  student: null
};
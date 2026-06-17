import { Candidate } from "@/lib/types";

export const mockCandidates: Candidate[] = [
  {
    id: "cand-001",
    studentId: "std-001",
    positionId: "pos-001",
    manifesto: "I will champion student welfare, improve campus facilities, and ensure transparent governance. My three priorities: mental health support, academic resources, and inter-school collaboration.",
    status: "APPROVED",
    student: {
      fullName: "Amina Wanjiru",
      admissionNo: "D021/0001/2021",
      school: "School of Computing & IT",
      yearOfStudy: 4
    }
  },
  {
    id: "cand-002",
    studentId: "std-002",
    positionId: "pos-001",
    manifesto: "As a three-year student leader, I bring experience and a proven track record. I will focus on industry linkages, internship opportunities, and student safety.",
    status: "APPROVED",
    student: {
      fullName: "Brian Kamau",
      admissionNo: "D021/0042/2022",
      school: "School of Engineering",
      yearOfStudy: 3
    }
  }
];
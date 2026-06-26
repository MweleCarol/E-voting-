// src/modules/users/scratch.manual3.ts
import { bulkImportStudents } from './users.service.js';

const csv = `email,fullName,admissionNo,school,yearOfStudy
s1@students.dkut.ac.ke,Student One,SCI-001,School of Computer Science,1
s2@students.dkut.ac.ke,Student Two,SCI-002,School of Computer Science,2
s1@students.dkut.ac.ke,Student One Again,SCI-003,School of Computer Science,1
s4@students.dkut.ac.ke,Student Four,SCI-004,School of Computer Science,abc`;

bulkImportStudents(Buffer.from(csv))
  .then((summary) => console.log(JSON.stringify(summary, null, 2)))
  .catch((e) => { console.error(e); process.exit(1); });
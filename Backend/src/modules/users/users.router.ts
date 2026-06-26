import { Router, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import { authenticate } from '@middleware/authenticate.middleware'; // confirm export name
import { requireRole } from '@middleware/requireRole.middleware';
import { validate } from '@middleware/validate.middleware';
import { asyncHandler } from '@middleware/asyncHandler'; // confirm actual path
import { ValidationError } from '@shared/errors/errors';
import {
  createSingleUserSchema,
  listUsersQuerySchema,
  userIdParamSchema,
} from './users.validation';
import { importStudents, createUser, listUsersHandler, getUserHandler } from './users.controller';

const router = Router();

// Every route below is admin-only for now — narrow on purpose, not yet
// confirmed whether ELECTION_OFFICER should also run bulk import.
router.use(authenticate);

const csvUpload = multer({
  storage: multer.memoryStorage(), // buffer in memory — matches bulkImportStudents(csvBuffer: Buffer); fine at this row count, would need disk storage if rolls ever reached tens of MB
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isCsv = file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv');
    if (!isCsv) {
      cb(new Error('Only .csv files are accepted.')); // matches overload 1 — one argument
      return;
    }
    cb(null, true); // matches overload 2 — literal null, literal boolean
  },
});

/**
 * Multer is callback-based, not Promise-based — asyncHandler can't wrap it.
 * This translates a raw multer/file-filter error into a real ValidationError
 * so it reaches your global error handler in the same shape as every other
 * 400 in the system, instead of falling through as an unhandled generic 500.
 */
function handleCsvUpload(req: Request, res: Response, next: NextFunction): void {
  csvUpload.single('file')(req, res, (err: unknown) => {
    if (err)
      return next(new ValidationError(err instanceof Error ? err.message : 'File upload failed.'));
    next();
  });
}

router.post(
  '/students/import',
  requireRole('SYSTEM_ADMIN'),
  handleCsvUpload,
  asyncHandler(importStudents),
);

router.post(
  '/',
  requireRole('SYSTEM_ADMIN'),
  validate({ body: createSingleUserSchema }),
  asyncHandler(createUser),
);

router.get(
  '/',
  requireRole('SYSTEM_ADMIN'),
  validate({ query: listUsersQuerySchema }),
  asyncHandler(listUsersHandler),
);

router.get(
  '/:id',
  requireRole('SYSTEM_ADMIN'),
  validate({ params: userIdParamSchema }),
  asyncHandler(getUserHandler),
);

export default router;

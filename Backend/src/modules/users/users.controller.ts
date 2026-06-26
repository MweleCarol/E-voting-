import type { Request, Response } from 'express';
import { sendSuccess } from '@shared/helpers/response.helper'; // confirm actual path
import { ValidationError } from '@shared/errors/errors';
import { HTTP_STATUS } from '@shared/constants/http-status.constants';
import {
  bulkImportStudents,
  createSingleUserAccount,
  getUsersList,
  getUserDetail,
} from './users.service';
import type { CreateSingleUserParsed, ListUsersQueryParsed, UserIdParam } from './users.validation.js';

export async function importStudents(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    throw new ValidationError('CSV file is required.');
  }
  const summary = await bulkImportStudents(req.file.buffer);
  sendSuccess(res, summary, 'Import completed.');
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const result = await createSingleUserAccount(req.body as CreateSingleUserParsed);
  sendSuccess(res, result, 'User created.', HTTP_STATUS.CREATED);
}

export async function listUsersHandler(req: Request, res: Response): Promise<void> {
  const result = await getUsersList(req.query as unknown as ListUsersQueryParsed);
  sendSuccess(res, result, 'Users retrieved.');
}

export async function getUserHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params as unknown as UserIdParam;
  const result = await getUserDetail(id);
  sendSuccess(res, result, 'User retrieved.');
}
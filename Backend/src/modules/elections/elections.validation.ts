// src/modules/elections/elections.validation.ts

import { z } from 'zod';
import { ElectionStatus } from '@generated/prisma/client';

// ─── PARAM SCHEMAS ────────────────────────────────────────────────────────────

export const electionIdParamSchema = z.object({
  id: z.string().uuid({ message: 'Election ID must be a valid UUID' }),
});

export const positionIdParamSchema = z.object({
  id:       z.string().uuid({ message: 'Election ID must be a valid UUID' }),
  posId:    z.string().uuid({ message: 'Position ID must be a valid UUID' }),
});

// ─── CREATE ELECTION ──────────────────────────────────────────────────────────

export const createElectionSchema = z.object({
  title: z
    .string({ error: 'Title is required' })
    .trim()
    .min(3,  { message: 'Title must be at least 3 characters' })
    .max(200, { message: 'Title must not exceed 200 characters' }),

  description: z
    .string()
    .trim()
    .max(2000, { message: 'Description must not exceed 2000 characters' })
    .optional(),

  startDate: z.coerce.date({
    error: 'startDate must be a valid ISO date string',
  }),

  endDate: z.coerce.date({
    error: 'endDate must be a valid ISO date string',
  }),

  positions: z
    .array(
      z.string({ error: 'Each position must be a string' })
       .trim()
       .min(1,   { message: 'Position title must not be blank' })
       .max(100, { message: 'Position title must not exceed 100 characters' }),
    )
    .min(1, { message: 'At least one position is required' }),

}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: 'endDate must be after startDate',
    path:    ['endDate'],
  },
).refine(
  (data) => data.startDate > new Date(),
  {
    message: 'startDate must be in the future',
    path:    ['startDate'],
  },
);

// ─── UPDATE ELECTION ──────────────────────────────────────────────────────────
// All fields optional — PATCH semantics.
// Cross-field date validation only fires when both dates are present.

export const updateElectionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3,   { message: 'Title must be at least 3 characters' })
    .max(200, { message: 'Title must not exceed 200 characters' })
    .optional(),

  description: z
    .string()
    .trim()
    .max(2000, { message: 'Description must not exceed 2000 characters' })
    .optional(),

  startDate: z.coerce.date({
    error: 'startDate must be a valid ISO date string',
  }).optional(),

  endDate: z.coerce.date({
    error: 'endDate must be a valid ISO date string',
  }).optional(),

}).refine(
  (data) => {
    if (data.startDate !== undefined && data.endDate !== undefined) {
      return data.endDate > data.startDate;
    }
    return true; // one or neither present — skip cross-field check
  },
  {
    message: 'endDate must be after startDate',
    path:    ['endDate'],
  },
);

// ─── ADD POSITION ─────────────────────────────────────────────────────────────

export const addPositionSchema = z.object({
  title: z
    .string({ error: 'Position title is required' })
    .trim()
    .min(1,   { message: 'Position title must not be blank' })
    .max(100, { message: 'Position title must not exceed 100 characters' }),
});

// ─── LIST ELECTIONS QUERY ─────────────────────────────────────────────────────

export const listElectionsQuerySchema = z.object({
  status: z.nativeEnum(ElectionStatus).optional(),

  page: z.coerce
    .number({ error: 'page must be a number' })
    .int()
    .min(1, { message: 'page must be at least 1' })
    .default(1),

  limit: z.coerce
    .number({ error: 'limit must be a number' })
    .int()
    .min(1,   { message: 'limit must be at least 1' })
    .max(100, { message: 'limit must not exceed 100' })
    .default(20),
});

// ─── INFERRED TYPES ───────────────────────────────────────────────────────────
// Used by controllers — these are post-coercion types (dates are Date objects).

export type CreateElectionBody  = z.infer<typeof createElectionSchema>;
export type UpdateElectionBody  = z.infer<typeof updateElectionSchema>;
export type AddPositionBody     = z.infer<typeof addPositionSchema>;
export type ListElectionsQuery  = z.infer<typeof listElectionsQuerySchema>;
export type ElectionIdParam     = z.infer<typeof electionIdParamSchema>;
export type PositionIdParam     = z.infer<typeof positionIdParamSchema>;
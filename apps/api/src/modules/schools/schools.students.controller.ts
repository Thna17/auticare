import type { Request, Response } from 'express';
import { ok } from '../../common/http/response.js';
import { SchoolStudentsService } from './schools.students.service.js';

const service = new SchoolStudentsService();

export const listMyStudents = async (req: Request, res: Response) =>
  ok(res, await service.listMyStudents(req.auth!));

/**
 * GET /api/v1/schools/enrolled-students
 * Student picker for the activity report form — ACTIVE enrollments with
 * dateOfBirth and a server-computed age.
 */
export const listEnrolledStudents = async (req: Request, res: Response) =>
  ok(res, await service.listEnrolledStudents(req.auth!));

import type { Request, Response } from 'express';
import {
  createSchoolStudentRequestSchema,
  listEnrolledStudentsQuerySchema,
  updateSchoolEnrollmentRequestSchema,
} from '@auticare/contracts';
import { forbidden } from '../../common/errors/app-error.js';
import { created, ok } from '../../common/http/response.js';
import { SchoolEnrollmentsService } from './schools.enrollments.service.js';

const service = new SchoolEnrollmentsService();

/** GET /api/v1/schools/enrollments/stats */
export const getEnrollmentStats = async (req: Request, res: Response) => {
  if (!req.auth || req.auth.role !== 'SCHOOL') throw forbidden();
  try {
    ok(res, await service.getEnrollmentStats(req.auth));
  } catch (error) {
    // Re-throw AppErrors (403 etc.), wrap unexpected errors as 500
    if (error && typeof error === 'object' && 'statusCode' in error) throw error;
    throw Object.assign(new Error('Failed to fetch enrollment stats.'), { statusCode: 500 });
  }
};

/** GET /api/v1/schools/enrollments/students */
export const getEnrolledStudents = async (req: Request, res: Response) => {
  if (!req.auth || req.auth.role !== 'SCHOOL') throw forbidden();

  // Validate and parse query parameters with Zod
  const query = listEnrolledStudentsQuerySchema.parse(req.query);

  try {
    const filters: { status?: string; specialistId?: string; search?: string } = {};
    if (query.status) filters.status = query.status;
    if (query.specialistId) filters.specialistId = query.specialistId;
    if (query.search) filters.search = query.search;

    ok(
      res,
      await service.getEnrolledStudents(req.auth, filters, {
        page: query.page,
        limit: query.limit,
      }),
    );
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error;
    throw Object.assign(new Error('Failed to fetch enrolled students.'), { statusCode: 500 });
  }
};

/** GET /api/v1/schools/enrollments/specialists */
export const getLeadSpecialists = async (req: Request, res: Response) => {
  if (!req.auth || req.auth.role !== 'SCHOOL') throw forbidden();
  try {
    ok(res, await service.getLeadSpecialists(req.auth));
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error;
    throw Object.assign(new Error('Failed to fetch specialists.'), { statusCode: 500 });
  }
};

/** POST /api/v1/schools/enrollments/students */
export const createStudent = async (req: Request, res: Response) => {
  if (!req.auth || req.auth.role !== 'SCHOOL') throw forbidden();
  const input = createSchoolStudentRequestSchema.parse(req.body);
  try {
    created(res, await service.createStudent(req.auth, input));
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error;
    throw Object.assign(new Error('Failed to create student.'), { statusCode: 500 });
  }
};

/** PATCH /api/v1/schools/enrollments/:childId — edit student/enrollment. */
export const updateEnrolledStudent = async (req: Request, res: Response) => {
  if (!req.auth || req.auth.role !== 'SCHOOL') throw forbidden();
  const childId = requiredPathParam(req.params.childId);
  const input = updateSchoolEnrollmentRequestSchema.parse(req.body);
  try {
    ok(res, await service.updateEnrolledStudent(req.auth, childId, input));
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error;
    throw Object.assign(new Error('Failed to update the student.'), { statusCode: 500 });
  }
};

/** DELETE /api/v1/schools/enrollments/:childId — remove student from school. */
export const removeEnrolledStudent = async (req: Request, res: Response) => {
  if (!req.auth || req.auth.role !== 'SCHOOL') throw forbidden();
  const childId = requiredPathParam(req.params.childId);
  try {
    ok(res, await service.removeEnrolledStudent(req.auth, childId));
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error;
    throw Object.assign(new Error('Failed to remove the student.'), { statusCode: 500 });
  }
};

const requiredPathParam = (value: string | readonly string[] | undefined): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw Object.assign(new Error('Missing route parameter.'), { statusCode: 400 });
  }
  return value;
};

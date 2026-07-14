import { z } from 'zod';

export const riskLevels = ['LOW', 'MODERATE', 'HIGH'] as const;
export type RiskLevel = (typeof riskLevels)[number];
export const screeningStatuses = ['DRAFT', 'SUBMITTED', 'ANALYZED'] as const;
export type ScreeningStatus = (typeof screeningStatuses)[number];
export const userRoles = ['PARENT', 'ADMIN', 'SCHOOL'] as const;
export type UserRole = (typeof userRoles)[number];
export const errorCodes = [
  'VALIDATION_ERROR',
  'AUTHENTICATION_REQUIRED',
  'AUTHORIZATION_FAILED',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
] as const;
export type ErrorCode = (typeof errorCodes)[number];
export type ApiSuccess<TData, TMeta = Record<string, never>> = {
  readonly data: TData;
  readonly meta: TMeta;
};
export type ApiError = {
  readonly error: {
    readonly code: ErrorCode;
    readonly message: string;
    readonly details?: readonly unknown[];
    readonly requestId: string;
  };
};
export type PaginationMeta = {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
};
export const parentResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(userRoles),
});
export type ParentResponse = z.infer<typeof parentResponseSchema>;
export const authResponseSchema = z.object({ parent: parentResponseSchema });
export type AuthResponse = z.infer<typeof authResponseSchema>;

export const refreshResponseSchema = z.object({ parent: parentResponseSchema });
export type RefreshResponse = z.infer<typeof refreshResponseSchema>;

export const registerRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const passwordResetRequestSchema = z.object({
  email: z.string().email(),
});
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export const passwordResetResponseSchema = z.object({
  message: z.string(),
  resetToken: z.string().optional(),
  resetUrl: z.string().url().optional(),
});
export type PasswordResetResponse = z.infer<typeof passwordResetResponseSchema>;
export const resetPasswordRequestSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(12),
});
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export const resetPasswordResponseSchema = z.object({
  message: z.string(),
});
export type ResetPasswordResponse = z.infer<typeof resetPasswordResponseSchema>;
export const childResponseSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.'),
  notes: z.string().nullable(),
  archivedAt: z.string().nullable(),
});
export type ChildResponse = z.infer<typeof childResponseSchema>;
export const createChildRequestSchema = z.object({
  firstName: z.string().min(1).max(80),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.'),
  notes: z.string().max(2000).optional(),
});
export type CreateChildRequest = z.infer<typeof createChildRequestSchema>;

export const updateChildRequestSchema = createChildRequestSchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    'At least one child profile field must be provided.',
  );
export type UpdateChildRequest = z.infer<typeof updateChildRequestSchema>;

export const screeningDisclaimer =
  'AutiCare screening is informational support only and is not a medical diagnosis. Please consult a qualified clinician for diagnosis or treatment decisions.';

export const schoolEnrollmentStatuses = ['ACTIVE', 'ENDED'] as const;
export type SchoolEnrollmentStatus = (typeof schoolEnrollmentStatuses)[number];

export const schoolStaffResponseSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  parentId: z.string(),
  title: z.string().nullable(),
});
export type SchoolStaffResponse = z.infer<typeof schoolStaffResponseSchema>;

export const schoolChildEnrollmentResponseSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  childId: z.string(),
  status: z.enum(schoolEnrollmentStatuses),
  startedAt: z.string(),
  endedAt: z.string().nullable(),
});
export type SchoolChildEnrollmentResponse = z.infer<typeof schoolChildEnrollmentResponseSchema>;

export const createSchoolChildEnrollmentRequestSchema = z.object({
  childId: z.string().min(1),
});
export type CreateSchoolChildEnrollmentRequest = z.infer<
  typeof createSchoolChildEnrollmentRequestSchema
>;

export const schoolActivityReportResponseSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  childId: z.string(),
  reporterId: z.string(),
  title: z.string(),
  summary: z.string(),
  activityDate: z.string(),
  createdAt: z.string(),
});
export type SchoolActivityReportResponse = z.infer<typeof schoolActivityReportResponseSchema>;

export const createSchoolActivityReportRequestSchema = z.object({
  childId: z.string().min(1),
  title: z.string().min(1).max(160),
  summary: z.string().min(1).max(4000),
  activityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.'),
});
export type CreateSchoolActivityReportRequest = z.infer<
  typeof createSchoolActivityReportRequestSchema
>;

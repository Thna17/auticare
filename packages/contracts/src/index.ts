import { z } from 'zod';

export const riskLevels = ['LOW', 'MODERATE', 'HIGH'] as const;
export type RiskLevel = (typeof riskLevels)[number];
export const screeningStatuses = ['DRAFT', 'SUBMITTED', 'ANALYZED'] as const;
export type ScreeningStatus = (typeof screeningStatuses)[number];
// Scoring direction of a screening question. DIRECT: higher answer value = higher
// risk. REVERSE: higher answer value = lower risk. Risk correction is applied only
// at scoring time; the raw 0-4 answer value is always stored unmodified.
export const questionPolarities = ['DIRECT', 'REVERSE'] as const;
export type QuestionPolarity = (typeof questionPolarities)[number];
// Age band a screening session/question belongs to. Under 4 years => TODDLER,
// 4 years and older => PRESCHOOL (decided from the child's age at session start).
export const ageBands = ['TODDLER', 'PRESCHOOL'] as const;
export type AgeBand = (typeof ageBands)[number];
export const userRoles = ['PARENT', 'ADMIN', 'SCHOOL', 'HOSPITAL'] as const;
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

export const hospitalResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  address: z.string(),
  services: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type HospitalResponse = z.infer<typeof hospitalResponseSchema>;

export const createHospitalRequestSchema = z.object({
  name: z.string().min(1).max(160),
  city: z.string().min(1).max(120),
  address: z.string().min(1).max(300),
  services: z.string().min(1).max(2000),
});
export type CreateHospitalRequest = z.infer<typeof createHospitalRequestSchema>;

export const appointmentStatuses = ['REQUESTED', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] as const;
export type AppointmentStatus = (typeof appointmentStatuses)[number];
export const doctorResponseSchema = z.object({
  id: z.string(),
  hospitalId: z.string(),
  fullName: z.string(),
  specialty: z.string(),
  bio: z.string().nullable(),
});
export type DoctorResponse = z.infer<typeof doctorResponseSchema>;
export const appointmentResponseSchema = z.object({
  id: z.string(),
  parentId: z.string(),
  childId: z.string().nullable(),
  childName: z.string().nullable(),
  hospitalId: z.string(),
  hospitalName: z.string(),
  doctorId: z.string().nullable(),
  doctorName: z.string().nullable(),
  scheduledAt: z.string(),
  status: z.enum(appointmentStatuses),
  reason: z.string().nullable(),
});
export type AppointmentResponse = z.infer<typeof appointmentResponseSchema>;
export const createAppointmentRequestSchema = z.object({
  childId: z.string().min(1),
  hospitalId: z.string().min(1),
  doctorId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  reason: z.string().max(2000).optional(),
});
export type CreateAppointmentRequest = z.infer<typeof createAppointmentRequestSchema>;
export const updateAppointmentStatusRequestSchema = z.object({
  status: z.enum(appointmentStatuses),
});
export type UpdateAppointmentStatusRequest = z.infer<typeof updateAppointmentStatusRequestSchema>;
export const doctorRequestSchema = z.object({
  fullName: z.string().min(1).max(160),
  specialty: z.string().min(1).max(160),
  bio: z.string().max(4000).nullable().optional(),
});
export type DoctorRequest = z.infer<typeof doctorRequestSchema>;
export const createHospitalAccountRequestSchema = z.object({
  hospital: createHospitalRequestSchema,
  account: z.object({
    email: z.string().email(),
    password: z.string().min(12),
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
    title: z.string().max(120).optional(),
  }),
});
export type CreateHospitalAccountRequest = z.infer<typeof createHospitalAccountRequestSchema>;
export const hospitalStaffResponseSchema = z.object({
  id: z.string(),
  hospitalId: z.string(),
  parentId: z.string(),
  title: z.string().nullable(),
});
export const adminHospitalAccountResponseSchema = z.object({
  hospital: hospitalResponseSchema,
  staff: hospitalStaffResponseSchema,
  account: parentResponseSchema,
});

export const screeningDisclaimer =
  'AutiCare screening is informational support only and is not a medical diagnosis. Please consult a qualified clinician for diagnosis or treatment decisions.';

export const schoolEnrollmentStatuses = ['ACTIVE', 'ENDED'] as const;
export type SchoolEnrollmentStatus = (typeof schoolEnrollmentStatuses)[number];

export const schoolAvailabilityStatuses = ['IMMEDIATE', 'WAITLIST', 'CLOSED'] as const;
export type SchoolAvailabilityStatus = (typeof schoolAvailabilityStatuses)[number];

// List-item / card shape. `rating` is computed (average of reviews, read-only) and
// `isVerified` is admin-controlled — neither is editable through the profile form.
export const schoolResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  address: z.string(),
  description: z.string().nullable(),
  logoUrl: z.string().nullable(),
  coverImageUrl: z.string().nullable(),
  availabilityStatus: z.enum(schoolAvailabilityStatuses),
  waitlistEstimate: z.string().nullable(),
  studentTeacherRatio: z.string().nullable(),
  specializations: z.array(z.string()),
  isVerified: z.boolean(),
  rating: z.number().nullable(),
  reviewCount: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SchoolResponse = z.infer<typeof schoolResponseSchema>;

// Full public profile (GET /schools/:id and GET /schools/me) — card fields plus
// the extended detail fields. Read-only for parents; no account-internal fields
// (login credentials live on the Parent/SchoolStaff records, never here).
export const schoolDetailResponseSchema = schoolResponseSchema.extend({
  email: z.string().nullable(),
  website: z.string().nullable(),
  admissionRequirements: z.string().nullable(),
  operatingHours: z.string().nullable(),
  facilities: z.array(z.string()),
});
export type SchoolDetailResponse = z.infer<typeof schoolDetailResponseSchema>;

// School-owned self-update (PATCH /schools/me). Deliberately OMITS isVerified and
// rating so they cannot be set here — unknown keys are stripped by zod on parse.
export const updateSchoolProfileRequestSchema = z
  .object({
    name: z.string().min(1).max(160).optional(),
    city: z.string().min(1).max(120).optional(),
    address: z.string().min(1).max(300).optional(),
    description: z.string().max(2000).nullable().optional(),
    email: z.string().email().max(160).nullable().optional(),
    website: z.string().url().max(500).nullable().optional(),
    logoUrl: z.string().url().max(1000).nullable().optional(),
    coverImageUrl: z.string().url().max(1000).nullable().optional(),
    studentTeacherRatio: z.string().max(40).nullable().optional(),
    availabilityStatus: z.enum(schoolAvailabilityStatuses).optional(),
    waitlistEstimate: z.string().max(120).nullable().optional(),
    admissionRequirements: z.string().max(4000).nullable().optional(),
    operatingHours: z.string().max(200).nullable().optional(),
    facilities: z.array(z.string().min(1).max(120)).max(50).optional(),
    specializations: z.array(z.string().min(1).max(120)).max(50).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'At least one school field is required.');
export type UpdateSchoolProfileRequest = z.infer<typeof updateSchoolProfileRequestSchema>;

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

export const createSchoolAccountRequestSchema = z.object({
  school: z.object({
    name: z.string().min(1).max(160),
    city: z.string().min(1).max(120),
    address: z.string().min(1).max(300),
    description: z.string().max(2000).optional(),
  }),
  account: z.object({
    email: z.string().email(),
    password: z.string().min(12),
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
    title: z.string().max(120).optional(),
  }),
});
export type CreateSchoolAccountRequest = z.infer<typeof createSchoolAccountRequestSchema>;

export const updateSchoolRequestSchema = z
  .object({
    name: z.string().min(1).max(160).optional(),
    city: z.string().min(1).max(120).optional(),
    address: z.string().min(1).max(300).optional(),
    description: z.string().max(2000).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one school field is required.');
export type UpdateSchoolRequest = z.infer<typeof updateSchoolRequestSchema>;

export const adminSchoolAccountResponseSchema = z.object({
  school: schoolResponseSchema,
  staff: schoolStaffResponseSchema,
  account: parentResponseSchema,
});
export type AdminSchoolAccountResponse = z.infer<typeof adminSchoolAccountResponseSchema>;

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

export const screeningSessionResponseSchema = z.object({
  id: z.string(),
  childId: z.string(),
  status: z.enum(screeningStatuses),
  // Age band used for this session's question set. Nullable for legacy sessions
  // created before age banding existed.
  ageBand: z.enum(ageBands).nullable(),
  startedAt: z.string(),
  submittedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ScreeningSessionResponse = z.infer<typeof screeningSessionResponseSchema>;

export const screeningQuestionResponseSchema = z.object({
  id: z.string(),
  questionText: z.string(),
  category: z.string(),
  displayOrder: z.number().int(),
  polarity: z.enum(questionPolarities),
});
export type ScreeningQuestionResponse = z.infer<typeof screeningQuestionResponseSchema>;

export const screeningAnswerResponseSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  questionId: z.string(),
  answerValue: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ScreeningAnswerResponse = z.infer<typeof screeningAnswerResponseSchema>;

export const screeningCategoryScoreResponseSchema = z.object({
  category: z.string(),
  riskPercentage: z.number().int(),
  riskLevel: z.enum(riskLevels),
});
export type ScreeningCategoryScoreResponse = z.infer<typeof screeningCategoryScoreResponseSchema>;

export const screeningResultResponseSchema = z.object({
  id: z.string(),
  score: z.number().int(),
  // Normalized 0-100 polarity-corrected risk indicator. Nullable for legacy
  // (pre-v2) results scored by the raw-sum engine.
  riskPercentage: z.number().int().nullable(),
  riskLevel: z.enum(riskLevels),
  recommendation: z.string(),
  disclaimer: z.string(),
  analysisVersion: z.string(),
  analyzedAt: z.string(),
  // Per-category risk breakdown (empty for legacy results scored before v3).
  categoryBreakdown: z.array(screeningCategoryScoreResponseSchema),
});
export type ScreeningResultResponse = z.infer<typeof screeningResultResponseSchema>;

export const screeningSessionDetailResponseSchema = screeningSessionResponseSchema.extend({
  answers: z.array(screeningAnswerResponseSchema),
  result: screeningResultResponseSchema.nullable(),
});
export type ScreeningSessionDetailResponse = z.infer<typeof screeningSessionDetailResponseSchema>;

// Trend comparison against the child's most recent OTHER completed session.
// comparable=true  => same age band; previousRiskPercentage/previousCompletedAt/delta set.
// comparable=false => a previous session exists but used a different age band; reason set.
// The whole object is null when there is no earlier completed session.
export const previousScreeningComparisonSchema = z.object({
  comparable: z.boolean(),
  previousRiskPercentage: z.number().int().nullable(),
  previousCompletedAt: z.string().nullable(),
  delta: z.number().int().nullable(),
  reason: z.string().nullable(),
});
export type PreviousScreeningComparison = z.infer<typeof previousScreeningComparisonSchema>;

export const screeningSessionResultResponseSchema = screeningSessionDetailResponseSchema.extend({
  previousComparison: previousScreeningComparisonSchema.nullable(),
});
export type ScreeningSessionResultResponse = z.infer<typeof screeningSessionResultResponseSchema>;

export const createScreeningSessionRequestSchema = z.object({
  childId: z.string().min(1),
});
export type CreateScreeningSessionRequest = z.infer<typeof createScreeningSessionRequestSchema>;

export const createScreeningSessionResponseSchema = z.object({
  session: screeningSessionResponseSchema,
  questions: z.array(screeningQuestionResponseSchema),
});
export type CreateScreeningSessionResponse = z.infer<typeof createScreeningSessionResponseSchema>;

export const upsertScreeningAnswerRequestSchema = z.object({
  questionId: z.string().min(1),
  answerValue: z.number().int().min(0).max(4),
});
export type UpsertScreeningAnswerRequest = z.infer<typeof upsertScreeningAnswerRequestSchema>;

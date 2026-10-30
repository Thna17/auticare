import { z } from 'zod';
import {
  billingIntervals,
  sponsorshipStatuses,
  subscriptionPlans,
  subscriptionStatuses,
} from './plans.js';

export * from './admin-portal.js';

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
// Which question set a screening uses. FULL is the long instrument; SHORT is the
// few threshold questions a parent meets straight after login. Both are scored by
// the same engine against the same 0-100 normalization, so a short result is
// directly comparable with a past full one in the same age band.
export const screeningFormKinds = ['FULL', 'SHORT'] as const;
export type ScreeningFormKind = (typeof screeningFormKinds)[number];
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
  // The assistant is switched off because no model provider is configured. The
  // rest of the app keeps working; this is a deliberate, reported state rather
  // than a failure a parent should retry.
  'AI_UNAVAILABLE',
  // The account's plan does not allow this (for example a third child on Pro).
  'PLAN_LIMIT_REACHED',
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

// ── Pagination ────────────────────────────────────────────────────────
/**
 * Shared page/limit query for list endpoints.
 *
 * Nearly every list in the app was unbounded — 36 of 37 findMany calls had no
 * take — so a growing database would have been returned whole on every request.
 *
 * `limit` has a hard maximum as well as a default: without the cap a client can
 * ask for the entire table and defeat the point, and the cap has to live in the
 * schema rather than the service so it is enforced before a query is built.
 *
 * The pre-existing listEnrolledStudentsQuerySchema keeps its own default of 10.
 * Changing it would alter the size of a response clients already receive, which
 * is a behaviour change rather than the mechanical one this is.
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/**
 * Counts returned alongside every paginated list, matching the shape
 * getEnrolledStudents established.
 *
 * Replaces an earlier hand-written PaginationMeta type that used `pageSize`
 * instead of `limit`. It was dead — nothing imported it — and having two
 * competing shapes in the same file is how a client ends up reading the wrong
 * key off a response.
 */
export const paginationMetaSchema = z.object({
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  totalPages: z.number().int(),
});
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;
export const parentResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(userRoles),
  mustResetPassword: z.boolean().optional(),
  /** Login name for school-managed teacher accounts; null for everyone else. */
  username: z.string().nullable().optional(),
  /** Optional contact details the account holder can edit themselves. */
  phoneNumber: z.string().nullable(),
  socialMediaAccount: z.string().nullable(),
});
export type ParentResponse = z.infer<typeof parentResponseSchema>;
export const authResponseSchema = z.object({ parent: parentResponseSchema });

/**
 * Fields the signed-in account holder may change about themselves
 * (PATCH /auth/me).
 *
 * Deliberately excludes `email` and `role`: email is the login identity and
 * changing it needs a verification flow, and role is assigned by an
 * administrator. Password changes go through the existing
 * forgot-password/reset-password pair.
 *
 * Every field is optional so a client can send only what changed, but at least
 * one must be present — the service rejects an empty body rather than doing a
 * no-op write.
 */
export const updateMyProfileRequestSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  // Nullable so a value can be cleared, not just replaced.
  phoneNumber: z.string().trim().max(32).nullable().optional(),
  socialMediaAccount: z.string().trim().max(160).nullable().optional(),
});
export type UpdateMyProfileRequest = z.infer<typeof updateMyProfileRequestSchema>;
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
/**
 * `email` carries the login identifier: an email address, or the username of
 * a school-managed teacher account (which has no real email). The field keeps
 * its name so existing clients keep working.
 */
export const loginRequestSchema = z.object({
  email: z.string().trim().min(1).max(254),
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

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12),
});
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;

export const changePasswordResponseSchema = z.object({
  message: z.string(),
});
export type ChangePasswordResponse = z.infer<typeof changePasswordResponseSchema>;

// ── Account Invitation Schemas ───────────────────────────────────────────

export const verifyInvitationQuerySchema = z.object({
  token: z.string().min(1),
});
export type VerifyInvitationQuery = z.infer<typeof verifyInvitationQuerySchema>;

export const verifyInvitationResponseSchema = z.object({
  valid: z.boolean(),
  email: z.string().email(),
  role: z.enum(userRoles),
  firstName: z.string(),
  lastName: z.string(),
  organizationName: z.string().nullable().optional(),
});
export type VerifyInvitationResponse = z.infer<typeof verifyInvitationResponseSchema>;

export const acceptInvitationRequestSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(12),
});
export type AcceptInvitationRequest = z.infer<typeof acceptInvitationRequestSchema>;

export const acceptInvitationResponseSchema = z.object({
  parent: parentResponseSchema,
});
export type AcceptInvitationResponse = z.infer<typeof acceptInvitationResponseSchema>;

export const resendInvitationRequestSchema = z.object({
  email: z.string().email(),
});
export type ResendInvitationRequest = z.infer<typeof resendInvitationRequestSchema>;

export const resendInvitationResponseSchema = z.object({
  message: z.string(),
  invitationUrl: z.string().url().optional(),
});
export type ResendInvitationResponse = z.infer<typeof resendInvitationResponseSchema>;
export const questionnaireStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const;
export type QuestionnaireStatus = (typeof questionnaireStatuses)[number];

export const childResponseSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string().nullable().optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.'),
  address: z.string().nullable().optional(),
  notes: z.string().nullable(),
  archivedAt: z.string().nullable(),
  questionnaireStatus: z.enum(questionnaireStatuses).optional(),
});
export type ChildResponse = z.infer<typeof childResponseSchema>;
export const createChildRequestSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().max(80).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.'),
  address: z.string().max(500).optional(),
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

export const listChildrenQuerySchema = paginationQuerySchema.extend({
  includeArchived: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
});
export type ListChildrenQuery = z.infer<typeof listChildrenQuerySchema>;

export const hospitalResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  address: z.string(),
  services: z.string(),
  // Public directory details; null when the hospital has not provided them.
  description: z.string().nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  isFavorite: z.boolean().optional(),
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

export const updateHospitalProfileRequestSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  address: z.string().trim().min(1).max(300).optional(),
  city: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  services: z.string().trim().min(1).max(2000).optional(),
});
export type UpdateHospitalProfileRequest = z.infer<typeof updateHospitalProfileRequestSchema>;

export const appointmentStatuses = ['REQUESTED', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] as const;
export type AppointmentStatus = (typeof appointmentStatuses)[number];
export const doctorResponseSchema = z.object({
  id: z.string(),
  hospitalId: z.string(),
  fullName: z.string(),
  specialty: z.string(),
  bio: z.string().nullable(),
  availableDays: z.string().optional(),
  startHour: z.number().optional(),
  endHour: z.number().optional(),
  slotDurationMinutes: z.number().optional(),
  timezone: z.string().optional(),
});
export type DoctorResponse = z.infer<typeof doctorResponseSchema>;

export const doctorSlotSchema = z.object({
  time: z.string(), // e.g. "09:00 AM"
  iso: z.string(), // e.g. "2026-10-15T02:00:00.000Z" (UTC ISO)
  available: z.boolean(),
});
export type DoctorSlot = z.infer<typeof doctorSlotSchema>;

export const doctorAvailabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  timezone: z.string().trim().optional(),
});
export type DoctorAvailabilityQuery = z.infer<typeof doctorAvailabilityQuerySchema>;

export const doctorAvailabilityResponseSchema = z.object({
  doctorId: z.string(),
  date: z.string(),
  timezone: z.string(),
  slots: z.array(doctorSlotSchema),
});
export type DoctorAvailabilityResponse = z.infer<typeof doctorAvailabilityResponseSchema>;

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
  /** The parent's reason for requesting the appointment. */
  reason: z.string().nullable(),
  /** The hospital's explanation when it rejected the request. */
  rejectionReason: z.string().nullable(),
  parentName: z.string().nullable().optional(),
  parentEmail: z.string().nullable().optional(),
  parentPhoneNumber: z.string().nullable().optional(),
  childDateOfBirth: z.string().nullable().optional(),
  childNotes: z.string().nullable().optional(),
});
export type AppointmentResponse = z.infer<typeof appointmentResponseSchema>;

export const appointmentListResponseSchema = z.object({
  appointments: z.array(appointmentResponseSchema),
  pagination: paginationMetaSchema,
});
export type AppointmentListResponse = z.infer<typeof appointmentListResponseSchema>;

export const listAppointmentsQuerySchema = paginationQuerySchema.extend({
  childId: z.string().trim().min(1).optional(),
  status: z.enum(appointmentStatuses).optional(),
});
export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuerySchema>;
export const createAppointmentRequestSchema = z.object({
  childId: z.string().min(1),
  hospitalId: z.string().min(1),
  doctorId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  reason: z.string().max(2000).optional(),
});
export type CreateAppointmentRequest = z.infer<typeof createAppointmentRequestSchema>;

export const rescheduleAppointmentRequestSchema = z.object({
  scheduledAt: z.string().datetime(),
  reason: z.string().max(2000).optional(),
});
export type RescheduleAppointmentRequest = z.infer<typeof rescheduleAppointmentRequestSchema>;
/**
 * Hospital-side appointment list filters (GET /hospital-management/appointments).
 *
 * Kept permissive on purpose: `status` and the date range are validated further
 * in the service, which returns a message naming the valid statuses. Tightening
 * them here would change those messages, so this schema only does what the old
 * hand-rolled `queryString` helper did — accept a non-empty string or nothing.
 */
export const hospitalAppointmentFiltersQuerySchema = z.object({
  status: z.string().trim().min(1).optional(),
  doctorId: z.string().trim().min(1).optional(),
  from: z.string().trim().min(1).optional(),
  to: z.string().trim().min(1).optional(),
});
export type HospitalAppointmentFiltersQuery = z.infer<typeof hospitalAppointmentFiltersQuerySchema>;

export const updateAppointmentStatusRequestSchema = z.object({
  status: z.enum(appointmentStatuses),
  /**
   * The hospital's explanation, stored only when rejecting (status CANCELLED).
   * Previously the web client sent this and the schema silently stripped it, so
   * the reason never reached the patient.
   */
  reason: z.string().trim().max(2000).optional(),
});
export type UpdateAppointmentStatusRequest = z.infer<typeof updateAppointmentStatusRequestSchema>;
export const doctorRequestSchema = z.object({
  fullName: z.string().min(1).max(160),
  specialty: z.string().min(1).max(160),
  bio: z.string().max(4000).nullable().optional(),
  availableDays: z.union([z.string().max(60), z.array(z.string())]).optional(),
  startHour: z.number().int().min(0).max(23).optional(),
  endHour: z.number().int().min(1).max(24).optional(),
  slotDurationMinutes: z.number().int().min(10).max(120).optional(),
  timezone: z.string().max(80).optional(),
});
export type DoctorRequest = z.infer<typeof doctorRequestSchema>;
export const createHospitalAccountRequestSchema = z.object({
  hospital: createHospitalRequestSchema,
  account: z.object({
    email: z.string().email(),
    password: z.string().min(12).optional(),
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
    title: z.string().max(120).optional(),
  }),
});
export type CreateHospitalAccountRequest = z.infer<typeof createHospitalAccountRequestSchema>;
export const hospitalStaffRoles = ['ADMIN', 'COORDINATOR', 'DOCTOR'] as const;
export type HospitalStaffRole = (typeof hospitalStaffRoles)[number];

export const hospitalStaffStatuses = ['ACTIVE', 'SETUP_PENDING', 'DEACTIVATED'] as const;
export type HospitalStaffStatus = (typeof hospitalStaffStatuses)[number];

export const hospitalStaffResponseSchema = z.object({
  id: z.string(),
  hospitalId: z.string(),
  parentId: z.string(),
  title: z.string().nullable(),
  role: z.enum(hospitalStaffRoles).optional(),
});
export const adminHospitalAccountResponseSchema = z.object({
  hospital: hospitalResponseSchema,
  staff: hospitalStaffResponseSchema,
  account: parentResponseSchema,
  invitationSent: z.boolean().optional(),
  invitationUrl: z.string().url().optional(),
});
export type AdminHospitalAccountResponse = z.infer<typeof adminHospitalAccountResponseSchema>;

export const hospitalMeResponseSchema = z.object({
  hospital: hospitalResponseSchema,
  staff: hospitalStaffResponseSchema.optional(),
  staffRole: z.enum(hospitalStaffRoles),
});
export type HospitalMeResponse = z.infer<typeof hospitalMeResponseSchema>;

export const screeningDisclaimer =
  'AutiCare screening is informational support only and is not a medical diagnosis. Please consult a qualified clinician for diagnosis or treatment decisions.';

export const schoolChildEnrollmentStatuses = [
  'PENDING',
  'ACTIVE',
  'REJECTED',
  'GRADUATED',
] as const;
export type SchoolChildEnrollmentStatus = (typeof schoolChildEnrollmentStatuses)[number];
/** @deprecated Use schoolChildEnrollmentStatuses instead. */
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
  isFavorite: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SchoolResponse = z.infer<typeof schoolResponseSchema>;

/**
 * Parent school-search filters (GET /schools). There is no separate province
 * column — the School model stores the province/region in `city`, so `province`
 * filters on it. `specializations` is a comma-separated tag list; a school
 * matches when it carries ANY of the tags.
 */
export const parentSchoolSearchQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    province: z.string().trim().max(120).optional(),
    availability: z.enum(schoolAvailabilityStatuses).optional(),
    specializations: z.string().trim().max(400).optional(),
    isFavorite: z.union([z.boolean(), z.string().transform((val) => val === 'true')]).optional(),
  })
  .merge(paginationQuerySchema);
export type ParentSchoolSearchQuery = z.infer<typeof parentSchoolSearchQuerySchema>;

export const schoolListResponseSchema = z.object({
  schools: z.array(schoolResponseSchema),
  pagination: paginationMetaSchema,
});
export type SchoolListResponse = z.infer<typeof schoolListResponseSchema>;

// Full public profile (GET /schools/:id and GET /schools/me) — card fields plus
// the extended detail fields. Read-only for parents; no account-internal fields
// (login credentials live on the Parent/SchoolStaff records, never here).
export const schoolDetailResponseSchema = schoolResponseSchema.extend({
  email: z.string().nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  admissionRequirements: z.string().nullable(),
  operatingHours: z.string().nullable(),
  facilities: z.array(z.string()),
  isFavorite: z.boolean().optional(),
});
export type SchoolDetailResponse = z.infer<typeof schoolDetailResponseSchema>;

export const schoolFavoriteResponseSchema = z.object({
  favorited: z.boolean(),
  schoolId: z.string(),
});
export type SchoolFavoriteResponse = z.infer<typeof schoolFavoriteResponseSchema>;

export const createSchoolReviewRequestSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});
export type CreateSchoolReviewRequest = z.infer<typeof createSchoolReviewRequestSchema>;

export const schoolReviewResponseSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  parentId: z.string(),
  parentName: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SchoolReviewResponse = z.infer<typeof schoolReviewResponseSchema>;

export const schoolReviewListResponseSchema = z.object({
  reviews: z.array(schoolReviewResponseSchema),
  averageRating: z.number().nullable(),
  totalReviews: z.number().int(),
});
export type SchoolReviewListResponse = z.infer<typeof schoolReviewListResponseSchema>;

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

/** ADMIN runs the school's account; TEACHER sees only assigned children. */
export const schoolStaffRoles = ['ADMIN', 'TEACHER'] as const;
export type SchoolStaffRole = (typeof schoolStaffRoles)[number];

export const schoolStaffResponseSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  parentId: z.string(),
  title: z.string().nullable(),
  role: z.enum(schoolStaffRoles),
});
export type SchoolStaffResponse = z.infer<typeof schoolStaffResponseSchema>;

export const schoolChildEnrollmentResponseSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  childId: z.string(),
  status: z.enum(schoolChildEnrollmentStatuses),
  startDate: z.string(),
  endDate: z.string().nullable(),
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
    password: z.string().min(12).optional(),
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
    isVerified: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one school field is required.');
export type UpdateSchoolRequest = z.infer<typeof updateSchoolRequestSchema>;

export const adminSchoolAccountResponseSchema = z.object({
  school: schoolResponseSchema,
  staff: schoolStaffResponseSchema,
  account: parentResponseSchema,
  invitationSent: z.boolean().optional(),
  invitationUrl: z.string().url().optional(),
});
export type AdminSchoolAccountResponse = z.infer<typeof adminSchoolAccountResponseSchema>;

export const activityReportResponseSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  childId: z.string(),
  reporterId: z.string(),
  activityCategory: z.string(),
  title: z.string(),
  summary: z.string(),
  activityDate: z.string(),
  status: z.string(),
  duration: z.number().int().nullable(),
  performanceMetrics: z.unknown().nullable(),
  teacherObservation: z.string().nullable(),
  recommendations: z.string().nullable(),
  photoUrls: z.array(z.string()).nullable(),
  createdAt: z.string(),
});
export type ActivityReportResponse = z.infer<typeof activityReportResponseSchema>;
/** @deprecated Use ActivityReportResponse instead. */
export type SchoolActivityReportResponse = ActivityReportResponse;

export const reportStatuses = ['DRAFT', 'SUBMITTED'] as const;
export type ReportStatus = (typeof reportStatuses)[number];
export const activityReportStatuses = reportStatuses;
export const activityReportStatusSchema = z.enum(activityReportStatuses);
export type ActivityReportStatus = ReportStatus;

export const createActivityReportRequestSchema = z.object({
  childId: z.string().min(1),
  activityCategory: z.string().min(1).max(120),
  // Canonical activity name. `title` is accepted as a legacy alias — the server
  // derives the stored title from activityName ?? title ?? activityCategory.
  activityName: z.string().min(1).max(160).optional(),
  title: z.string().min(1).max(160).optional(),
  // Optional — the server derives it from teacherObservation when omitted.
  summary: z.string().max(4000).optional(),
  // Optional — defaults to today (server time) when omitted.
  activityDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.')
    .optional(),
  duration: z.number().int().min(0).optional(),
  performanceMetrics: z.unknown().optional(),
  teacherObservation: z.string().max(4000).optional(),
  recommendations: z.string().max(4000).optional(),
  // Accepts server-generated upload paths like /uploads/activity-reports/<uuid>.jpg
  // (relative), so plain min(1) instead of .url() which requires an origin.
  photoUrls: z.array(z.string().min(1)).max(10).optional(),
  status: z.enum(reportStatuses).optional(),
});
export type CreateActivityReportRequest = z.infer<typeof createActivityReportRequestSchema>;
/** @deprecated Use CreateActivityReportRequest instead. */
export type CreateSchoolActivityReportRequest = CreateActivityReportRequest;

export const updateActivityReportRequestSchema = z
  .object({
    activityCategory: z.string().min(1).max(120).optional(),
    title: z.string().min(1).max(160).optional(),
    summary: z.string().min(1).max(4000).optional(),
    activityDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.')
      .optional(),
    status: z.enum(reportStatuses).optional(),
    duration: z.number().int().min(0).nullable().optional(),
    performanceMetrics: z.unknown().nullable().optional(),
    teacherObservation: z.string().max(4000).nullable().optional(),
    recommendations: z.string().max(4000).nullable().optional(),
    // Accepts relative server upload paths too — see createActivityReportRequestSchema.
    photoUrls: z.array(z.string().min(1)).max(10).nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'At least one report field must be provided.');
export type UpdateActivityReportRequest = z.infer<typeof updateActivityReportRequestSchema>;

export const listActivityReportsQuerySchema = z
  .object({
    childId: z.string().optional(),
    status: z.enum(reportStatuses).optional(),
    search: z.string().trim().max(120).optional(),
  })
  .merge(paginationQuerySchema);
export type ListActivityReportsQuery = z.infer<typeof listActivityReportsQuerySchema>;

// ── Activities ────────────────────────────────────────────────────────
/**
 * The activity catalogue is global, not per school: Activity carries no
 * schoolId or authorId, so entries are platform-provided rather than written by
 * a school. Age suitability is a month range, which is finer-grained than the
 * screening question bands.
 */
export const activityResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  minAgeMonths: z.number().int(),
  maxAgeMonths: z.number().int(),
  summary: z.string(),
  isFavorite: z.boolean().optional(),
});
export type ActivityResponse = z.infer<typeof activityResponseSchema>;

/**
 * One child's engagement with one activity. `completedAt` null means started but
 * not finished; the parent's own note is optional and theirs alone.
 */
export const activityProgressResponseSchema = z.object({
  id: z.string(),
  childId: z.string(),
  activityId: z.string(),
  activityTitle: z.string(),
  startedAt: z.string(),
  completedAt: z.string().nullable(),
  parentObservation: z.string().nullable(),
});
export type ActivityProgressResponse = z.infer<typeof activityProgressResponseSchema>;

/**
 * Catalogue filters. `childId` narrows the list to what suits that child's age
 * in months, which is why the child must belong to the caller.
 */
export const listActivitiesQuerySchema = z.object({
  childId: z.string().min(1).optional(),
  category: z.string().trim().min(1).max(60).optional(),
  learningGoal: z.string().trim().min(1).max(60).optional(),
  minAgeMonths: z.coerce.number().int().optional(),
  maxAgeMonths: z.coerce.number().int().optional(),
  // A query string is text, and z.coerce.boolean() would read "false" as true.
  favoriteOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
});
export type ListActivitiesQuery = z.infer<typeof listActivitiesQuerySchema>;

export const listActivityProgressQuerySchema = z.object({
  childId: z.string().min(1),
});
export type ListActivityProgressQuery = z.infer<typeof listActivityProgressQuerySchema>;

export const startActivityRequestSchema = z.object({
  childId: z.string().min(1),
});
export type StartActivityRequest = z.infer<typeof startActivityRequestSchema>;

/**
 * Update progress. `completed` true stamps completedAt, false clears it so a
 * parent can undo a mistaken tap; omitting it leaves completion alone.
 */
export const updateActivityProgressRequestSchema = z
  .object({
    completed: z.boolean().optional(),
    parentObservation: z.string().trim().max(2000).nullable().optional(),
  })
  .refine(
    (value) => value.completed !== undefined || value.parentObservation !== undefined,
    'Provide at least one field to update.',
  );
export type UpdateActivityProgressRequest = z.infer<typeof updateActivityProgressRequestSchema>;

// ── School Notifications ──────────────────────────────────────────────
export const schoolNotificationStatuses = ['UNREAD', 'READ', 'ARCHIVED'] as const;
export type SchoolNotificationStatus = (typeof schoolNotificationStatuses)[number];

export const notificationTypes = [
  'SYSTEM',
  'APPOINTMENT',
  'ADMISSION',
  'SCREENING',
  'ACTIVITY',
  'SCHOOL_REPORT',
  'ENROLLMENT_REQUEST',
  'REPORT_REQUEST',
] as const;
export type NotificationType = (typeof notificationTypes)[number];

export const notificationResponseSchema = z.object({
  id: z.string(),
  type: z.enum(notificationTypes),
  status: z.enum(schoolNotificationStatuses),
  title: z.string(),
  body: z.string(),
  enrollmentId: z.string().nullable(),
  reportId: z.string().nullable(),
  appointmentId: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type NotificationResponse = z.infer<typeof notificationResponseSchema>;

export const parentNotificationListResponseSchema = z.object({
  notifications: z.array(notificationResponseSchema),
  pagination: paginationMetaSchema,
});
export type ParentNotificationListResponse = z.infer<typeof parentNotificationListResponseSchema>;

// ── Parent preferences ──────────────────────────────────────────────────

export const updateParentPreferencesRequestSchema = z.object({
  reducedMotion: z.boolean().optional(),
  highContrast: z.boolean().optional(),
  preferredLanguage: z.string().trim().min(2).max(10).optional(),
  notifyQuestionnaire: z.boolean().optional(),
  notifyActivities: z.boolean().optional(),
  notifyReports: z.boolean().optional(),
  notifySchool: z.boolean().optional(),
  notifyAnnouncements: z.boolean().optional(),
});
export type UpdateParentPreferencesRequest = z.infer<typeof updateParentPreferencesRequestSchema>;

export const parentPreferenceSchema = z.object({
  preferredLanguage: z.string(),
  reducedMotion: z.boolean(),
  highContrast: z.boolean(),
  notifyQuestionnaire: z.boolean().optional(),
  notifyActivities: z.boolean().optional(),
  notifyReports: z.boolean().optional(),
  notifySchool: z.boolean().optional(),
  notifyAnnouncements: z.boolean().optional(),
  updatedAt: z.string().optional(),
});
export type ParentPreference = z.infer<typeof parentPreferenceSchema>;

export const parentPreferencesResponseSchema = z.object({
  preference: parentPreferenceSchema,
});
export type ParentPreferencesResponse = z.infer<typeof parentPreferencesResponseSchema>;

// ── Admission / enrollment requests ─────────────────────────────────────

export const createAdmissionRequestSchema = z.object({
  schoolId: z.string().min(1),
  childId: z.string().min(1),
  message: z.string().max(2000).optional(),
});
export type CreateAdmissionRequestRequest = z.infer<typeof createAdmissionRequestSchema>;

export const admissionRequestStatuses = ['REQUESTED', 'APPROVED', 'REJECTED'] as const;
export const admissionRequestStatusSchema = z.enum(admissionRequestStatuses);
export type AdmissionRequestStatus = (typeof admissionRequestStatuses)[number];

export const admissionRequestResponseSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  schoolName: z.string(),
  schoolCity: z.string().nullable().optional(),
  schoolAddress: z.string().nullable().optional(),
  childId: z.string().nullable(),
  childName: z.string(),
  status: admissionRequestStatusSchema,
  message: z.string().nullable(),
  createdAt: z.string(),
});
export type AdmissionRequestResponse = z.infer<typeof admissionRequestResponseSchema>;

/** School's decision on an enrollment-request notification. */
export const enrollmentDecisions = ['APPROVED', 'REJECTED', 'PENDING'] as const;
export const enrollmentDecisionSchema = z.enum(enrollmentDecisions);
export type EnrollmentDecision = (typeof enrollmentDecisions)[number];

/**
 * School-facing notification item: the base notification enriched with the
 * sender's name and (for ENROLLMENT_REQUEST types) the linked admission
 * request details.
 */
export const schoolNotificationItemSchema = z.object({
  id: z.string(),
  type: z.enum(notificationTypes),
  status: z.enum(schoolNotificationStatuses),
  title: z.string(),
  body: z.string(),
  createdAt: z.string(),
  senderName: z.string(),
  admissionRequestId: z.string().nullable(),
  admissionStatus: z.string().nullable(),
  studentName: z.string().nullable(),
  requestMessage: z.string().nullable(),
});
export type SchoolNotificationItem = z.infer<typeof schoolNotificationItemSchema>;

export const schoolNotificationListResponseSchema = z.object({
  notifications: z.array(schoolNotificationItemSchema),
  pagination: paginationMetaSchema,
});
export type SchoolNotificationListResponse = z.infer<typeof schoolNotificationListResponseSchema>;

export const decideNotificationRequestSchema = z.object({
  decision: enrollmentDecisionSchema,
});
export type DecideNotificationRequest = z.infer<typeof decideNotificationRequestSchema>;

export const notificationDecisionResponseSchema = z.object({
  notification: notificationResponseSchema,
  admissionStatus: z.string().nullable(),
  enrollmentId: z.string().nullable(),
});
export type NotificationDecisionResponse = z.infer<typeof notificationDecisionResponseSchema>;

/**
 * The school notification page's filter tabs, as a server-side filter.
 *
 * PENDING and DECIDED select on the linked admission request's status, which is
 * not a column on Notification — the service derives it. They are named as a
 * `view` rather than exposed as a raw admissionStatus param because the page only
 * ever asks for these two groupings, and because resolving them takes a second
 * query (see listNotificationsWithSender).
 */
export const schoolNotificationViews = ['PENDING', 'DECIDED'] as const;
export type SchoolNotificationView = (typeof schoolNotificationViews)[number];

export const listNotificationsQuerySchema = z
  .object({
    isRead: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
    view: z.enum(schoolNotificationViews).optional(),
  })
  .merge(paginationQuerySchema);
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;

/**
 * Parent notification list query.
 *
 * It carries isRead for the same reason the school query does: the parent page
 * offers an "Unread" filter, and filtering a single page in the browser gives the
 * wrong answer once the list is paginated — "Nothing unread" would show whenever
 * page 1 happened to be all read, however many unread items sat on page 3.
 */
export const listParentNotificationsQuerySchema = z
  .object({
    isRead: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
    status: z.enum(['UNREAD', 'READ', 'ARCHIVED']).optional(),
  })
  .merge(paginationQuerySchema);
export type ListParentNotificationsQuery = z.infer<typeof listParentNotificationsQuerySchema>;

export const screeningSessionResponseSchema = z.object({
  id: z.string(),
  childId: z.string(),
  status: z.enum(screeningStatuses),
  // Age band used for this session's question set. Nullable for legacy sessions
  // created before age banding existed.
  ageBand: z.enum(ageBands).nullable(),
  // Question set frozen at creation. Sessions created before the short form
  // existed are FULL.
  formKind: z.enum(screeningFormKinds),
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
  formKind: z.enum(screeningFormKinds),
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
  // Omitted means FULL, which keeps every existing caller working unchanged.
  formKind: z.enum(screeningFormKinds).optional(),
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

// ── School Dashboard ──────────────────────────────────────────────────────

export const schoolDashboardRecentReportSchema = z.object({
  id: z.string(),
  childFirstName: z.string(),
  activityCategory: z.string(),
  title: z.string(),
  activityDate: z.string(),
  status: z.string(),
});
export type SchoolDashboardRecentReport = z.infer<typeof schoolDashboardRecentReportSchema>;

export const schoolDashboardReminderSchema = z.object({
  id: z.string(),
  title: z.string(),
  urgency: z.enum(['today', 'tomorrow', 'upcoming']),
  dueTime: z.string().nullable(),
});
export type SchoolDashboardReminder = z.infer<typeof schoolDashboardReminderSchema>;

export const schoolDashboardResponseSchema = z.object({
  schoolName: z.string(),
  staffFirstName: z.string(),
  staffLastName: z.string(),
  staffTitle: z.string().nullable(),
  stats: z.object({
    totalStudents: z.number().int(),
    studentsDelta: z.number().int().nullable(),
    reportsSubmitted: z.number().int(),
    pendingReports: z.number().int(),
    activitiesCompleted: z.number().int(),
    weekDelta: z.number().nullable(),
  }),
  recentReports: z.array(schoolDashboardRecentReportSchema),
  reminders: z.array(schoolDashboardReminderSchema),
});
export type SchoolDashboardResponse = z.infer<typeof schoolDashboardResponseSchema>;

// ── School Enrollment Stats & Student List ───────────────────────────────

export const enrollmentStatsResponseSchema = z.object({
  totalStudents: z.number().int(),
  newStudentsThisMonth: z.number().int(),
  activePrograms: z.number().int(),
  participationRate: z.number().int(),
  averageProgress: z.number().int(),
  needsAttention: z.number().int(),
});
export type EnrollmentStatsResponse = z.infer<typeof enrollmentStatsResponseSchema>;

export const enrolledStudentSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  enrollmentStatus: z.enum(schoolChildEnrollmentStatuses),
  startDate: z.string(),
  leadSpecialist: z
    .object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      title: z.string().nullable(),
    })
    .nullable(),
  /** Every teacher assigned to this child at this school. */
  teachers: z
    .array(
      z.object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        title: z.string().nullable(),
      }),
    )
    .optional(),
  communicationProgress: z.number().int(),
  age: z.number().optional(),
  dateOfBirth: z.string().optional(),
});
export type EnrolledStudent = z.infer<typeof enrolledStudentSchema>;

export const enrolledStudentsListResponseSchema = z.object({
  students: z.array(enrolledStudentSchema),
  pagination: z.object({
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int(),
  }),
});
export type EnrolledStudentsListResponse = z.infer<typeof enrolledStudentsListResponseSchema>;

/**
 * Student-picker entry for the activity report form (GET /schools/enrolled-students).
 *
 * ACTIVE and PENDING both appear: listPickerEnrolledStudentsForSchool queries
 * `status: { in: ['ACTIVE', 'PENDING'] }` so reports can be written for newly
 * added children before activation.
 */
export const enrolledStudentOptionSchema = z.object({
  id: z.string(),
  childId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.string(),
  age: z.number().int(),
  photoUrl: z.string().nullable(),
  enrollmentStatus: z.enum(['ACTIVE', 'PENDING']),
  startDate: z.string(),
});
export type EnrolledStudentOption = z.infer<typeof enrolledStudentOptionSchema>;

export const leadSpecialistResponseSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  title: z.string().nullable(),
});
export type LeadSpecialistResponse = z.infer<typeof leadSpecialistResponseSchema>;

export const listEnrolledStudentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(schoolChildEnrollmentStatuses).optional(),
  specialistId: z.string().optional(),
  search: z.string().optional(),
});
export type ListEnrolledStudentsQuery = z.infer<typeof listEnrolledStudentsQuerySchema>;

// ── School: Add New Student ───────────────────────────────────────────

export const createSchoolStudentRequestSchema = z.object({
  // Child fields
  firstName: z.string().min(1).max(80),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.'),
  photoUrl: z.string().url().max(1000).optional(),
  address: z.string().max(500).optional(),
  // Guardian (Parent) fields
  guardianFirstName: z.string().min(1).max(80),
  guardianLastName: z.string().min(1).max(80),
  guardianEmail: z.string().email(),
  guardianPhone: z.string().max(40).optional(),
  guardianSocialMedia: z.string().max(300).optional(),
});
export type CreateSchoolStudentRequest = z.infer<typeof createSchoolStudentRequestSchema>;

// ── School: Edit / Remove enrolled student ─────────────────────────────

/**
 * PATCH /schools/enrollments/:childId — school-side update of an enrolled
 * student. Child fields touch the parent-owned Child record; enrollment
 * fields touch the SchoolChildEnrollment for the authenticated school only.
 * All fields optional; at least one must be present (validated in service).
 */
export const updateSchoolEnrollmentRequestSchema = z.object({
  // Child fields
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().max(80).nullable().optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format.')
    .optional(),
  notes: z.string().max(2000).nullable().optional(),
  photoUrl: z.string().url().max(1000).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  // Enrollment fields
  status: z.enum(schoolChildEnrollmentStatuses).optional(),
  leadSpecialistId: z.string().cuid().nullable().optional(),
});
export type UpdateSchoolEnrollmentRequest = z.infer<typeof updateSchoolEnrollmentRequestSchema>;

/** PATCH /schools/enrollments/:childId response — the refreshed row. */
export const schoolEnrollmentMutationResponseSchema = z.object({
  childId: z.string(),
  childFirstName: z.string(),
  childLastName: z.string().nullable(),
  enrollmentId: z.string(),
  enrollmentStatus: z.enum(schoolChildEnrollmentStatuses),
  leadSpecialistId: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string().nullable(),
});
export type SchoolEnrollmentMutationResponse = z.infer<
  typeof schoolEnrollmentMutationResponseSchema
>;

// ── Activity Report Detail Response ──────────────────────────────────────

export const activityReportDetailResponseSchema = activityReportResponseSchema.extend({
  child: z.object({
    id: z.string(),
    firstName: z.string(),
    dateOfBirth: z.string(),
    photoUrl: z.string().nullable(),
    parent: z.object({
      firstName: z.string(),
      lastName: z.string(),
    }),
  }),
  reporter: z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
  }),
});
export type ActivityReportDetailResponse = z.infer<typeof activityReportDetailResponseSchema>;

// ── Activity Report List with Child Info ───────────────────────────────────

export const activityReportListItemSchema = z.object({
  id: z.string(),
  schoolId: z.string(),
  childId: z.string(),
  reporterId: z.string(),
  activityCategory: z.string(),
  title: z.string(),
  summary: z.string(),
  activityDate: z.string(),
  status: z.string(),
  duration: z.number().int().nullable(),
  performanceMetrics: z.unknown().nullable(),
  teacherObservation: z.string().nullable(),
  recommendations: z.string().nullable(),
  photoUrls: z.array(z.string()).nullable(),
  createdAt: z.string(),
  childFirstName: z.string(),
  childLastName: z.string().nullable(),
  childPhotoUrl: z.string().nullable(),
  reporterFirstName: z.string(),
  reporterLastName: z.string(),
});
export type ActivityReportListItem = z.infer<typeof activityReportListItemSchema>;

export const activityReportListResponseSchema = z.object({
  reports: z.array(activityReportListItemSchema),
  pagination: paginationMetaSchema,
});
export type ActivityReportListResponse = z.infer<typeof activityReportListResponseSchema>;

// ── Upload Response ──────────────────────────────────────────────────────

export const uploadPhotosResponseSchema = z.object({
  urls: z.array(z.string()),
});
export type UploadPhotosResponse = z.infer<typeof uploadPhotosResponseSchema>;

export const createSchoolStudentResponseSchema = z.object({
  student: z.object({
    id: z.string(),
    firstName: z.string(),
    dateOfBirth: z.string(),
    photoUrl: z.string().nullable(),
    address: z.string().nullable(),
  }),
  guardian: z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    phoneNumber: z.string().nullable(),
    socialMediaAccount: z.string().nullable(),
  }),
  enrollment: schoolChildEnrollmentResponseSchema,
});
export type CreateSchoolStudentResponse = z.infer<typeof createSchoolStudentResponseSchema>;

// ── Parent: Activity Reports (SUBMITTED only) ─────────────────────────────

/** One submitted activity report as visible to the child's parent. */
export const parentActivityReportResponseSchema = z.object({
  id: z.string(),
  childId: z.string(),
  activityCategory: z.string(),
  title: z.string(),
  summary: z.string(),
  activityDate: z.string(),
  status: z.string(),
  duration: z.number().int().nullable(),
  performanceMetrics: z.unknown().nullable(),
  teacherObservation: z.string().nullable(),
  recommendations: z.string().nullable(),
  photoUrls: z.array(z.string()).nullable(),
  createdAt: z.string(),
  /** School that ran the activity. */
  schoolName: z.string(),
  /** Staff member who filed the report. */
  reporter: z.object({
    firstName: z.string(),
    lastName: z.string(),
  }),
});
export type ParentActivityReportResponse = z.infer<typeof parentActivityReportResponseSchema>;

export const parentActivityReportListResponseSchema = z.object({
  reports: z.array(parentActivityReportResponseSchema),
  pagination: paginationMetaSchema,
});
export type ParentActivityReportListResponse = z.infer<
  typeof parentActivityReportListResponseSchema
>;

// ── Role-Specific Dashboards (Parent & Administrator) ───────────────────

export const parentDashboardWeeklyProgressSchema = z.object({
  days: z.array(
    z.object({
      day: z.string(),
      count: z.number().int(),
      percentage: z.number().int(),
    }),
  ),
  totalCompletedThisWeek: z.number().int(),
});
export type ParentDashboardWeeklyProgress = z.infer<typeof parentDashboardWeeklyProgressSchema>;

export const parentDashboardScreeningSummarySchema = z.object({
  hasScreening: z.boolean(),
  sessionId: z.string().nullable(),
  status: z.enum(screeningStatuses).nullable(),
  riskLevel: z.enum(riskLevels).nullable(),
  riskPercentage: z.number().int().nullable(),
  score: z.number().int().nullable(),
  completedDate: z.string().nullable(),
  recommendation: z.string().nullable(),
});
export type ParentDashboardScreeningSummary = z.infer<typeof parentDashboardScreeningSummarySchema>;

export const parentDashboardUpcomingAppointmentSchema = z.object({
  id: z.string(),
  hospitalName: z.string(),
  doctorName: z.string().nullable(),
  specialty: z.string().nullable(),
  scheduledAt: z.string(),
  status: z.enum(appointmentStatuses),
  reason: z.string().nullable(),
  childFirstName: z.string().nullable(),
});
export type ParentDashboardUpcomingAppointment = z.infer<
  typeof parentDashboardUpcomingAppointmentSchema
>;

export const parentDashboardRecommendedActionSchema = z.object({
  title: z.string(),
  description: z.string(),
  actionPath: z.string(),
  actionLabel: z.string(),
  source: z.enum(['SCREENING_RESULT', 'NO_CHILD', 'NO_SCREENING', 'GENERAL_SUPPORT']),
});
export type ParentDashboardRecommendedAction = z.infer<
  typeof parentDashboardRecommendedActionSchema
>;

export const parentDashboardQuerySchema = z.object({
  childId: z.string().optional(),
});
export type ParentDashboardQuery = z.infer<typeof parentDashboardQuerySchema>;

/** A child's initial questionnaire. The personalized dashboard opens once it is COMPLETED. */
export const parentDashboardResponseSchema = z.object({
  selectedChild: z
    .object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string().nullable(),
      dateOfBirth: z.string(),
      photoUrl: z.string().nullable(),
    })
    .nullable(),
  totalChildren: z.number().int(),
  children: z
    .array(
      z.object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string().nullable(),
        dateOfBirth: z.string(),
        photoUrl: z.string().nullable(),
      }),
    )
    .optional(),
  /** The selected child's questionnaire; null when there is no child. */
  questionnaireStatus: z.enum(questionnaireStatuses).nullable().optional(),
  screeningSummary: parentDashboardScreeningSummarySchema,
  weeklyProgress: parentDashboardWeeklyProgressSchema,
  upcomingAppointment: parentDashboardUpcomingAppointmentSchema.nullable(),
  recommendedAction: parentDashboardRecommendedActionSchema,
  recentObservations: z
    .array(
      z.object({
        id: z.string(),
        category: z.string(),
        occurredAt: z.string(),
        note: z.string().nullable(),
      }),
    )
    .optional(),
  recentNotifications: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        body: z.string(),
        createdAt: z.string(),
      }),
    )
    .optional(),
  recommendedActivities: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        category: z.string(),
        minAgeMonths: z.number().int(),
        maxAgeMonths: z.number().int(),
        summary: z.string(),
      }),
    )
    .optional(),
});
export type ParentDashboardResponse = z.infer<typeof parentDashboardResponseSchema>;

export const adminDashboardResponseSchema = z.object({
  stats: z.object({
    totalFamilies: z.number().int(),
    activeChildren: z.number().int(),
    totalHospitals: z.number().int(),
    totalSchools: z.number().int(),
    totalAppointments: z.number().int(),
    pendingAppointments: z.number().int(),
  }),
  recentAppointments: z.array(
    z.object({
      id: z.string(),
      parentName: z.string(),
      childName: z.string().nullable(),
      hospitalName: z.string(),
      scheduledAt: z.string(),
      status: z.enum(appointmentStatuses),
    }),
  ),
  recentAuditEvents: z.array(
    z.object({
      id: z.string(),
      action: z.string(),
      actorEmail: z.string().nullable(),
      targetEmail: z.string().nullable(),
      createdAt: z.string(),
    }),
  ),
});
export type AdminDashboardResponse = z.infer<typeof adminDashboardResponseSchema>;

// ── Behaviour observations ────────────────────────────────────────────────
//
// What a parent recorded happening, in their own words. Deliberately plain:
// these are observable events, not clinical constructs, and nothing here is
// scored, graded or turned into a diagnosis.

export const observationCategories = [
  'COMMUNICATION',
  'EMOTIONAL',
  'CRYING',
  'SLEEP',
  'EATING',
  'SENSORY',
  'SOCIAL',
  'ROUTINE',
  'OTHER',
] as const;
export type ObservationCategory = (typeof observationCategories)[number];

export const observationResponseSchema = z.object({
  id: z.string(),
  childId: z.string(),
  category: z.enum(observationCategories),
  /** 1 (mild) to 5 (severe) — the parent's own read, not a clinical scale. */
  intensity: z.number().int().min(1).max(5),
  occurredAt: z.string(),
  note: z.string().nullable(),
  trigger: z.string().nullable().optional(),
  durationMinutes: z.number().int().nullable().optional(),
  parentResponse: z.string().nullable().optional(),
  outcome: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ObservationResponse = z.infer<typeof observationResponseSchema>;

export const createObservationRequestSchema = z.object({
  childId: z.string().min(1),
  category: z.enum(observationCategories),
  intensity: z.number().int().min(1).max(5),
  occurredAt: z.string().min(1),
  note: z.string().max(2000).optional(),
  trigger: z.string().max(2000).optional(),
  durationMinutes: z.number().int().min(0).max(1440).optional(),
  parentResponse: z.string().max(2000).optional(),
  outcome: z.string().max(2000).optional(),
});
export type CreateObservationRequest = z.infer<typeof createObservationRequestSchema>;

export const updateObservationRequestSchema = z
  .object({
    category: z.enum(observationCategories),
    intensity: z.number().int().min(1).max(5),
    occurredAt: z.string().min(1),
    note: z.string().max(2000).nullable(),
    trigger: z.string().max(2000).nullable().optional(),
    durationMinutes: z.number().int().min(0).max(1440).nullable().optional(),
    parentResponse: z.string().max(2000).nullable().optional(),
    outcome: z.string().max(2000).nullable().optional(),
  })
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    'At least one field must be provided to update an observation.',
  );
export type UpdateObservationRequest = z.infer<typeof updateObservationRequestSchema>;

export const listObservationsQuerySchema = z.object({
  childId: z.string().min(1),
  category: z.enum(observationCategories).optional(),
  /** Inclusive ISO date-time bounds, used by the dashboard window. */
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
export type ListObservationsQuery = z.infer<typeof listObservationsQuerySchema>;

// ── AI parent assistant ───────────────────────────────────────────────────
//
// The assistant answers in the parent's own language, cites the reviewed sources
// it was allowed to use, and never produces a diagnosis. `kind` distinguishes an
// answer the model wrote from a fixed safety reply, so the UI can render a
// crisis card differently from a normal turn.

export const aiLanguages = ['en', 'km'] as const;
export type AiLanguage = (typeof aiLanguages)[number];

export const aiMessageRoles = ['USER', 'ASSISTANT'] as const;
export type AiMessageRole = (typeof aiMessageRoles)[number];

export const aiMessageKinds = ['ANSWER', 'CRISIS', 'MEDICATION'] as const;
export type AiMessageKind = (typeof aiMessageKinds)[number];

export const aiSourceSchema = z.object({
  title: z.string(),
  publisher: z.string(),
  url: z.string(),
});
export type AiSource = z.infer<typeof aiSourceSchema>;

export const aiMessageResponseSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  role: z.enum(aiMessageRoles),
  kind: z.enum(aiMessageKinds),
  content: z.string(),
  /** Null for parent turns, and for fixed safety replies that no model wrote. */
  model: z.string().nullable(),
  /** Reviewed sources the answer drew on. Empty when there were none. */
  sources: z.array(aiSourceSchema),
  savedAt: z.string().nullable().optional(),
  feedback: z.string().nullable().optional(),
  feedbackNote: z.string().nullable().optional(),
  relatedActivities: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        category: z.string(),
        description: z.string().nullable().optional(),
      }),
    )
    .optional(),
  createdAt: z.string(),
});
export type AiMessageResponse = z.infer<typeof aiMessageResponseSchema>;

export const aiConversationSummarySchema = z.object({
  id: z.string(),
  childId: z.string().nullable(),
  title: z.string(),
  language: z.enum(aiLanguages),
  createdAt: z.string(),
  updatedAt: z.string(),
  messageCount: z.number().int(),
});
export type AiConversationSummary = z.infer<typeof aiConversationSummarySchema>;

export const aiConversationDetailResponseSchema = aiConversationSummarySchema.extend({
  messages: z.array(aiMessageResponseSchema),
});
export type AiConversationDetailResponse = z.infer<typeof aiConversationDetailResponseSchema>;

export const createAiConversationRequestSchema = z.object({
  childId: z.string().min(1).optional(),
  language: z.enum(aiLanguages).default('en'),
  includeChildContext: z.boolean().optional(),
});
export type CreateAiConversationRequest = z.infer<typeof createAiConversationRequestSchema>;

export const sendAiMessageRequestSchema = z
  .object({
    content: z.string().min(1).max(2000),
    language: z.enum(aiLanguages).optional(),
    includeChildContext: z.boolean().optional(),
    childId: z.string().min(1).optional(),
  })
  .superRefine((value, context) => {
    if (value.includeChildContext && !value.childId) {
      context.addIssue({
        code: 'custom',
        path: ['childId'],
        message: 'A child must be selected to share child context.',
      });
    }
  });
export type SendAiMessageRequest = z.infer<typeof sendAiMessageRequestSchema>;

export const publicAiChatRequestSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  language: z.enum(aiLanguages),
  history: z
    .array(
      z.object({
        role: z.enum(['USER', 'ASSISTANT']),
        content: z.string().min(1).max(2000),
      }),
    )
    .max(10)
    .default([]),
});
export type PublicAiChatRequest = z.infer<typeof publicAiChatRequestSchema>;

export const aiStatusResponseSchema = z.object({
  /** False until a model provider is configured — the rest of the app still works. */
  configured: z.boolean(),
  model: z.string().nullable(),
  /** Messages this parent may send per day. */
  dailyLimit: z.number().int(),
  usedToday: z.number().int(),
});
export type AiStatusResponse = z.infer<typeof aiStatusResponseSchema>;

export const sendAiMessageResponseSchema = z.object({
  userMessage: aiMessageResponseSchema,
  assistantMessage: aiMessageResponseSchema,
});
export type SendAiMessageResponse = z.infer<typeof sendAiMessageResponseSchema>;

// ── Child pattern insights ────────────────────────────────────────────────
//
// Counts and clusters over what the parent recorded. The server returns the
// evidence, not a verdict: `patterns` is what the UI renders, and `summary` is a
// plain audit string. Nothing here asserts a cause, a diagnosis, or a prognosis.

export const insightTrends = ['INCREASED', 'DECREASED', 'STABLE', 'NEW', 'NONE'] as const;
export type InsightTrend = (typeof insightTrends)[number];

export const insightTimeBuckets = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'] as const;
export type InsightTimeBucket = (typeof insightTimeBuckets)[number];

export const observationPatternSchema = z.object({
  category: z.enum(observationCategories),
  count: z.number().int(),
  /** Share of all observations in the window, 0–1. */
  share: z.number(),
  averageIntensity: z.number(),
  trend: z.enum(insightTrends),
  /** Local-time counts, using the caller's UTC offset. */
  weekdayCount: z.number().int(),
  weekendCount: z.number().int(),
  timeOfDay: z.enum(insightTimeBuckets).nullable(),
});
export type ObservationPattern = z.infer<typeof observationPatternSchema>;

export const childInsightSchema = z.object({
  childId: z.string(),
  windowStart: z.string(),
  windowEnd: z.string(),
  observationCount: z.number().int(),
  /** Days in the window on which at least one observation was recorded. */
  distinctDays: z.number().int(),
  patterns: z.array(observationPatternSchema),
  /** Plain-language audit summary. The UI composes its own copy from `patterns`. */
  summary: z.string(),
  analysisVersion: z.string(),
  generatedAt: z.string(),
});
export type ChildInsightResponse = z.infer<typeof childInsightSchema>;

// ── Educational summary ───────────────────────────────────────────────────────
//
// The summary a parent reads is written from facts the insights engine computed,
// never from their raw notes. `cached` is exposed so the UI can say that the
// stored text already describes the current records, instead of implying fresh
// wording was written.

export const childSummarySchema = z.object({
  childId: z.string(),
  content: z.string(),
  language: z.enum(aiLanguages),
  model: z.string(),
  promptVersion: z.string(),
  windowDays: z.number().int(),
  generatedAt: z.string(),
  /** True when the stored text already described the current records. */
  cached: z.boolean(),
});
export type ChildSummaryResponse = z.infer<typeof childSummarySchema>;

export const childSummaryQuerySchema = z.object({
  language: z.enum(aiLanguages).default('en'),
});
export type ChildSummaryQuery = z.infer<typeof childSummaryQuerySchema>;

export const generateChildSummaryRequestSchema = z.object({
  language: z.enum(aiLanguages).optional(),
  /** Window the summary describes. Clamped server-side to the insights range. */
  days: z.coerce.number().int().min(7).max(120).optional(),
  /** Browser's minutes east of UTC, so weekday clustering is right. */
  tzOffset: z.coerce.number().int().min(-720).max(840).optional(),
});
export type GenerateChildSummaryRequest = z.infer<typeof generateChildSummaryRequestSchema>;

// ── Reviewed guidance ─────────────────────────────────────────────────────
//
// Answers to "what can I do about this?" drawn only from a curated corpus the
// project owner has reviewed. When nothing in the corpus is relevant the result
// is an empty list, not a guess — that is the feature's whole premise.

export const guidancePassageSchema = z.object({
  title: z.string(),
  publisher: z.string(),
  sourceUrl: z.string(),
  heading: z.string().nullable(),
  /** The part of the source that answers the question. */
  excerpt: z.string(),
  /** Higher is more relevant. Exposed so the UI can order deterministically. */
  relevance: z.number(),
});
export type GuidancePassage = z.infer<typeof guidancePassageSchema>;

export const guidanceSearchQuerySchema = z.object({
  q: z.string().min(1).max(300),
  language: z.enum(aiLanguages).default('en'),
});
export type GuidanceSearchQuery = z.infer<typeof guidanceSearchQuerySchema>;

export const guidanceSearchResponseSchema = z.object({
  passages: z.array(guidancePassageSchema),
  /** How many reviewed sources exist for this language at all. */
  corpusSize: z.number().int(),
});
export type GuidanceSearchResponse = z.infer<typeof guidanceSearchResponseSchema>;

// ── School connections ────────────────────────────────────────────────────
//
// Three pieces that let a school work with families on AutiCare:
// 1. the school admin creates teacher accounts (username + one-time setup
//    code, no email needed);
// 2. the admin assigns one or more teachers to each enrolled child;
// 3. the admin hands a family a single-use connection code; the parent enters
//    it, picks their child and consents, which creates the enrollment.

export const schoolStaffStatuses = ['ACTIVE', 'SETUP_PENDING', 'DEACTIVATED'] as const;
export type SchoolStaffStatus = (typeof schoolStaffStatuses)[number];

export const schoolStaffMemberSchema = z.object({
  /** SchoolStaff id — the id used for assignment and staff actions. */
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  title: z.string().nullable(),
  role: z.enum(schoolStaffRoles),
  username: z.string().nullable(),
  status: z.enum(schoolStaffStatuses),
  assignedStudents: z.number().int(),
});
export type SchoolStaffMember = z.infer<typeof schoolStaffMemberSchema>;

export const createTeacherRequestSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  title: z.string().trim().max(80).optional(),
});
export type CreateTeacherRequest = z.infer<typeof createTeacherRequestSchema>;

/** Returned once, when a teacher is created or given a new setup code. */
export const teacherCredentialsResponseSchema = z.object({
  staff: schoolStaffMemberSchema,
  username: z.string(),
  setupCode: z.string(),
  setupCodeExpiresAt: z.string(),
});
export type TeacherCredentialsResponse = z.infer<typeof teacherCredentialsResponseSchema>;

/** POST /auth/staff-setup — a teacher's first sign-in. */
export const staffSetupRequestSchema = z.object({
  username: z.string().trim().min(3).max(80),
  setupCode: z.string().trim().min(8).max(20),
  password: z.string().min(12),
});
export type StaffSetupRequest = z.infer<typeof staffSetupRequestSchema>;

/** PUT /schools/enrollments/:childId/teachers — replaces the assigned set. */
export const assignTeachersRequestSchema = z.object({
  staffIds: z.array(z.string().min(1)).max(10),
});
export type AssignTeachersRequest = z.infer<typeof assignTeachersRequestSchema>;

export const connectionCodeStatuses = ['ACTIVE', 'USED', 'EXPIRED', 'REVOKED'] as const;
export type ConnectionCodeStatus = (typeof connectionCodeStatuses)[number];

export const createConnectionCodeRequestSchema = z.object({
  label: z.string().trim().max(80).optional(),
  teacherStaffIds: z.array(z.string().min(1)).max(10).optional(),
});
export type CreateConnectionCodeRequest = z.infer<typeof createConnectionCodeRequestSchema>;

const codeTeacherSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
});

export const connectionCodeSchema = z.object({
  id: z.string(),
  label: z.string().nullable(),
  status: z.enum(connectionCodeStatuses),
  expiresAt: z.string(),
  createdAt: z.string(),
  usedAt: z.string().nullable(),
  childFirstName: z.string().nullable(),
  teachers: z.array(codeTeacherSchema),
});
export type ConnectionCode = z.infer<typeof connectionCodeSchema>;

/** The plain code exists only in this response; the server keeps a hash. */
export const createdConnectionCodeResponseSchema = connectionCodeSchema.extend({
  code: z.string(),
});
export type CreatedConnectionCodeResponse = z.infer<typeof createdConnectionCodeResponseSchema>;

export const connectionCodeInputSchema = z.object({
  code: z.string().trim().min(8).max(20),
});
export type ConnectionCodeInput = z.infer<typeof connectionCodeInputSchema>;

const connectedSchoolSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  logoUrl: z.string().nullable(),
});

const connectedTeacherSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  title: z.string().nullable(),
});

/** POST /connections/preview — what the parent is about to connect to. */
export const connectionPreviewResponseSchema = z.object({
  school: connectedSchoolSchema,
  label: z.string().nullable(),
  expiresAt: z.string(),
  teachers: z.array(connectedTeacherSchema),
});
export type ConnectionPreviewResponse = z.infer<typeof connectionPreviewResponseSchema>;

/** POST /connections — the parent's explicit consent is part of the request. */
export const connectSchoolRequestSchema = z.object({
  code: z.string().trim().min(8).max(20),
  childId: z.string().min(1),
  consent: z.literal(true),
});
export type ConnectSchoolRequest = z.infer<typeof connectSchoolRequestSchema>;

export const parentSchoolConnectionSchema = z.object({
  enrollmentId: z.string(),
  status: z.enum(schoolChildEnrollmentStatuses),
  startDate: z.string(),
  child: z.object({ id: z.string(), firstName: z.string() }),
  school: connectedSchoolSchema,
  teachers: z.array(connectedTeacherSchema),
  /** Submitted reports only; drafts are never counted or shown to parents. */
  reportCount: z.number().int(),
});
export type ParentSchoolConnection = z.infer<typeof parentSchoolConnectionSchema>;

// ── School Registration Requests ─────────────────────────────────────────

export const schoolRegistrationStatuses = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type SchoolRegistrationStatus = (typeof schoolRegistrationStatuses)[number];

export const schoolRegistrationRequestSchema = z.object({
  schoolName: z.string().trim().min(1, 'School name is required.').max(160),
  city: z.string().trim().min(1, 'City is required.').max(120),
  address: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  contactFirstName: z.string().trim().min(1, 'First name is required.').max(80),
  contactLastName: z.string().trim().min(1, 'Last name is required.').max(80),
  contactTitle: z
    .string()
    .trim()
    .max(120)
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  phone: z.string().trim().min(1, 'Phone number is required.').max(32),
  studentCount: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.coerce.number().int().min(1).max(100000).optional(),
  ),
  message: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
});
export type SchoolRegistrationRequest = z.infer<typeof schoolRegistrationRequestSchema>;

export const schoolRegistrationSchema = z.object({
  id: z.string(),
  schoolName: z.string(),
  city: z.string(),
  address: z.string().nullable(),
  contactFirstName: z.string(),
  contactLastName: z.string(),
  contactTitle: z.string().nullable(),
  email: z.string().email(),
  phone: z.string(),
  studentCount: z.number().int().nullable(),
  message: z.string().nullable(),
  status: z.enum(schoolRegistrationStatuses),
  rejectionReason: z.string().nullable(),
  reviewedById: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  schoolId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type SchoolRegistration = z.infer<typeof schoolRegistrationSchema>;

export const rejectSchoolRegistrationRequestSchema = z.object({
  reason: z.string().trim().min(3, 'Reason must be at least 3 characters.').max(500),
});
export type RejectSchoolRegistrationRequest = z.infer<typeof rejectSchoolRegistrationRequestSchema>;

// ── Hospital Registration Requests ────────────────────────────────────────

export const hospitalRegistrationStatuses = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type HospitalRegistrationStatus = (typeof hospitalRegistrationStatuses)[number];

export const hospitalRegistrationRequestSchema = z.object({
  hospitalName: z.string().trim().min(1, 'Hospital name is required.').max(160),
  city: z.string().trim().min(1, 'City is required.').max(120),
  address: z
    .string()
    .trim()
    .max(500)
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  contactFirstName: z.string().trim().min(1, 'First name is required.').max(80),
  contactLastName: z.string().trim().min(1, 'Last name is required.').max(80),
  contactTitle: z
    .string()
    .trim()
    .max(120)
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  phone: z.string().trim().min(1, 'Phone number is required.').max(32),
  services: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  message: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
});
export type HospitalRegistrationRequest = z.infer<typeof hospitalRegistrationRequestSchema>;

export const hospitalRegistrationSchema = z.object({
  id: z.string(),
  hospitalName: z.string(),
  city: z.string(),
  address: z.string().nullable(),
  contactFirstName: z.string(),
  contactLastName: z.string(),
  contactTitle: z.string().nullable(),
  email: z.string().email(),
  phone: z.string(),
  services: z.string().nullable(),
  message: z.string().nullable(),
  status: z.enum(hospitalRegistrationStatuses),
  rejectionReason: z.string().nullable(),
  reviewedById: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  hospitalId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type HospitalRegistration = z.infer<typeof hospitalRegistrationSchema>;

export const rejectHospitalRegistrationRequestSchema = z.object({
  reason: z.string().trim().min(3, 'Reason must be at least 3 characters.').max(500),
});
export type RejectHospitalRegistrationRequest = z.infer<
  typeof rejectHospitalRegistrationRequestSchema
>;

// ── Hospital Team ──────────────────────────────────────────────────────────

export const hospitalStaffMemberSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  title: z.string().nullable(),
  role: z.enum(hospitalStaffRoles),
  username: z.string().nullable(),
  status: z.enum(hospitalStaffStatuses),
  doctorId: z.string().nullable().optional(),
  doctorName: z.string().nullable().optional(),
});
export type HospitalStaffMember = z.infer<typeof hospitalStaffMemberSchema>;

export const createHospitalStaffRequestSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  title: z.string().trim().max(80).optional(),
  role: z.enum(['COORDINATOR', 'DOCTOR']),
  doctorId: z.string().trim().min(1).optional(),
});
export type CreateHospitalStaffRequest = z.infer<typeof createHospitalStaffRequestSchema>;

export const hospitalStaffCredentialsResponseSchema = z.object({
  staff: hospitalStaffMemberSchema,
  username: z.string(),
  setupCode: z.string(),
  setupCodeExpiresAt: z.string(),
});
export type HospitalStaffCredentialsResponse = z.infer<
  typeof hospitalStaffCredentialsResponseSchema
>;

// ---------------------------------------------------------------------------
// Subscriptions. Free is the absence of a plan that grants access; Pro belongs to
// a parent and Business to a school. Prices are confirmed; everything marked as
// an open decision in the product spec (Free quotas, grace periods, refunds) is
// deliberately not modelled here.
// ---------------------------------------------------------------------------

export * from './plans.js';
export const subscriptionSchema = z.object({
  id: z.string(),
  plan: z.enum(subscriptionPlans),
  interval: z.enum(billingIntervals),
  status: z.enum(subscriptionStatuses),
  priceCents: z.number().int(),
  currency: z.string(),
  startedAt: z.string(),
  currentPeriodEnd: z.string().nullable(),
  canceledAt: z.string().nullable(),
  provider: z.string(),
  /** Whether this subscription gives access right now. */
  grantsAccess: z.boolean(),
});
export type Subscription = z.infer<typeof subscriptionSchema>;

/** A school's offer of a sponsored Pro account, as the invited parent sees it. */
export const sponsorshipOfferSchema = z.object({
  id: z.string(),
  schoolName: z.string(),
  invitedAt: z.string(),
});
export type SponsorshipOffer = z.infer<typeof sponsorshipOfferSchema>;

export const parentPlanResponseSchema = z.object({
  plan: z.enum(['FREE', 'PRO']),
  /** Where Pro comes from. A personal plan is reported first when both apply. */
  source: z.enum(['PERSONAL', 'SPONSORED']).nullable(),
  subscription: subscriptionSchema.nullable(),
  sponsorship: z
    .object({
      id: z.string(),
      schoolName: z.string(),
      acceptedAt: z.string().nullable(),
      /** False while the school's Business plan is not active. */
      grantsAccess: z.boolean(),
    })
    .nullable(),
  /** Null when no limit applies. */
  maxChildren: z.number().int().nullable(),
  activeChildren: z.number().int(),
  offers: z.array(sponsorshipOfferSchema),
});
export type ParentPlanResponse = z.infer<typeof parentPlanResponseSchema>;

/** A sponsorship as the school sees it: who was invited and the slot state, never child data. */
export const schoolSponsorshipSchema = z.object({
  id: z.string(),
  email: z.string(),
  status: z.enum(sponsorshipStatuses),
  invitedAt: z.string(),
  acceptedAt: z.string().nullable(),
  endedAt: z.string().nullable(),
  endedReason: z.string().nullable(),
});
export type SchoolSponsorship = z.infer<typeof schoolSponsorshipSchema>;

export const schoolSubscriptionResponseSchema = z.object({
  subscription: subscriptionSchema.nullable(),
  businessActive: z.boolean(),
  slotsTotal: z.number().int(),
  slotsUsed: z.number().int(),
  sponsorships: z.array(schoolSponsorshipSchema),
});
export type SchoolSubscriptionResponse = z.infer<typeof schoolSubscriptionResponseSchema>;

export const inviteSponsorshipRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(191),
});
export type InviteSponsorshipRequest = z.infer<typeof inviteSponsorshipRequestSchema>;

export const adminSubscriptionSchema = subscriptionSchema.extend({
  owner: z.object({
    type: z.enum(['PARENT', 'SCHOOL']),
    id: z.string(),
    name: z.string(),
    email: z.string().nullable(),
  }),
  note: z.string().nullable(),
});
export type AdminSubscription = z.infer<typeof adminSubscriptionSchema>;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.');

/**
 * The admin records a plan by hand until a payment provider is chosen. Pro is
 * set on a parent (by email), Business on a school (by id).
 */
export const createAdminSubscriptionRequestSchema = z
  .object({
    plan: z.enum(subscriptionPlans),
    interval: z.enum(billingIntervals),
    parentEmail: z.string().trim().toLowerCase().email().optional(),
    schoolId: z.string().trim().min(1).optional(),
    currentPeriodEnd: isoDate.optional(),
    note: z.string().trim().max(500).optional(),
  })
  .refine(
    (v) => (v.plan === 'PRO' ? !!v.parentEmail && !v.schoolId : !!v.schoolId && !v.parentEmail),
    {
      message: 'Pro needs a parent email; Business needs a school.',
    },
  );
export type CreateAdminSubscriptionRequest = z.infer<typeof createAdminSubscriptionRequestSchema>;

export const updateAdminSubscriptionRequestSchema = z.object({
  status: z.enum(subscriptionStatuses),
  currentPeriodEnd: isoDate.nullable().optional(),
});
export type UpdateAdminSubscriptionRequest = z.infer<typeof updateAdminSubscriptionRequestSchema>;

export * from './parent-portal.js';

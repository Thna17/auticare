import { z } from 'zod';

/**
 * The platform admin's portal: user management, audit logs, the overview and
 * the cross-school sponsorship view. Admin lists never carry child details
 * beyond a count; a child's records stay with the parent who owns them.
 */

export const accountStatuses = ['ACTIVE', 'SUSPENDED'] as const;
export type AccountStatus = (typeof accountStatuses)[number];

/** `?page=1&pageSize=25&search=…`, shared by the admin lists. */
export const adminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(120).optional(),
});
export type AdminListQuery = z.infer<typeof adminListQuerySchema>;

const paged = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
  });

export const adminParentSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  createdAt: z.string(),
  status: z.enum(accountStatuses),
  suspendedReason: z.string().nullable(),
  plan: z.enum(['FREE', 'PRO']),
  /** How many active child profiles; never which children. */
  childCount: z.number().int(),
});
export type AdminParent = z.infer<typeof adminParentSchema>;
export const adminParentListSchema = paged(adminParentSchema);
export type AdminParentList = z.infer<typeof adminParentListSchema>;

export const suspendAccountRequestSchema = z.object({
  reason: z.string().trim().min(3).max(500),
});
export type SuspendAccountRequest = z.infer<typeof suspendAccountRequestSchema>;

export const adminSchoolSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  isVerified: z.boolean(),
  businessActive: z.boolean(),
  teacherCount: z.number().int(),
  sponsoredUsed: z.number().int(),
  adminEmail: z.string().nullable(),
  createdAt: z.string(),
});
export type AdminSchool = z.infer<typeof adminSchoolSchema>;
export const adminSchoolListSchema = paged(adminSchoolSchema);
export type AdminSchoolList = z.infer<typeof adminSchoolListSchema>;

export const updateAdminSchoolRequestSchema = z
  .object({
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    isVerified: z.boolean().optional(),
    reason: z.string().trim().max(500).optional(),
  })
  .refine((v) => v.status !== undefined || v.isVerified !== undefined, {
    message: 'Nothing to change.',
  });
export type UpdateAdminSchoolRequest = z.infer<typeof updateAdminSchoolRequestSchema>;

export const adminStaffStatuses = ['ACTIVE', 'SETUP_PENDING', 'DEACTIVATED', 'SUSPENDED'] as const;
export type AdminStaffStatus = (typeof adminStaffStatuses)[number];

/** One person's role at one school. */
export const adminStaffSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  /** Teachers made by a school sign in with a username and have no real email. */
  username: z.string().nullable(),
  email: z.string().nullable(),
  schoolId: z.string(),
  schoolName: z.string(),
  role: z.enum(['ADMIN', 'TEACHER']),
  title: z.string().nullable(),
  status: z.enum(adminStaffStatuses),
});
export type AdminStaff = z.infer<typeof adminStaffSchema>;
export const adminStaffListSchema = paged(adminStaffSchema);
export type AdminStaffList = z.infer<typeof adminStaffListSchema>;

export const adminAuditQuerySchema = adminListQuerySchema.extend({
  action: z.string().trim().max(80).optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});
export type AdminAuditQuery = z.infer<typeof adminAuditQuerySchema>;

export const adminAuditEventSchema = z.object({
  id: z.string(),
  action: z.string(),
  actorEmail: z.string().nullable(),
  actorRole: z.string().nullable(),
  targetId: z.string().nullable(),
  targetEmail: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string(),
});
export type AdminAuditEvent = z.infer<typeof adminAuditEventSchema>;
export const adminAuditListSchema = paged(adminAuditEventSchema).extend({
  /** Every action name recorded so far, for the filter. */
  actions: z.array(z.string()),
});
export type AdminAuditList = z.infer<typeof adminAuditListSchema>;

export const adminSponsorshipSchoolSchema = z.object({
  schoolId: z.string(),
  schoolName: z.string(),
  businessActive: z.boolean(),
  slotsUsed: z.number().int(),
  slotsTotal: z.number().int(),
  invited: z.number().int(),
  active: z.number().int(),
  ended: z.number().int(),
});
export type AdminSponsorshipSchool = z.infer<typeof adminSponsorshipSchoolSchema>;

export const adminOverviewSchema = z.object({
  parents: z.object({
    total: z.number().int(),
    new7d: z.number().int(),
    new30d: z.number().int(),
  }),
  schools: z.object({ active: z.number().int(), suspended: z.number().int() }),
  pending: z.object({
    schoolRequests: z.number().int(),
    hospitalRequests: z.number().int(),
    teacherSetups: z.number().int(),
  }),
  subscriptions: z.object({
    pro: z.number().int(),
    business: z.number().int(),
    sponsoredActive: z.number().int(),
    pastDue: z.number().int(),
  }),
  suspendedAccounts: z.number().int(),
  aiConfigured: z.boolean(),
  recentActivity: z.array(adminAuditEventSchema),
});
export type AdminOverview = z.infer<typeof adminOverviewSchema>;

// --- Announcements ---------------------------------------------------------

export const announcementAudiences = ['ALL', 'PARENTS', 'SCHOOLS', 'TEACHERS'] as const;
export type AnnouncementAudience = (typeof announcementAudiences)[number];
export const announcementStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export type AnnouncementStatus = (typeof announcementStatuses)[number];

const isoDateTime = z.string().datetime({ offset: true });

export const announcementSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  audience: z.enum(announcementAudiences),
  status: z.enum(announcementStatuses),
  publishAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  /** PUBLISHED and inside its window right now. */
  live: z.boolean(),
});
export type Announcement = z.infer<typeof announcementSchema>;

export const saveAnnouncementRequestSchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    body: z.string().trim().min(3).max(2000),
    audience: z.enum(announcementAudiences),
    status: z.enum(announcementStatuses),
    publishAt: isoDateTime.nullable().optional(),
    expiresAt: isoDateTime.nullable().optional(),
  })
  .refine((v) => !v.publishAt || !v.expiresAt || new Date(v.expiresAt) > new Date(v.publishAt), {
    message: 'The end must be after the start.',
    path: ['expiresAt'],
  });
export type SaveAnnouncementRequest = z.infer<typeof saveAnnouncementRequestSchema>;

/** What a signed-in user is shown: the live announcements for their audience. */
export const visibleAnnouncementSchema = announcementSchema.pick({
  id: true,
  title: true,
  body: true,
  publishedAt: true,
});
export type VisibleAnnouncement = z.infer<typeof visibleAnnouncementSchema>;

// --- Partnerships ----------------------------------------------------------

export const partnershipStatuses = [
  'PROSPECT',
  'CONTACTED',
  'IN_DISCUSSION',
  'ACTIVE',
  'ENDED',
] as const;
export type PartnershipStatus = (typeof partnershipStatuses)[number];
export const partnershipOrgTypes = ['SCHOOL', 'HOSPITAL', 'NGO', 'OTHER'] as const;

export const partnershipSchema = z.object({
  id: z.string(),
  organizationName: z.string(),
  organizationType: z.enum(partnershipOrgTypes),
  contactName: z.string().nullable(),
  contactEmail: z.string().nullable(),
  contactPhone: z.string().nullable(),
  status: z.enum(partnershipStatuses),
  nextFollowUpAt: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Partnership = z.infer<typeof partnershipSchema>;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional();

export const savePartnershipRequestSchema = z.object({
  organizationName: z.string().trim().min(2).max(160),
  organizationType: z.enum(partnershipOrgTypes),
  contactName: optionalText(120),
  contactEmail: z
    .union([z.literal(''), z.string().trim().toLowerCase().email().max(191)])
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional(),
  contactPhone: optionalText(40),
  status: z.enum(partnershipStatuses),
  nextFollowUpAt: z
    .union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)])
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional(),
  notes: optionalText(4000),
});
export type SavePartnershipRequest = z.input<typeof savePartnershipRequestSchema>;

// --- Analytics -------------------------------------------------------------

export const analyticsMonthSchema = z.object({
  /** "2026-10" */
  month: z.string(),
  parentRegistrations: z.number().int(),
  schoolsAdded: z.number().int(),
  proStarted: z.number().int(),
  businessStarted: z.number().int(),
  plansEnded: z.number().int(),
  /** Sum of list prices of plans recorded that month, in cents. Not payments. */
  recordedPlanValueCents: z.number().int(),
  questionnairesCompleted: z.number().int(),
  aiQuestions: z.number().int(),
  activitiesCompleted: z.number().int(),
});
export type AnalyticsMonth = z.infer<typeof analyticsMonthSchema>;

export const adminAnalyticsSchema = z.object({
  months: z.array(analyticsMonthSchema),
  totals: z.object({
    parents: z.number().int(),
    parentsOnPro: z.number().int(),
    activeChildren: z.number().int(),
    childrenWithCompletedQuestionnaire: z.number().int(),
  }),
});
export type AdminAnalytics = z.infer<typeof adminAnalyticsSchema>;

// --- Resources & activities editor -----------------------------------------

export const activityStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export type ActivityStatus = (typeof activityStatuses)[number];

export const adminActivitySchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  minAgeMonths: z.number().int(),
  maxAgeMonths: z.number().int(),
  summary: z.string(),
  steps: z.string().nullable(),
  imageUrl: z.string().nullable(),
  videoUrl: z.string().nullable(),
  resourceUrl: z.string().nullable(),
  status: z.enum(activityStatuses),
  professionallyReviewed: z.boolean(),
  reviewedBy: z.string().nullable(),
  /** How many times families marked it done. */
  completions: z.number().int(),
  updatedAt: z.string(),
});
export type AdminActivity = z.infer<typeof adminActivitySchema>;

const optionalUrl = z
  .union([z.literal(''), z.string().trim().url().max(2000)])
  .transform((v) => (v === '' ? null : v))
  .nullable()
  .optional();

export const saveActivityRequestSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    category: z.string().trim().min(2).max(60),
    minAgeMonths: z.coerce.number().int().min(0).max(216),
    maxAgeMonths: z.coerce.number().int().min(0).max(216),
    summary: z.string().trim().min(10).max(2000),
    steps: z
      .string()
      .trim()
      .max(6000)
      .transform((v) => (v === '' ? null : v))
      .nullable()
      .optional(),
    imageUrl: optionalUrl,
    videoUrl: optionalUrl,
    resourceUrl: optionalUrl,
    status: z.enum(activityStatuses),
    professionallyReviewed: z.boolean(),
    reviewedBy: z
      .string()
      .trim()
      .max(120)
      .transform((v) => (v === '' ? null : v))
      .nullable()
      .optional(),
  })
  .refine((v) => v.maxAgeMonths >= v.minAgeMonths, {
    message: 'The oldest age must not be below the youngest.',
    path: ['maxAgeMonths'],
  });
export type SaveActivityRequest = z.input<typeof saveActivityRequestSchema>;

// --- Questionnaire management ------------------------------------------------

// Same values as `ageBands`, `screeningFormKinds` and `questionPolarities` in
// index.ts. Repeated here because index.ts re-exports this file, and importing
// back from it would be a circular import.
const questionAgeBands = ['TODDLER', 'PRESCHOOL'] as const;
const questionFormKinds = ['FULL', 'SHORT'] as const;
const questionPolarityValues = ['DIRECT', 'REVERSE'] as const;

export const adminQuestionSchema = z.object({
  id: z.string(),
  questionText: z.string(),
  category: z.string(),
  displayOrder: z.number().int(),
  polarity: z.enum(questionPolarityValues),
  ageBand: z.enum(questionAgeBands),
  formKind: z.enum(questionFormKinds),
  isActive: z.boolean(),
  version: z.number().int(),
  replacesId: z.string().nullable(),
  /** Answers already given to this exact wording. */
  answerCount: z.number().int(),
  updatedAt: z.string(),
});
export type AdminQuestion = z.infer<typeof adminQuestionSchema>;

export const questionnaireStatsSchema = z.object({
  ageBand: z.enum(questionAgeBands),
  formKind: z.enum(questionFormKinds),
  started: z.number().int(),
  completed: z.number().int(),
});

export const adminQuestionnaireSchema = z.object({
  questions: z.array(adminQuestionSchema),
  stats: z.array(questionnaireStatsSchema),
});
export type AdminQuestionnaire = z.infer<typeof adminQuestionnaireSchema>;

export const updateQuestionRequestSchema = z.object({
  questionText: z.string().trim().min(5).max(500),
  category: z.string().trim().min(2).max(80),
  polarity: z.enum(questionPolarityValues),
  displayOrder: z.coerce.number().int().min(0).max(9999),
});
export type UpdateQuestionRequest = z.infer<typeof updateQuestionRequestSchema>;

export const createQuestionRequestSchema = updateQuestionRequestSchema.extend({
  ageBand: z.enum(questionAgeBands),
  formKind: z.enum(questionFormKinds),
});
export type CreateQuestionRequest = z.infer<typeof createQuestionRequestSchema>;

// --- AI monitoring -----------------------------------------------------------

export const aiDaySchema = z.object({
  date: z.string(),
  questions: z.number().int(),
  avgLatencyMs: z.number().int().nullable(),
});

export const adminAiMonitoringSchema = z.object({
  configured: z.boolean(),
  model: z.string().nullable(),
  days: z.number().int(),
  totals: z.object({
    conversations: z.number().int(),
    questions: z.number().int(),
    answers: z.number().int(),
    crisisReplies: z.number().int(),
    medicationReplies: z.number().int(),
    avgLatencyMs: z.number().int().nullable(),
    tokensIn: z.number().int(),
    tokensOut: z.number().int(),
    reviewedSources: z.number().int(),
  }),
  daily: z.array(aiDaySchema),
  /** The safety rules every answer is generated under, read-only. */
  rules: z.string(),
});
export type AdminAiMonitoring = z.infer<typeof adminAiMonitoringSchema>;

import { z } from 'zod';

export const inquiryStatuses = ['NEW', 'READ', 'ARCHIVED'] as const;
export type InquiryStatus = (typeof inquiryStatuses)[number];

export const createOrganizationInquiryRequestSchema = z
  .object({
    schoolId: z.string().min(1).optional(),
    hospitalId: z.string().min(1).optional(),
    childFirstName: z.string().trim().max(100).optional().nullable(),
    subject: z.string().trim().min(1).max(120),
    message: z.string().trim().min(1).max(2000),
  })
  .refine((v) => (v.schoolId ? !v.hospitalId : !!v.hospitalId), {
    message: 'Exactly one of schoolId or hospitalId must be provided.',
  });
export type CreateOrganizationInquiryRequest = z.infer<
  typeof createOrganizationInquiryRequestSchema
>;

export const organizationInquiryResponseSchema = z.object({
  id: z.string(),
  parentId: z.string(),
  parent: z
    .object({
      firstName: z.string(),
      lastName: z.string(),
      email: z.string(),
    })
    .nullable()
    .optional(),
  parentName: z.string().nullable().optional(),
  schoolId: z.string().nullable(),
  hospitalId: z.string().nullable(),
  schoolName: z.string().nullable().optional(),
  hospitalName: z.string().nullable().optional(),
  childFirstName: z.string().nullable(),
  subject: z.string(),
  message: z.string(),
  status: z.enum(inquiryStatuses),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type OrganizationInquiryResponse = z.infer<typeof organizationInquiryResponseSchema>;

export const aiMessageFeedbackValues = ['HELPFUL', 'NOT_HELPFUL'] as const;
export type AiMessageFeedback = (typeof aiMessageFeedbackValues)[number];

export const feedbackAiMessageRequestSchema = z.object({
  feedback: z.enum(aiMessageFeedbackValues),
  feedbackNote: z.string().trim().max(1000).optional().nullable(),
});
export type FeedbackAiMessageRequest = z.infer<typeof feedbackAiMessageRequestSchema>;

export const toggleActivityFavoriteResponseSchema = z.object({
  activityId: z.string(),
  isFavorite: z.boolean(),
});
export type ToggleActivityFavoriteResponse = z.infer<typeof toggleActivityFavoriteResponseSchema>;

export const toggleFavoriteHospitalResponseSchema = z.object({
  hospitalId: z.string(),
  isFavorite: z.boolean(),
});
export type ToggleFavoriteHospitalResponse = z.infer<typeof toggleFavoriteHospitalResponseSchema>;

export const markAllNotificationsReadResponseSchema = z.object({
  updatedCount: z.number().int(),
});
export type MarkAllNotificationsReadResponse = z.infer<
  typeof markAllNotificationsReadResponseSchema
>;

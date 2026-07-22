import { z } from 'zod';

export const createScreeningSessionRequestSchema = z.object({
  childId: z.string().min(1),
});
export type CreateScreeningSessionRequest = z.infer<typeof createScreeningSessionRequestSchema>;

export const upsertScreeningAnswerRequestSchema = z.object({
  questionId: z.string().min(1),
  answerValue: z.number().int().min(0).max(4),
});
export type UpsertScreeningAnswerRequest = z.infer<typeof upsertScreeningAnswerRequestSchema>;

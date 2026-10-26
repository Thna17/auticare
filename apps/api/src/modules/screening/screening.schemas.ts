import { z } from 'zod';
import { screeningFormKinds } from '@auticare/contracts';

export const createScreeningSessionRequestSchema = z.object({
  childId: z.string().min(1),
  // Omitted means FULL, so every existing client keeps its current behaviour.
  formKind: z.enum(screeningFormKinds).optional(),
});
export type CreateScreeningSessionRequest = z.infer<typeof createScreeningSessionRequestSchema>;

export const upsertScreeningAnswerRequestSchema = z.object({
  questionId: z.string().min(1),
  answerValue: z.number().int().min(0).max(4),
});
export type UpsertScreeningAnswerRequest = z.infer<typeof upsertScreeningAnswerRequestSchema>;

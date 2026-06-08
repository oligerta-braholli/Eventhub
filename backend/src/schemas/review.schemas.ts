import { z } from 'zod';

export const createReviewSchema = z.object({
  eventId: z.string().min(1, 'eventId krävs'),
  rating: z.number().int().min(1, 'Betyg måste vara mellan 1 och 5').max(5, 'Betyg måste vara mellan 1 och 5'),
  comment: z.string().trim().min(1, 'Kommentar krävs').max(1000, 'Kommentar får vara maximalt 1000 tecken'),
});

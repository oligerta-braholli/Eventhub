import { z } from 'zod';

export const createBookingSchema = z.object({
  eventId: z.string().min(1, 'eventId krävs'),
  ticketTypeName: z.string().trim().min(1, 'ticketTypeName krävs'),
  quantity: z.number().int().min(1, 'Antal måste vara minst 1').max(10, 'Antal får vara maximalt 10'),
});

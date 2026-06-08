import { z } from 'zod';

const ticketTypeSchema = z.object({
  name: z.string().trim().min(1, 'Biljettnamn krävs'),
  price: z.number().min(0, 'Pris kan inte vara negativt'),
  quantity: z.number().int().min(1, 'Antal måste vara minst 1'),
});

export const createEventSchema = z.object({
  title: z.string().trim().min(1, 'Titel krävs').max(200),
  description: z.string().trim().min(1, 'Beskrivning krävs'),
  venue: z.string().min(1, 'Plats krävs'),
  startDate: z.string().min(1, 'Startdatum krävs'),
  endDate: z.string().min(1, 'Slutdatum krävs'),
  capacity: z.number().int().min(1, 'Kapacitet måste vara minst 1'),
  ticketTypes: z.array(ticketTypeSchema).optional(),
});

export const updateEventSchema = createEventSchema;

export const updateStatusSchema = z.object({
  status: z.enum(['published', 'cancelled', 'completed'] as const, {
    error: 'Status måste vara published, cancelled eller completed',
  }),
});

export const calendarQuerySchema = z.object({
  from: z.string().min(1, 'from krävs (ISO 8601-datum)'),
  to: z.string().min(1, 'to krävs (ISO 8601-datum)'),
});

export const listEventsQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.string().optional(),
  page: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  sort: z.string().optional(),
});

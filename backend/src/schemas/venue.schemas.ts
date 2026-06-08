import { z } from 'zod';

export const createVenueSchema = z.object({
  name: z.string().trim().min(1, 'Namn krävs'),
  address: z.string().trim().min(1, 'Adress krävs'),
  city: z.string().trim().min(1, 'Stad krävs'),
  country: z.string().trim().min(1, 'Land krävs'),
  capacity: z.number().int().min(1, 'Kapacitet måste vara minst 1'),
});

import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Namnet måste vara minst 2 tecken')
    .max(100, 'Namnet får vara maximalt 100 tecken')
    .regex(/^[a-zA-ZåäöÅÄÖéèêëàâùûüîïôœæç\s]+$/, 'Namnet får bara innehålla bokstäver och mellanslag'),
  email: z
    .string()
    .email('Ogiltig e-postadress')
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'Lösenordet måste vara minst 8 tecken')
    .max(72, 'Lösenordet får vara maximalt 72 tecken')
    .regex(/[A-ZÅÄÖ]/, 'Lösenordet måste innehålla minst en stor bokstav')
    .regex(/[0-9]/, 'Lösenordet måste innehålla minst en siffra'),
  role: z.enum(['participant', 'organizer'] as const).optional().default('participant'),
});

export const loginSchema = z.object({
  email: z
    .string()
    .email('Felaktig e-post eller lösenord')
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string()
    .min(1, 'Felaktig e-post eller lösenord'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

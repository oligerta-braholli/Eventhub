import { z } from 'zod';

const mongoId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Ogiltigt ID-format');

export const idParamSchema = z.object({ id: mongoId });
export const eventIdParamSchema = z.object({ eventId: mongoId });

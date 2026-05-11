import { Request } from 'express';
import { Types } from 'mongoose';

export type UserRole = 'admin' | 'organizer' | 'participant';

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string>[];
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface EventFilterQuery extends PaginationQuery {
  from?: string;
  to?: string;
  venue?: string;
  search?: string;
}

export interface BookingStatus {
  status: 'confirmed' | 'cancelled';
}

export interface TicketType {
  name: string;
  price: number;
  quantity: number;
  sold: number;
}

export type UserRole = 'admin' | 'organizer' | 'participant';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isAnonymized: boolean;
  createdAt: string;
}

export interface Venue {
  _id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  capacity: number;
}

export interface TicketType {
  name: string;
  price: number;
  quantity: number;
  sold: number;
}

export interface Event {
  _id: string;
  title: string;
  description: string;
  venue: Venue;
  organizer: { _id: string; name: string };
  startDate: string;
  endDate: string;
  capacity: number;
  bookedCount: number;
  availableSpots: number;
  isFull: boolean;
  ticketTypes: TicketType[];
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  createdAt: string;
}

export interface Booking {
  _id: string;
  event: { _id: string; title: string; startDate: string; status: string };
  participant: string | User;
  ticketTypeName: string;
  quantity: number;
  totalPrice: number;
  status: 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface Review {
  _id: string;
  event: string;
  author: { _id: string; name: string };
  rating: number;
  comment: string;
  createdAt: string;
}

export interface WaitlistEntry {
  _id: string;
  event: string;
  participant: User;
  position: number;
  createdAt: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

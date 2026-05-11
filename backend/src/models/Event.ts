import { Schema, model, Document, Types } from 'mongoose';
import { TicketType } from '../types';

export interface IEvent extends Document {
  title: string;
  description: string;
  venue: Types.ObjectId;
  organizer: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  capacity: number;
  bookedCount: number;
  ticketTypes: TicketType[];
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const ticketTypeSchema = new Schema<TicketType>(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    sold: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const eventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    venue: { type: Schema.Types.ObjectId, ref: 'Venue', required: true },
    organizer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    capacity: { type: Number, required: true, min: 1 },
    bookedCount: { type: Number, default: 0, min: 0 },
    ticketTypes: { type: [ticketTypeSchema], default: [] },
    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled', 'completed'],
      default: 'published',
    },
  },
  { timestamps: true }
);

eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ venue: 1 });

eventSchema.virtual('availableSpots').get(function () {
  return this.capacity - this.bookedCount;
});

eventSchema.virtual('isFull').get(function () {
  return this.bookedCount >= this.capacity;
});

eventSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => { const { __v, ...clean } = ret as any; return clean; },
});

export const Event = model<IEvent>('Event', eventSchema);

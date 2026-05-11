import { Schema, model, Document, Types } from 'mongoose';

export interface IBooking extends Document {
  event: Types.ObjectId;
  participant: Types.ObjectId;
  ticketTypeName: string;
  quantity: number;
  totalPrice: number;
  status: 'confirmed' | 'cancelled';
  isAnonymized: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    participant: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ticketTypeName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, max: 10 },
    totalPrice: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
    isAnonymized: { type: Boolean, default: false },
  },
  { timestamps: true }
);

bookingSchema.index({ event: 1, participant: 1 });
bookingSchema.index({ participant: 1 });

bookingSchema.set('toJSON', { transform: (_doc, ret) => { const { __v, ...clean } = ret as any; return clean; } });

export const Booking = model<IBooking>('Booking', bookingSchema);

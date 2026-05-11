import { Schema, model, Document, Types } from 'mongoose';

export interface ITicket extends Document {
  event: Types.ObjectId;
  booking: Types.ObjectId;
  participant: Types.ObjectId;
  ticketTypeName: string;
  price: number;
  ticketNumber: string;
  isAnonymized: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>(
  {
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    participant: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ticketTypeName: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    ticketNumber: { type: String, required: true, unique: true },
    isAnonymized: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ticketSchema.set('toJSON', { transform: (_doc, ret) => { const { __v, ...clean } = ret as any; return clean; } });

export const Ticket = model<ITicket>('Ticket', ticketSchema);

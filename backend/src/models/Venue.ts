import { Schema, model, Document } from 'mongoose';

export interface IVenue extends Document {
  name: string;
  address: string;
  city: string;
  country: string;
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
}

const venueSchema = new Schema<IVenue>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    address: { type: String, required: true, trim: true, maxlength: 300 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    country: { type: String, required: true, trim: true, maxlength: 100 },
    capacity: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

venueSchema.set('toJSON', { transform: (_doc, ret) => { const { __v, ...clean } = ret as any; return clean; } });

export const Venue = model<IVenue>('Venue', venueSchema);

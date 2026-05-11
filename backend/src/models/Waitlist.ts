import { Schema, model, Document, Types } from 'mongoose';

export interface IWaitlist extends Document {
  event: Types.ObjectId;
  participant: Types.ObjectId;
  position: number;
  isAnonymized: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const waitlistSchema = new Schema<IWaitlist>(
  {
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    participant: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    position: { type: Number, required: true, min: 1 },
    isAnonymized: { type: Boolean, default: false },
  },
  { timestamps: true }
);

waitlistSchema.index({ event: 1, participant: 1 }, { unique: true });
waitlistSchema.index({ event: 1, position: 1 });

waitlistSchema.set('toJSON', { transform: (_doc, ret) => { const { __v, ...clean } = ret as any; return clean; } });

export const Waitlist = model<IWaitlist>('Waitlist', waitlistSchema);

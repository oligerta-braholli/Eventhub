import { Schema, model, Document, Types } from 'mongoose';

export interface IReview extends Document {
  event: Types.ObjectId;
  author: Types.ObjectId;
  rating: number;
  comment: string;
  isAnonymized: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
    isAnonymized: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One review per participant per event
reviewSchema.index({ event: 1, author: 1 }, { unique: true });

reviewSchema.set('toJSON', { transform: (_doc, ret) => { const { __v, ...clean } = ret as any; return clean; } });

export const Review = model<IReview>('Review', reviewSchema);

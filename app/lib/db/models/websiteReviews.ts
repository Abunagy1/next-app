import mongoose, { Schema } from 'mongoose';

const websiteReviewSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    category: {
      type: String,
      enum: ['customer_support', 'pricing', 'reliability', 'communication', 'overall'],
      default: 'overall',
    },
    comment: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

export default mongoose.models.WebsiteReview || mongoose.model('WebsiteReview', websiteReviewSchema);
import mongoose, { Schema, Document } from 'mongoose';
export interface IProduct extends Document {
  name: string;
  price: number;
  image: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}
const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  type: { type: String, required: true }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});
export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
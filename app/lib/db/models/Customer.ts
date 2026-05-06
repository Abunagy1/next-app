import mongoose, { Schema, Document } from 'mongoose';
export interface ICustomer extends Document {
  name: string;
  email: string;
  image_url: string;
  user_id?: mongoose.Types.ObjectId;
}
const CustomerSchema = new Schema<ICustomer>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  image_url: { type: String, required: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User' }
});
export default mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
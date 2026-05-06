import { Schema } from 'mongoose';

export interface ICustomer {
  name: string;
  email: string;
  image_url: string;
  user_id?: Schema.Types.ObjectId;
}

const customerSchema = new Schema<ICustomer>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  image_url: { type: String, required: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User' },
});

export default customerSchema;
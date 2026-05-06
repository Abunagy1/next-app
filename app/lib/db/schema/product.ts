import { Schema } from 'mongoose';

export interface IProduct {
  name: string;
  price: number;
  image: string;
  type: string;
  created_at?: Date;
  updated_at?: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    type: { type: String, required: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export default productSchema;
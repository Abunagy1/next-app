import { Schema } from 'mongoose';

export interface IInvoice {
  customer: {
    id: Schema.Types.ObjectId;
    name: string;
    email: string;
    image_url: string;
  };
  amount: number;
  status: 'pending' | 'paid';
  date: Date;
  items?: any;
  shipping_info?: any;
  payment_intent_id?: string;
  payment_method?: string;
  payment_reference?: string;
  created_at?: Date;
  updated_at?: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    customer: {
      id: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
      name: { type: String, required: true },
      email: { type: String, required: true },
      image_url: { type: String, required: true },
    },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid'], required: true },
    date: { type: Date, required: true },
    items: { type: Schema.Types.Mixed },
    shipping_info: { type: Schema.Types.Mixed },
    payment_intent_id: { type: String },
    payment_method: { type: String },
    payment_reference: { type: String },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export default invoiceSchema;
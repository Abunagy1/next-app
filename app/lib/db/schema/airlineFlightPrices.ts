import { Schema } from "mongoose";

const amountSchema: Schema = new Schema({
  type: {
    type: String,
    enum: ["percentage", "fixed"],
    required: true,
    default: "percentage",
  }, // percentage from base price
  amount: { type: Number, required: true, default: 0 },
});
type AgeGroupSchema<T> = {
  adult: T;
  child: T;
  infant: T;
};
export function createAgeGroupSchema<T>(valueSchema: T): AgeGroupSchema<T> {
  return {
    adult: valueSchema,
    child: valueSchema,
    infant: valueSchema,
  };
}
const basePriceSchema = createAgeGroupSchema<NumberConstructor>(Number);
const amountBasedSchema = createAgeGroupSchema<typeof amountSchema>(amountSchema);
const airlineFlightPricesSchema = new Schema({
  airlineCode: { type: String, ref: "Airline", required: true },
  departureAirportCode: { type: String, required: true },
  arrivalAirportCode: { type: String, required: true },
  distance: {
    lengthIn: { type: String, enum: ["mi"], required: true, default: "mi" },
    value: { type: Number, required: true },
  },
  basePrice: {
    economy: basePriceSchema,
    premium_economy: basePriceSchema,
    business: basePriceSchema,
    first: basePriceSchema,
  },
  discount: amountBasedSchema,
  serviceFee: amountBasedSchema,
  taxes: amountBasedSchema,
});
export default airlineFlightPricesSchema;
import mongoose, { Schema, Document } from 'mongoose';

export interface IWebsiteConfig extends Document {
    maintenance_mode: any;
    enable_flight_booking: boolean;
    enable_hotel_booking: boolean;
}

const WebsiteConfigSchema = new Schema<IWebsiteConfig>({
    maintenance_mode: Schema.Types.Mixed,
    enable_flight_booking: { type: Boolean, default: true },
    enable_hotel_booking: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.WebsiteConfig || mongoose.model<IWebsiteConfig>('WebsiteConfig', WebsiteConfigSchema);
// // import { model, models } from 'mongoose';
// import { model } from 'mongoose';
// //import mongoose from 'mongoose';
// // ------------------------------------------------------------------
// // 1. Import all project schemas (these are used to create models)
// // ------------------------------------------------------------------
// import {
//   subscriptionSchema,
//   userSchema,
//   anonymousUserSchema,
//   flightItinerarySchema,
//   flightSegmentSchema,
//   flightSeatsSchema,
//   accountsSchema,
//   airlineSchema,
//   airlineFlightPricesSchema,
//   airportSchema,
//   flightBookingSchema,
//   flightReviewSchema,
//   flightPaymentSchema,
//   hotelBookingSchema,
//   hotelRoomSchema,
//   hotelGuestSchema,
//   hotelSchema,
//   hotelReviewSchema,
//   hotelPaymentSchema,
//   passengerSchema,
//   verificationTokensSchema,
//   sessionSchema,
//   seatSchema,
//   airplaneSchema,
//   promoCodeSchema,
//   searchHistorySchema,
//   websiteReviewSchema,
//   websiteConfigSchema,
//   analyticsSchema,
// } from '../schema';
// // ------------------------------------------------------------------
// // 2. Import base project models (already exported as Mongoose models)
// // ------------------------------------------------------------------
// //import UserModel from './User';
// import CommentModel from './Comment';
// import CommentReactionModel from './CommentReaction';
// import CustomerModel from './Customer';
// import InvoiceModel from './Invoice';
// import PasswordResetTokenModel from './PasswordResetToken';
// import PostModel from './Post';
// import PostReactionModel from './PostReaction';
// import ProductModel from './Product';
// import RevenueModel from './Revenue';
// import VerificationTokenModel from './VerificationToken';

// // ------------------------------------------------------------------
// // 3. Create models from schema (if models don't exist), it check for the models first
// // ------------------------------------------------------------------
// // const User = mongoose.models?.User || mongoose.model('User', userSchema);
// // const Subscription = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);
// // const AnonymousUser = mongoose.models.AnonymousUser || mongoose.model('AnonymousUser', anonymousUserSchema);
// // const FlightItinerary = mongoose.models.FlightItinerary || mongoose.model('FlightItinerary', flightItinerarySchema);
// // const FlightSegment = mongoose.models.FlightSegment || mongoose.model('FlightSegment', flightSegmentSchema);
// // const FlightSeat = mongoose.models.FlightSeat || mongoose.model('FlightSeat', flightSeatsSchema);
// // const Account = mongoose.models.Account || mongoose.model('Account', accountsSchema);
// // const Airline = mongoose.models.Airline || mongoose.model('Airline', airlineSchema);
// // const AirlineFlightPrice = mongoose.models.AirlineFlightPrice || mongoose.model('AirlineFlightPrice', airlineFlightPricesSchema);
// // const Airport = mongoose.models.Airport || mongoose.model('Airport', airportSchema);
// // const FlightBooking = mongoose.models.FlightBooking || mongoose.model('FlightBooking', flightBookingSchema);
// // const FlightReview = mongoose.models.FlightReview || mongoose.model('FlightReview', flightReviewSchema);
// // const FlightPayment = mongoose.models.FlightPayment || mongoose.model('FlightPayment', flightPaymentSchema);
// // const HotelBooking = mongoose.models.HotelBooking || mongoose.model('HotelBooking', hotelBookingSchema);
// // const HotelRoom = mongoose.models.HotelRoom || mongoose.model('HotelRoom', hotelRoomSchema);
// // const HotelGuest = mongoose.models.HotelGuest || mongoose.model('HotelGuest', hotelGuestSchema);
// // const Hotel = mongoose.models.Hotel || mongoose.model('Hotel', hotelSchema);
// // const HotelPayment = mongoose.models.HotelPayment || mongoose.model('HotelPayment', hotelPaymentSchema);
// // const Passenger = mongoose.models.Passenger || mongoose.model('Passenger', passengerSchema);
// // const HotelReview = mongoose.models.HotelReview || mongoose.model('HotelReview', hotelReviewSchema);
// // const Verification_Token = mongoose.models.Verification_Token || mongoose.model('Verification_Token', verificationTokenSchema);
// // const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);
// // const Seat = mongoose.models.Seat || mongoose.model('Seat', seatSchema);
// // const Airplane = mongoose.models.Airplane || mongoose.model('Airplane', airplaneSchema);
// // const PromoCode = mongoose.models.PromoCode || mongoose.model('PromoCode', promoCodeSchema);
// // const SearchHistory = mongoose.models.SearchHistory || mongoose.model('SearchHistory', searchHistorySchema);
// // const WebsiteReview = mongoose.models.WebsiteReview || mongoose.model('WebsiteReview', websiteReviewSchema);
// // const WebsiteConfig = mongoose.models.WebsiteConfig || mongoose.model('WebsiteConfig', websiteConfigSchema);
// // const Analytic = mongoose.models.Analytic || mongoose.model('Analytic', analyticsSchema);

// // If you want to remove the cache check and force direct models creation from schemas, use this way:
// // 3. Create models from schemas (direct creation – no cache check)
// //    Note: In Next.js with hot reload, this may cause "OverwriteModelError".
// //    If you encounter that, switch back to `models.ModelName || model(...)`.
// const User = model('User', userSchema);
// // const User = models?.User || model('User', userSchema);
// const Subscription = model('Subscription', subscriptionSchema);
// // const Subscription = models?.Subscription || model('Subscription', subscriptionSchema);
// const AnonymousUser = model('AnonymousUser', anonymousUserSchema);
// // const AnonymousUser = models.AnonymousUser || model('AnonymousUser', anonymousUserSchema);
// const FlightItinerary = model('FlightItinerary', flightItinerarySchema);
// // const FlightItinerary = models.FlightItinerary || model('FlightItinerary', flightItinerarySchema);
// const FlightSegment = model('FlightSegment', flightSegmentSchema);
// // const FlightSegment = models.FlightSegment || model('FlightSegment', flightSegmentSchema);
// const FlightSeat = model('FlightSeat', flightSeatsSchema);
// // const FlightSeat = models.FlightSeat || model('FlightSeat', flightSeatsSchema);
// const Account = model('Account', accountsSchema);
// // const Account = models.Account || model('Account', accountsSchema);
// const Airline = model('Airline', airlineSchema);
// // const Airline = models.Airline || model('Airline', airlineSchema);
// const AirlineFlightPrice = model('AirlineFlightPrice', airlineFlightPricesSchema);
// // const AirlineFlightPrice = models.AirlineFlightPrice || model('AirlineFlightPrice', airlineFlightPricesSchema);
// const Airport = model('Airport', airportSchema);
// // const Airport = models.Airport || model('Airport', airportSchema);
// const FlightBooking = model('FlightBooking', flightBookingSchema);
// // const FlightBooking = models.FlightBooking || model('FlightBooking', flightBookingSchema);
// const FlightReview = model('FlightReview', flightReviewSchema);
// // const FlightReview = models.FlightReview || model('FlightReview', flightReviewSchema);
// const FlightPayment = model('FlightPayment', flightPaymentSchema);
// // const FlightPayment = models.FlightPayment || model('FlightPayment', flightPaymentSchema);
// const HotelBooking = model('HotelBooking', hotelBookingSchema);
// // const HotelBooking = models.HotelBooking || model('HotelBooking', hotelBookingSchema);
// const HotelRoom = model('HotelRoom', hotelRoomSchema);
// // const HotelRoom = models.HotelRoom || model('HotelRoom', hotelRoomSchema);
// const HotelGuest = model('HotelGuest', hotelGuestSchema);
// // const HotelGuest = models.HotelGuest || model('HotelGuest', hotelGuestSchema);
// const Hotel = model('Hotel', hotelSchema);
// // const Hotel = models.Hotel || model('Hotel', hotelSchema);
// const HotelPayment = model('HotelPayment', hotelPaymentSchema);
// // const HotelPayment = models.HotelPayment || model('HotelPayment', hotelPaymentSchema);
// const Passenger = model('Passenger', passengerSchema);
// // const Passenger = models.Passenger || model('Passenger', passengerSchema);
// const HotelReview = model('HotelReview', hotelReviewSchema);
// // const HotelReview = models.HotelReview || model('HotelReview', hotelReviewSchema);
// const Verification_Token = model('Verification_Token', verificationTokensSchema);
// // const Verification_Token = models.Verification_Token || model('Verification_Token', verificationTokensSchema);
// const Session = model('Session', sessionSchema);
// // const Session = models.Session || model('Session', sessionSchema);
// const Seat = model('Seat', seatSchema);
// // const Seat = models.Seat || model('Seat', seatSchema);
// const Airplane = model('Airplane', airplaneSchema);
// // const Airplane = models.Airplane || model('Airplane', airplaneSchema);
// const PromoCode = model('PromoCode', promoCodeSchema);
// // const PromoCode = models.PromoCode || model('PromoCode', promoCodeSchema);
// const SearchHistory = model('SearchHistory', searchHistorySchema);
// // const SearchHistory = models.SearchHistory || model('SearchHistory', searchHistorySchema);
// const WebsiteReview = model('WebsiteReview', websiteReviewSchema);
// // const WebsiteReview = models.WebsiteReview || model('WebsiteReview', websiteReviewSchema);
// const WebsiteConfig = model('WebsiteConfig', websiteConfigSchema);
// // const WebsiteConfig = models.WebsiteConfig || model('WebsiteConfig', websiteConfigSchema);
// const Analytic = model('Analytic', analyticsSchema);
// // const Analytic = models.Analytic || model('Analytic', analyticsSchema);
// // ------------------------------------------------------------------
// // 4. Combine all models into a single object
// // ------------------------------------------------------------------
// // ------------------------------------------------------------------
// // 5. Export each model individually for convenience
// // ------------------------------------------------------------------
// // Export all models as named exports
//  const dataModels = {
//   Comment: CommentModel,
//   CommentReaction: CommentReactionModel,
//   Customer: CustomerModel,
//   Invoice: InvoiceModel,
//   PasswordResetToken: PasswordResetTokenModel,
//   Post: PostModel,
//   PostReaction: PostReactionModel,
//   Product: ProductModel,
//   Revenue: RevenueModel,
//   VerificationToken: VerificationTokenModel,
//   User,
//   Subscription,
//   AnonymousUser,
//   FlightItinerary,
//   FlightSegment,
//   FlightSeat,
//   Account,
//   Airline,
//   AirlineFlightPrice,
//   Airport,
//   FlightBooking,
//   FlightReview,
//   FlightPayment,
//   HotelBooking,
//   HotelRoom,
//   HotelGuest,
//   Hotel,
//   HotelPayment,
//   Passenger,
//   HotelReview,
//   Verification_Token,
//   Session,
//   Seat,
//   Airplane,
//   PromoCode,
//   SearchHistory,
//   WebsiteReview,
//   WebsiteConfig,
//   Analytic,
// };

// export default dataModels;

import mongoose from 'mongoose';
// Import all schemas (old project + base)
import {
  subscriptionSchema,
  userSchema,
  anonymousUserSchema,
  flightItinerarySchema,
  flightSegmentSchema,
  flightSeatsSchema,
  accountsSchema,
  airlineSchema,
  airlineFlightPricesSchema,
  airportSchema,
  flightBookingSchema,
  flightReviewSchema,
  flightPaymentSchema,
  hotelBookingSchema,
  hotelRoomSchema,
  hotelGuestSchema,
  hotelSchema,
  hotelReviewSchema,
  hotelPaymentSchema,
  passengerSchema,
  verificationTokenSchema, // from old project (password reset?)
  sessionSchema,
  seatSchema,
  airplaneSchema,
  promoCodeSchema,
  searchHistorySchema,
  websiteReviewSchema,
  websiteConfigSchema,
  analyticsSchema,
  // Base project schemas
  postSchema,
  commentSchema,
  commentReactionSchema,
  postReactionSchema,
  customerSchema,
  invoiceSchema,
  revenueSchema,
  productSchema,
  passwordResetTokenSchema,
} from '../schema';

// Helper to get or create model
const getModel = (name: string, schema: mongoose.Schema) => {
  return mongoose.models[name] || mongoose.model(name, schema);
};

// Export all models
export const Subscription = getModel('Subscription', subscriptionSchema);
export const User = getModel('User', userSchema);
export const AnonymousUser = getModel('AnonymousUser', anonymousUserSchema);
export const FlightItinerary = getModel('FlightItinerary', flightItinerarySchema);
export const FlightSegment = getModel('FlightSegment', flightSegmentSchema);
export const FlightSeat = getModel('FlightSeat', flightSeatsSchema);
export const Account = getModel('Account', accountsSchema);
export const Airline = getModel('Airline', airlineSchema);
export const AirlineFlightPrice = getModel('AirlineFlightPrice', airlineFlightPricesSchema);
export const Airport = getModel('Airport', airportSchema);
export const FlightBooking = getModel('FlightBooking', flightBookingSchema);
export const FlightReview = getModel('FlightReview', flightReviewSchema);
export const FlightPayment = getModel('FlightPayment', flightPaymentSchema);
export const HotelBooking = getModel('HotelBooking', hotelBookingSchema);
export const HotelRoom = getModel('HotelRoom', hotelRoomSchema);
export const HotelGuest = getModel('HotelGuest', hotelGuestSchema);
export const Hotel = getModel('Hotel', hotelSchema);
export const HotelPayment = getModel('HotelPayment', hotelPaymentSchema);
export const Passenger = getModel('Passenger', passengerSchema);
export const HotelReview = getModel('HotelReview', hotelReviewSchema);
export const Verification_Token = getModel('Verification_Token', verificationTokenSchema);
export const Session = getModel('Session', sessionSchema);
export const Seat = getModel('Seat', seatSchema);
export const Airplane = getModel('Airplane', airplaneSchema);
export const PromoCode = getModel('PromoCode', promoCodeSchema);
export const SearchHistory = getModel('SearchHistory', searchHistorySchema);
export const WebsiteReview = getModel('WebsiteReview', websiteReviewSchema);
export const WebsiteConfig = getModel('WebsiteConfig', websiteConfigSchema);
export const Analytic = getModel('Analytic', analyticsSchema);

// Base project models
export const Post = getModel('Post', postSchema);
export const Comment = getModel('Comment', commentSchema);
export const CommentReaction = getModel('CommentReaction', commentReactionSchema);
export const PostReaction = getModel('PostReaction', postReactionSchema);
export const Customer = getModel('Customer', customerSchema);
export const Invoice = getModel('Invoice', invoiceSchema);
export const Revenue = getModel('Revenue', revenueSchema);
export const Product = getModel('Product', productSchema);
export const PasswordResetToken = getModel('PasswordResetToken', passwordResetTokenSchema);


// Default export for convenience
export default {
  Subscription,
  User,
  AnonymousUser,
  FlightItinerary,
  FlightSegment,
  FlightSeat,
  Account,
  Airline,
  AirlineFlightPrice,
  Airport,
  FlightBooking,
  FlightReview,
  FlightPayment,
  HotelBooking,
  HotelRoom,
  HotelGuest,
  Hotel,
  HotelPayment,
  Passenger,
  HotelReview,
  Verification_Token,
  Session,
  Seat,
  Airplane,
  PromoCode,
  SearchHistory,
  WebsiteReview,
  WebsiteConfig,
  Analytic,
  Post,
  Comment,
  CommentReaction,
  PostReaction,
  Customer,
  Invoice,
  Revenue,
  Product,
  PasswordResetToken,
};
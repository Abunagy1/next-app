// "use server";
// import mongoose from "mongoose";
// if (mongoose.connection.readyState === 0) {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI);
//   } catch (e) {
//     console.log(e.message);
//     throw e;
//   }
// }
// import subscribeAction from "./subscribeAction";
// import writeReviewAction from "./writeReviewAction";
// import { signUpAction } from "./signUpAction";
// import trackUserFlightClass from "./trackUserFlightClass";
// import {
//   updatePasswordAction,
//   updateProfilePictureAction,
//   updateCoverPhotoAction,
//   updateNameAction,
//   updatePhoneAction,
//   updateAddressAction,
//   updateDateOfBirthAction,
//   addNewEmailAction,
//   updateEmailAction,
//   deletePaymentCardAction,
// } from "./updateProfileActions";
// import likeOrUnlikeAction from "./likeOrUnlikeAction";
// import sendPassResetCodeAction from "./sendPassResetCodeAction";
// import { sendEmailConfimationLinkAction } from "./sendEmailActions";
// import resendCodeAction from "./resendCodeAction";
// import setNewPasswordAction from "./setNewPasswordAction";
// import flagReviewAction from "./flagReviewAction";
// import {
//   authenticateAction,
//   authenticateWithFacebook,
//   authenticateWithGoogle,
// } from "./authenticateActions";
// import signOutAction from "./signOutAction";
// import {
//   getCookiesAction,
//   deleteCookiesAction,
//   setCookiesAction,
// } from "./cookiesActions";
// import deleteAccountAction from "./deleteAccountAction";
// import { validateSearchStateAction } from "./validateSearchstateAction";
// export {
//   subscribeAction,
//   writeReviewAction,
//   signUpAction,
//   trackUserFlightClass,
//   updateCoverPhotoAction,
//   updateProfilePictureAction,
//   likeOrUnlikeAction,
//   sendPassResetCodeAction,
//   sendEmailConfimationLinkAction,
//   resendCodeAction,
//   updateNameAction,
//   setNewPasswordAction,
//   flagReviewAction,
//   authenticateAction,
//   authenticateWithFacebook,
//   authenticateWithGoogle,
//   signOutAction,
//   setCookiesAction,
//   deleteCookiesAction,
//   getCookiesAction,
//   updatePasswordAction,
//   updatePhoneAction,
//   updateAddressAction,
//   updateDateOfBirthAction,
//   addNewEmailAction,
//   updateEmailAction,
//   deleteAccountAction,
//   deletePaymentCardAction,
//   validateSearchStateAction,
// };
'use server';
// Core actions
export { default as subscribeAction } from './subscribeAction';
export { signUpAction } from './signUpAction';
export { default as trackUserFlightClass } from './trackUserFlightClass';
export { default as sendPassResetCodeAction } from './sendPassResetCodeAction';
export { sendEmailConfimationLinkAction } from './sendEmailActions';
export { default as resendCodeAction } from './resendCodeAction';
export { default as setNewPasswordAction } from './setNewPasswordAction';
export { default as signOutAction } from './signOutAction';
export { deleteAccountAction } from './deleteAccountAction';
// Profile update actions
export {
  updateNameAction,
  updateEmailAction,
  addNewEmailAction,
  updatePhoneAction,
  updateAddressAction,
  updateDateOfBirthAction,
  updatePasswordAction,
  updateProfilePictureAction,
  updateCoverPhotoAction,
  deletePaymentCardAction,
} from './updateProfileActions';
// Authentication actions (only credentials)
// ... other exports
export {
  authenticateAction,
  authenticateWithFacebook,
  authenticateWithGoogle,
} from './authenticateActions';

// Cookie actions
export {
  getCookiesAction,
  deleteCookiesAction,
  setCookiesAction,
} from './cookiesActions';

// Review actions
export { default as writeReviewAction } from './writeReviewAction';
export { default as flagReviewAction } from './flagReviewAction';
export { default as submitWebsiteReviewsAction } from './submitWebsiteReviewsAction';

// Booking actions
export { flightReserveAction } from './flightReserveAction';
export { default as hotelRoomReserveAction } from './hotelRoomReserveAction';
export { default as cancelFlightBookingAction } from './cancelFlightBookingAction';
export { default as cancelHotelBookingAction } from './cancelHotelBookingAction';
export { default as requestRefundFlightBookingAction } from './requestRefundFlightBookingAction';
export { default as requestRefundHotelBookingAction } from './requestRefundHotelBookingAction';
export { confirmHotelBookingCashAction } from './confirmHotelBookingAction';

// Like / bookmark action
export { default as likeOrUnlikeAction } from './likeOrUnlikeAction';

// Search history action
export { default as addToSearchHistoryAction } from './addToSearchHistoryAction';

// Validation actions (no DB)
export { default as validatePassengersDetailsAction } from './validatePassengerDetailsAction';
export { default as validatePassengersPreferencesAction } from './validatePassengersPreferencesAction';
export { validateSearchStateAction } from './validateSearchstateAction';

// Note: authenticateWithFacebook and authenticateWithGoogle are not implemented
// in the refactored authenticateActions.ts. If needed, they must be added separately.
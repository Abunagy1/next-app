import emailConfirmation from './compiled/emailConfirmation.hbs';
import flightBookingConfirmed from "./compiled/flightBookingConfirmed.hbs";
import newUserSignup from "./compiled/newUserSignup.hbs";
import passwordResetVerification from "./compiled/passwordResetVerification.hbs";
/**
 * @typedef {Object} BrandingInfo
 * @property {string} logoImageUrl
 * @property {string} baseUrl
 */
/**
 * @typedef {Object} SocialIcons
 * @property {string} facebookIconUrl
 * @property {string} twitterIconUrl
 * @property {string} instagramIconUrl
 * @property {string} youtubeIconUrl
 */
/**
 * @typedef {Object} SocialLinks
 * @property {string} facebook
 * @property {string} twitter
 * @property {string} instagram
 * @property {string} youtube
 */
/**
 * @typedef {Object} FooterLink
 * @property {string} url
 * @property {string} text
 */
/**
 * @typedef {Object} FooterInfo
 * @property {FooterLink[]} footerLinks
 * @property {string} companyAddress
 * @property {string} currentYear
 */
/**
 * @typedef {Object} EmailConfirmation
 * @property {BrandingInfo} branding - Branding data (logo, name, base URL)
 * @property {SocialIcons} socialIcons - Social media icon URLs
 * @property {SocialLinks} socialLinks - Social media links
 * @property {FooterInfo} footer - Footer metadata
 * @property {{verificationUrl: string, expirationTime: string}} main - Verification data
 * @returns {string}
 */
/**
 * @typedef {Object} Segment
 * @property {string} flightNumber
 * @property {string} airlineName
 * @property {string} departureDateTime
 * @property {string} departureAirportName
 * @property {string} departureAirportIataCode
 * @property {string} arrivalDateTime
 * @property {string} arrivalAirportName
 * @property {string} arrivalAirportIataCode
 * @property {number} totalDurationMinutes
 * @property {string} airplaneModelName
 */
/**
 * @typedef {Object} FlightDetails
 * @property {string} itineraryFlightNumber
 * @property {Segment[]} segments
 */
/**
 * @typedef {Object} Passengers
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} passengerType
 * @property {string} seatNumber
 * @property {string} seatClass
 */
/**
 * @typedef {Object} PaymentMethod
 * @property {string} brand
 * @property {string} last4
 * @property {string} receiptUrl
 */
/**
 * @typedef {Object} BookingDetails
 * @property {string} pnrCode
 * @property {string} userTimeZone
 * @property {Passengers} passengers
 * @property {string} ticketType
 * @property {string} fareClass
 * @property {PaymentMethod} paymentMethod
 * @property {string} totalFare
 * @property {string} currency
 */
/**
 * @typedef {Object} FlightBookingConfirmed
 * @property {BrandingInfo} branding - Branding data (logo, name, base URL)
 * @property {SocialIcons} socialIcons - Social media icon URLs
 * @property {SocialLinks} socialLinks - Social media links
 * @property {FooterInfo} footer - Footer metadata
 * @property {{bookingDetails: BookingDetails, flightDetails: FlightDetails, manageBookingUrl: string, downloadTicketUrl: string }} main - Flight data
 * @returns {string}
 */
/**
 * @typedef {Object} NewUserSignup
 * @property {BrandingInfo} branding - Branding data (logo, name, base URL)
 * @property {SocialIcons} socialIcons - Social media icon URLs
 * @property {SocialLinks} socialLinks - Social media links
 * @property {FooterInfo} footer - Footer metadata
 * @property {{firstName: string}} main - Flight data
 * @returns {string}
 */
/**
 * @typedef {Object} PasswordResetVerification
 * @property {BrandingInfo} branding - Branding data (logo, name, base URL)
 * @property {SocialIcons} socialIcons - Social media icon URLs
 * @property {SocialLinks} socialLinks - Social media links
 * @property {FooterInfo} footer - Footer metadata
 * @property {{code: string, expirationTime: string}} main - Verification data
 * @returns {string}
 */
/**
 * @type {(data: EmailConfirmation) => string}
 */
export const emailConfirmationEmailTemplate = emailConfirmation;

/**
 * @type {(data: FlightBookingConfirmed) => string}
 */
export const flightBookingConfirmedEmailTemplate = flightBookingConfirmed;

/**
 * @type {(data: NewUserSignup) => string}
 */
export const newUserSignupEmailTemplate = newUserSignup;

/**
 * @type {(data: PasswordResetVerification) => string}
 */
export const passwordResetVerificationEmailTemplate = passwordResetVerification;


// import emailConfirmation from './compiled/emailConfirmation.hbs';
// import flightBookingConfirmed from './compiled/flightBookingConfirmed.hbs';
// import newUserSignup from './compiled/newUserSignup.hbs';
// import passwordResetVerification from './compiled/passwordResetVerification.hbs';

// // Type definitions for template data (simplified)
// export interface BrandingInfo {
//   logoImageUrl: string;
//   baseUrl: string;
// }

// export interface SocialIcons {
//   facebookIconUrl: string;
//   twitterIconUrl: string;
//   instagramIconUrl: string;
//   youtubeIconUrl: string;
// }

// export interface SocialLinks {
//   facebook: string;
//   twitter: string;
//   instagram: string;
//   youtube: string;
// }

// export interface FooterLink {
//   url: string;
//   text: string;
// }

// export interface FooterInfo {
//   footerLinks: FooterLink[];
//   companyAddress: string;
//   currentYear: string;
// }

// export interface EmailConfirmationData {
//   branding: BrandingInfo;
//   socialIcons: SocialIcons;
//   socialLinks: SocialLinks;
//   footer: FooterInfo;
//   main: {
//     verificationUrl: string;
//     expirationTime: string;
//   };
// }

// export interface FlightBookingConfirmedData {
//   branding: BrandingInfo;
//   socialIcons: SocialIcons;
//   socialLinks: SocialLinks;
//   footer: FooterInfo;
//   main: {
//     manageBookingUrl: string;
//     downloadTicketUrl: string;
//     flightDetails: any;
//     bookingDetails: any;
//   };
// }

// export interface NewUserSignupData {
//   branding: BrandingInfo;
//   socialIcons: SocialIcons;
//   socialLinks: SocialLinks;
//   footer: FooterInfo;
//   main: {
//     firstName: string;
//   };
// }

// export interface PasswordResetVerificationData {
//   branding: BrandingInfo;
//   socialIcons: SocialIcons;
//   socialLinks: SocialLinks;
//   footer: FooterInfo;
//   main: {
//     code: string;
//     expirationTime: string;
//   };
// }

// export const emailConfirmationEmailTemplate = emailConfirmation as (
//   data: EmailConfirmationData
// ) => string;

// export const flightBookingConfirmedEmailTemplate = flightBookingConfirmed as (
//   data: FlightBookingConfirmedData
// ) => string;

// export const newUserSignupEmailTemplate = newUserSignup as (
//   data: NewUserSignupData
// ) => string;

// export const passwordResetVerificationEmailTemplate = passwordResetVerification as (
//   data: PasswordResetVerificationData
// ) => string;
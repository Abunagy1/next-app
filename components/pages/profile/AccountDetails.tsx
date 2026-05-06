import { TabContentMockup } from "@/components/pages/profile/ui/TabContentMockup";
import { ChangeNamePopup } from "@/components/pages/profile/ui/changeNamePopup";
import { VerifyEmailBtn } from "./ui/VerifyEmailBtn";
import { cookies } from "next/headers";
import { ChangePasswordPopup } from "./ui/ChangePasswordPopup";
import { ChangePhonePopup } from "./ui/ChangePhonePopup";
import { ChangeAddressPopup } from "./ui/ChangeAddressPopup";
import { ChangeDateOfBirthPopup } from "./ui/ChangeDateOfBirthPopup";
import { ChangeEmailPopup } from "./ui/ChangeEmailPopup";
import { AddAnotherEmailPopup } from "./ui/AddAnotherEmailPopup";
import { ChangeCityPopup } from "./ui/ChangeCityPopup";
import { ChangeAboutPopup } from "./ui/ChangeAboutPopup";

interface UserEmail {
  email: string;
  primary: boolean;
  emailVerifiedAt: string | null;
  inVerification?: boolean;
}

interface PhoneNumber {
  number: string;
  dialCode: string;
  primary?: boolean;
  verifiedAt?: string | null;
  inVerification?: boolean;
}

export interface UnifiedUserDetails {
  id?: string;
  name?: string;
  email: string;
  email_verified?: boolean;
  image?: string | null;
  phone?: string | null;
  city?: string | null;
  about?: string | null;
  birth_date?: string | Date | null;
  role: 'admin' | 'user';
  firstName: string;
  lastName: string;
  emails?: UserEmail[];
  phoneNumbers?: PhoneNumber[];
  address?: string | null;
  coverImage?: string | null;
  customerId?: string | null;
  emailVerifiedAt?: string | Date | null;
  flights?: any;
  hotels?: any;
  rewardPoints?: any;
  dateOfBirth?: string | Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AccountDetailsProps {
  userDetails: UnifiedUserDetails;
}

export async function AccountDetails({ userDetails }: AccountDetailsProps) {
  const cookieStore = await cookies();
  const sendAgainAt = cookieStore.get("sai")?.value;

  let emails = userDetails.emails ?? [];
  if (typeof emails === 'string') {
    try { emails = JSON.parse(emails); } catch { emails = []; }
  }
  if (!Array.isArray(emails)) emails = [];

  const accountDetails = {
    name: `${userDetails.firstName} ${userDetails.lastName}`,
    emails: emails,
    phone: userDetails.phoneNumbers ?? [],
    address: userDetails.address,
    dateOfBirth: userDetails.birth_date || userDetails.dateOfBirth,
    city: userDetails.city,
    about: userDetails.about,
    role: userDetails.role,
  };

  return (
    <TabContentMockup title="Account">
      <div className="rounded-2 flex flex-col gap-3 bg-white p-5 shadow-md dark:bg-gray-800">
        {/* Name */}
        <div>
          <h4 className="text-gray-500 dark:text-gray-400 font-medium">Name</h4>
          <div className="flex items-center justify-between">
            <p className="text-[1.25rem] font-semibold dark:text-white">
              {accountDetails.name}
            </p>
            <ChangeNamePopup firstname={userDetails.firstName} lastname={userDetails.lastName} />
          </div>
        </div>

        {/* Emails */}
        <div>
          <h4 className="text-gray-500 dark:text-gray-400 font-medium">Email</h4>
          <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              {emails.map((item) => (
                <div key={item.email} className="flex flex-wrap items-center gap-1 text-[1.25rem] font-semibold dark:text-white">
                  <span>{item.email}</span>
                  {item.primary && <span className="text-sm">(primary)</span>}
                  {item.emailVerifiedAt === null && (
                    <VerifyEmailBtn email={item.email} sendAgainAt={sendAgainAt} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <AddAnotherEmailPopup />
              <ChangeEmailPopup emails={emails} />
            </div>
          </div>
        </div>

        {/* Password */}
        <div>
          <h4 className="text-gray-500 dark:text-gray-400 font-medium">Password</h4>
          <div className="flex items-center justify-between">
            <p className="text-[1.25rem] font-semibold dark:text-white">•••••••</p>
            <ChangePasswordPopup />
          </div>
        </div>

        {/* Phone */}
        <div>
          <h4 className="text-gray-500 dark:text-gray-400 font-medium">Phone</h4>
          <div className="flex items-center justify-between">
            <p className="text-[1.25rem] font-semibold dark:text-white">
              {accountDetails.phone.length
                ? `${accountDetails.phone[0].dialCode} ${accountDetails.phone[0].number}`
                : "N/A"}
            </p>
            <ChangePhonePopup />
          </div>
        </div>

        {/* Address */}
        <div>
          <h4 className="text-gray-500 dark:text-gray-400 font-medium">Address</h4>
          <div className="flex items-center justify-between">
            <p className="text-[1.25rem] font-semibold dark:text-white">
              {accountDetails.address ?? "N/A"}
            </p>
            <ChangeAddressPopup />
          </div>
        </div>

        {/* Date of birth */}
        <div>
          <h4 className="text-gray-500 dark:text-gray-400 font-medium">Date of birth</h4>
          <div className="flex items-center justify-between">
            <p className="text-[1.25rem] font-semibold dark:text-white">
              {accountDetails.dateOfBirth
                ? new Date(accountDetails.dateOfBirth).toLocaleDateString()
                : 'N/A'}
            </p>
            <ChangeDateOfBirthPopup />
          </div>
        </div>

        {/* City */}
        <div>
          <h4 className="text-gray-500 dark:text-gray-400 font-medium">City</h4>
          <div className="flex items-center justify-between">
            <p className="text-[1.25rem] font-semibold dark:text-white">
              {accountDetails.city ?? 'N/A'}
            </p>
            <ChangeCityPopup />
          </div>
        </div>

        {/* About */}
        <div>
          <h4 className="text-gray-500 dark:text-gray-400 font-medium">About</h4>
          <div className="flex items-center justify-between">
            <p className="text-[1.25rem] font-semibold dark:text-white">
              {accountDetails.about ?? 'N/A'}
            </p>
            <ChangeAboutPopup />
          </div>
        </div>

        {/* Role – only for admins */}
        {accountDetails.role === 'admin' && (
          <div>
            <h4 className="text-gray-500 dark:text-gray-400 font-medium">Role</h4>
            <p className="text-[1.25rem] font-semibold dark:text-white">{accountDetails.role}</p>
          </div>
        )}
      </div>
    </TabContentMockup>
  );
}
'use client';
import { useState, useEffect } from 'react';
import { Input } from '@/components/local-ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { UploadProfilePicture } from '../../profile/ui/UploadProfilePicture';
import Image from 'next/image';
import { AddAnotherEmailPopup } from '../../profile/ui/AddAnotherEmailPopup';
import { Edit, Save, X } from 'lucide-react';
import {
  updateAddressAction,
  updateDateOfBirthAction,
  updateNameAction,
  updatePhoneAction,
  updateCityAction,
  updateAboutAction,
} from '@/app/lib/actions/updateProfileActions';
import { toast } from 'sonner';

interface PhoneNumber {
  dialCode: string;
  number: string;
}

interface Email {
  email: string;
  primary: boolean;
  emailVerifiedAt?: string | null;
}

export interface ProfileUserDetails {
  firstName: string;
  lastName: string;
  image?: string;
  phoneNumbers?: PhoneNumber[];
  birth_date?: string | null;
  address?: string | null;
  city?: string | null;
  about?: string | null;
  emails: Email[];
}

interface ProfileSettingsProps {
  userDetails: ProfileUserDetails;
}


export default function ProfileSettings({ userDetails }: ProfileSettingsProps) {
  let emails = userDetails.emails;
  if (typeof emails === 'string') {
    try { emails = JSON.parse(emails); } catch { emails = []; }
  }
  if (!Array.isArray(emails)) emails = [];

  // Then use `emails` instead of `userDetails.emails` everywhere below.
  const [isPersonalInfoEditing, setIsPersonalInfoEditing] = useState(false);
  const [personalInfoErrors, setPersonalInfoErrors] = useState<Record<string, string>>({});

  const userData = {
    firstName: userDetails?.firstName,
    lastName: userDetails?.lastName,
    phone: {
      dialCode: userDetails?.phoneNumbers?.[0]?.dialCode || '',
      number: userDetails?.phoneNumbers?.[0]?.number || '',
    },
    avatar: userDetails.image,  // it should be image
    dob: userDetails.birth_date || 'N/A',
    address: userDetails.address || 'N/A',
    city: userDetails.city || '',
    about: userDetails.about || '',
    preferredClass: 'business',
    language: 'en',
    emails: emails,
    primaryEmail: emails.find((email) => email.primary),
    otherEmails: emails.filter((email) => !email.primary),
    emailNotifications: true,
    smsNotifications: false,
  };

  const [formDataState, setFormDataState] = useState({
    firstName: '',
    lastName: '',
    phone: { dialCode: '', number: '' },
    dob: '',
    address: '',
    city: '',
    about: '',
    emailNotifications: true,
    smsNotifications: false,
  });

  useEffect(() => {
    queueMicrotask(() => {
      setFormDataState({
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: { dialCode: userData.phone.dialCode, number: userData.phone.number },
        dob: userData.dob,
        address: userData.address,
        city: userData.city,
        about: userData.about,
        emailNotifications: userData.emailNotifications,
        smsNotifications: userData.smsNotifications,
      });
    });
  }, [JSON.stringify(userDetails)]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormDataState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const parsed = JSON.parse(e.target.value);
    setFormDataState((prev) => ({
      ...prev,
      phone: parsed,
    }));
  }

  function handleDateOfBirthChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormDataState((prev) => ({
      ...prev,
      dob: e.target.value,
    }));
  }

  async function handleSave(e: React.MouseEvent<HTMLButtonElement>) {
    e.currentTarget.disabled = true;
    const promises: Promise<any>[] = [];
    const formDataObj = new FormData();

    if (formDataState.firstName !== userData.firstName || formDataState.lastName !== userData.lastName) {
      formDataObj.append('firstName', formDataState.firstName);
      formDataObj.append('lastName', formDataState.lastName);
      promises.push(updateNameAction(null, formDataObj));
    }
    if (formDataState.phone.dialCode !== userData.phone.dialCode || formDataState.phone.number !== userData.phone.number) {
      const phoneForm = new FormData();
      phoneForm.append('number', formDataState.phone.number);
      phoneForm.append('dialCode', formDataState.phone.dialCode);
      promises.push(updatePhoneAction(null, phoneForm));
    }
    if (formDataState.dob !== userData.dob) {
      const dobForm = new FormData();
      dobForm.append('birth_date', formDataState.dob);  // check that
      promises.push(updateDateOfBirthAction(null, dobForm));
    }
    if (formDataState.address !== userData.address) {
      const addrForm = new FormData();
      addrForm.append('address', formDataState.address);
      promises.push(updateAddressAction(null, addrForm));
    }
    if (formDataState.city !== (userData.city || '')) {
      const cityForm = new FormData();
      cityForm.append('city', formDataState.city);
      promises.push(updateCityAction(null, cityForm));
    }
    if (formDataState.about !== (userData.about || '')) {
      const aboutForm = new FormData();
      aboutForm.append('about', formDataState.about);
      promises.push(updateAboutAction(null, aboutForm));
    }
    const responses = await Promise.all(promises);
    let errors: Record<string, string> = {};
    responses.forEach((res) => {
      if (res?.error) {
        errors = { ...errors, ...res.error };
      }
      if (res?.success === true && res?.message) {
        toast.success(res.message);
      }
    });

    if (Object.keys(errors).length === 0) {
      setIsPersonalInfoEditing(false);
    }
    setPersonalInfoErrors(errors);
    e.currentTarget.disabled = false;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-3">
      {/* Profile Picture */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Profile Picture</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-gray-300">
            {userData.avatar ? (
              <>
                <div className="h-28 w-28 overflow-hidden rounded-full">
                  <Image width={100} height={100} src={userData.avatar} alt="avatar" className="h-full w-full object-cover" />
                </div>
                <UploadProfilePicture />
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xl font-semibold text-gray-400">
                {userData.firstName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Personal Information */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold dark:text-white">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {isPersonalInfoEditing ? (
              <>
                <Input
                  name="firstName"
                  label="First Name"
                  defaultValue={formDataState.firstName}
                  error={personalInfoErrors?.firstName}
                  onChange={handleChange}
                  placeholder="John"
                />
                <Input
                  name="lastName"
                  label="Last Name"
                  defaultValue={formDataState.lastName}
                  error={personalInfoErrors?.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                />
                <Input
                  type="tel"
                  name="phone"
                  label="Phone Number"
                  value={JSON.stringify(formDataState.phone)} // ✅ Serialize to string
                  error={personalInfoErrors?.phone}
                  onChange={handlePhoneChange as any} // ✅ Type assertion
                  placeholder="Phone Number"
                  dialCodePlaceholder="+XXX"
                />
                <Input
                  type="date"
                  name="dateOfBirth"
                  label="Date of Birth"
                  error={personalInfoErrors?.dateOfBirth}
                  value={formDataState.dob}
                  minDate={new Date(1900, 0, 1)}
                  maxDate={new Date()}
                  onChange={handleDateOfBirthChange as any} // ✅ Type assertion
                />
                <Input
                  type="textarea"
                  name="address"
                  label="Address"
                  value={formDataState.address}
                  error={personalInfoErrors?.address}
                  onChange={handleChange}
                  placeholder="Address"
                  className="col-span-2"
                />
                {/* in the editing mode */}
                <Input
                  name="city"
                  label="City"
                  value={formDataState.city}
                  onChange={handleChange}
                  error={personalInfoErrors?.city}
                  placeholder="Your city"
                />
                <Input
                  name="about"
                  label="About"
                  type="textarea"
                  value={formDataState.about}
                  onChange={handleChange}
                  error={personalInfoErrors?.about}
                  placeholder="Tell something about yourself"
                  className="col-span-2"
                />
              </>
            ) : (
              <>
                <div className="text-sm font-semibold">
                  <p className="text-muted-foreground dark:text-gray-400">First Name: </p>
                  <p className="dark:text-white">{userData.firstName}</p>
                </div>
                <div className="text-sm font-semibold">
                  <p className="text-muted-foreground dark:text-gray-400">Last Name: </p>
                  <p className="dark:text-white">{userData.lastName}</p>
                </div>
                <div className="text-sm font-semibold">
                  <p className="text-muted-foreground dark:text-gray-400">Phone: </p>
                  <p className="dark:text-white">
                    {userData.phone.dialCode
                      ? `${userData.phone.dialCode} ${userData.phone.number}`
                      : 'N/A'}
                  </p>
                </div>
                <div className="text-sm font-semibold">
                  <p className="text-muted-foreground dark:text-gray-400">Date of Birth: </p>
                  {/* <p className="dark:text-white">{userData.dob || 'N/A'}</p> */}
                  <p>{userData.dob ? new Date(userData.dob).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="text-sm font-semibold">
                  <p className="text-muted-foreground dark:text-gray-400">Address: </p>
                  <p className="dark:text-white">{userData.address || 'N/A'}</p>
                </div>
                <div className="text-sm font-semibold">
                  <p className="text-muted-foreground dark:text-gray-400">City: </p>
                  <p className="dark:text-white">{userData.city || 'N/A'}</p>
                </div>
                <div className="text-sm font-semibold col-span-2">
                  <p className="text-muted-foreground dark:text-gray-400">About: </p>
                  <p className="dark:text-white">{userData.about || 'N/A'}</p>
                </div>
              </>
            )}
          </div>
          <div className="mt-3 flex items-center justify-end">
            {isPersonalInfoEditing ? (
              <div className="space-x-3">
                <Button size="lg" onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
                <Button size="lg" variant="outline" onClick={() => setIsPersonalInfoEditing(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            ) : (
              <Button size="lg" onClick={() => setIsPersonalInfoEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Methods */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Contact Methods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground dark:text-gray-400">Primary Email (read-only)</label>
            <p className="font-medium">{userData?.primaryEmail?.email}</p>
          </div>
          {userData.otherEmails.length > 0 && (
            <div>
              <label className="text-sm text-muted-foreground dark:text-gray-400">Additional Emails</label>
              <div className="font-medium">
                {userData.otherEmails.map((email) => (
                  <p key={email.email}>{email.email}</p>
                ))}
              </div>
            </div>
          )}
          <AddAnotherEmailPopup />
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold dark:text-white">Notification Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm text-muted-foreground dark:text-gray-400">Email Notifications</label>
            <Switch
              checked={formDataState.emailNotifications}
              onCheckedChange={(val) => setFormDataState((prev) => ({ ...prev, emailNotifications: val }))}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
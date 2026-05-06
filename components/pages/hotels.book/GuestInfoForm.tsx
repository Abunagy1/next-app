'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/local-ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, Option } from '@/components/local-ui/Select';
import validateGuestForm from '@/app/lib/zodSchemas/hotelGuestsFormValidation';
import { usePathname, useRouter } from 'next/navigation';
import { deepSanitize } from '@/app/lib/utils';

interface GuestInfoFormProps {
  guestsCount?: number;
  userDetails?: any;
  nextStep: string;
}

interface GuestData {
  firstName: string;
  lastName: string;
  email: string;
  phone: { dialCode: string; number: string };
  guestType: string;
  age: string;
  isPrimary: boolean;
}

export default function GuestInfoForm({ guestsCount = 1, userDetails, nextStep }: GuestInfoFormProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [errors, setErrors] = useState<Record<number, any>>({});
  const [guestData, setGuestData] = useState<GuestData[]>(() => {
    return Array.from({ length: guestsCount }, (_, index) => ({
      firstName: '',
      lastName: '',
      email: '',
      phone: { dialCode: '', number: '' },
      guestType: 'adult',
      age: '',
      isPrimary: index === 0,
    }));
  });

  const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'guestType', 'age', 'isPrimary'];
  const userDetailsDeps = JSON.stringify(userDetails || {});

  useEffect(() => {
    const userDetailsObj = JSON.parse(userDetailsDeps);
    const guests = JSON.parse(sessionStorage.getItem('guests') || '{}');
    const guestsErrors = JSON.parse(sessionStorage.getItem('guestsFormErrors') || '{}');
    const guestsArr = Object.values(guests);
    const sanitizedGuests = deepSanitize(guestsArr);
    const sanitizedErrors = deepSanitize(guestsErrors);

    queueMicrotask(() => {
      if (userDetailsObj) {
        const primaryPhone = userDetailsObj.phoneNumbers?.[0] || { dialCode: '', number: '' };
        const mapped = {
          firstName: userDetailsObj.firstName || '',
          lastName: userDetailsObj.lastName || '',
          email: userDetailsObj.email || '',
          phone: primaryPhone,
          guestType: 'adult',
        };
        setGuestData((prev) =>
          prev.map((g) => ({
            ...g,
            ...(g.isPrimary ? mapped : {}),
          }))
        );
      }
      setErrors(sanitizedErrors);
      if (sanitizedGuests.length > 0) {
        setGuestData((prev) =>
          prev.map((g, i) => ({ ...g, ...(sanitizedGuests[i] as GuestData) }))
        );
      }
    });
  }, [userDetailsDeps]);
  useEffect(() => {
    sessionStorage.removeItem('guests');
    sessionStorage.removeItem('guestsFormErrors');
  }, []);
  function handleChange(index: number, field: string, value: any) {
    const updated = [...guestData];
    if (allowedFields.includes(field)) {
      (updated[index] as any)[field] = value;
    }
    setGuestData(updated);
  }

  function handleCheckboxChange(index: number) {
    const updated = [...guestData];
    updated.forEach((g, i) => (g.isPrimary = i === index));
    setGuestData(updated);
  }

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    let key = 0;
    const err: Record<number, any> = {};
    const data: Record<number, any> = {};
    for (const guestForm of guestData) {
      const validate = validateGuestForm(guestForm);
      if (!validate.success) {
        err[key] = validate.errors;
      }
      if (validate.success) {
        data[key] = validate.data;
      }
      key++;
    }
    if (Object.keys(err).length) {
      setErrors(err);
      return;
    }
    sessionStorage.setItem('guests', JSON.stringify(data));
    sessionStorage.removeItem('guestsFormErrors');
    router.push(`${pathname}?tab=${nextStep}`);
  }

  return (
    <form onSubmit={handleContinue} className="space-y-6">
      {guestData.map((guest, index) => (
        <Card key={index} className="bg-muted shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
            <div className="col-span-full flex items-center gap-2">
              <h3 className="text-lg font-semibold">Guest {index + 1}</h3>
              {guest.isPrimary === false ? (
                <Button type="button" onClick={() => handleCheckboxChange(index)} className="rounded-full dark:bg-primary dark:hover:bg-primary/80 dark:text-white" size="sm">
                  Set as Primary
                </Button>
              ) : (
                <span className="ml-2 font-normal">(Primary)</span>
              )}
            </div>

            <div className="space-y-1.5">
              <Input
                id={`firstName-${index}`}
                label="First Name *"
                value={guest.firstName}
                onChange={(e) => handleChange(index, 'firstName', e.target.value)}
                error={errors[index]?.firstName}
              />
            </div>
            <div className="space-y-1.5">
              <Input
                id={`lastName-${index}`}
                label="Last Name *"
                value={guest.lastName}
                onChange={(e) => handleChange(index, 'lastName', e.target.value)}
                error={errors[index]?.lastName}
              />
            </div>
            {guest.isPrimary && (
              <div className="space-y-1.5">
                <Input
                  type="email"
                  name={`email-${index}`}
                  label="Email *"
                  value={guest.email}
                  onChange={(e) => handleChange(index, 'email', e.target.value)}
                  error={errors[index]?.email}
                />
              </div>
            )}
            {guest.isPrimary && (
              <div className="space-y-1.5">
                <Input
                  type="tel"
                  defaultPhoneValue={JSON.stringify(guest.phone)}
                  name={`phone-${index}`}
                  label="Phone *"
                  dialCodePlaceholder="+XXX"
                  onChange={(e) => {
                    handleChange(index, 'phone', JSON.parse(e.target.value));
                  }}
                  error={errors[index]?.phone}
                />
              </div>
            )}
            <div className="relative h-auto space-y-1.5">
              <span className="absolute -top-[8px] left-5 z-10 bg-background px-1 text-sm font-normal leading-4">
                Guest Type *
              </span>
              <Select
                placeholder="Select guest type"
                value={guest.guestType}
                onValueChange={(val) => handleChange(index, 'guestType', val.value)}
                name={`guestType-${index}`}
                className="!mt-0"
                error={errors[index]?.guestType}
              >
                <Option value="adult">Adult</Option>
                <Option value="child">Child</Option>
              </Select>
              {errors[index]?.guestType && (
                <p className="text-sm font-medium text-red-500">{errors[index]?.guestType}</p>
              )}
            </div>
            {guest.guestType === 'child' && (
              <div className="relative space-y-1.5">
                <span className="absolute -top-[8px] left-5 z-10 bg-background px-1 text-sm font-normal leading-4">
                  Age *
                </span>
                <Select
                  error={errors[index]?.age}
                  placeholder="Select age"
                  value={guest.age}
                  onValueChange={(val) => handleChange(index, 'age', val.value)}
                  name={`age-${index}`}
                  className="!mt-0"
                >
                  {Array.from({ length: 17 }, (_, i) => i + 1).map((age) => (
                    <Option key={age} value={String(age)}>
                      {age}
                    </Option>
                  ))}
                </Select>
                {errors[index]?.age && <p className="text-sm font-medium text-red-500">{errors[index]?.age}</p>}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      <div className="text-end">
        <Button type="submit" className="px-6 py-2 dark:bg-primary dark:hover:bg-primary/80 dark:text-white">
          Continue
        </Button>
      </div>
    </form>
  );
}
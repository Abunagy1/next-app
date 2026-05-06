"use client";

import { Input } from "@/components/local-ui/input";
import { SelectCountry } from "@/components/SelectCountry";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn, debounce } from "@/app/lib/utils";
import { useRef, useEffect, useState, useCallback } from 'react';
import { defaultPassengerFormValue } from "@/reduxStore/features/singlePassengerFormSlice";
import { addMonths, addYears } from "date-fns";
import { savePassengerDetailsAction, getSavedPassengerDetails } from '@/app/lib/actions/savePassengerDetailsAction';
interface TravelerDetailsFormProps {
  errors?: Record<string, string>;
  className?: string;
  travelerType: string;
  travelerCount: number;
  primaryTraveler?: boolean;
  primaryPassengerEmail?: string;
  metaData?: { departureDate?: string };
}
export default function TravelerDetailsForm({
  errors,
  className,
  travelerType,
  travelerCount,
  primaryTraveler = false,
  primaryPassengerEmail,
  metaData,
}: TravelerDetailsFormProps) {
  const travelerKey = `${travelerType}-${travelerCount}`;
  const [thisPassenger, setThisPassenger] = useState<any>(defaultPassengerFormValue);

  function setPassengerFormInStorage(payload: any) {
    const passengersDetails = JSON.parse(sessionStorage.getItem("passengersDetails") || "[]");
    const pIndex = passengersDetails.findIndex((x: any) => x.key === travelerKey);
    let newPForm: any = { passengerType: travelerType };
    if (pIndex === -1) {
      newPForm = { ...defaultPassengerFormValue, key: travelerKey, passengerType: travelerType, isPrimary: primaryTraveler };
      passengersDetails.push({ ...newPForm, ...payload });
    }
    if (pIndex > -1) {
      passengersDetails[pIndex] = { ...passengersDetails[pIndex], ...newPForm, isPrimary: primaryTraveler, ...payload };
    }
    setThisPassenger({ ...thisPassenger, ...payload });
    sessionStorage.setItem("passengersDetails", JSON.stringify(passengersDetails));
  }

  useEffect(() => {
    const passengersDetails = JSON.parse(sessionStorage.getItem('passengersDetails') || '[]');
    const findThisPassenger = passengersDetails.find((x: any) => x.key === travelerKey);
    queueMicrotask(() => {
      if (findThisPassenger) {
        setThisPassenger(findThisPassenger);
      } else {
        const newPForm = {
          ...defaultPassengerFormValue,
          key: travelerKey,
          passengerType: travelerType,
          email: primaryPassengerEmail || '',
          isPrimary: primaryTraveler,
        };
        sessionStorage.setItem('passengersDetails', JSON.stringify([...passengersDetails, newPForm]));
        setThisPassenger(newPForm);
      }
    });

  }, [travelerType, travelerKey, primaryTraveler, primaryPassengerEmail]);

  // 2nd effect – load saved details from DB (only once per travelerKey)
    // ✅ INSERT NEW EFFECT HERE
    useEffect(() => {
      if (!thisPassenger.firstName) { // empty form
        getSavedPassengerDetails().then(saved => {
          if (saved) {
            // ensure phone is an object
            const phone = saved.phone && typeof saved.phone === 'object'
              ? saved.phone
              : { dialCode: '', number: '' };

            const merged = {
              ...defaultPassengerFormValue,
              ...saved,
              phoneNumber: phone,
              key: travelerKey,
              saveDetails: true,
            };
            // Ensure gender is valid
            if (merged.gender && !['male', 'female'].includes(merged.gender)) {
              merged.gender = '';
            }
            setThisPassenger(merged);
            setPassengerFormInStorage(merged);
          }
        });
      }
    }, [travelerKey]);
    // ----- Debounced session‑timeout update (stable across renders) -----
    const setSessionTimeoutInStorage = useCallback(() => {
      const newValue = (Date.now() + 1200 * 1000).toString();
      const oldValue = localStorage.getItem('sessionTimeoutAt');
      localStorage.setItem('sessionTimeoutAt', newValue);
      window.dispatchEvent(
        new CustomEvent('customStorage', {
          detail: { key: 'sessionTimeoutAt', newValue, oldValue },
        })
      );
    }, []);

    const debouncedSetTimeoutRef = useRef(
      debounce(() => setSessionTimeoutInStorage(), 300)
    );

    // ----- Immediate field save + debounced timeout update -----
    const handleOnChange = (e: any) => {
      const { name, value } = e.target;
      const extractName = name.split('-').at(-1);
      setPassengerFormInStorage({ [extractName]: value });          // save instantly
      debouncedSetTimeoutRef.current();                              // debounced side effect
    };



  return (
    // In TravelerDetailsForm.tsx
    <form className={cn("flex flex-col gap-6 rounded-md bg-white dark:bg-gray-800 p-3 shadow-lg", className)}>
      <Input
        defaultValue={thisPassenger?.firstName}
        type="text"
        name={travelerKey + "-" + "firstName"}
        label="First Name"
        placeholder="Enter your first name"
        required
        onChange={handleOnChange}
        error={errors?.firstName}
      />
      <Input
        defaultValue={thisPassenger?.lastName}
        type="text"
        name={travelerKey + "-" + "lastName"}
        label="Last Name"
        placeholder="Enter your last name"
        required
        onChange={handleOnChange}
        error={errors?.lastName}
      />
      <Input
        defaultValue={thisPassenger?.dateOfBirth}
        type="date"
        name={travelerKey + "-" + "dateOfBirth"}
        label="Date of Birth"
        placeholder="Date of Birth"
        required
        onChange={handleOnChange}
        error={errors?.dateOfBirth}
        minDate={new Date(1900, 0, 1)}
        maxDate={new Date()}
      />
      <Input
        defaultValue={thisPassenger?.passportNumber}
        type="text"
        name={travelerKey + "-" + "passportNumber"}
        label="Passport Number"
        placeholder="Passport Number"
        required
        onChange={handleOnChange}
        error={errors?.passportNumber}
      />
      <div>
        <Input
          defaultValue={thisPassenger?.passportExpiryDate}
          type="date"
          name={travelerKey + "-" + "passportExpiryDate"}
          label="Passport Expiry Date"
          placeholder="Passport Expiry Date"
          required
          onChange={handleOnChange}
          error={errors?.passportExpiryDate}
          minDate={addMonths(new Date(metaData?.departureDate || new Date()), 6)}
          maxDate={addYears(new Date(), 15)}
        />
        <p className="mt-2 text-xs font-bold text-destructive">
          Note: Passport must be valid for at least 6 months from the date of departure
        </p>
      </div>
      <div className="relative block h-auto">
        <span className="absolute -top-[8px] left-5 z-10 bg-background px-1 text-sm font-normal leading-4">Country</span>
        <SelectCountry
          name={travelerKey + "-" + "country"}
          className="h-auto"
          //defaultValue={thisPassenger?.country}
          value={thisPassenger?.country}
          getSelected={(selected: string) => {
            setPassengerFormInStorage({ country: selected }); // selected is already a string, don't treat it as selected.value
            setSessionTimeoutInStorage();
          }}
          containerPopover={global?.document?.body}
          error={errors?.country}
        />
      </div>
      <div className={cn("flex flex-col gap-2 px-2", errors?.gender && "border-destructive")}>
        <p className="text-sm font-bold">Gender</p>
        <RadioGroup
          name={travelerKey + "-" + "gender"}
          value={thisPassenger?.gender}
          className="flex gap-3"
          onValueChange={(v) => {
            setPassengerFormInStorage({ gender: v });
            setSessionTimeoutInStorage();
          }}
        >
          <Label className="flex gap-1">
            <RadioGroupItem className="border-2 data-[state='checked']:border-primary data-[state='checked']:text-primary" value="male" />
            <p>Male</p>
          </Label>
          <Label className="flex gap-1">
            <RadioGroupItem className="border-2 data-[state='checked']:border-primary data-[state='checked']:text-primary" value="female" />
            <p>Female</p>
          </Label>
        </RadioGroup>
        {errors?.gender && <p className="mt-1 pl-4 text-destructive">{errors.gender}</p>}
      </div>
      <div className="mt-3 flex flex-col gap-6">
        <h3 className="mb-2 text-xl font-bold">Frequent Flyer</h3>
        <Input
          defaultValue={thisPassenger?.frequentFlyerAirline}
          type="text"
          name={travelerKey + "-" + "frequentFlyerAirline"}
          label="Frequent Flyer Airline(If Any)"
          placeholder="Frequent Flyer Airline"
          onChange={handleOnChange}
          error={errors?.frequentFlyerAirline}
        />
        <Input
          defaultValue={thisPassenger?.frequentFlyerNumber}
          type="text"
          name={travelerKey + "-" + "frequentFlyerNumber"}
          label="Frequent Flyer Name"
          placeholder="Frequent Flyer Name"
          onChange={handleOnChange}
          error={errors?.frequentFlyerNumber}
        />
      </div>
      <div className="mt-3 flex flex-col gap-6">
        <h3 className="mb-2 text-xl font-bold">Contacts</h3>
        <Input
          value={primaryPassengerEmail || thisPassenger?.email}
          type="text"
          name={travelerKey + "-" + "email"}
          label="Email"
          placeholder="Email"
          onChange={handleOnChange}
          required
          error={errors?.email}
          disabled={!!primaryPassengerEmail}
        />
        <Input
          defaultPhoneValue={JSON.stringify(thisPassenger?.phoneNumber)}
          type="tel"
          name={travelerKey + "-" + "phoneNumber"}
          label="Phone Number"
          placeholder="Phone Number"
          required
          error={errors?.phoneNumber}
          containerPopover={global?.document?.body}
          dialCodePlaceholder="+XXX"
          onChange={debounce((e: any) => {
            const parsed = JSON.parse(e.target.value);
            setPassengerFormInStorage({ phoneNumber: parsed });
            setSessionTimeoutInStorage();
          }, 300)}
        />
      </div>
      {true && (
        <div>
          <Checkbox
            error={errors?.saveDetails}
            checked={thisPassenger?.saveDetails}
            name={travelerKey + "-" + "savedetails"}
            id={travelerKey + "-" + "savedetails"}
            label={<p className="font-semibold">Save my details</p>}
            onChange={(e: any) => {
            const checked = e.target.checked;
            setThisPassenger({ ...thisPassenger, saveDetails: checked });
            setPassengerFormInStorage({ saveDetails: checked });
            setSessionTimeoutInStorage();
            if (checked) {
              const detailsToSave = { ...thisPassenger, saveDetails: true };
              delete detailsToSave.errors;
              savePassengerDetailsAction(detailsToSave).catch(console.error);
            }
          }}
          />
        </div>
      )}
    </form>
  );
}
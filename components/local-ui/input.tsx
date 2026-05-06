'use client';

import { Input as _Input } from '@/components/ui/input';
import Image from 'next/image';
import error_icon from '@/public/travel/icons/error.svg';
import { cn, isDateObjValid } from '@/app/lib/utils';
import { forwardRef, useState, ChangeEvent, useCallback } from 'react';
import eye from '@/public/travel/icons/eye.svg';
import eyeOff from '@/public/travel/icons/eye-closed.svg';
import { SelectDialCode } from '../SelectDialCode';
import { DatePicker } from './DatePicker';
import { addYears, endOfYear, format, subYears } from 'date-fns';

// Cast _Input to any to bypass type issues
const InputComponent = _Input as any;

interface DatePickerCustomInputProps {
  value?: Date | null;
  onClick?: () => void;
  className?: string;
}

const DatePickerCustomInput = forwardRef<HTMLDivElement, DatePickerCustomInputProps>(
  ({ value, onClick, className }, ref) => {
    return isDateObjValid(value) ? (
      <div
        role="button"
        className={cn('flex h-full w-full cursor-pointer items-center justify-between px-2', className)}
        ref={ref}
        onClick={onClick}
      >
        <span className="dark:text-white">{format(value!, 'dd MMM yyyy')}</span>
        <Image src="/travel/icons/calender.svg" alt="calendar_icon" width={20} height={20} />
      </div>
    ) : (
      <div
        role="button"
        className={cn('flex h-full w-full cursor-pointer items-center justify-between px-2', className)}
        ref={ref}
        onClick={onClick}
      >
        <span className="dark:text-gray-400">dd MMM yyyy</span>
        <Image src="/travel/icons/calender.svg" alt="calendar_icon" width={20} height={20} />
      </div>
    );
  }
);

DatePickerCustomInput.displayName = 'DatePickerCustomInput';

interface PhoneData {
  number: string;
  dialCode: string;
}

interface InputProps {
  label?: string;
  error?: string | null;
  className?: string;
  type?: 'text' | 'password' | 'email' | 'tel' | 'date' | 'textarea';
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  defaultPhoneValue?: string;
  dialCodePlaceholder?: string;
  minDate?: Date;
  maxDate?: Date;
  value?: string;
  defaultValue?: string;
  containerPopover?: HTMLElement;
  name?: string;
  placeholder?: string;
  required?: boolean;
  [key: string]: any;
}

export function Input({
  label = 'Label',
  error = null,
  className,
  type = 'text',
  onChange = () => {},
  defaultPhoneValue,
  dialCodePlaceholder,
  minDate,
  maxDate,
  value,
  defaultValue,
  containerPopover,
  ...props
}: InputProps) {
  const [inputType, setInputType] = useState(type);
  
  const [phoneData, setPhoneData] = useState<PhoneData>(() => {
    if (type === 'tel' && defaultPhoneValue) {
      try {
        return JSON.parse(defaultPhoneValue);
      } catch {
        return { number: '', dialCode: '' };
      }
    }
    return { number: '', dialCode: '' };
  });

  const toggleEye = () => {
    setInputType((prev) => (prev === 'password' ? 'text' : 'password'));
  };

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newPhone = e.target.value;
    const newPhoneData = { ...phoneData, number: newPhone };
    setPhoneData(newPhoneData);
    onChange({ target: { value: JSON.stringify(newPhoneData) } } as any);
  };

  const handleDialCode = useCallback((dialCode: { value: string }) => {
    const newPhoneData = { ...phoneData, dialCode: dialCode.value };
    setPhoneData(newPhoneData);
    onChange({ target: { value: JSON.stringify(newPhoneData) } } as any);
  }, [phoneData, onChange]);

  const handleDateChange = (selected: Date | null) => {
    let d = '';
    if (selected) {
      d = new Date(selected).toLocaleString('en-CA', {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    }
    onChange({ target: { value: d, name: props.name } } as any);
  };

  const dateValue = value || defaultValue;
  const parsedDate = dateValue ? new Date(dateValue) : null;
  const validDate = isDateObjValid(parsedDate) ? parsedDate : null;

  return (
    <div className={cn('relative block h-auto', className)}>
      <p className="absolute -top-[8px] left-5 z-10 bg-background px-1 text-sm font-normal leading-4 dark:bg-gray-800 dark:text-gray-300">
        <span>{label}</span>
        {props.required && <span className="text-destructive"> *</span>}
      </p>
      <div className="relative h-auto">
        {type !== 'textarea' ? (
          type === 'tel' ? (
            <div className={cn('flex h-10 w-full rounded-md border-2 border-black lg:h-14', error && 'border-destructive')}>
              <input type="hidden" name={props.name} value={JSON.stringify(phoneData)} />
              <SelectDialCode
                name="dialCode"
                getDialCode={handleDialCode as any}
                value={phoneData?.dialCode}
                className="border-none bg-slate-300 dark:bg-gray-700 dark:text-white"
                placeholder={dialCodePlaceholder}
                containerPopover={containerPopover}
              />
              <InputComponent
                className="h-full border-none bg-inherit lg:h-full dark:bg-inherit dark:text-white"
                type="tel"
                name="number"
                defaultValue={phoneData?.number}
                onChange={handlePhoneChange}
                placeholder={props.placeholder}
              />
            </div>
          ) : type === 'date' ? (
            <div className={cn('flex h-10 w-full rounded-md border-2 border-black lg:h-14 dark:border-gray-600', error && 'border-destructive')}>
              <input type="hidden" name={props.name} value={dateValue || ''} />
              <DatePicker
                customInput={<DatePickerCustomInput />}
                date={validDate}
                minDate={minDate || subYears(new Date(), 20)}
                maxDate={maxDate || addYears(endOfYear(new Date()), 20)}
                setDate={handleDateChange}
                // className={className}
                className="min-h-[48px] w-full bg-white dark:bg-gray-800 cursor-pointer"
              />
            </div>
          ) : (
            <InputComponent
              className={cn('border-2 border-black dark:border-gray-600 dark:bg-gray-800 dark:text-white', error && 'border-destructive')}
              type={inputType}
              onChange={onChange}
              value={value}
              defaultValue={defaultValue}
              {...props}
            />
          )
        ) : (
          <textarea
            className={cn('min-h-[100px] w-full rounded-sm border-2 border-black p-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white', error && 'border-destructive')}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            {...props}
          />
        )}
        <div className="absolute right-3 top-1/2 flex w-auto -translate-y-1/2 gap-[6px]">
          {type === 'password' && (
            <button type="button" onClick={toggleEye} className="h-auto w-auto">
              <Image width={16} height={16} src={inputType === 'password' ? eyeOff : eye} alt="eye_on_off_icon" />
            </button>
          )}
          {error && <Image width={16} height={16} src={error_icon} alt="error_icon" />}
        </div>
      </div>
      <p className="mt-1 pl-4 text-sm font-medium text-destructive">{error}</p>
    </div>
  );
}
'use client';

import { addYears, format, isSameDay } from 'date-fns';
import { cn, isDateObjValid } from '@/app/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DatePickerReact from 'react-datepicker';
import './datepicker.css';
import React, { forwardRef, useState, useMemo, useEffect } from 'react';

interface DatePickerProps {
  customInput?: React.ReactElement;
  className?: string;
  date?: Date | null;
  setDate?: (date: Date | null) => void;
  loading?: boolean;
  minDate?: Date;
  maxDate?: Date;
  [key: string]: any;
}

// --- Custom Input component (unchanged) ---
const CustomInput = forwardRef<HTMLDivElement, any>(
  ({ value, onClick, className }, ref) => {
    return isDateObjValid(value) ? (
      <div
        className={cn('h-full w-full dark:text-white', className)}
        ref={ref}
        onClick={onClick}
      >
        {format(value, 'dd MMM yyyy')}
      </div>
    ) : (
      <div
        className={cn('h-full w-full dark:text-white', className)}
        ref={ref}
        onClick={onClick}
      >
        dd MMM yyyy
      </div>
    );
  }
);
CustomInput.displayName = 'CustomInput';

// --- Custom Header (month/year controls) ---
function CustomHeader({ years = [], months = [], props }: any) {
  return (
    <div className="flex h-fit items-center justify-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-6 w-6 rounded-md"
        onClick={props?.decreaseMonth}
        disabled={props?.prevMonthButtonDisabled}
      >
        <ChevronLeft width={16} height={16} />
      </Button>
      <select
        value={months[new Date(props?.date).getMonth()]}
        onChange={({ target: { value } }) =>
          props?.changeMonth(months.indexOf(value))
        }
        className="grow-0 rounded-sm bg-white p-1 dark:bg-gray-800 dark:text-white dark:border-gray-600"
      >
        {months.map((option: string) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <select
        className="h-full grow-0 rounded-sm bg-white p-1 dark:bg-gray-800 dark:text-white dark:border-gray-600"
        value={new Date(props?.date).getFullYear()}
        onChange={({ target: { value } }) => props?.changeYear(value)}
      >
        {years.map((option: number) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-6 w-6 rounded-md"
        onClick={props?.increaseMonth}
        disabled={props?.nextMonthButtonDisabled}
      >
        <ChevronRight width={16} height={16} />
      </Button>
    </div>
  );
}

// --- Main DatePicker component ---
export function DatePicker({
  customInput,
  className,
  date,
  setDate = () => {},
  loading = false,
  minDate = new Date(),
  maxDate = addYears(new Date(), 1),
  ...props
}: DatePickerProps) {
  const [popperOpened, setPopperOpened] = useState(false);

  // 🔧 MutationObserver to shorten weekday names to single letters
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const dayNames = document.querySelectorAll('.react-datepicker__day-name');
      dayNames.forEach((el) => {
        const original = el.textContent || '';
        if (original.length > 1) {
          el.textContent = original.charAt(0);
        }
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const customInputEl = useMemo(
    () => customInput ?? <CustomInput />,
    [customInput]
  );

  const years: number[] = [];
  for (let i = minDate.getFullYear(); i <= maxDate.getFullYear(); i++) {
    years.push(i);
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handleChange = (selected: Date | null) => {
    if (selected && date && isSameDay(date, selected)) {
      setDate(null);
    } else {
      setDate(selected);
    }
    setPopperOpened(false);
  };

  return (
    <DatePickerReact
      customInput={customInputEl}
      renderCustomHeader={(headerProps) => (
        <CustomHeader years={years} months={months} props={headerProps} />
      )}
      popperClassName="dark:bg-gray-800 dark:border-gray-700"
      calendarClassName="dark:bg-gray-800"
      formatWeekDay={(day) => day.substring(0, 1)}  // fallback, but observer will also run
      open={!loading && popperOpened}
      onInputClick={() => setPopperOpened(!popperOpened)}
      onClickOutside={() => setPopperOpened(false)}
      selected={isDateObjValid(date) ? new Date(date as Date) : null}
      onChange={(selected: Date | null) => handleChange(selected)}
      className={className}
      minDate={minDate}
      maxDate={maxDate}
      {...props}
    />
  );
}
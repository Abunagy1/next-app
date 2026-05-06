'use client';
import { useState } from 'react';
import countryInfo from '@/data/countryInfo.json';
import { Option, Select } from './local-ui/Select';
import { cn } from '@/app/lib/utils';
interface SelectDialCodeProps {
  name?: string;               // kept for compatibility, not used
  getDialCode?: (value: { value: string }) => void;
  value?: string;
  className?: string;
  placeholder?: string;
  containerPopover?: HTMLElement;
}
export function SelectDialCode({
  name,
  getDialCode = () => {},
  value,
  className,
  placeholder,
  containerPopover,
}: SelectDialCodeProps) {
  const initialCountry = countryInfo.find((c) => c.dial_code === value);
  const initialCode = initialCountry?.code || '';
  const [selectedCountryCode, setSelectedCountryCode] = useState(initialCode);
  const handleChange = (option: { value: string }) => {
    const country = countryInfo.find((c) => c.code === option.value);
    if (country) {
      setSelectedCountryCode(country.code);
      // Notify the parent Input component of the new dial code
      getDialCode({ value: country.dial_code });
    }
  };
  return (
    <Select
      value={selectedCountryCode}           // unique country code
      onValueChange={handleChange}
      className={cn('h-auto max-w-[110px] lg:h-auto', className)}
      placeholder={placeholder}
      popoverAttributes={{ containerDomObjRef: containerPopover, search: true }}
    >
      {countryInfo.map((item) => (
        <Option
          key={item.code}
          value={item.code}
          searchableValue={`${item.name} ${item.dial_code}`}
          displayValue={
            <span>
              {item.emoji} {item.dial_code}
            </span>
          }
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">{item.emoji}</span>
            <span>
              {item.name} ({item.dial_code})
            </span>
          </div>
        </Option>
      ))}
    </Select>
  );
}
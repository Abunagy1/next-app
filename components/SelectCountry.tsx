'use client';

import countryInfo from '@/data/countryInfo.json';
import { Option, Select } from './local-ui/Select';
import { cn } from '@/app/lib/utils';

interface SelectCountryProps {
  error?: string;
  className?: string;
  getSelected?: (value: string) => void;
  value?: string;
  containerPopover?: HTMLElement;
  name?: string;
}

export function SelectCountry({
  error,
  className,
  getSelected = () => {},
  value,
  containerPopover,
  ...props
}: SelectCountryProps) {
  return (
    <>
      <Select
        onValueChange={(val) => getSelected(val.value)}
        value={value}
        placeholder="select country"
        className={cn(className, error && 'border-destructive')}
        popoverAttributes={{ containerDomObjRef: containerPopover }}
        {...props}
      >
        {countryInfo.map((country) => (
          <Option searchableValue={country.name} className="py-3" key={country.name} value={country.name}>
            {country.name}
          </Option>
        ))}
      </Select>
      <p className="mt-1 pl-4 font-medium text-destructive">{error}</p>
    </>
  );
}
'use client';

import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import countryInfo from '@/data/countryInfo.json';
import { ChevronDown } from 'lucide-react';

interface SelectCountryProps {
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function SelectCountry({ name = 'country', value, onChange }: SelectCountryProps) {
  const [country, setCountry] = useState<string>(() => {
    if (value) {
      const found = countryInfo.find((c) => c.dial_code === value);
      return found?.emoji || countryInfo[0].emoji;
    }
    return countryInfo[0].emoji;
  });
  const [callingCode, setCallingCode] = useState<string>(() => {
    if (value) return value;
    return countryInfo[0].dial_code;
  });
  const [open, setOpen] = useState(false);
  const ulRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    function adjustHeight() {
      const ul = ulRef.current;
      if (!ul) return;
      const screenHeight = window.innerHeight;
      const ulPosition = ul.getBoundingClientRect();
      const ulHeight = screenHeight - ulPosition.y - 30;
      ul.style.maxHeight = `${ulHeight}px`;
    }

    if (open) {
      adjustHeight();
      window.addEventListener('resize', adjustHeight);
    }

    return () => {
      window.removeEventListener('resize', adjustHeight);
    };
  }, [open]);

  function handleSelect(item: (typeof countryInfo)[0]) {
    setCountry(item.emoji);
    setCallingCode(item.dial_code);
    setOpen(false);
    onChange?.(item.dial_code);
  }

  return (
    <div className="relative">
      <input type="hidden" name={name} value={callingCode} />
      <Button
        variant="ghost"
        type="button"
        className="h-full !bg-slate-100 px-2 bg-inherit text-2xl lg:text-3xl"
        onClick={() => setOpen(!open)}
      >
        {country}&nbsp; <span className="text-sm text-disabled-foreground">{callingCode}</span>
        <ChevronDown className="ml-1 h-4 w-4" />
      </Button>
      {open && (
        <ul
          ref={ulRef}
          className="absolute overflow-y-scroll goBye-scrollbar rounded-lg p-2 top-10 lg:top-14 left-0 z-50 w-full bg-white shadow-lg border"
        >
          {countryInfo.map((item) => (
            <li
              key={item.code}
              className="flex mb-1 items-center gap-2 p-2 hover:bg-slate-100 cursor-pointer"
              onClick={() => handleSelect(item)}
            >
              <span className="text-2xl">{item.emoji}</span>
              {item.name} ({item.dial_code})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState } from 'react';

interface PassangerDropdownProps {
  className?: string;
  defaultValue?: string;
  searchResult: Array<{ label: string; value: string }>;
  name?: string;
}

export function PassangerDropdown({
  className,
  defaultValue = '',
  searchResult,
  name,
}: PassangerDropdownProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [items] = useState(searchResult);
  const [filter, setFilter] = useState(items);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.toLowerCase();
    const filtered = items.filter((item) => item.label.toLowerCase().includes(val));
    setFilter(filtered);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <input type="hidden" name={name} value={value} />
      <PopoverTrigger className={className} asChild>
        <Button variant="ghost" className="justify-start font-normal">
          {value === '' ? 'Select airport' : value}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 dark:bg-gray-800 dark:border-gray-700" align="start">
        <Input className="w-full mb-3 dark:bg-gray-700 dark:text-white" placeholder="Search..." onChange={handleChange} />
        <div>
          {filter.length < 1 ? (
            <div className="p-4 text-center text-sm dark:text-gray-400">No results found</div>
          ) : (
            filter.map((obj) => (
              <div
                key={obj.value}
                onClick={() => {
                  setValue(obj.label === value ? '' : obj.label);
                  setOpen(false);
                }}
                className="flex cursor-pointer items-center justify-between p-4 hover:bg-muted dark:hover:bg-gray-600"
              >
                <div className="text-sm dark:text-gray-300">{obj.label}</div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
'use client';
import * as React from 'react';
import { useState } from 'react';
// import {
//   forwardRef,
//   useRef,
//   useState,
//   createContext,
//   useContext,
//   useEffect,
// } from "react";
import {
  Select as SelectShadcn,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/app/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
export interface SelectOption {
  value: string;
  label?: React.ReactNode;
  searchableValue?: string;
  displayValue?: React.ReactNode;
}
interface SelectProps {
  value?: string;
  onValueChange?: (option: SelectOption) => void;
  placeholder?: string;
  className?: string;
  name?: string;
  popoverAttributes?: {
    className?: string;
    containerDomObjRef?: HTMLElement;
    search?: boolean;
  };
  children: React.ReactNode;
  error?: string;
}
export function Select({
  value,
  onValueChange,
  placeholder = 'Select an option',
  className,
  name,
  popoverAttributes = {},
  children,
  error,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);
  const [searchQuery, setSearchQuery] = useState('');   // ← always called
  // Clear search when popover closes
  React.useEffect(() => {
    if (!open) setSearchQuery('');
  }, [open]);
  const options = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<OptionProps> =>
      React.isValidElement(child) && child.type === Option
  );
  const selectedOption = options.find((opt) => opt.props.value === selectedValue)
  const handleSelect = (option: SelectOption) => {
    setSelectedValue(option.value);
    setOpen(false);
    onValueChange?.(option);
  };
  // ---------- Searchable popover (custom, no cmdk) ----------
  if (popoverAttributes.search) {
    const { containerDomObjRef, search, ...restPopoverAttrs } =
      popoverAttributes;

    const filteredOptions = options.filter((opt) => {
      if (!searchQuery) return true;
      const text =
        opt.props.searchableValue ||
        (typeof opt.props.children === 'string' ? opt.props.children : '');
      return text.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
      <div className={cn('relative', className)}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white',
                error && 'border-red-500'
              )}
            >
              {selectedOption ? (
                selectedOption.props.displayValue || selectedOption.props.children
              ) : (
                <span>{placeholder}</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className={cn(
              'w-full min-w-[250px] p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700',
              restPopoverAttrs.className
            )}
            align="start"
            sideOffset={4}
          >
            <div className="flex items-center gap-2 mb-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                className="h-8 border-0 bg-transparent focus-visible:ring-0 dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="max-h-80 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <p className="text-sm text-gray-500 py-2 text-center">
                  No option found.
                </p>
              ) : (
                filteredOptions.map((opt, idx) => (
                  <div
                    key={opt.props.searchableValue || `${opt.props.value}-${idx}`}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm hover:bg-gray-100 dark:hover:bg-gray-700',
                      selectedValue === opt.props.value
                        ? 'bg-primary/10 font-semibold'
                        : ''
                    )}
                    onClick={() => handleSelect(opt.props)}
                  >
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0',
                        selectedValue === opt.props.value
                          ? 'opacity-100 text-primary'
                          : 'opacity-0'
                      )}
                    />
                    <span className="flex-1">
                      {opt.props.displayValue || opt.props.children}
                    </span>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
        <input type="hidden" name={name} value={selectedValue || ''} />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  // ---------- Simple shadcn Select ----------
  return (
    <div className={cn('relative', className)}>
      <SelectShadcn
        value={selectedValue}
        onValueChange={(val) => {
          const opt = options.find((o) => o.props.value === val);
          if (opt) handleSelect(opt.props);
        }}
      >
        <SelectTrigger
          className={cn(
            error && 'border-destructive',
            'dark:border-gray-600 dark:bg-gray-800 dark:text-white'
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent
          className={cn(
            popoverAttributes.className,
            'dark:bg-gray-800 dark:border-gray-700 dark:text-white'
          )}
        >
          <SelectGroup>
            {options.map((opt, idx) => (
              <SelectItem
                key={opt.props.searchableValue || `${opt.props.value}-${idx}`}
                value={opt.props.value}
              >
                {opt.props.children}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </SelectShadcn>
      <input type="hidden" name={name} value={selectedValue || ''} />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

interface OptionProps {
  value: string;
  children: React.ReactNode;
  searchableValue?: string;
  displayValue?: React.ReactNode;
  className?: string;
}

export function Option({ children, ...props }: OptionProps) {
  return <SelectItem {...props}>{children}</SelectItem>;
}
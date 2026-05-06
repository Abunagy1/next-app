'use client';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/app/lib/utils';
import { useState } from 'react';
interface DropdownProps {
  title: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  classNames?: {
    parent?: string;
    trigger?: string;
    content?: string;
  };
  children: React.ReactNode;
}
export function Dropdown({
  title,
  open: controlledOpen,
  defaultOpen = false,
  classNames,
  children,
}: DropdownProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const handleValueChange = (value: string) => {
    const newOpen = value === 'item-1';
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    // If controlled, parent must manage state via `open` prop.
  };
  return (
    <Accordion
      type="single"
      value={isOpen ? 'item-1' : ''}
      onValueChange={handleValueChange}
      collapsible
      className={classNames?.parent}
    >
      <AccordionItem value="item-1" className="border-b-0">
        <AccordionTrigger
        //   className={cn(
        //     'rounded-md bg-primary/30 p-4 dark:bg-gray-700 dark:text-white',
        //     classNames?.trigger
        //   )}
        //   onClick={(e) => e.stopPropagation()}
        // >
          className={cn('rounded-md bg-primary/30 p-4 dark:bg-gray-700 dark:text-white', classNames?.trigger)}>
          {title}
        </AccordionTrigger>
        <AccordionContent className={cn('my-3 dark:text-gray-300', classNames?.content)}>
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
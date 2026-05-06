"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/app/lib/utils";
import { ChevronDown } from "lucide-react";

interface DropdownProps {
  title: React.ReactNode;
  open?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Dropdown({ title, open, className, children }: DropdownProps) {
  return (
    <Accordion className={cn(className)} type="single" defaultValue={open ? "item-1" : undefined} collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger>{title}</AccordionTrigger>
        <AccordionContent>{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
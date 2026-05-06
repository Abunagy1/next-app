"use client";
import { useState } from "react";
import { CheckboxShadcn } from "./checkboxShadcn";

import { cn } from "@/app/lib/utils";

/**
 * @param {Object} param
 * @param {string} [param.className]
 * @param {string} [param.error]
 * @param {string} param.id
 * @param {string} param.name
 * @param {string} [param.label]
 * @param {Object} [param.props] - Additional props
 */

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxShadcn> {
  error?: string;
  id: string;
  label?: React.ReactNode;
}

export function Checkbox({ className, error, id, name, label, ...props }: CheckboxProps) {
  const [checked, setChecked] = useState(false);
  return (
    <div className={cn("flex select-none items-center space-x-2 py-1", error && "rounded-[2px] ring-2 ring-destructive ring-offset-4")}>
      <input type="hidden" value={checked ? "on" : ""} name={name} />
      <CheckboxShadcn
        onCheckedChange={(checked) => {
          setChecked(!!checked);
          props.onChange?.({ target: { checked } } as any);
        }}
        className={cn(className)}
        id={id}
        {...props}
      />
      {label && (
        <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
    </div>
  );
}

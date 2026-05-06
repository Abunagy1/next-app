'use client';

import { useEffect, useRef } from 'react';
import { objDeepCompare } from '@/app/lib/utils';

type AnyFunction = (...args: any[]) => any;
type Action = AnyFunction | [AnyFunction, ...any[]];

interface ActionRunnerProps {
  actions?: Action[];
}

export default function ActionRunner({ actions = [] }: ActionRunnerProps) {
  const prevDeps = useRef<any[]>([]);

  useEffect(() => {
    if (prevDeps.current.length === 0) {
      prevDeps.current = actions.map((action) =>
        Array.isArray(action) ? action.slice(1).map(normalizeForComparison) : null
      );
      actions.forEach((action) => {
        const fn = Array.isArray(action) ? action[0] : action;
        const args = Array.isArray(action) ? prepareArgsForExecution(action.slice(1)) : [];
        fn(...args);
      });
      return;
    }

    actions.forEach((action, index) => {
      if (!Array.isArray(action)) return;
      const [fn, ...currentRawDeps] = action;
      const currentDeps = currentRawDeps.map(normalizeForComparison);
      const previousDeps = prevDeps.current[index];
      if (
        !previousDeps ||
        currentDeps.length !== previousDeps.length ||
        !arrayDeepCompare(currentDeps, previousDeps)
      ) {
        const args = prepareArgsForExecution(currentRawDeps);
        fn(...args);
        prevDeps.current[index] = currentDeps;
      }
    });
  }, [actions]);

  return null;
}

function normalizeForComparison(value: any): any {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value) && value.every((item) => Array.isArray(item) && item.length === 2)) {
      return value;
    }
    return JSON.parse(JSON.stringify(value));
  }
  return value;
}

function prepareArgsForExecution(args: any[]): any[] {
  return args.map((arg) => {
    if (Array.isArray(arg) && arg.every((item) => Array.isArray(item) && item.length === 2)) {
      const formData = new FormData();
      arg.forEach(([key, value]) => formData.append(key, value));
      return formData;
    }
    return arg;
  });
}

function arrayDeepCompare(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, i) => objDeepCompare(val, b[i]));
}
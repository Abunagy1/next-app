import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Revenue } from './definitions';
import { defaultFlightFormValue } from '../../reduxStore/features/flightFormSlice';

// -----------------------------------------------------------------------------
// Tailwind class merging
// -----------------------------------------------------------------------------
export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

// -----------------------------------------------------------------------------
// Math helpers
// -----------------------------------------------------------------------------
export function lerp(a: number, b: number, n: number): number {
  return (1 - n) * a + n * b;
}

export function normalize(num: number, min: number, max: number): number {
  return (num - min) / (max - min);
}

export function minutesToHMFormat(min: number): string {
  const hours = Math.floor(min / 60);
  const remainingMinutes = Math.round(min % 60);
  return `${hours}h ${remainingMinutes}m`;
}

export function substractTimeInMins(a: Date | string, b: Date | string): number {
  const timeA = new Date(a);
  const timeB = new Date(b);
  return Math.abs((timeA.getTime() - timeB.getTime()) / (1000 * 60));
}

// -----------------------------------------------------------------------------
// URL validation
// -----------------------------------------------------------------------------
export async function validateURL(str: string): Promise<boolean> {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// Debounce utilities
// -----------------------------------------------------------------------------
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  timeout = 300
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
    }, timeout);
  };
}

export function debounceAsync<T extends (...args: any[]) => any>(
  func: T,
  delay = 300
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: NodeJS.Timeout;
  let lastPromiseResolve: ((value: ReturnType<T>) => void) | null = null;
  let lastPromiseReject: ((reason?: any) => void) | null = null;
  return (...args: Parameters<T>) =>
    new Promise((resolve, reject) => {
      clearTimeout(timeoutId);
      lastPromiseResolve = resolve;
      lastPromiseReject = reject;
      timeoutId = setTimeout(async () => {
        try {
          const result = await func(...args);
          if (lastPromiseResolve === resolve) resolve(result);
        } catch (error) {
          if (lastPromiseReject === reject) reject(error);
        }
      }, delay);
    });
}

// -----------------------------------------------------------------------------
// Promise detection
// -----------------------------------------------------------------------------
export function isPromise(value: any): value is Promise<any> {
  return !!value && (typeof value === 'object' || typeof value === 'function') && typeof value.then === 'function';
}

// -----------------------------------------------------------------------------
// Email validation
// -----------------------------------------------------------------------------
export function isEmailValid(email: string): boolean {
  const emailRegex = /^(([^<>()\\[\]\\.,;:\s@"]+(\.[^<>()\\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(email);
}

// -----------------------------------------------------------------------------
// String helpers
// -----------------------------------------------------------------------------
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// -----------------------------------------------------------------------------
// Array helpers
// -----------------------------------------------------------------------------
export function findOnlyUniqueElements<T>(arr: T[], ...moreArrs: T[][]): T[] {
  if (!arr) throw new Error('first argument is required');
  if (!Array.isArray(arr)) throw new Error('ensure all arguments are arrays');
  for (const other of moreArrs) {
    if (!Array.isArray(other)) throw new Error('ensure all arguments are arrays');
  }
  const combined = arr.concat(...moreArrs);
  return combined.filter((item, index, array) => array.indexOf(item) === index && array.lastIndexOf(item) === index);
}

export function findOnlyDuplicateElements<T>(arr: T[], ...moreArrs: T[][]): T[] {
  if (!arr) throw new Error('first argument is required');
  if (!Array.isArray(arr)) throw new Error('ensure all arguments are arrays');
  for (const other of moreArrs) {
    if (!Array.isArray(other)) throw new Error('ensure all arguments are arrays');
  }
  return arr.filter((item, index, array) => array.indexOf(item) === index && array.lastIndexOf(item) !== index);
}

// -----------------------------------------------------------------------------
// Deep object comparison
// -----------------------------------------------------------------------------
export function objDeepCompare(...objects: any[]): boolean {
  if (objects.length < 2) throw new Error('Need two or more arguments to compare');
  function compare2Objects(x: any, y: any, leftChain: any[] = [], rightChain: any[] = []): boolean {
    if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') return true;
    if (x === y) return true;
    if (
      (typeof x === 'function' && typeof y === 'function') ||
      (x instanceof Date && y instanceof Date) ||
      (x instanceof RegExp && y instanceof RegExp) ||
      (x instanceof String && y instanceof String) ||
      (x instanceof Number && y instanceof Number)
    ) {
      return x.toString() === y.toString();
    }
    if (!(x instanceof Object && y instanceof Object)) return false;
    if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) return false;
    if (x.constructor !== y.constructor) return false;
    if (x.prototype !== y.prototype) return false;
    if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) return false;
    for (const p in y) {
      if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) return false;
      if (typeof y[p] !== typeof x[p]) return false;
    }
    for (const p in x) {
      if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) return false;
      if (typeof y[p] !== typeof x[p]) return false;
      switch (typeof x[p]) {
        case 'object':
        case 'function':
          if (!compare2Objects(x[p], y[p], [...leftChain, x], [...rightChain, y])) return false;
          break;
        default:
          if (x[p] !== y[p]) return false;
      }
    }
    return true;
  }
  const first = objects[0];
  for (let i = 1; i < objects.length; i++) {
    if (!compare2Objects(first, objects[i])) return false;
  }
  return true;
}

// -----------------------------------------------------------------------------
// Flight search parsing
// -----------------------------------------------------------------------------
export function passengerStrToObject(passengersStr: string): { adults: number; children: number; infants: number } {
  const extractPassengers: any = {};
  passengersStr.split('_').forEach((el) => {
    const [key, val] = el.split('-');
    extractPassengers[key] = +val;
  });
  return {
    adults: extractPassengers.adults || 0,
    children: extractPassengers.children || 0,
    infants: extractPassengers.infants || 0,
  };
}

export function passengerObjectToStr(passengerObj: { adults?: number; children?: number; infants?: number }): string {
  if (!isObject(passengerObj)) return '';
  return `adults-${passengerObj.adults ?? 1}_children-${passengerObj.children ?? 0}_infants-${passengerObj.infants ?? 0}`;
}

export function airportStrToObject(airportStr: string): { iataCode: string; name: string; city: string } {
  const arr = airportStr.split('_');
  return { iataCode: arr[0], name: arr[1], city: arr[2] };
}

export function parseFlightSearchParams(searchParamsJSON: any): any {
  const isValidArg = isObject(searchParamsJSON) || typeof searchParamsJSON === 'string';
  if (!isValidArg) throw new Error('Invalid argument. Expected object or JSON string');
  let parsedSearchState: any = {};
  if (typeof searchParamsJSON === 'string') parsedSearchState = JSON.parse(searchParamsJSON);
  else parsedSearchState = { ...searchParamsJSON };
  parsedSearchState.passengers = parsedSearchState?.passengers
    ? passengerStrToObject(parsedSearchState.passengers)
    : defaultFlightFormValue.passengers;
  parsedSearchState.from = parsedSearchState?.from ? airportStrToObject(parsedSearchState.from) : {};
  parsedSearchState.to = parsedSearchState?.to ? airportStrToObject(parsedSearchState.to) : {};
  return parsedSearchState;
}

export function airportObjectToStr(airportObj: { iataCode: string; name: string; city: string }): string {
  if (!isObject(airportObj)) return '';
  return `${airportObj.iataCode}_${airportObj.name}_${airportObj.city}`;
}

// -----------------------------------------------------------------------------
// Date helpers
// -----------------------------------------------------------------------------
export function isDateObjValid(date: any): boolean {
  if (date === null) return false;
  return new Date(date).toString() !== 'Invalid Date';
}

export function formatDateToLocal(dateStr: string, locale: string = 'en-US'): string {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  const formatter = new Intl.DateTimeFormat(locale, options);
  return formatter.format(date);
}

export function formatDateToYYYYMMDD(date: Date, timeZone: string = 'UTC'): string {
  return date.toLocaleString('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// -----------------------------------------------------------------------------
// Dashboard helpers
// -----------------------------------------------------------------------------
export function generateYAxis(revenue: Revenue[]) {
  const yAxisLabels: string[] = [];
  const highestRecord = Math.max(...revenue.map((month) => month.revenue));
  const topLabel = Math.ceil(highestRecord / 1000) * 1000;
  for (let i = topLabel; i >= 0; i -= 1000) {
    yAxisLabels.push(`$${i / 1000}K`);
  }
  return { yAxisLabels, topLabel };
}

export function generatePagination(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 3) {
    return [1, 2, 3, '...', totalPages - 1, totalPages];
  }
  if (currentPage >= totalPages - 2) {
    return [1, 2, '...', totalPages - 2, totalPages - 1, totalPages];
  }
  return [
    1,
    '...',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    '...',
    totalPages,
  ];
}

// -----------------------------------------------------------------------------
// Type guards
// -----------------------------------------------------------------------------
export function isObject(x: any): x is object {
  return typeof x === 'object' && !Array.isArray(x) && x !== null;
}

// -----------------------------------------------------------------------------
// Base64 utilities
// -----------------------------------------------------------------------------
export function strtoBase64(str: string): string {
  return Buffer.from(str).toString('base64');
}

export function base64toStr(base64: string): string {
  return Buffer.from(base64, 'base64').toString('utf-8');
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = Buffer.from(base64, 'base64').toString('binary');
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export function base64toBlob(base64Image: string): Blob {
  const parts = base64Image.split(';base64,');
  if (parts.length !== 2) throw new Error('Invalid base64 image format.');
  const contentType = parts[0].split(':')[1];
  const b64Data = parts[1];
  const arrayBuffer = base64ToArrayBuffer(b64Data);
  return new Blob([arrayBuffer], { type: contentType });
}

export function blobToUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

// -----------------------------------------------------------------------------
// ID generation
// -----------------------------------------------------------------------------
export function customAlphabet(alphabet: string, length: number): () => string {
  return () => {
    let id = '';
    for (let i = 0; i < length; i++) {
      id += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return id;
  };
}

export function nanoid(): string {
  return customAlphabet('1234567890abcdefhijklmnopqrstuvwxyz', 6)();
}

// -----------------------------------------------------------------------------
// JSON validation
// -----------------------------------------------------------------------------
export function isValidJSON(str: any): boolean {
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === 'object' && parsed !== null;
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------------
// Currency helpers (cents)
// -----------------------------------------------------------------------------
export function usdToCents(usd: number): number {
  return Math.round(usd * 100);
}

export function centsToUSD(cents: number): number {
  return cents / 100;
}

// -----------------------------------------------------------------------------
// Dollar-based formatting (old project) - flights and hotels use dollars, so this helper formats directly without converting from cents
// -----------------------------------------------------------------------------
export function currencyFormat(amount: number, currency: string = 'USD', locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// -----------------------------------------------------------------------------
// Cents-based formatting (base invoices) - base project uses cents for all amounts, so this helper converts to dollars and formats
// -----------------------------------------------------------------------------
export function formatCurrency(amountInCents: number, currency: string = 'USD', locale: string = 'en-US'): string {
  const dollars = amountInCents / 100;
  return currencyFormat(dollars, currency, locale);
}

// -----------------------------------------------------------------------------
// Array grouping
// -----------------------------------------------------------------------------
export function groupBy<T>(items: T[], callbackFn: (item: T, index: number) => string): Record<string, T[]> {
  if (items == null) throw new TypeError('Object.groupBy called on null or undefined');
  if (typeof callbackFn !== 'function') throw new TypeError('callbackFn must be a function');
  const result: Record<string, T[]> = Object.create(null);
  let index = 0;
  for (const element of items) {
    const key = callbackFn(element, index++);
    const groupKey = typeof key === 'symbol' ? String(key) : key;
    if (!Object.prototype.hasOwnProperty.call(result, groupKey)) result[groupKey] = [];
    result[groupKey].push(element);
  }
  return result;
}

// -----------------------------------------------------------------------------
// Rounding and bucketizing
// -----------------------------------------------------------------------------
export function roundToBucketBase(n: number): number {
  if (isNaN(n)) throw new Error('Input must be a number.');
  if (!Number.isFinite(n)) throw new Error('Input must be a finite number.');
  if (n === 0) return 0;
  const sign = Math.sign(n);
  const x = Math.abs(n);
  const pow10 = Math.pow(10, Math.floor(Math.log10(x)));
  const leading = Math.floor(x / pow10);
  return sign * leading * pow10;
}

export function bucketizeNumber(n: number): string {
  if (isNaN(n)) throw new Error('Input must be a number.');
  if (!Number.isFinite(n)) throw new Error('Input must be a finite number.');
  const floored = roundToBucketBase(n);
  const sign = floored < 0 ? '-' : '';
  let x = Math.abs(floored);
  const units = ['', 'k', 'M', 'B', 'T', 'P', 'E'];
  let u = 0;
  while (x >= 1000 && u < units.length - 1) {
    if (x % 1000 !== 0) break;
    x = x / 1000;
    u++;
  }
  return sign + String(x) + units[u];
}

// -----------------------------------------------------------------------------
// Deep sanitize (prevent prototype pollution)
// -----------------------------------------------------------------------------
export function deepSanitize<T>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) return obj;
  const result: any = Array.isArray(obj) ? [] : {};
  for (const key of Object.keys(obj)) {
    if (!['__proto__', 'constructor', 'prototype'].includes(key)) {
      result[key] = deepSanitize((obj as any)[key]);
    }
  }
  return result;
}
'use client';
import React from 'react';
import { toast } from 'sonner';

export function generateStars(
  rating: number,
  options: { width?: number; height?: number } = { width: 24, height: 24 }
): React.ReactElement[] {
  const stars = Math.floor(rating);
  const img: React.ReactElement[] = [];
  for (let i = 0; i < stars; i++) {
    img.push(
      React.createElement(
        'svg',
        {
          key: i,
          xmlns: 'http://www.w3.org/2000/svg',
          width: options.width,
          height: options.height,
          viewBox: '0 0 24 24',
          fill: 'none',
        },
        React.createElement('path', {
          d: 'M18.4687 22.5C18.3109 22.5 18.1562 22.5 ...', // use your actual path string
          fill: 'currentColor',
        })
      )
    );
  }
  return img;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
}
export function toPlainObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Uint8Array || Buffer.isBuffer(obj)) return '';
  if (Array.isArray(obj)) return obj.map(toPlainObject);
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    if (typeof obj.toString === 'function' && obj._bsontype === 'ObjectId') {
      return obj.toString();
    }
    const plain: any = {};
    for (const key of Object.keys(obj)) {
      plain[key] = toPlainObject(obj[key]);
    }
    return plain;
  }
  return obj;
}
// export function toPlainObject(obj: any): any {
//   if (obj === null || obj === undefined) return obj;
//   // Convert MongoDB ObjectId to string
//   if (typeof obj === 'object' && obj !== null && typeof obj.toString === 'function' && obj._bsontype === 'ObjectId') {
//     return obj.toString();
//   }
//   // Convert Uint8Array and Buffer to something harmless (string or empty)
//   if (obj instanceof Uint8Array || Buffer.isBuffer(obj)) {
//     return ''; // or Buffer.from(obj).toString('hex') if you need the data
//   }
//   if (Array.isArray(obj)) {
//     return obj.map(toPlainObject);
//   }
//   if (typeof obj === 'object' && !(obj instanceof Date)) {
//     const plain: any = {};
//     for (const key of Object.keys(obj)) {
//       plain[key] = toPlainObject(obj[key]);
//     }
//     return plain;
//   }
//   return obj;
// }




export function showResponseToast(response: ApiResponse): void {
  if (response.success === true) {
    toast.success(response.message || 'Operation successful!');
  } else {
    toast.error(response.message || 'Something went wrong.');
  }
}
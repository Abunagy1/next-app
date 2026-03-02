// In Our /app/ui folder, we created a new file called fonts.ts.
// we'll use this file to keep the fonts that will be used throughout Our application.
// Import the Inter font from the next/font/google module - 
// this will be your primary font. Then, specify what subset you'd like to load. In this case, 'latin':
// And Import a secondary font called Lusitana and pass it to the <p> element in your /app/page.tsx
import { Inter, Lusitana } from 'next/font/google';
// add a custom Google fonts
export const inter = Inter({ subsets: ['latin'] }); // Inter font class def & specify what subset you'd like to load. In this case, 'latin':.
export const lusitana = Lusitana({ // Lusitana font class def & subset like you did before, as font weights. 400 (normal) and 700 (bold)..
  weight: ['400', '700'],
  subsets: ['latin'],
});
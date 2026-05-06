import { minutesToHMFormat } from '@/app/lib/utils';

export default function minToHM(minutes: number): string {
  return minutesToHMFormat(+minutes);
}
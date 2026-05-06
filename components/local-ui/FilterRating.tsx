// 'use client';
// import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
// import { cn } from '@/app/lib/utils';
// interface FilterRatingProps {
//   className?: string;
//   value: string[];
//   setValue: (value: string[]) => void;
// }
// export function FilterRating({ className, value, setValue }: FilterRatingProps) {
//   return (
//     <ToggleGroup
//       type="multiple"
//       onValueChange={setValue}
//       value={value}
//       className={cn(
//         'w-full [&_button[data-state=on]]:border-primary [&_button[data-state=on]]:bg-primary/20 [&_button]:border dark:[&_button]:border-gray-600 dark:[&_button]:text-gray-300 dark:[&_button[data-state=on]]:bg-primary/30',
//         'relative z-10 pointer-events-auto',
//         className
//       )}
//     >
//       <ToggleGroupItem value="1" aria-label="Toggle 1 star">+1</ToggleGroupItem>
//       <ToggleGroupItem value="2" aria-label="Toggle 2 star">+2</ToggleGroupItem>
//       <ToggleGroupItem value="3" aria-label="Toggle 3 star">+3</ToggleGroupItem>
//       <ToggleGroupItem value="4" aria-label="Toggle 4 star">+4</ToggleGroupItem>
//       <ToggleGroupItem value="5" aria-label="Toggle 5 star">+5</ToggleGroupItem>
//     </ToggleGroup>
//   );
// }
'use client';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/app/lib/utils';

interface FilterRatingProps {
  className?: string;
  value: string[];
  setValue: (value: string[]) => void;
}

export function FilterRating({ className, value, setValue }: FilterRatingProps) {
  return (
    <ToggleGroup
      type="multiple"
      onValueChange={setValue}
      value={value}
      className={cn('w-full flex gap-1', className)}
    >
      {['1', '2', '3', '4', '5'].map((star) => (
        <ToggleGroupItem
          key={star}
          value={star}
          aria-label={`${star} star`}
          className={cn(
            'h-8 w-8 border-2 border-gray-300 dark:border-gray-600 rounded-md text-sm font-semibold',
            'text-gray-700 dark:text-gray-300',          // ← default off state
            'data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:border-blue-600',
            'hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors',
            'flex items-center justify-center'
          )}
        >
          +{star}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
// import { CheckIcon, ClockIcon } from '@heroicons/react/24/outline';
// // CLSX to conditionally style an element based on state or some other condition
// import clsx from 'clsx';
// // InvoiceStatus component which accepts status, If it's 'paid', you want the color to be green. If it's 'pending', you want the color to be gray.
// export default function InvoiceStatus({ status }: { status: string }) {
//   return (
//     <span
//       className={clsx( 
//         'inline-flex items-center rounded-full px-2 py-1 text-xs',
//         {
//           'bg-gray-100 text-gray-500': status === 'pending',
//           'bg-green-500 text-white': status === 'paid',
//         },
//       )}
//     >
//       {status === 'pending' ? (
//         <>
//           Pending
//           <ClockIcon className="ml-1 w-4 text-gray-500" />
//         </>
//       ) : null}
//       {status === 'paid' ? (
//         <>
//           Paid
//           <CheckIcon className="ml-1 w-4 text-white" />
//         </>
//       ) : null}
//     </span>
//   );
// }
import { CheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

export default function InvoiceStatus({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-1 text-xs',
        {
          'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300': status === 'pending',
          'bg-green-500 text-white dark:bg-green-600': status === 'paid',
        },
      )}
    >
      {status === 'pending' ? (
        <>
          Pending
          <ClockIcon className="ml-1 w-4 text-gray-500 dark:text-gray-300" />
        </>
      ) : null}
      {status === 'paid' ? (
        <>
          Paid
          <CheckIcon className="ml-1 w-4 text-white" />
        </>
      ) : null}
    </span>
  );
}
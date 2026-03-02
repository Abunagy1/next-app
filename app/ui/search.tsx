// "use client" -- This is a Client Component, which means you can use event listeners and hooks.
'use client';
/*
Here's a breakdown of what's happening:
${pathname} is the current path, in your case, "/dashboard/invoices".
As the user types into the search bar, params.toString() translates this input into a URL-friendly format.
replace(${pathname}?${params.toString()}) updates the URL with the user's search data.
For example, /dashboard/invoices?query=lee if the user searches for "Lee".
The URL is updated without reloading the page,
thanks to Next.js's client-side navigation (which you learned about in the chapter on navigating between pages.

You're updating the URL on every keystroke, and therefore querying your database on every keystroke!
This isn't a problem as our application is small, but imagine if your application had thousands of users,
each sending a new request to your database on each keystroke.
Debouncing is a programming practice that limits the rate at which a function can fire.
In our case, you only want to query the database when the user has stopped typing.
we'll use a library called use-debounce  --> npm i use-debounce
How Debouncing Works:
Trigger Event: When an event that should be debounced (like a keystroke in the search box) occurs, a timer starts.
Wait: If a new event occurs before the timer expires, the timer is reset.
Execution: If the timer reaches the end of its countdown, the debounced function is executed.
*/
import { useDebouncedCallback } from 'use-debounce';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
//Import the useSearchParams hook from next/navigation and assign it to a variable:
// If you have the query string. You can use Next.js's useRouter and usePathname hooks to update the URL.
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

// WE Create a new handleSearch function, and add an onChange listener to the <input> element.
// onChange will invoke handleSearch whenever the input value changes.
/*  
URLSearchParams is a Web API that provides utility methods for manipulating the URL query parameters.
Instead of creating a complex string literal, you can use it to get the params string like ?page=1&query=a.
*/

export default function Search({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  // Inside handleSearch, create a new URLSearchParams instance using your new searchParams variable.
  // Inside your handleSearch function, add the following console.log:
  const handleSearch = useDebouncedCallback((term) => {
    console.log(`Searching... ${term}`);
    // URLSearchParams is a Web API that provides utility methods for manipulating the URL query parameters.
    // Instead of creating a complex string literal, you can use it to get the params string like ?page=1&query=a.
    const params = new URLSearchParams(searchParams);
    // you want to reset the page number to 1. You can do this by updating the handleSearch function in your <Search> component:
    params.set('page', '1');
    //Next, set the params string based on the user’s input. If the input is empty, you want to delete it:
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }
    //Now that you have the query string. You can use Next.js's useRouter and usePathname hooks to update the URL.
    replace(`${pathname}?${params.toString()}`);
  }, 300);
  // <input> - This is the search input.
  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 dark:text-gray-400 focus:ring-1 focus:ring-gray-300 focus:ring-offset-1 focus:ring-offset-white focus-visible:outline-none dark:focus:ring-gray-600 dark:focus:ring-offset-gray-900"
        placeholder={placeholder}
        onChange={(e) => {
          handleSearch(e.target.value);
        }}
        // To ensure the input field is in sync with the URL and will be populated when sharing,
        // you can pass a defaultValue to input by reading from searchParams:
        defaultValue={searchParams.get('query')?.toString()}
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 dark:text-gray-400 focus:ring-1 focus:ring-gray-300 focus:ring-offset-1 focus:ring-offset-white focus-visible:outline-none dark:focus:ring-gray-600 dark:focus:ring-offset-gray-900 peer-focus:text-gray-900" />
    </div>
  );
}

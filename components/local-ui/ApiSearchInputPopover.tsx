'use client';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import Image from 'next/image';
import { cn, debounce } from '@/app/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import searchIcon from '@/public/travel/icons/search.svg';
interface FetchInputs {
  url: string;
  method?: string;
  searchParamsName: string;
  next?: { revalidate?: number; tags?: string[] };
}
interface ApiSearchInputPopoverProps<T> {
  className?: string;
  defaultSelected?: T;
  fetchInputs: FetchInputs;
  isLoading?: boolean;
  getSelectedResult?: (selected: T) => void;
  renderSelectedResult: (obj: T) => React.ReactNode;
  getSearchResults?: (data: any) => void;
  renderSearchResults: (
    result: any,
    setOpen: (open: boolean) => void,
    setSelected: (selected: T) => void
  ) => React.ReactNode;
}
export function ApiSearchInputPopover<T extends Record<string, any>>({
  className,
  defaultSelected = {} as T,
  fetchInputs,
  isLoading = false,
  getSelectedResult = () => {},
  renderSelectedResult,
  getSearchResults = () => {},
  renderSearchResults,
}: ApiSearchInputPopoverProps<T>) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState<T>(defaultSelected);
  const [selectedState, setSelectedState] = useState<T>({} as T);
  // Notify parent only when selectedState actually changes (deep compare)
  useEffect(() => {
    getSelectedResult(selectedState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(selectedState)]);
  // Update internal value when defaultSelected changes
  useEffect(() => {
    setVal(defaultSelected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(defaultSelected)]);
return (
    <Popover open={open} onOpenChange={(open) => !isLoading && setOpen(open)}>
      <PopoverTrigger asChild className={cn('cursor-pointer', className)}>
        {renderSelectedResult(val)}
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-2 md:w-[400px] dark:bg-gray-800 dark:border-gray-700" align="center">
        <SearchResults
          setOpen={setOpen}
          setSelected={setSelectedState}
          getSelectedResult={getSelectedResult}
          getSearchResults={getSearchResults}
          renderSearchResults={renderSearchResults}
          fetchInputs={fetchInputs}
        />
      </PopoverContent>
    </Popover>
  );
}
interface SearchResultsProps<T> {
  setOpen: (open: boolean) => void;
  setSelected: (selected: T) => void;
  getSelectedResult?: (selected: T) => void;
  getSearchResults: (data: any) => void;
  renderSearchResults: (
    result: any,
    setOpen: (open: boolean) => void,
    setSelected: (selected: T) => void
  ) => React.ReactNode;
  fetchInputs: FetchInputs;
}
function SearchResults<T>({
  setOpen,
  setSelected,
  getSearchResults = () => {},
  renderSearchResults,
  fetchInputs,
}: SearchResultsProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const urlSearchParam = new URLSearchParams({
    [fetchInputs.searchParamsName]: searchQuery,
  }).toString();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
useEffect(() => {
  async function getData() {
    setLoading(true);
    try {
      const res = await fetch(`${fetchInputs.url}?${urlSearchParam}`, {
        next: { revalidate: fetchInputs?.next?.revalidate || 600, tags: fetchInputs?.next?.tags },
        method: fetchInputs?.method || 'GET',
        cache: 'default',
      });
      if (!res.ok) {
        setData({ success: false, message: `Error ${res.status}` });
        return;
      }
      const json = await res.json();
      setData(json);
      getSearchResults(json);
    } catch (err) {
      setData({ success: false, message: 'Network error' });
    } finally {
      setLoading(false);
    }
  }
  getData();
}, [urlSearchParam, fetchInputs, getSearchResults]);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value || '';
    setSearchQuery(value);
  };
  return (
    <div>
      <div className="mb-2 flex">
        <div className="flex items-center justify-center rounded-md rounded-l border border-r-0 p-1 dark:border-gray-600 dark:bg-gray-800">
          <Image src={searchIcon} alt="search_icon" />
        </div>
        <Input
          ref={inputRef}
          defaultValue={searchQuery}
          className="!h-full w-full rounded-l-[0px] border-l-0 bg-transparent outline-none transition-all hover:bg-muted dark:bg-gray-800 dark:text-white dark:border-gray-600"
          placeholder="Search..."
          onChange={debounce(handleInputChange)}
        />
      </div>
      {loading ? (
        <div className="goBye-scrollbar flex h-80 flex-col gap-2 overflow-auto"> 
          {/*  you can remove goBye-scrollbar if not needed */}
          {[1, 2, 3, 4, 5].map((el) => (
            <Skeleton key={el} className="h-[60px] w-full" />
          ))}
        </div>
      ) : (
        <div className="goBye-scrollbar flex h-80 flex-col gap-2 overflow-auto">
          {!data || data.length < 1 ? (
            <div className="flex h-full items-center justify-center p-2 text-center text-sm font-bold dark:text-gray-400">
              No results found
            </div>
          ) : (
            renderSearchResults(data, setOpen, setSelected)
          )}
        </div>
      )}
    </div>
  );
}
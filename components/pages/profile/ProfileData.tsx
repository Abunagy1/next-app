
import { TabsTrigger, Tabs, TabsList, TabsContent } from "@/components/ui/tabs";
import { AccountDetails } from "@/components/pages/profile/AccountDetails";
import { TicketsOrBookings } from "@/components/pages/profile/TicketsOrBookings";
import SavedCards from "./SavedCards";

interface ProfileDataProps {
  userDetails: any;
  tab?: string;
  
}
export function ProfileData({ userDetails, tab }: ProfileDataProps) {
  return (
    <Tabs className="w-full bg-transparent p-0" defaultValue={tab || "account"}>
      <TabsList className="mb-4 flex flex-row justify-start gap-1 bg-white dark:bg-gray-800 p-0 shadow-md rounded-md">
        <TabsTrigger value="account" className="h-[48px] w-full grow gap-2 font-bold md:h-[60px] dark:data-[state=active]:bg-gray-700 dark:text-gray-300">Account</TabsTrigger>
        <TabsTrigger value="tickets/bookings" className="h-[48px] w-full grow gap-2 font-bold max-xsm:text-wrap md:h-[60px] dark:data-[state=active]:bg-gray-700 dark:text-gray-300">Tickets / Bookings</TabsTrigger>
        <TabsTrigger value="payment_methods" className="h-[48px] w-full grow gap-2 font-bold max-xsm:text-wrap md:h-[60px] dark:data-[state=active]:bg-gray-700 dark:text-gray-300">Payment Methods</TabsTrigger>
      </TabsList>
      <TabsContent value="account"><AccountDetails userDetails={userDetails} /></TabsContent>
      <TabsContent value="tickets/bookings"><TicketsOrBookings /></TabsContent>
      <TabsContent value="payment_methods"><SavedCards /></TabsContent>
    </Tabs>
  );
}
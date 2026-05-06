// "use client";
// import Link from "next/link";
// import { cn } from "@/app/lib/utils";
// import { useSearchParams } from "next/navigation";
// import routes from "@/data/routes.json";

// export function SettingsSideBar() {
//   const searchParams = useSearchParams();
//   const currentTab = searchParams.get("tab");
//   const isActive = (tab: string) =>
//     currentTab === tab
//       ? "font-bold text-primary bg-primary/10 dark:bg-primary/20 dark:text-primary"
//       : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700";

//   const settingTabs = ["profile", "account", "payments", "security", "appearance"];

//   return (
//     <div className="w-full border-b border-r-0 border-slate-200 p-4 md:w-60 md:border-b-0 md:border-r xl:w-80 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
//       <ul className="flex flex-col gap-2">
//         {settingTabs.map((tab, i) => (
//           <li key={tab} className="w-full rounded-md hover:bg-slate-100">
//             <Link className={cn("block h-full w-full p-2 capitalize", isActive(tab), i === 0 && !currentTab && "bg-primary/10 font-bold text-primary", "dark:text-white dark:hover:bg-gray-700")} href={`${routes.settings.path}?tab=${tab}`}>
//               {tab}
//             </Link>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

"use client";
import Link from "next/link";
import { cn } from "@/app/lib/utils";
import { useSearchParams } from "next/navigation";
import routes from "@/data/routes.json";

export function SettingsSideBar() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");

  const isActive = (tab: string) =>
    currentTab === tab
      ? "font-bold text-primary bg-primary/10 dark:bg-primary/20 dark:text-primary"
      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700";

  const settingTabs = ["profile", "account", "payments", "security", "appearance"];

  return (
    <div className="w-full border-b border-r-0 border-slate-200 dark:border-gray-700 p-4 md:w-60 md:border-b-0 md:border-r xl:w-80 bg-white dark:bg-gray-800">
      <ul className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible">
        {settingTabs.map((tab) => (
          <li key={tab} className="w-full rounded-md">
            <Link
              className={cn(
                "block h-full w-full p-2 capitalize rounded-md transition-colors",
                isActive(tab),
                !currentTab && tab === "profile" && "bg-primary/10 font-bold text-primary dark:bg-primary/20 dark:text-primary"
              )}
              href={`${routes.settings.path}?tab=${tab}`}
            >
              {tab}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
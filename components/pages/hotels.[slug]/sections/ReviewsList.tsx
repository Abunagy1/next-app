// import { OneReview } from "@/components/pages/hotels.[slug]/sections/OneReview";
// import Image from "next/image";
// import leftArrow from "@/public/travel/icons/forward.svg";
// export function ReviewsList() {
//   return (
//     <>
//       <div>
//         <OneReview />
//         <OneReview />
//         <OneReview />
//       </div>
//       <div className="flex justify-center gap-[24px]">
//         <Image
//           className="rotate-180"
//           src={leftArrow}
//           alt=""
//           height={24}
//           width={24}
//         />
//         <p>1 of 40</p>
//         <Image src={leftArrow} alt="" height={24} width={24} />
//       </div>
//     </>
//   );
// }
import { OneReview } from "./OneReview";
import Image from "next/image";
import leftArrow from "@/public/icons/forward.svg";
export function ReviewsList() {
  return (
    <>
      <div>
        <OneReview />
        <OneReview />
        <OneReview />
      </div>
      <div className="flex justify-center gap-[24px] dark:bg-gray-800 dark:text-white">
        <Image className="rotate-180" src={leftArrow} alt="" height={24} width={24} />
        <p>1 of 40</p>
        <Image src={leftArrow} alt="" height={24} width={24} />
      </div>
    </>
  );
}
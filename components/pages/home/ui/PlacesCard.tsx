import Image from "next/image";
import { Fragment } from "react";

interface PLacesCardProps {
  imgSrc?: string;
  placeName?: string;
  tags?: string[];
}

export function PLacesCard({ imgSrc = "", placeName = "Tokyo", tags = ["Flight", "Hotel"] }: PLacesCardProps) {
  return (
    <div className="flex items-center gap-[16px] rounded-[16px] border p-[16px] shadow-md dark:border-gray-700 dark:bg-gray-800">
      <Image className="aspect-square w-[90px] rounded-[8px]" width={90} height={90} src={imgSrc} alt="" />
      <div>
        <p className="font-semibold text-secondary opacity-70 dark:text-white">{placeName}</p>
        <p>
          {tags.map((tag, i) => (
            <Fragment key={i}>
              <span className="text-[0.875rem] font-medium text-secondary dark:text-gray-400">{tag}</span>
              {i !== tags.length - 1 && <span className="mx-[8px] inline-block">•</span>}
            </Fragment>
          ))}
        </p>
      </div>
    </div>
  );
}
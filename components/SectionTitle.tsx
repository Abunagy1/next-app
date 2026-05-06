interface SectionTitleProps {
  title: string;
  subTitle: string;
  className?: string;
}

export function SectionTitle({ title, subTitle, className }: SectionTitleProps) {
  return (
    <div className={className}>
      <h2 className="mb-2 text-[2rem] font-semibold text-black max-md:text-center md:mb-4 dark:text-white">{title}</h2>
      <p className="opacity-75 max-md:text-center dark:text-gray-400">{subTitle}</p>
    </div>
  );
}
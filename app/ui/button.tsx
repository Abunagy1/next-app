import clsx from 'clsx';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'destructive';
}
export function Button({ children, className, variant = 'default', ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={clsx(
        'flex h-10 items-center rounded-lg px-4 text-sm font-medium text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 active:aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
        variant === 'default' && 'bg-blue-500 hover:bg-blue-400 focus-visible:outline-blue-500 active:bg-blue-600',
        variant === 'destructive' && 'bg-red-500 hover:bg-red-400 focus-visible:outline-red-500 active:bg-red-600',
        className,
      )}
    >
      {children}
    </button>
  );
}
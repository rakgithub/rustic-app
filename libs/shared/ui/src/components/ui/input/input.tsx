import * as React from "react";
import { cn } from "cn";

type InputProps = React.ComponentProps<"input"> & {
  icon?: React.ReactNode;
};

function Input({ className, type, icon, ...props }: InputProps) {
  const input = (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-w-0 rounded-[var(--input-radius)] border border-[var(--input-border)] bg-[var(--input-background)] px-[var(--input-padding-inline)] py-[var(--input-padding-block)] text-sm leading-[var(--font-line-height-normal)] text-[var(--input-foreground)] transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[var(--input-placeholder)] focus-visible:border-[var(--input-border-focus)] focus-visible:ring-3 focus-visible:ring-[var(--input-border-focus)]/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-[var(--input-border-disabled)] disabled:bg-[var(--input-background-disabled)] disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        icon && "pl-10",
        className,
      )}
      {...props}
    />
  );

  if (!icon) return input;

  return (
    <div className="relative w-full" data-slot="input-wrapper">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-[var(--input-padding-inline)] text-[var(--input-placeholder)] [&_svg]:size-4"
        data-slot="input-icon"
      >
        {icon}
      </span>
      {input}
    </div>
  );
}

export { Input };

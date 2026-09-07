import * as React from "react";
import { cn } from "cn";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-w-0 rounded-[var(--input-radius)] border border-[var(--input-border)] bg-[var(--input-background)] px-[var(--input-padding-inline)] py-[var(--input-padding-block)] text-sm leading-[var(--font-line-height-normal)] text-[var(--input-foreground)] transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[var(--input-placeholder)] focus-visible:border-[var(--input-border-focus)] focus-visible:ring-3 focus-visible:ring-[var(--input-border-focus)]/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-[var(--input-border-disabled)] disabled:bg-[var(--input-background-disabled)] disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export { Input };

import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-base text-texto placeholder:text-texto/30 transition-all duration-200 focus-visible:outline-none focus-visible:border-primaria focus-visible:ring-4 focus-visible:ring-primaria/10 focus-visible:shadow-[0_0_12px_rgba(22,163,74,0.1)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };

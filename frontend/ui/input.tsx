import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-2xl border border-border bg-card px-4 text-sm text-foreground",
        "placeholder:text-muted-foreground transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

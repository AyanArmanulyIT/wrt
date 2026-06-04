import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

export const Badge = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-medium",
        "bg-muted text-muted-foreground border border-border/50",
        className
      )}
      {...props}
    />
  )
);
Badge.displayName = "Badge";
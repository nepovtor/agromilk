import * as React from "react";
import { cn } from "@/lib/utils";
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-11 rounded-xl border border-(--border) bg-white px-3 text-sm outline-none focus:border-(--primary) focus:ring-2 focus:ring-blue-100",
      className,
    )}
    {...props}
  />
));
Select.displayName = "Select";

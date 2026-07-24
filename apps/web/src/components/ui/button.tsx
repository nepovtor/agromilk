import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const variants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[.98]",
  {
    variants: {
      variant: {
        default:
          "bg-(--primary) text-white shadow-[0_8px_22px_-8px_rgba(109,74,255,.75)] hover:-translate-y-0.5 hover:bg-[#5e3bea] hover:shadow-[0_12px_26px_-8px_rgba(109,74,255,.72)]",
        secondary: "bg-(--secondary) text-(--secondary-foreground) hover:opacity-85",
        outline:
          "border border-(--border) bg-white hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50",
        ghost: "hover:bg-(--muted)",
        destructive: "bg-(--destructive) text-white hover:opacity-90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof variants> {}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(variants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";

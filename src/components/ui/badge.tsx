import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-teal-100 text-teal-800 border border-teal-300",
        secondary: "bg-slate-100 text-slate-800 border border-slate-300",
        destructive: "bg-red-100 text-red-800 border border-red-300",
        success: "bg-emerald-100 text-emerald-800 border border-emerald-300",
        warning: "bg-amber-100 text-amber-800 border border-amber-300",
        info: "bg-blue-100 text-blue-800 border border-blue-300",
        outline: "text-slate-950 border border-slate-300",
        // Special large badges for patient views
        patientLarge: "text-base px-4 py-1.5 font-bold rounded-lg border-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

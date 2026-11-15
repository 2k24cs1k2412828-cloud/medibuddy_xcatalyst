import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-teal-700 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default: "bg-teal-700 text-white hover:bg-teal-800 active:bg-teal-900 shadow-sm",
        secondary: "bg-slate-200 text-slate-900 hover:bg-slate-300 active:bg-slate-400",
        outline: "border-2 border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-400",
        ghost: "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
        destructive: "bg-red-700 text-white hover:bg-red-800 active:bg-red-900",
        success: "bg-emerald-700 text-white hover:bg-emerald-800 active:bg-emerald-900",
        // Special Patient-accessible buttons
        patientPrimary: "bg-teal-700 text-white hover:bg-teal-800 text-xl font-bold min-h-[60px] px-8 rounded-xl shadow-md border-2 border-teal-800",
        patientSuccess: "bg-emerald-700 text-white hover:bg-emerald-800 text-xl font-bold min-h-[60px] px-8 rounded-xl shadow-md border-2 border-emerald-800",
        patientSecondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 text-lg font-semibold min-h-[52px] px-6 rounded-xl border-2 border-slate-300",
        patientWarning: "bg-amber-600 text-white hover:bg-amber-700 text-lg font-bold min-h-[52px] px-6 rounded-xl border-2 border-amber-700",
      },
      size: {
        default: "h-11 px-5 py-2 text-base",
        sm: "h-9 rounded-md px-3 text-sm",
        lg: "h-14 rounded-xl px-8 text-lg",
        icon: "h-11 w-11",
        patient: "min-h-[60px] px-8 py-3 text-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

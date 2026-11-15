import * as React from "react";
import { cn } from "@/lib/utils";

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  isPatient?: boolean;
}

export function PageContainer({
  children,
  className,
  isPatient = false,
  ...props
}: PageContainerProps) {
  return (
    <main
      className={cn(
        "flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full",
        isPatient && "p-6 md:p-10 max-w-5xl",
        className
      )}
      {...props}
    >
      {children}
    </main>
  );
}

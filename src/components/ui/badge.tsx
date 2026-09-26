import { cn } from "@/lib/utils";
import React from "react";

export function Badge({ children, className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span 
      className={cn("inline-flex items-center rounded-full bg-elevated px-3 py-1 font-nunito text-xs font-bold text-text-secondary border border-border", className)}
      {...props}
    >
      {children}
    </span>
  );
}

import { cn } from "@/lib/utils";
import React from "react";

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("bg-surface rounded-2xl border-2 border-border p-5", className)} {...props}>
      {children}
    </div>
  );
}

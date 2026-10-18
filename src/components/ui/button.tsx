import { cn } from "@/lib/utils";
import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "surface";
  size?: "default" | "sm" | "lg";
}

// Duolingo 3D button:
// Resting: Solid 4px colored bottom shadow.
// Active (mouse down / touch): sinks 4px down into the shadow space, shadow collapses to 0.
// On release: snaps right back up instantly via pure CSS without JS state desyncs.
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "default", className, children, disabled, type = "button", ...props }, ref) => {
    const is3D = variant !== "ghost";

    const sizes = {
      default: "text-base py-3 px-6 min-h-[48px]",
      sm: "text-sm py-2 px-4 min-h-[36px]",
      lg: "text-lg py-4 px-8 min-h-[58px]",
    };

    const variants = {
      primary: cn(
        "bg-primary text-[#16151A]",
        is3D && "shadow-[0_4px_0_0_#46A302] hover:brightness-105 active:translate-y-[4px] active:shadow-[0_0_0_0_#46A302]"
      ),
      secondary: cn(
        "bg-secondary text-white",
        is3D && "shadow-[0_4px_0_0_#B8226F] hover:brightness-105 active:translate-y-[4px] active:shadow-[0_0_0_0_#B8226F]"
      ),
      surface: cn(
        "bg-elevated text-white border border-border/60",
        is3D && "shadow-[0_4px_0_0_#16151A] hover:brightness-110 active:translate-y-[4px] active:shadow-[0_0_0_0_#16151A]"
      ),
      danger: cn(
        "bg-danger text-white",
        is3D && "shadow-[0_4px_0_0_#9E2B2A] hover:brightness-105 active:translate-y-[4px] active:shadow-[0_0_0_0_#9E2B2A]"
      ),
      ghost: "bg-transparent text-text-secondary hover:text-white hover:bg-white/5 active:scale-95",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          "relative w-full flex items-center justify-center font-black rounded-2xl cursor-pointer select-none tracking-wide",
          "transition-[transform,box-shadow,filter] duration-75 ease-out",
          is3D && "mb-[4px] translate-y-0",
          sizes[size],
          variants[variant],
          disabled && "opacity-50 cursor-not-allowed pointer-events-none active:translate-y-0 active:shadow-none",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

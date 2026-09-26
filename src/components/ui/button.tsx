import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "surface";
  size?: "default" | "sm" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "default", className, children, ...props }, ref) => {
    const baseClasses = "relative w-full flex items-center justify-center font-bold rounded-2xl transition-colors";
    
    const sizes = {
      default: "text-base py-3 px-6 min-h-[48px]",
      sm: "text-sm py-2 px-4 min-h-[36px]",
      lg: "text-lg py-4 px-8 min-h-[60px]"
    };
    const variants = {
      primary: "bg-primary text-[#16151A] border-b-[5px] border-primary-shadow hover:brightness-110",
      secondary: "bg-secondary text-white border-b-[5px] border-secondary-shadow hover:brightness-110",
      surface: "bg-elevated text-white border-b-[5px] border-border hover:brightness-110",
      danger: "bg-danger text-white border-b-[5px] border-[#B73736] hover:brightness-110",
      ghost: "bg-transparent text-text-secondary hover:text-white",
    };

    const is3D = variant !== "ghost";

    return (
      <motion.button
        ref={ref}
        whileTap={is3D ? { y: 5, borderBottomWidth: 0, marginBottom: 5 } : { scale: 0.96 }}
        className={cn(baseClasses, sizes[size], variants[variant], className)}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
Button.displayName = "Button";

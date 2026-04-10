import { cn } from "../../lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg border transition-all duration-150",
          "hover:scale-[0.98] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-primary text-white border-primary hover:bg-[#4338CA]":
              variant === "primary",
            "bg-white text-foreground border-border hover:bg-accent":
              variant === "secondary",
            "bg-transparent text-foreground border-transparent hover:bg-accent":
              variant === "ghost",
            "bg-destructive text-white border-destructive hover:bg-[#B91C1C]":
              variant === "danger",
          },
          {
            "px-3 py-1.5 text-xs": size === "sm",
            "px-4 py-2": size === "md",
            "px-6 py-3": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

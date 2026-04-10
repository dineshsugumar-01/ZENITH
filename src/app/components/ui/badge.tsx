import { cn } from "../../lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "secondary";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        {
          "bg-accent text-foreground": variant === "default",
          "bg-[#DCFCE7] text-[#166534]": variant === "success",
          "bg-[#FEF3C7] text-[#92400E]": variant === "warning",
          "bg-[#FEE2E2] text-[#991B1B]": variant === "danger",
          "bg-[#F3F4F6] text-secondary": variant === "secondary",
        },
        className
      )}
    >
      {children}
    </span>
  );
}

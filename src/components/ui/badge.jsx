import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-accent text-primary hover:opacity-90",
        secondary: "border-transparent bg-secondary text-white hover:opacity-90",
        success: "border-transparent bg-[#2ECC71] text-white hover:bg-[#27b564]",
        destructive: "border-transparent bg-[#E74C3C] text-white hover:bg-[#cf4334]",
        outline: "border border-primary/20 text-primary",
        complete: "border-transparent bg-primary text-primary-foreground hover:opacity-90",
        pending: "border-transparent bg-secondary text-secondary-foreground hover:opacity-90",
        proceed: "border-transparent bg-accent text-accent-foreground hover:opacity-90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };


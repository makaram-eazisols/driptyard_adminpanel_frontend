import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[#E0B74F] text-[#0B0B0D] hover:bg-[#d8a93f]",
        secondary: "border-transparent bg-[#1F4E79] text-white hover:bg-[#183c5c]",
        success: "border-transparent bg-[#2ECC71] text-white hover:bg-[#27b564]",
        destructive: "border-transparent bg-[#E74C3C] text-white hover:bg-[#cf4334]",
        outline: "border border-[#0B0B0D]/20 text-[#0B0B0D]",
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


"use client";

import { Loader2Icon } from "lucide-react";
import type { SVGAttributes } from "react";

import { cn } from "@/lib/utils";

export type SpinnerProps = SVGAttributes<SVGSVGElement> & {
  /** Omit when nested in a control that exposes `aria-busy` (pending button). */
  label?: string;
};

export function Spinner({ className, label, ...props }: SpinnerProps) {
  return (
    <Loader2Icon
      role={label ? "status" : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
      className={cn("size-4 shrink-0 animate-spin motion-reduce:animate-none", className)}
      {...props}
    />
  );
}

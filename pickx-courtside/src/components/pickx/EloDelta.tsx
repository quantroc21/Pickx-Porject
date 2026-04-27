import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface EloDeltaProps {
  delta: number;
  className?: string;
  size?: "sm" | "md";
}

export function EloDelta({ delta, className, size = "sm" }: EloDeltaProps) {
  const positive = delta >= 0;
  const sizeCls = size === "md" ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-xs";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-mono-stat font-semibold",
        positive
          ? "bg-success/15 text-success ring-1 ring-success/30"
          : "bg-danger/15 text-danger ring-1 ring-danger/30",
        sizeCls,
        className,
      )}
    >
      {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
      {positive ? "+" : ""}
      {delta} ĐH
    </span>
  );
}
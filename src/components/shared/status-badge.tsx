import { OrderStatus } from "@/types";
import { STATUS_CONFIG } from "@/lib/constants";

export function StatusBadge({ status, size = "sm" }: { status: OrderStatus; size?: "sm" | "xs" }) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.color} ${config.bg} ${
        size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      }`}
    >
      <span className={`rounded-full ${config.dotColor} ${size === "xs" ? "w-1 h-1" : "w-1.5 h-1.5"}`} />
      {config.label}
    </span>
  );
}

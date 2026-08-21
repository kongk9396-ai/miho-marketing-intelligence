import { cn } from "@/lib/utils";

export type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral";

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
}

const variantStyles: Record<StatusVariant, { badge: string; dot: string }> = {
  success: { badge: "bg-green-50 text-green-700 ring-green-200", dot: "bg-green-500" },
  warning: { badge: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  danger: { badge: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500" },
  info: { badge: "bg-blue-50 text-blue-700 ring-blue-200", dot: "bg-blue-500" },
  neutral: { badge: "bg-gray-100 text-gray-600 ring-gray-200", dot: "bg-gray-400" },
};

export function StatusBadge({ label, variant = "neutral" }: StatusBadgeProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        styles.badge
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
      {label}
    </span>
  );
}

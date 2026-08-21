import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
        <Icon className="h-5 w-5 text-gray-400" strokeWidth={2} />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-gray-500">{description}</p>
    </div>
  );
}

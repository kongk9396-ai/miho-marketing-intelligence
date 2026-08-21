import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">{children}</div>
      </main>
    </div>
  );
}

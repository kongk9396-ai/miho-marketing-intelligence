"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { navSections } from "@/lib/nav-config";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white">
          <BarChart3 className="h-4.5 w-4.5" strokeWidth={2.25} />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-gray-900">MIHO</p>
          <p className="text-[11px] text-gray-500">마케팅 인텔리전스</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {navSections.map((section, index) => (
          <div key={section.title ?? `section-${index}`}>
            {section.title ? (
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {section.title}
              </p>
            ) : null}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-blue-600" : "text-gray-400"
                        )}
                        strokeWidth={2}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <p className="text-[11px] text-gray-400">사내 전용</p>
      </div>
    </aside>
  );
}

import {
  ClipboardList,
  ChartLine,
  Waypoints,
  History,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    items: [
      {
        label: "요약 보고",
        href: "/report",
        icon: ClipboardList,
      },
      {
        label: "광고 성과",
        href: "/ads-analysis/overview",
        icon: ChartLine,
      },
      {
        label: "고객 흐름",
        href: "/funnel/landing",
        icon: Waypoints,
      },
      {
        label: "변경 기록",
        href: "/changes/creative",
        icon: History,
      },
      {
        label: "관리",
        href: "/data/meta-sync",
        icon: Settings,
      },
    ],
  },
];

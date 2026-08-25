import {
  LayoutDashboard,
  ClipboardList,
  ChartLine,
  Megaphone,
  Image as ImageIcon,
  Video,
  GitCompare,
  Globe,
  MousePointerClick,
  Users,
  CalendarCheck,
  PenLine,
  LayoutTemplate,
  Wallet,
  FileText,
  CalendarDays,
  Send,
  Upload,
  MailCheck,
  RefreshCw,
  Waypoints,
  Database,
  Settings,
  SlidersHorizontal,
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
      { label: "종합 보고", href: "/report", icon: ClipboardList },
      { label: "대시보드", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    title: "광고 분석",
    items: [
      { label: "전체 성과", href: "/ads-analysis/overview", icon: ChartLine },
      { label: "캠페인", href: "/ads-analysis/campaigns", icon: Megaphone },
      {
        label: "소재 분석",
        href: "/ads-analysis/creative-analysis",
        icon: ImageIcon,
      },
      {
        label: "영상 분석",
        href: "/ads-analysis/video-analysis",
        icon: Video,
      },
      {
        label: "전후 비교",
        href: "/ads/before-after",
        icon: GitCompare,
      },
      {
        label: "랜딩 전후 비교",
        href: "/landing/before-after",
        icon: LayoutTemplate,
      },
    ],
  },
  {
    title: "퍼널 분석",
    items: [
      { label: "GA4", href: "/funnel/ga4", icon: Globe },
      {
        label: "랜딩 분석",
        href: "/funnel/landing",
        icon: MousePointerClick,
      },
      { label: "DB 분석", href: "/funnel/leads", icon: Users },
      {
        label: "상담 / 예약",
        href: "/funnel/consultation-booking",
        icon: CalendarCheck,
      },
    ],
  },
  {
    title: "변경 이력",
    items: [
      {
        label: "소재 변경",
        href: "/changes/creative",
        icon: PenLine,
      },
      {
        label: "랜딩 변경",
        href: "/changes/landing",
        icon: LayoutTemplate,
      },
      {
        label: "예산 변경",
        href: "/change-history/budget-changes",
        icon: Wallet,
      },
    ],
  },
  {
    title: "리포트",
    items: [
      { label: "일일 리포트", href: "/reports/daily", icon: FileText },
      { label: "주간 리포트", href: "/reports/weekly", icon: CalendarDays },
      { label: "텔레그램", href: "/reports/telegram", icon: Send },
    ],
  },
  {
    title: "데이터",
    items: [
      { label: "Meta 자동 수집", href: "/data/meta-sync", icon: MailCheck },
      { label: "Meta CSV 업로드", href: "/data/meta-csv-upload", icon: Upload },
      { label: "GA4 자동 수집", href: "/data/ga4-sync", icon: RefreshCw },
      { label: "DB 자동 동기화", href: "/data/leads-sync", icon: Users },
      { label: "데이터 매핑", href: "/data/utm-mapping", icon: Waypoints },
    ],
  },
  {
    title: "설정",
    items: [
      { label: "광고 운영 설정", href: "/settings/ad-operations", icon: SlidersHorizontal },
      { label: "데이터베이스", href: "/settings/database", icon: Database },
      { label: "텔레그램", href: "/settings/telegram", icon: Send },
      { label: "기본 설정", href: "/settings/general", icon: Settings },
    ],
  },
];

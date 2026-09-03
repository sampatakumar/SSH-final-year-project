import {
  BarChart3,
  Bot,
  Code2,
  FileText,
  GitBranch,
  Globe,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  Settings,
  Sparkles,
  Target,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

export type DashboardLink = {
  to: string;
  icon: LucideIcon;
  label: string;
  badge?: string;
};

export const dashboardLinks: DashboardLink[] = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { to: "/dashboard/mentor", icon: Bot, label: "Smart Mentor", badge: "AI" },
  { to: "/dashboard/skills", icon: Sparkles, label: "Skill Profile" },
  { to: "/dashboard/gaps", icon: Target, label: "Skill Gaps" },
  { to: "/dashboard/roadmap", icon: MapPin, label: "Learning Roadmap" },
  { to: "/dashboard/edutube", icon: GraduationCap, label: "EduTube", badge: "New" },
  { to: "/dashboard/coding", icon: Code2, label: "Coding Assessment" },
  { to: "/dashboard/github", icon: GitBranch, label: "GitHub Intelligence" },
  { to: "/dashboard/resumes", icon: FileText, label: "Resume AI" },
  { to: "/dashboard/portfolios", icon: Globe, label: "Portfolios" },
  { to: "/dashboard/profile", icon: UserCheck, label: "Profile Details" },
  { to: "/dashboard/analytics", icon: BarChart3, label: "My Analytics" },
  { to: "/dashboard/settings", icon: Settings, label: "Settings" },
];


import {
  BarChart3,
  Bot,
  ClipboardCheck,
  Code2,
  Compass,
  FileText,
  FolderGit2,
  FlaskConical,
  GitBranch,
  Globe,
  GraduationCap,
  LayoutDashboard,
  MapPin,
  Settings,
  Sparkles,
  Target,
  UserCheck,
  Wrench,
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
  { to: "/dashboard/assessments", icon: ClipboardCheck, label: "Assessment Center", badge: "New" },
  { to: "/dashboard/labs", icon: FlaskConical, label: "Practical Labs", badge: "New" },
  { to: "/dashboard/career-pathways", icon: Compass, label: "Career Pathways", badge: "New" },
  { to: "/dashboard/tools", icon: Wrench, label: "Specialized Tools", badge: "New" },
  { to: "/dashboard/github", icon: GitBranch, label: "GitHub Intelligence" },
  { to: "/dashboard/resumes", icon: FileText, label: "Resume AI" },
  { to: "/dashboard/projects", icon: FolderGit2, label: "Projects" },
  { to: "/dashboard/portfolios", icon: Globe, label: "Portfolios" },
  { to: "/dashboard/profile", icon: UserCheck, label: "Profile Details" },
  { to: "/dashboard/analytics", icon: BarChart3, label: "My Analytics" },
  { to: "/dashboard/settings", icon: Settings, label: "Settings" },
];


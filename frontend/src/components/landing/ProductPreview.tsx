import React from "react";
import {
  Sparkles,
  LayoutDashboard,
  Bot,
  UserCheck,
  Target,
  Map,
  PlaySquare,
  Code2,
  GitBranch,
  FileText,
  Briefcase,
  User,
  Settings,
  BarChart3,
  TrendingUp,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

export const ProductPreview: React.FC = () => {
  const sidebarItems = [
    { label: "Overview", icon: LayoutDashboard, active: true },
    { label: "Smart Mentor", icon: Bot },
    { label: "Skill Profile", icon: UserCheck },
    { label: "Skill Gaps", icon: Target },
    { label: "Learning Roadmap", icon: Map },
    { label: "EduTube", icon: PlaySquare },
    { label: "Coding Assessment", icon: Code2 },
    { label: "GitHub Intelligence", icon: GitBranch },
    { label: "Resume AI", icon: FileText },
    { label: "Portfolios", icon: Briefcase },
    { label: "Profile Details", icon: User },
    { label: "Settings", icon: Settings },
    { label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="relative group w-full">
      {/* Outer ambient glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 -z-10" />

      {/* Main Container */}
      <div className="rounded-2xl border border-white/10 bg-[#0B0F19]/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden text-slate-200">
        
        {/* App Frame Header (macOS style dots + subtle title) */}
        <div className="px-4 py-2.5 bg-[#080B14] border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <span className="text-indigo-400">app.smartskillhub.io</span>/dashboard
          </div>
          <div className="w-10" />
        </div>

        {/* Dashboard Body with Sidebar + Main Content */}
        <div className="grid grid-cols-12 min-h-[460px]">
          
          {/* Left Mini Sidebar */}
          <aside className="col-span-3 lg:col-span-3 bg-[#070A13] border-r border-white/[0.06] p-3 hidden sm:flex flex-col justify-between">
            <div>
              {/* Mini Brand */}
              <div className="flex items-center gap-2 px-2 py-1.5 mb-3">
                <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <span className="font-bold text-xs text-white tracking-tight">Smart Skill Hub</span>
              </div>

              {/* Navigation Items */}
              <div className="space-y-0.5">
                {sidebarItems.map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                      item.active
                        ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
                    }`}
                  >
                    <item.icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06] px-2">
              <div className="text-[10px] text-slate-400">v2.4.0 • Live AI System</div>
            </div>
          </aside>

          {/* Main Dashboard Panel */}
          <main className="col-span-12 sm:col-span-9 p-4 sm:p-5 flex flex-col gap-4 bg-[#0B0F19]">
            
            {/* Greeting Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5">
                  Welcome back, Sampata! <span className="text-lg">👋</span>
                </h3>
                <p className="text-xs text-slate-400">Here's your career overview for today.</p>
              </div>

              <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#131926] border border-white/10 text-xs font-medium text-slate-300">
                <span>This Week</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Metric 1 */}
              <div className="bg-[#111726]/80 border border-white/[0.07] rounded-xl p-2.5">
                <div className="text-[10px] text-slate-400 font-medium">Skills Analyzed</div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold text-white">24</span>
                  <span className="text-[10px] font-semibold text-emerald-400 flex items-center">
                    +15%
                  </span>
                </div>
                <div className="text-[9px] text-slate-400">vs last week</div>
              </div>

              {/* Metric 2 */}
              <div className="bg-[#111726]/80 border border-white/[0.07] rounded-xl p-2.5">
                <div className="text-[10px] text-slate-400 font-medium">Projects Built</div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold text-white">5</span>
                  <span className="text-[10px] font-semibold text-blue-400 flex items-center">
                    +2
                  </span>
                </div>
                <div className="text-[9px] text-slate-400">vs last week</div>
              </div>

              {/* Metric 3 */}
              <div className="bg-[#111726]/80 border border-white/[0.07] rounded-xl p-2.5">
                <div className="text-[10px] text-slate-400 font-medium">Learning Hours</div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold text-white">18.5</span>
                  <span className="text-[10px] font-semibold text-cyan-400 flex items-center">
                    +4.5h
                  </span>
                </div>
                <div className="text-[9px] text-slate-400">vs last week</div>
              </div>

              {/* Metric 4 */}
              <div className="bg-[#111726]/80 border border-white/[0.07] rounded-xl p-2.5">
                <div className="text-[10px] text-slate-400 font-medium">Mentor Interactions</div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold text-white">32</span>
                  <span className="text-[10px] font-semibold text-purple-400 flex items-center">
                    +8
                  </span>
                </div>
                <div className="text-[9px] text-slate-400">vs last week</div>
              </div>
            </div>

            {/* Recommended Next Step Banner */}
            <div className="bg-gradient-to-r from-indigo-950/40 via-[#111726] to-[#111726] border border-indigo-500/25 rounded-xl p-3 sm:p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] font-semibold text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  Recommended Next Step
                </div>
                <button className="px-2.5 py-1 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-sm transition-colors">
                  Continue
                </button>
              </div>
              <p className="text-xs text-slate-200 font-medium mb-2.5">
                Complete 2 MERN stack projects to strengthen your portfolio.
              </p>
              <div className="flex items-center gap-3">
                <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full w-[90%]" />
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-300">90%</span>
              </div>
            </div>

            {/* Bottom Grid: Recent Activity & Skill Gap Highlight */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Recent Activity */}
              <div className="sm:col-span-7 bg-[#111726]/70 border border-white/[0.07] rounded-xl p-3">
                <div className="text-xs font-semibold text-white mb-2.5 flex items-center justify-between">
                  <span>Recent Activity</span>
                  <span className="text-[10px] text-slate-400">Real-time</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                      <span className="text-slate-300 truncate">Completed React Advanced Course in EduTube</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">2h ago</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                      <span className="text-slate-300 truncate">GitHub repo "smart-skill-hub" updated</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">5h ago</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span className="text-slate-300 truncate">Resume optimized with AI</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">1d ago</span>
                  </div>
                </div>
              </div>

              {/* Skill Gap Highlight */}
              <div className="sm:col-span-5 bg-[#111726]/70 border border-white/[0.07] rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-white mb-1.5 flex items-center justify-between">
                    <span>Skill Gap Highlight</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 mb-2">
                    <span className="text-xs font-bold text-slate-200">React Query</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      High Priority
                    </span>
                  </div>
                </div>
                <button className="w-full py-1.5 text-[11px] font-semibold text-white bg-indigo-600/80 hover:bg-indigo-600 rounded-lg border border-indigo-400/30 transition-colors">
                  Start Learning
                </button>
              </div>
            </div>

          </main>
        </div>
      </div>
    </div>
  );
};

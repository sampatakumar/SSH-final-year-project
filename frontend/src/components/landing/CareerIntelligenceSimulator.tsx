import React, { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  GitBranch,
  FileText,
  Code2,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Layers,
  Award,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

interface RoleBenchmarkPreview {
  id: string;
  roleName: string;
  category: string;
  benchmarkScore: number;
  description: string;
  coreSkills: Array<{ name: string; level: string; verified: boolean }>;
  signals: {
    resumePoints: number;
    githubPoints: number;
    codingPoints: number;
    synergyBonus: number;
  };
}

const PREVIEW_ROLES: RoleBenchmarkPreview[] = [
  {
    id: "fullstack",
    roleName: "Full Stack Developer",
    category: "Software Engineering",
    benchmarkScore: 75,
    description: "Design end-to-end client/server web architectures with production-grade database integration and CI/CD pipelines.",
    coreSkills: [
      { name: "React", level: "Proficient", verified: true },
      { name: "Node.js", level: "Proficient", verified: true },
      { name: "TypeScript", level: "Competent", verified: true },
      { name: "MongoDB", level: "Competent", verified: true },
      { name: "Docker", level: "Developing", verified: false },
    ],
    signals: {
      resumePoints: 28,
      githubPoints: 36,
      codingPoints: 42,
      synergyBonus: 18,
    },
  },
  {
    id: "frontend",
    roleName: "Frontend Engineer",
    category: "Client-Side Engineering",
    benchmarkScore: 75,
    description: "Build accessible, high-performance web applications with state synchronization, responsive design, and micro-animations.",
    coreSkills: [
      { name: "React", level: "Strong Evidence", verified: true },
      { name: "TypeScript", level: "Proficient", verified: true },
      { name: "TailwindCSS", level: "Proficient", verified: true },
      { name: "Next.js", level: "Competent", verified: true },
      { name: "Testing (Vitest)", level: "Competent", verified: true },
    ],
    signals: {
      resumePoints: 30,
      githubPoints: 38,
      codingPoints: 40,
      synergyBonus: 18,
    },
  },
  {
    id: "backend",
    roleName: "Backend Engineer",
    category: "Systems & Services",
    benchmarkScore: 75,
    description: "Architect scalable microservices, idempotent REST APIs, event queues, and distributed transactional consistency.",
    coreSkills: [
      { name: "Node.js", level: "Proficient", verified: true },
      { name: "Express.js", level: "Proficient", verified: true },
      { name: "PostgreSQL", level: "Competent", verified: true },
      { name: "Docker", level: "Competent", verified: true },
      { name: "REST APIs", level: "Strong Evidence", verified: true },
    ],
    signals: {
      resumePoints: 26,
      githubPoints: 38,
      codingPoints: 44,
      synergyBonus: 18,
    },
  },
  {
    id: "ai_ml",
    roleName: "AI & ML Engineer",
    category: "Applied Intelligence",
    benchmarkScore: 80,
    description: "Train and deploy deep learning models, LLM orchestration pipelines, vector embeddings, and evaluation telemetry.",
    coreSkills: [
      { name: "Python", level: "Strong Evidence", verified: true },
      { name: "PyTorch", level: "Proficient", verified: true },
      { name: "Prompt Engineering", level: "Proficient", verified: true },
      { name: "FastAPI", level: "Competent", verified: true },
      { name: "Vector Databases", level: "Developing", verified: false },
    ],
    signals: {
      resumePoints: 28,
      githubPoints: 34,
      codingPoints: 40,
      synergyBonus: 18,
    },
  },
  {
    id: "devops",
    roleName: "Cloud & DevOps Engineer",
    category: "Infrastructure",
    benchmarkScore: 78,
    description: "Automate container orchestration, infrastructure as code, zero-downtime deployment pipelines, and observability.",
    coreSkills: [
      { name: "Docker", level: "Proficient", verified: true },
      { name: "Kubernetes", level: "Competent", verified: true },
      { name: "CI/CD Pipelines", level: "Proficient", verified: true },
      { name: "Linux CLI", level: "Strong Evidence", verified: true },
      { name: "Terraform", level: "Developing", verified: false },
    ],
    signals: {
      resumePoints: 25,
      githubPoints: 38,
      codingPoints: 42,
      synergyBonus: 18,
    },
  },
];

export const CareerIntelligenceSimulator: React.FC<{ onExploreRole?: (role: string) => void }> = ({
  onExploreRole,
}) => {
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const [includeGitHub, setIncludeGitHub] = useState(true);
  const [includeCoding, setIncludeCoding] = useState(true);

  const currentRole = PREVIEW_ROLES[selectedRoleIndex];

  // Calculate dynamic composite readiness based on toggled sources
  const baseResume = currentRole.signals.resumePoints;
  const baseGitHub = includeGitHub ? currentRole.signals.githubPoints : 0;
  const baseCoding = includeCoding ? currentRole.signals.codingPoints : 0;

  const activeSourcesCount = 1 + (includeGitHub ? 1 : 0) + (includeCoding ? 1 : 0);
  let synergyBonus = 0;
  if (activeSourcesCount === 2) synergyBonus = 10;
  if (activeSourcesCount === 3) synergyBonus = 18;

  // Single-source ceiling guarantees
  let rawScore = baseResume + baseGitHub + baseCoding + synergyBonus;
  if (activeSourcesCount === 1) {
    rawScore = Math.min(30, rawScore);
  } else if (activeSourcesCount === 2) {
    rawScore = Math.min(74, rawScore);
  }

  const compositeScore = Math.min(100, Math.max(20, Math.round(rawScore)));
  const meetsBenchmark = compositeScore >= currentRole.benchmarkScore;

  return (
    <section className="py-20 sm:py-28 relative bg-[#060913] border-b border-white/[0.06] overflow-hidden">
      {/* Background radial gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-900/10 rounded-full blur-[180px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Explainable Evidence Methodology</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">
            Evidence-Based Career Intelligence
          </h2>
          <p className="text-base sm:text-lg text-slate-300">
            No keyword stuffing. No inflated claims. Smart Skill Hub corroborates your Resume claims with real GitHub repository activity and isolated Docker sandbox test results.
          </p>
        </div>

        {/* Interactive Role Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {PREVIEW_ROLES.map((role, idx) => {
            const isSelected = selectedRoleIndex === idx;
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRoleIndex(idx)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-indigo-400/40 scale-105"
                    : "bg-[#0E1322] text-slate-400 hover:text-slate-200 border border-white/[0.06] hover:border-white/15"
                }`}
              >
                {role.roleName}
              </button>
            );
          })}
        </div>

        {/* Main Interactive Simulator Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-[#0A0E1A]/90 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_25px_60px_rgba(0,0,0,0.6)]">
          
          {/* Left Column: Role Details & Core Skills */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold">
                  {currentRole.category}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-950/80 border border-indigo-500/30 text-indigo-300">
                  Target Benchmark: {currentRole.benchmarkScore}/100
                </span>
              </div>

              <h3 className="text-2xl font-black text-white tracking-tight mb-2">
                {currentRole.roleName}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                {currentRole.description}
              </p>

              {/* Core Required Skills with Corroboration Status */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Required Competency Profile
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentRole.coreSkills.map((skill) => (
                    <div
                      key={skill.name}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#111728] border border-white/[0.06] text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {skill.verified ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-amber-400/50 shrink-0" />
                        )}
                        <span className="font-semibold text-white">{skill.name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          skill.verified
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                        }`}
                      >
                        {skill.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Corroboration Toggles */}
            <div className="pt-4 border-t border-white/[0.08]">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Simulate Evidence Corroboration
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIncludeGitHub(!includeGitHub)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    includeGitHub
                      ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300"
                      : "bg-[#111728] border-white/10 text-slate-500 line-through"
                  }`}
                >
                  <GitBranch className="w-3 h-3" />
                  <span>GitHub Repositories</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIncludeCoding(!includeCoding)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    includeCoding
                      ? "bg-cyan-600/20 border-cyan-500/50 text-cyan-300"
                      : "bg-[#111728] border-white/10 text-slate-500 line-through"
                  }`}
                >
                  <Code2 className="w-3 h-3" />
                  <span>Docker Sandbox Challenges</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Evidence Score Meter & Rubric Breakdown */}
          <div className="lg:col-span-6 bg-[#0E1322] border border-white/[0.08] rounded-2xl p-6 flex flex-col justify-between space-y-6">
            
            {/* Top Score Meter */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400">
                  Verified Readiness Score
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    meetsBenchmark
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                  }`}
                >
                  {meetsBenchmark ? "Meets Role Benchmark" : "Skill Gap Detected"}
                </span>
              </div>

              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-5xl font-black text-white font-mono tracking-tight">
                  {compositeScore}
                </span>
                <span className="text-slate-400 text-sm font-mono">/ 100 max</span>
              </div>

              {/* Progress Bar */}
              <div className="h-3 w-full bg-white/[0.08] rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    meetsBenchmark
                      ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400"
                      : "bg-gradient-to-r from-amber-500 to-rose-500"
                  }`}
                  style={{ width: `${compositeScore}%` }}
                />
              </div>
            </div>

            {/* Evidence Signal Weight Rubric Breakdown */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Multi-Source Rubric Breakdown
              </div>

              {/* Source 1: Resume */}
              <div className="p-3 rounded-xl bg-[#13192B] border border-white/[0.06] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white">Resume Claims (Extracted)</div>
                    <div className="text-[10px] text-slate-400">Self-reported projects & skills</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-200">+{baseResume} pts</span>
              </div>

              {/* Source 2: GitHub */}
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                includeGitHub
                  ? "bg-[#13192B] border-white/[0.06]"
                  : "bg-[#13192B]/40 border-white/[0.03] opacity-40"
              }`}>
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white">GitHub Project Evidence</div>
                    <div className="text-[10px] text-slate-400">Commits, tests, hygiene & architecture</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-200">
                  {includeGitHub ? `+${baseGitHub} pts` : "0 pts"}
                </span>
              </div>

              {/* Source 3: Coding Sandbox */}
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                includeCoding
                  ? "bg-[#13192B] border-white/[0.06]"
                  : "bg-[#13192B]/40 border-white/[0.03] opacity-40"
              }`}>
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white">Docker Sandbox Assessments</div>
                    <div className="text-[10px] text-slate-400">100% automated test execution pass rate</div>
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-200">
                  {includeCoding ? `+${baseCoding} pts` : "0 pts"}
                </span>
              </div>

              {/* Multi-source Synergy Bonus */}
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-indigo-200">
                      Cross-Source Synergy Bonus
                    </div>
                    <div className="text-[10px] text-indigo-300/80">
                      {activeSourcesCount === 3
                        ? "Triple corroboration achieved (+18 bonus)"
                        : activeSourcesCount === 2
                        ? "Dual source corroborated (+10 bonus)"
                        : "No synergy: single source ceiling (max 30 pts)"}
                    </div>
                  </div>
                </div>
                <span className="font-mono font-bold text-indigo-300">+{synergyBonus} pts</span>
              </div>
            </div>

            {/* Bottom Insight */}
            <div className="text-xs text-slate-400 italic">
              {activeSourcesCount < 3
                ? "Notice: Without all three sources, candidate readiness cannot reach 'Strong Evidence' (90+) regardless of resume keywords."
                : "Candidate demonstrates verified competency validated by automated unit tests and public code commits."}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartSkillApi, SkillGapItem } from "@/lib/api";
import { toast } from "sonner";

const AVAILABLE_ROLES = [
  "Full Stack Developer",
  "Frontend Engineer",
  "Backend Node.js Engineer",
  "Software Engineer (General / Core CS)",
];

const SkillGapsPage = () => {
  const [selectedRole, setSelectedRole] = useState("Full Stack Developer");
  const [gapData, setGapData] = useState<{
    targetRole: string;
    roleDescription: string;
    roleMatchPercentage: number;
    gaps: SkillGapItem[];
    metSkills: any[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGaps = async (role: string) => {
    try {
      setIsLoading(true);
      const data = await SmartSkillApi.getSkillGaps(role);
      setGapData(data);
    } catch (err: any) {
      console.error("Failed to load gaps:", err);
      toast.error(err.message || "Failed to load skill gaps");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGaps(selectedRole);
  }, [selectedRole]);

  const gaps = gapData?.gaps || [];
  const metSkills = gapData?.metSkills || [];
  const matchPercentage = gapData?.roleMatchPercentage || 0;

  // Group gaps by status
  const missingGaps = gaps.filter((g) => g.status === "Missing");
  const weakGaps = gaps.filter((g) => g.status === "Weak / Action Required");
  const developingGaps = gaps.filter((g) => g.status === "Developing / Limited Evidence");

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Role Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/30 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" /> Target Role Skill Gap Analysis
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compare your evaluated evidence against industry benchmarks for engineering career tracks.
          </p>
        </div>

        {/* Role Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Target Role:</span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-background text-foreground text-xs font-bold border border-border/40 rounded-xl px-3 py-2 h-9 focus:outline-none focus:ring-1 focus:ring-primary shadow-neo-raised-sm"
          >
            {AVAILABLE_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Role Overview & Match Card */}
      <div className="p-6 bg-surface border border-border/40 rounded-2xl shadow-neo-raised flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Benchmark Evaluation</span>
          <h2 className="text-xl font-bold text-foreground">{gapData?.targetRole || selectedRole}</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {gapData?.roleDescription || "Standard technical requirements and proficiency expectations for this track."}
          </p>
          <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground pt-2">
            <span>Met Criteria: <b className="text-success">{metSkills.length}</b></span>
            <span>Identified Gaps: <b className="text-warning">{gaps.length}</b></span>
          </div>
        </div>

        {/* Match Percentage Visual */}
        <div className="flex flex-col items-center justify-center p-4 bg-background/80 rounded-2xl border border-border/30 min-w-[160px] text-center shadow-neo-pressed">
          <span className="text-xs font-bold text-muted-foreground uppercase">Role Match</span>
          <span className="text-4xl font-black text-foreground my-1">{isLoading ? "--" : `${matchPercentage}%`}</span>
          <span className="text-[11px] text-muted-foreground">
            {matchPercentage >= 75 ? "Strong Candidate" : matchPercentage >= 50 ? "Developing Profile" : "Requires Preparation"}
          </span>
        </div>
      </div>

      {/* Gaps List by Severity */}
      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
          <p>Analyzing role skill gaps...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Missing Critical Requirements */}
          {missingGaps.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Missing Role Requirements ({missingGaps.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {missingGaps.map((gap) => (
                  <div
                    key={gap.canonicalName}
                    className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 shadow-neo-raised-sm space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-bold text-foreground">{gap.canonicalName}</span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20 uppercase">
                          {gap.priority}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{gap.reason}</p>
                    </div>
                    <div className="pt-2 border-t border-border/20 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Required: {gap.requiredLevel}</span>
                      <Link
                        to="/dashboard/roadmap"
                        className="text-primary font-semibold hover:underline flex items-center gap-1"
                      >
                        Action Plan <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Weak / Action Required */}
          {weakGaps.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-warning flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Weak Evidence / Action Required ({weakGaps.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {weakGaps.map((gap) => (
                  <div
                    key={gap.canonicalName}
                    className="p-4 rounded-xl border border-warning/30 bg-warning/5 shadow-neo-raised-sm space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-bold text-foreground">{gap.canonicalName}</span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/20 uppercase">
                          {gap.priority}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{gap.reason}</p>
                    </div>
                    <div className="pt-2 border-t border-border/20 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">
                        Current: {gap.currentLevel} ({gap.currentScore} pts) → Target: {gap.requiredLevel}
                      </span>
                      <Link
                        to="/dashboard/coding"
                        className="text-primary font-semibold hover:underline flex items-center gap-1"
                      >
                        Practice Task <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Developing Competence */}
          {developingGaps.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" /> Developing Competence ({developingGaps.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {developingGaps.map((gap) => (
                  <div
                    key={gap.canonicalName}
                    className="p-4 rounded-xl border border-border/30 bg-surface shadow-neo-raised-sm space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-bold text-foreground">{gap.canonicalName}</span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border/30 uppercase">
                          {gap.priority}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{gap.reason}</p>
                    </div>
                    <div className="pt-2 border-t border-border/20 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">
                        Current: {gap.currentLevel} ({gap.currentScore} pts) → Target: {gap.requiredLevel}
                      </span>
                      <Link
                        to="/dashboard/roadmap"
                        className="text-primary font-semibold hover:underline flex items-center gap-1"
                      >
                        Recommended Steps <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Met Criteria */}
          {metSkills.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border/30">
              <h3 className="text-sm font-bold text-success flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Met Requirements ({metSkills.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {metSkills.map((skill) => (
                  <div
                    key={skill.canonicalName}
                    className="p-3 rounded-xl border border-success/30 bg-success/5 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-foreground block">{skill.canonicalName}</span>
                      <span className="text-[10px] text-muted-foreground">{skill.currentLevel} ({skill.currentScore}/100)</span>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SkillGapsPage;

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Code2,
  FileText,
  GitBranch,
  Info,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/core/auth";
import { SmartSkillApi, SkillProfileData, normalizeSkillGaps, type SkillGapViewModel } from "@/lib/api";
import { toast } from "sonner";

const DashboardHome = () => {
  const { backendUser, firebaseUser } = useAuth();
  const [profile, setProfile] = useState<SkillProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showReadinessModal, setShowReadinessModal] = useState(false);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const data = await SmartSkillApi.getSkillProfile();
      setProfile(data);
    } catch (err: any) {
      console.warn("Could not load skill profile, triggering initial evaluation:", err.message);
      try {
        const evalResult = await SmartSkillApi.evaluateSkills();
        setProfile(evalResult.profile);
      } catch (evalErr: any) {
        console.error("Evaluation failed:", evalErr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleReevaluate = async () => {
    try {
      setIsEvaluating(true);
      toast.info("Synthesizing multi-source evidence from Resume, GitHub & Coding...");
      const result = await SmartSkillApi.evaluateSkills();
      setProfile(result.profile);
      toast.success("Skill Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to evaluate skills");
    } finally {
      setIsEvaluating(false);
    }
  };

  const targetRole = profile?.targetRole || backendUser?.targetRole || "Full Stack Developer";
  const readinessScore = profile?.overallReadinessScore || 0;
  const evaluatedSkills = profile?.skills || [];
  const skillGaps: SkillGapViewModel[] = normalizeSkillGaps(profile?.skillGaps);
  const recommendations = profile?.recommendations || [];

  // Determine connected evidence provider statuses
  const hasResumeEvidence = evaluatedSkills.some((s) => s.sources?.includes("resume"));
  const hasGitHubEvidence = evaluatedSkills.some((s) => s.sources?.includes("github"));
  const hasCodingEvidence = evaluatedSkills.some((s) => s.sources?.includes("coding"));

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/30 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <span>Welcome back, {backendUser?.displayName || backendUser?.name || firebaseUser?.displayName || "Developer"}</span>
            <span className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {targetRole}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Smart Skill Hub combines your Resume, GitHub repositories, and practical Coding assessments into a unified career intelligence profile.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReevaluate}
            disabled={isEvaluating}
            className="shadow-neo-raised-sm bg-background border-border/40 hover:border-primary/40 gap-2 h-9 text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isEvaluating ? "animate-spin text-primary" : ""}`} />
            {isEvaluating ? "Evaluating Evidence..." : "Re-evaluate Profile"}
          </Button>
        </div>
      </div>

      {/* Hero Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Readiness Estimate Card */}
        <div className="md:col-span-1 bg-surface border border-border/40 shadow-neo-raised rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Readiness Estimate
            </span>
            <button
              onClick={() => setShowReadinessModal(true)}
              className="text-muted-foreground hover:text-primary transition-colors"
              title="About this score"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>

          <div className="my-4 flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tight text-foreground">
              {isLoading ? "--" : readinessScore}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">/ 100</span>
          </div>

          <div>
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden border border-border/20">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, readinessScore))}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 leading-tight">
              Derived from {evaluatedSkills.length} evaluated technical skills across connected evidence.
            </p>
          </div>
        </div>

        {/* Evidence Sources Status Card */}
        <div className="md:col-span-2 lg:col-span-3 bg-surface border border-border/40 shadow-neo-raised rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-border/20 pb-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Evidence Triangulation Status
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              3 Independent Assessment Channels
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Resume Status */}
            <Link
              to="/dashboard/resumes"
              className="p-3.5 rounded-xl border border-border/30 bg-background/60 hover:border-primary/40 hover:bg-surface/60 transition-all flex flex-col justify-between group shadow-neo-raised-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">Resume AI</span>
                </div>
                {hasResumeEvidence ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-warning" />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {hasResumeEvidence
                  ? "Claimed skills, project context, and work roles extracted."
                  : "Upload or update your resume to extract claimed skills."}
              </p>
              <span className="text-[11px] text-primary font-semibold mt-2 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Manage Resumes <ArrowRight className="h-3 w-3" />
              </span>
            </Link>

            {/* GitHub Status */}
            <Link
              to="/dashboard/github"
              className="p-3.5 rounded-xl border border-border/30 bg-background/60 hover:border-primary/40 hover:bg-surface/60 transition-all flex flex-col justify-between group shadow-neo-raised-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">GitHub Intel</span>
                </div>
                {hasGitHubEvidence ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-warning" />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {hasGitHubEvidence
                  ? "Public repositories, code volume, and tech stack analyzed."
                  : "Analyze your GitHub username to detect observed repository code."}
              </p>
              <span className="text-[11px] text-primary font-semibold mt-2 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Analyze GitHub <ArrowRight className="h-3 w-3" />
              </span>
            </Link>

            {/* Coding Platform Status */}
            <Link
              to="/dashboard/coding"
              className="p-3.5 rounded-xl border border-border/30 bg-background/60 hover:border-primary/40 hover:bg-surface/60 transition-all flex flex-col justify-between group shadow-neo-raised-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">Coding Sandbox</span>
                </div>
                {hasCodingEvidence ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-warning" />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {hasCodingEvidence
                  ? "Practical test case execution verified in Docker sandbox."
                  : "Complete coding problems in the isolated sandbox to verify mastery."}
              </p>
              <span className="text-[11px] text-primary font-semibold mt-2 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Practice Coding <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Two-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Evaluated Skills Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Top Evaluated Skills
            </h2>
            <Link
              to="/dashboard/skills"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              View Full Skill Profile ({evaluatedSkills.length}) <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {evaluatedSkills.length === 0 ? (
            <div className="p-8 border border-border/40 bg-surface rounded-2xl text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                No evaluated skills yet. Connect your Resume, GitHub, or complete a Coding challenge to generate your profile.
              </p>
              <Button size="sm" onClick={handleReevaluate} className="gap-2">
                <Sparkles className="h-4 w-4" /> Run Initial Evaluation
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {evaluatedSkills.slice(0, 6).map((skill) => (
                <div
                  key={skill.canonicalName}
                  className="p-4 rounded-xl border border-border/30 bg-surface hover:border-primary/30 transition-all shadow-neo-raised-sm flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{skill.canonicalName}</h3>
                      <span className="text-[11px] text-muted-foreground font-medium">{skill.category}</span>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        skill.level === "Strong Evidence" || skill.level === "Proficient"
                          ? "bg-primary/10 text-primary border-primary/30"
                          : skill.level === "Competent"
                          ? "bg-success/10 text-success border-success/30"
                          : "bg-warning/10 text-warning border-warning/30"
                      }`}
                    >
                      {skill.level}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-muted-foreground font-medium">Confidence: {Math.round(skill.confidence * 100)}%</span>
                      <span className="font-bold text-foreground">{skill.score}/100</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${Math.min(100, Math.max(5, skill.score))}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-border/20">
                    <span className="text-[10px] text-muted-foreground">Sources:</span>
                    {(skill.sources || []).map((src) => (
                      <span
                        key={src}
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-background border border-border/30 text-foreground capitalize"
                      >
                        {src}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Role Gaps & Recommended Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-warning" /> Target Role Gaps
            </h2>
            <Link
              to="/dashboard/gaps"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Analyze Gaps <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="p-4 border border-border/40 bg-surface rounded-2xl shadow-neo-raised space-y-3">
            <div className="flex items-center justify-between border-b border-border/20 pb-2">
              <span className="text-xs font-semibold text-muted-foreground">Role: {targetRole}</span>
              <span className="text-xs font-bold text-foreground">
                {skillGaps.filter((g) => g.status === "Missing" || g.status.includes("Weak")).length} Action Items
              </span>
            </div>

            {skillGaps.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No skill gaps detected! Your evaluated evidence fulfills current role criteria.
              </p>
            ) : (
              <div className="space-y-2.5">
                {skillGaps.slice(0, 4).map((gap) => (
                  <div
                    key={gap.canonicalName}
                    className="p-2.5 rounded-lg border border-border/20 bg-background/50 flex items-start justify-between gap-2"
                  >
                    <div>
                      <span className="text-xs font-bold text-foreground block">{gap.canonicalName}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
                        {gap.status} — Requires {gap.requiredLevel}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                        gap.priority === "Critical"
                          ? "bg-destructive/10 text-destructive border-destructive/30"
                          : gap.priority === "High"
                          ? "bg-warning/10 text-warning border-warning/30"
                          : "bg-secondary text-muted-foreground border-border/40"
                      }`}
                    >
                      {gap.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Link
              to="/dashboard/roadmap"
              className="w-full mt-2 inline-flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-neo-raised-sm"
            >
              <TrendingUp className="h-3.5 w-3.5" /> View Learning Roadmap
            </Link>
          </div>
        </div>
      </div>

      {/* Explanatory Modal for Readiness Score */}
      {showReadinessModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-surface border border-border/40 rounded-2xl max-w-md w-full p-6 shadow-neo-raised-lg space-y-4">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" /> Smart Skill Hub Readiness Estimate
              </h3>
              <button
                onClick={() => setShowReadinessModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This score is an internal, multi-source career preparation estimate synthesized from your claimed Resume keywords, observed public GitHub code volume, and verified practical Coding sandbox assessments.
            </p>
            <div className="p-3 bg-background rounded-xl border border-border/30 text-[11px] text-muted-foreground space-y-1">
              <p className="font-bold text-foreground">Usage & Limitation Notice:</p>
              <p>
                The readiness score is a technical estimation based solely on available connected data. It does NOT represent guaranteed employability, a formal certification, or expert human audit.
              </p>
            </div>
            <Button size="sm" onClick={() => setShowReadinessModal(false)} className="w-full">
              Got it
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;

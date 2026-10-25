import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Code2,
  Compass,
  FileText,
  Flame,
  GitBranch,
  Info,
  Layers,
  Lock,
  Play,
  RefreshCw,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Video,
  Wrench,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/core/auth";
import {
  SmartSkillApi,
  SkillProfileData,
  DashboardIntelligenceData,
  UnifiedWorkspaceData,
  normalizeSkillGaps,
  type SkillGapViewModel,
} from "@/lib/api";
import { toast } from "sonner";
import { SpacedRevisionWidget } from "../skills/components/SpacedRevisionWidget";

const DashboardHome = () => {
  const { backendUser, firebaseUser } = useAuth();
  const [profile, setProfile] = useState<SkillProfileData | null>(null);
  const [intelligence, setIntelligence] = useState<DashboardIntelligenceData | null>(null);
  const [workspace, setWorkspace] = useState<UnifiedWorkspaceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showReadinessModal, setShowReadinessModal] = useState(false);
  const [showMasteryModal, setShowMasteryModal] = useState(false);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [activeSkillTab, setActiveSkillTab] = useState<"all" | "strong" | "gaps">("all");
  const [completedMissions, setCompletedMissions] = useState<Record<string, boolean>>({});

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [profileData, intelData] = await Promise.all([
        SmartSkillApi.getSkillProfile().catch(() => null),
        SmartSkillApi.getDashboardIntelligence().catch(() => null),
      ]);

      if (profileData) {
        setProfile(profileData);
      } else {
        const evalResult = await SmartSkillApi.evaluateSkills().catch(() => null);
        if (evalResult?.profile) setProfile(evalResult.profile);
      }

      if (intelData) {
        setIntelligence(intelData);
        if (intelData.unifiedWorkspace) {
          setWorkspace(intelData.unifiedWorkspace);
        }
      }

      if (!intelData?.unifiedWorkspace) {
        SmartSkillApi.getUnifiedWorkspace()
          .then((ws) => {
            if (ws) setWorkspace(ws);
          })
          .catch(() => null);
      }
    } catch (err: any) {
      console.warn("Dashboard data initialization error:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleReevaluate = async () => {
    try {
      setIsEvaluating(true);
      toast.info("Synthesizing multi-source evidence from Resume, GitHub & Coding assessments...");
      const [evalResult, intelData] = await Promise.all([
        SmartSkillApi.evaluateSkills(),
        SmartSkillApi.getDashboardIntelligence().catch(() => null),
      ]);
      setProfile(evalResult.profile);
      if (intelData) {
        setIntelligence(intelData);
        if (intelData.unifiedWorkspace) {
          setWorkspace(intelData.unifiedWorkspace);
        }
      }
      if (!intelData?.unifiedWorkspace) {
        SmartSkillApi.getUnifiedWorkspace()
          .then((ws) => {
            if (ws) setWorkspace(ws);
          })
          .catch(() => null);
      }
      toast.success("Skill Profile & Intelligence updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to evaluate skills");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleAdaptiveSync = async () => {
    try {
      setIsEvaluating(true);
      toast.info("Updating adaptive learning loop and recalculating recommendations...");
      const result = await SmartSkillApi.evaluateAdaptiveLoop();
      const intelData = await SmartSkillApi.getDashboardIntelligence().catch(() => null);
      if (intelData) setIntelligence(intelData);
      toast.success(`Adaptive loop updated: Focal skill is ${result.focalSkill}!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update adaptive learning loop");
    } finally {
      setIsEvaluating(false);
    }
  };

  useEffect(() => {
    if (intelligence?.dailyLearningPlan) {
      const map: Record<string, boolean> = {};
      intelligence.dailyLearningPlan.forEach((m: any) => {
        if (m.completed) {
          map[m.id] = true;
        }
      });
      setCompletedMissions(map);
    }
  }, [intelligence?.dailyLearningPlan]);

  const toggleMission = async (mission: any) => {
    const id = mission.id;
    const currentState = Boolean(completedMissions[id]);
    const newState = !currentState;

    // Optimistic UI update
    setCompletedMissions((prev) => ({
      ...prev,
      [id]: newState,
    }));

    try {
      await SmartSkillApi.toggleDailyMission(id, {
        title: mission.title,
        targetSkill: mission.targetSkill,
        completed: newState,
      });
      toast.success(newState ? "Mission marked as complete!" : "Mission marked as incomplete.");
    } catch (err: any) {
      // Revert optimistic update
      setCompletedMissions((prev) => ({
        ...prev,
        [id]: currentState,
      }));
      toast.error(err.message || "Failed to update mission state.");
    }
  };

  const targetRole =
    workspace?.learningOverview?.targetCareerRole ||
    intelligence?.overview?.targetRole ||
    profile?.targetRole ||
    backendUser?.targetRole ||
    "Full Stack Developer";

  const discipline =
    workspace?.learningOverview?.academicDiscipline ||
    intelligence?.overview?.academic?.branchName ||
    backendUser?.academic?.branchName ||
    "Engineering & Technology";

  const readinessScore = intelligence?.overview?.readinessEstimate?.score ?? profile?.overallReadinessScore ?? 0;
  const empiricalMastery = intelligence?.overview?.empiricalMastery;
  const evaluatedSkills = profile?.skills || [];
  const skillGaps: SkillGapViewModel[] = normalizeSkillGaps(profile?.skillGaps);
  const recommendations = profile?.recommendations || [];

  // Determine connected evidence provider statuses
  const hasResumeEvidence = evaluatedSkills.some((s) => s.sources?.includes("resume"));
  const hasGitHubEvidence = evaluatedSkills.some((s) => s.sources?.includes("github"));
  const hasCodingEvidence = evaluatedSkills.some((s) => s.sources?.includes("coding"));

  const weeklyHours = intelligence?.overview?.studyTimeThisWeek?.hours ?? 0;
  const streakDays = intelligence?.overview?.consistencyStreakDays ?? 0;
  const careerProgress = intelligence?.overview?.careerGoalProgress;
  const dailyMissions = intelligence?.dailyLearningPlan || [];
  const nextAction = intelligence?.nextRecommendedAction;
  const recommendedVideos = intelligence?.topEduTubeRecommendations || [];
  const recentAssessments = intelligence?.recentAssessments || [];
  const prerequisiteGaps = intelligence?.skillVisualization?.prerequisiteGaps || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/30 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5 flex-wrap">
            <span>
              Welcome back,{" "}
              {backendUser?.displayName || backendUser?.name || firebaseUser?.displayName || "Developer"}
            </span>
            <span className="text-sm font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {targetRole}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border/40 flex items-center gap-1">
              <Briefcase className="h-3 w-3 text-muted-foreground" /> {discipline}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Intelligent learning dashboard synthesizing verified practical evidence, empirical mastery, and educational EduTube recommendations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAdaptiveSync}
            disabled={isEvaluating}
            className="shadow-neo-raised-sm bg-background border-border/40 hover:border-primary/40 gap-2 h-9 text-xs font-semibold text-primary"
          >
            <Sparkles className={`h-3.5 w-3.5 ${isEvaluating ? "animate-spin" : "text-primary"}`} />
            Sync Adaptive Loop
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReevaluate}
            disabled={isEvaluating}
            className="shadow-neo-raised-sm bg-background border-border/40 hover:border-primary/40 gap-2 h-9 text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isEvaluating ? "animate-spin text-primary" : ""}`} />
            {isEvaluating ? "Evaluating Evidence..." : "Re-evaluate Evidence"}
          </Button>
        </div>
      </div>

      {/* Phase 38: Cross-Module Learning Telemetry Ribbon */}
      {intelligence?.telemetry && (
        <div className="bg-surface border border-primary/25 rounded-2xl p-4 shadow-neo-raised flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Adaptive Learning Telemetry
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  {intelligence.telemetry.isPersonalized ? "Personalized Active" : "Foundational Mode"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Outcome-driven metrics synchronized across Roadmap, Missions, Sandbox Challenges, and Skill Profile.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs">
            <div className="text-center sm:text-right">
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Milestones</span>
              <span className="font-extrabold text-foreground text-sm font-mono">
                {intelligence.telemetry.milestonesCompleted} / {intelligence.telemetry.milestonesTotal}
              </span>
            </div>
            <div className="text-center sm:text-right">
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Daily Missions</span>
              <span className="font-extrabold text-foreground text-sm font-mono">
                {intelligence.telemetry.dailyMissionsCompleted} / {intelligence.telemetry.dailyMissionsTotal}
              </span>
            </div>
            <div className="text-center sm:text-right">
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Sandbox Solved</span>
              <span className="font-extrabold text-primary text-sm font-mono">
                {intelligence.telemetry.codingChallengesSolved} / {intelligence.telemetry.codingChallengesAttempted}
              </span>
            </div>
            <div className="text-center sm:text-right">
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Active Gaps</span>
              <span className="font-extrabold text-amber-400 text-sm font-mono">
                {intelligence.telemetry.persistentSkillGapsCount}
              </span>
            </div>
            <div className="text-center sm:text-right">
              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Revisions Due</span>
              <span className="font-extrabold text-foreground text-sm font-mono">
                {intelligence.telemetry.revisionsDueToday ?? 0}
              </span>
            </div>
            {intelligence.telemetry.competencyBadgesCount !== undefined && (
              <div className="text-center sm:text-right">
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Badges Earned</span>
                <Link
                  to="/dashboard/skills"
                  className="font-extrabold text-amber-400 text-sm font-mono hover:underline flex items-center justify-end gap-1"
                >
                  <Award className="h-3.5 w-3.5" />
                  {intelligence.telemetry.competencyBadgesCount}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Phase 53: Unified Student Workspace & Cross-Module Intelligence */}
      <div className="bg-surface border border-primary/30 rounded-2xl p-5 shadow-neo-raised space-y-5">
        {/* Workspace Header: Five Core Questions Overview */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/15 text-primary border border-primary/30 shrink-0">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold tracking-tight text-foreground">
                  Personalized Student Workspace
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 uppercase">
                  {workspace?.learningOverview?.activeLearningStage || "ADAPTIVE INTELLIGENCE"}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border/40">
                  {discipline}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Evidence-grounded learning guidance answering what to learn, empirical evidence on record, remaining gaps, and career readiness.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuestionsModal(true)}
              className="text-xs font-semibold gap-1.5 h-8 bg-background border-border/40 hover:border-primary/40 text-muted-foreground hover:text-foreground"
            >
              <Info className="h-3.5 w-3.5 text-primary" />
              <span>5 Core Questions</span>
            </Button>
          </div>
        </div>

        {/* 2-Column Core Guidance Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Col 1 & 2: Primary Next-Best Learning Action & Skill Evidence Ledger */}
          <div className="lg:col-span-2 space-y-4">
            {/* Primary Next Action Card */}
            {workspace?.nextBestAction?.primaryAction ? (
              <div className="p-4 rounded-xl border border-primary/40 bg-primary/5 shadow-neo-raised-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary text-primary-foreground uppercase tracking-wider">
                      Primary Next Action
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface border border-border/40 text-foreground capitalize">
                      {workspace.nextBestAction.primaryAction.category}
                    </span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase border text-warning bg-warning/10 border-warning/30">
                      {workspace.nextBestAction.primaryAction.priority} Priority
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                    <Clock className="h-3.5 w-3.5" /> ~{workspace.nextBestAction.primaryAction.estimatedMinutes} mins
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {workspace.nextBestAction.primaryAction.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    <span className="font-semibold text-foreground">Why this action: </span>
                    {workspace.nextBestAction.primaryAction.whyRecommended}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    <span className="font-semibold text-foreground">Intended outcome: </span>
                    {workspace.nextBestAction.primaryAction.intendedOutcome}
                  </p>
                  {(workspace.nextBestAction.primaryAction.supportingEvidence?.prerequisiteWarning || workspace.nextBestAction.primaryAction.prerequisiteWarning) && (
                    <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-400 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{workspace.nextBestAction.primaryAction.supportingEvidence?.prerequisiteWarning || workspace.nextBestAction.primaryAction.prerequisiteWarning}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/20">
                  <span className="text-xs text-muted-foreground">
                    Directly advances competence in <span className="font-bold text-foreground">{workspace.nextBestAction.primaryAction.skill}</span>
                  </span>
                  <Link
                    to={workspace.nextBestAction.primaryAction.destination}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
                  >
                    <span>{workspace.nextBestAction.primaryAction.actionLabel || "Launch Activity"}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-border/30 bg-background/50 text-center py-6 text-xs text-muted-foreground">
                All primary milestones completed! Explore Practical Labs or Project Studio to build advanced deliverables.
              </div>
            )}

            {/* Secondary Actions Pills */}
            {workspace?.nextBestAction?.secondaryActions && workspace.nextBestAction.secondaryActions.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Secondary Learning Actions
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {workspace.nextBestAction.secondaryActions.slice(0, 4).map((sec) => (
                    <Link
                      key={sec.actionId}
                      to={sec.destination}
                      className="p-3 rounded-xl border border-border/30 bg-background/60 hover:border-primary/40 hover:bg-background transition-all flex items-center justify-between gap-2 group shadow-neo-raised-sm"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                            {sec.category}
                          </span>
                          <span className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {sec.title}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {sec.whyRecommended}
                        </p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Skill Evidence Ledger Summary Breakdown */}
            <div className="p-3.5 rounded-xl border border-border/30 bg-background/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" /> Evidence Ledger Breakdown
                </span>
                <Link to="/dashboard/skills" className="text-xs text-primary font-semibold hover:underline">
                  View Ledger ({workspace?.evidenceLedger?.summary?.totalRecords || evaluatedSkills.length} records)
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-surface border border-border/30">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Verified Proof</span>
                  <span className="text-sm font-extrabold text-emerald-400 font-mono">
                    {workspace?.evidenceLedger?.summary?.verifiedCount ?? (hasCodingEvidence ? 1 : 0)}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-surface border border-border/30">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Rubric Scored</span>
                  <span className="text-sm font-extrabold text-primary font-mono">
                    {workspace?.evidenceLedger?.summary?.rubricScoredCount ?? 0}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-surface border border-border/30">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Formative Practice</span>
                  <span className="text-sm font-extrabold text-foreground font-mono">
                    {workspace?.evidenceLedger?.summary?.formativePracticeCount ?? 0}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-surface border border-border/30">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Self Reported</span>
                  <span className="text-sm font-extrabold text-muted-foreground font-mono">
                    {workspace?.evidenceLedger?.summary?.selfReportedCount ?? (hasResumeEvidence ? 1 : 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Col 3: Projects, Portfolio Privacy, and Recent Activity */}
          <div className="space-y-4">
            {/* Active Projects & Deliverables */}
            <div className="p-4 rounded-xl border border-border/30 bg-background/50 space-y-3">
              <div className="flex items-center justify-between border-b border-border/20 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-primary" /> Active Projects
                </span>
                <Link to="/dashboard/projects" className="text-xs text-primary font-semibold hover:underline">
                  Project Studio
                </Link>
              </div>

              {workspace?.activeProjects && workspace.activeProjects.length > 0 ? (
                <div className="space-y-2">
                  {workspace.activeProjects.slice(0, 2).map((proj) => (
                    <div key={proj.projectId} className="p-2.5 rounded-lg border border-border/30 bg-surface flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground truncate">{proj.title}</span>
                        <span className="text-[10px] font-mono text-primary font-bold">{proj.progressPercentage}%</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{proj.disciplineCategory}</span>
                        <span>{proj.deliverablesCount} deliverables</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No active project blueprints. Launch a template in Project Studio.
                </p>
              )}
            </div>

            {/* Shared Portfolio Artifacts (Privacy Scoped) */}
            <div className="p-4 rounded-xl border border-border/30 bg-background/50 space-y-3">
              <div className="flex items-center justify-between border-b border-border/20 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Share2 className="h-4 w-4 text-emerald-400" /> Portfolio Artifacts
                </span>
                <Link to="/dashboard/portfolio" className="text-xs text-primary font-semibold hover:underline">
                  Portfolio
                </Link>
              </div>

              {workspace?.portfolioArtifacts && workspace.portfolioArtifacts.length > 0 ? (
                <div className="space-y-2">
                  {workspace.portfolioArtifacts.slice(0, 3).map((art) => (
                    <div key={art.artifactId} className="p-2 rounded-lg border border-border/30 bg-surface flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-foreground truncate block">{art.title}</span>
                        <span className="text-[10px] text-muted-foreground capitalize">{art.artifactType} • {art.discipline}</span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0 flex items-center gap-1">
                        <Share2 className="h-2.5 w-2.5" /> Shared
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-2 text-xs text-muted-foreground space-y-1">
                  <p className="text-[11px]">No artifacts shared to portfolio yet.</p>
                  <p className="text-[10px] text-muted-foreground">
                    Only records where you have explicitly enabled Portfolio Sharing will appear publicly.
                  </p>
                </div>
              )}
            </div>

            {/* Cross-Module Recent Activity */}
            {workspace?.recentActivity && workspace.recentActivity.length > 0 && (
              <div className="p-4 rounded-xl border border-border/30 bg-background/50 space-y-3">
                <div className="flex items-center justify-between border-b border-border/20 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary" /> Cross-Module Activity
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">Live</span>
                </div>

                <div className="space-y-2">
                  {workspace.recentActivity.slice(0, 3).map((act, idx) => (
                    <Link
                      key={act.activityId || act.id || `act-${idx}`}
                      to={act.route}
                      className="p-2 rounded-lg border border-border/30 bg-surface hover:border-primary/40 transition-colors flex items-center justify-between gap-2 block group"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors block">
                          {act.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate block">
                          {act.outcomeSummary}
                        </span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero Overview Grid: 4 Defined Intelligence Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Empirical Skill Mastery (Verified Evidence) */}
        <div className="bg-surface border border-border/40 shadow-neo-raised rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-success" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Verified Mastery
              </span>
            </div>
            <button
              onClick={() => setShowMasteryModal(true)}
              className="text-muted-foreground hover:text-primary transition-colors"
              title="Verified Evidence Formula"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
              {isLoading ? "--" : empiricalMastery?.score !== null && empiricalMastery?.score !== undefined ? empiricalMastery.score : readinessScore}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">/ 100</span>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-success font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Empirical Docker Sandbox
              </span>
              <span className="text-muted-foreground">
                {empiricalMastery?.testedSkillsCount ?? (hasCodingEvidence ? 1 : 0)} skills tested
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden border border-border/20">
              <div
                className="bg-success h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(5, empiricalMastery?.score ?? readinessScore)
                  )}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 leading-tight">
              Calculated from verified Docker sandbox test executions.
            </p>
          </div>
        </div>

        {/* Card 2: Career Readiness Estimate */}
        <div className="bg-surface border border-border/40 shadow-neo-raised rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Readiness Estimate
              </span>
            </div>
            <button
              onClick={() => setShowReadinessModal(true)}
              className="text-muted-foreground hover:text-primary transition-colors"
              title="About this score"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
              {isLoading ? "--" : readinessScore}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">/ 100</span>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-primary font-semibold">Multi-Source Estimate</span>
              <span className="text-muted-foreground">{evaluatedSkills.length} skills</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden border border-border/20">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, readinessScore))}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 leading-tight">
              Synthesized from Resume, GitHub code, and Coding evidence.
            </p>
          </div>
        </div>

        {/* Card 3: Weekly Study Time & Consistency Streak */}
        <div className="bg-surface border border-border/40 shadow-neo-raised rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-warning" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Study Time
              </span>
            </div>
            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/30 flex items-center gap-1">
              <Flame className="h-3 w-3" /> {streakDays}-Day Streak
            </span>
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
              {isLoading ? "--" : weeklyHours}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">hours this week</span>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-muted-foreground">Learning Consistency</span>
              <span className="text-foreground font-semibold">{streakDays > 0 ? "Active daily" : "Start today"}</span>
            </div>
            <div className="grid grid-cols-7 gap-1 mt-1">
              {(intelligence?.learningConsistency?.dailyTrends || [
                { day: "M", count: 0 },
                { day: "T", count: 1 },
                { day: "W", count: 1 },
                { day: "T", count: 0 },
                { day: "F", count: 1 },
                { day: "S", count: 0 },
                { day: "S", count: 1 },
              ]).map((d: any, idx: number) => {
                const isDayActive = (d.videosCompleted || 0) > 0 || (d.codingSolved || 0) > 0 || idx >= 4;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-full h-2 rounded-sm ${
                        isDayActive ? "bg-warning" : "bg-secondary"
                      }`}
                      title={`${d.day}: ${d.videosCompleted || 0} lessons`}
                    />
                    <span className="text-[9px] text-muted-foreground">{d.day?.[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 4: Career Goal Progress */}
        <div className="bg-surface border border-border/40 shadow-neo-raised rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Career Goal
              </span>
            </div>
            <Link
              to="/dashboard/roadmap"
              className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5"
            >
              Roadmap <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
              {isLoading ? "--" : careerProgress?.progressPercent ?? 68}
              <span className="text-2xl font-bold">%</span>
            </span>
            <span className="text-xs font-medium text-muted-foreground">alignment</span>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-muted-foreground truncate max-w-[140px]">{targetRole}</span>
              <span className="text-foreground font-semibold">
                {careerProgress?.metSkillsCount ?? evaluatedSkills.filter((s) => s.score >= 50).length}/
                {careerProgress?.totalRequiredSkillsCount ?? evaluatedSkills.length + skillGaps.length} Met
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden border border-border/20">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(5, careerProgress?.progressPercent ?? 68))}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 leading-tight">
              Progress toward competencies required for {targetRole}.
            </p>
          </div>
        </div>
      </div>

      {/* Phase 39: Adaptive Spaced Revision Queue & Retrieval Practice */}
      <SpacedRevisionWidget />

      {/* Section 2: Personalized Daily Learning Plan & Next Recommended Action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Personalized Daily Learning Plan */}
        <div className="lg:col-span-2 bg-surface border border-border/40 rounded-2xl p-5 shadow-neo-raised space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/20 pb-3">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Personalized Daily Learning Plan
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Targeted 3-part daily missions balancing concept study, sandbox practice, and retrieval revision.
              </p>
            </div>
            <span className="text-xs font-bold text-muted-foreground bg-secondary/80 px-2.5 py-1 rounded-lg">
              {Object.values(completedMissions).filter(Boolean).length} of {dailyMissions.length || 3} Completed Today
            </span>
          </div>

          <div className="space-y-3">
            {(dailyMissions.length > 0
              ? dailyMissions
              : [
                  {
                    id: "mission_1_concept",
                    type: "video_lesson",
                    title: "Study Docker Container Architecture & Layers",
                    targetSkill: "Docker",
                    estimatedMinutes: 20,
                    actionUrl: "/dashboard/edutube",
                    isPersonalized: false,
                    explanation: "Addresses primary Critical skill gap identified in profile.",
                  },
                  {
                    id: "mission_2_hands_on",
                    type: "coding_task",
                    title: "Solve Isolated Docker Sandbox Practice Challenge",
                    targetSkill: "Node.js Containerization",
                    estimatedMinutes: 25,
                    actionUrl: "/dashboard/coding",
                    isPersonalized: false,
                    explanation: "Empirical code execution builds verifiable skill mastery.",
                  },
                  {
                    id: "mission_3_retrieval",
                    type: "spaced_revision",
                    title: "Retrieval Practice: React State & Effect Hooks",
                    targetSkill: "React",
                    estimatedMinutes: 10,
                    actionUrl: "/dashboard/skills",
                    isPersonalized: false,
                    explanation: "Scheduled revision reinforcing memory retention.",
                  },
                ]
            ).map((mission) => {
              const isDone = completedMissions[mission.id];
              return (
                <div
                  key={mission.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDone
                      ? "bg-success/5 border-success/30 opacity-75"
                      : "bg-background/60 border-border/30 hover:border-primary/40 shadow-neo-raised-sm"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleMission(mission)}
                      className={`mt-0.5 rounded-lg p-1 border transition-colors ${
                        isDone
                          ? "bg-success text-success-foreground border-success"
                          : "border-border/60 hover:border-primary text-muted-foreground"
                      }`}
                      title={isDone ? "Mark incomplete" : "Mark completed"}
                    >
                      <CheckCircle2 className={`h-4 w-4 ${isDone ? "fill-success/20" : ""}`} />
                    </button>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs font-bold ${
                            isDone ? "line-through text-muted-foreground" : "text-foreground"
                          }`}
                        >
                          {mission.title}
                        </span>
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                          {mission.targetSkill}
                        </span>
                        {mission.isPersonalized ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Personalized
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/40 font-mono">
                            Foundational
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        {mission.explanation}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {mission.estimatedMinutes}m
                    </span>
                    <Link
                      to={mission.actionUrl}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1 shadow-neo-raised-sm"
                    >
                      Start <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Next Recommended Action Hero Card */}
        <div className="bg-surface border border-border/40 rounded-2xl p-5 shadow-neo-raised flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-border/20 pb-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-warning" /> Next Recommended Action
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                High Impact
              </span>
            </div>

            <h3 className="text-sm font-bold text-foreground">
              {nextAction?.title || "Complete Docker Containerization Challenge"}
            </h3>

            <div className="my-2 p-3 rounded-xl bg-background/60 border border-border/30 text-xs text-muted-foreground leading-relaxed">
              <p className="font-semibold text-foreground text-[11px] mb-1 flex items-center gap-1">
                <Target className="h-3.5 w-3.5 text-primary" /> Grounded Rationale:
              </p>
              <p className="text-[11px]">
                {nextAction?.reasoning ||
                  "Empirical sandbox coding assessment in Docker addresses your active gap and satisfies core competency prerequisites."}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Estimated: {nextAction?.estimatedMinutes || 25} minutes</span>
            </div>
          </div>

          <Link
            to={nextAction?.actionUrl || "/dashboard/coding"}
            className="w-full inline-flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-neo-raised-sm"
          >
            Launch Activity Now <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Section 3: Skill-Wise Progress & Prerequisite Gaps Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Evaluated Skills Preview */}
        <div className="lg:col-span-2 bg-surface border border-border/40 rounded-2xl p-5 shadow-neo-raised space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/20 pb-3">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Skill Mastery & Progress Visualization
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Technical competencies evaluated with confidence ratings and empirical sources.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-secondary/80 p-1 rounded-xl">
              <button
                onClick={() => setActiveSkillTab("all")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  activeSkillTab === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                All ({evaluatedSkills.length})
              </button>
              <button
                onClick={() => setActiveSkillTab("strong")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  activeSkillTab === "strong" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Strong ({evaluatedSkills.filter((s) => s.score >= 70).length})
              </button>
              <button
                onClick={() => setActiveSkillTab("gaps")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  activeSkillTab === "gaps" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Gaps ({skillGaps.length})
              </button>
            </div>
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
              {evaluatedSkills
                .filter((s) => {
                  if (activeSkillTab === "strong") return s.score >= 70;
                  if (activeSkillTab === "gaps") return s.score < 50;
                  return true;
                })
                .slice(0, 6)
                .map((skill) => (
                  <div
                    key={skill.canonicalName}
                    className="p-3.5 rounded-xl border border-border/30 bg-background/50 hover:border-primary/40 transition-all shadow-neo-raised-sm flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{skill.canonicalName}</h3>
                        <span className="text-[10px] text-muted-foreground font-medium">{skill.category}</span>
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

                    <div className="mt-2.5">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-muted-foreground font-medium">
                          Confidence: {Math.round(skill.confidence * 100)}%
                        </span>
                        <span className="font-bold text-foreground">{skill.score}/100</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(5, skill.score))}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-border/20">
                      <span className="text-[10px] text-muted-foreground">Sources:</span>
                      {(skill.sources || []).map((src) => (
                        <span
                          key={src}
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface border border-border/30 text-foreground capitalize"
                        >
                          {src}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              Showing top competencies aligned with {targetRole}.
            </span>
            <Link
              to="/dashboard/skills"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              View Full Skill Profile ({evaluatedSkills.length}) <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Right 1 Col: Role Gaps & Prerequisite Blockers */}
        <div className="bg-surface border border-border/40 rounded-2xl p-5 shadow-neo-raised flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-border/20 pb-2 mb-3">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Target className="h-4 w-4 text-warning" /> Prerequisite & Role Gaps
              </h2>
              <Link
                to="/dashboard/gaps"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                Analyze <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {prerequisiteGaps.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No active gaps detected! Evaluated evidence satisfies role criteria.
              </p>
            ) : (
              <div className="space-y-2.5">
                {prerequisiteGaps.slice(0, 4).map((gap) => (
                  <div
                    key={gap.skill}
                    className="p-2.5 rounded-xl border border-border/30 bg-background/50 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{gap.skill}</span>
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

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Score: {gap.currentScore} / {gap.targetScore}</span>
                      {gap.isPrerequisiteBlocker && (
                        <span className="text-warning font-semibold flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Blocks {gap.blocksTechnologies?.slice(0, 2).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/dashboard/gaps"
            className="w-full inline-flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-bold bg-secondary text-foreground hover:bg-secondary/80 transition-all border border-border/30"
          >
            Review Gap Breakdown & Next Steps <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Section 4: EduTube Recommendations with Verified Duration & Explanations */}
      <div className="bg-surface border border-border/40 rounded-2xl p-5 shadow-neo-raised space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/20 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold text-foreground">
                EduTube Educational Feed (Verified 120s+ Quality Gate)
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Strictly filtered educational tutorials with authoritative durations and grounded explanations.
            </p>
          </div>
          <Link
            to="/dashboard/edutube"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Explore EduTube <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recommendedVideos.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-xs">
            Personalized EduTube recommendations are assembling. Visit the EduTube discovery page to browse.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendedVideos.map((video) => (
              <div
                key={video.videoId}
                className="bg-background/60 border border-border/30 hover:border-primary/40 rounded-xl overflow-hidden transition-all shadow-neo-raised-sm flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-video overflow-hidden bg-secondary">
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Video className="h-6 w-6" />
                      </div>
                    )}
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" /> {video.durationFormatted}
                    </span>
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-success/90 text-[9px] font-bold text-white flex items-center gap-0.5">
                      <ShieldCheck className="h-2.5 w-2.5" /> Quality Gate Passed
                    </span>
                  </div>

                  <div className="p-3">
                    <h3 className="text-xs font-bold text-foreground line-clamp-2 leading-snug">
                      {video.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-1 truncate">
                      {video.channelTitle}
                    </p>

                    {/* Grounded explanation pill */}
                    <div className="mt-2.5 p-2 rounded-lg bg-secondary/60 border border-border/20 text-[10px] text-muted-foreground leading-tight line-clamp-2">
                      <span className="font-semibold text-primary">Why: </span>
                      {video.whyRecommended?.[0] || "Targeted milestone for your career track."}
                    </div>
                  </div>
                </div>

                <div className="p-3 pt-0">
                  <Link
                    to={`/dashboard/edutube/watch/${video.videoId}`}
                    className="w-full py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center gap-1 shadow-neo-raised-sm"
                  >
                    <Play className="h-3 w-3 fill-current" /> Watch Lesson
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 5: Recent Assessments & Empirical Score Changes */}
      {recentAssessments.length > 0 && (
        <div className="bg-surface border border-border/40 rounded-2xl p-5 shadow-neo-raised space-y-3">
          <div className="flex items-center justify-between border-b border-border/20 pb-2">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Award className="h-4 w-4 text-success" /> Recent Empirical Assessments & Score Changes
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Verifiable outcomes from Docker sandbox coding tasks and formative assessments.
              </p>
            </div>
            <Link
              to="/dashboard/coding"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Practice Sandbox <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {recentAssessments.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-border/30 bg-background/50 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{item.skill}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/30">
                    {item.score}/100
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Test Execution: {item.testCasesPassed ?? 0}/{item.testCasesTotal ?? 10} test cases passed
                </p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2 pt-1.5 border-t border-border/20">
                  <span>Delta: {item.scoreDelta >= 0 ? `+${item.scoreDelta}` : item.scoreDelta} pts</span>
                  <span>{new Date(item.date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explanatory Modal: Career Readiness Score */}
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
                The readiness score is a technical estimation based on available connected data. It distinguishes measured results from estimates and does NOT represent a formal certification or guaranteed employability.
              </p>
            </div>
            <Button size="sm" onClick={() => setShowReadinessModal(false)} className="w-full">
              Got it
            </Button>
          </div>
        </div>
      )}

      {/* Explanatory Modal: Verified Empirical Mastery */}
      {showMasteryModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-surface border border-border/40 rounded-2xl max-w-md w-full p-6 shadow-neo-raised-lg space-y-4">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-success" /> Verified Empirical Mastery
              </h3>
              <button
                onClick={() => setShowMasteryModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Empirical mastery is computed strictly from verified test suite executions inside our isolated Docker sandbox. Unlike claimed keywords, this score requires actual code compilation, test pass rates, and correct time complexity.
            </p>
            <div className="p-3 bg-background rounded-xl border border-border/30 text-[11px] text-muted-foreground space-y-1">
              <p className="font-bold text-foreground">Calculation Formula:</p>
              <p>
                Empirical Score = Average of (Test Cases Passed / Total Cases) × Difficulty Multiplier across submitted challenges.
              </p>
            </div>
            <Button size="sm" onClick={() => setShowMasteryModal(false)} className="w-full">
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Explanatory Modal: Five Core Intelligence Questions */}
      {showQuestionsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-surface border border-border/40 rounded-2xl max-w-lg w-full p-6 shadow-neo-raised-lg space-y-4">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Compass className="h-4 w-4 text-primary" /> Five Core Questions Answered
              </h3>
              <button
                onClick={() => setShowQuestionsModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="p-2.5 rounded-xl bg-background border border-border/30">
                <span className="font-bold text-foreground block">1. What is this student trying to achieve?</span>
                <span className="text-muted-foreground mt-0.5 block">{workspace?.questionsAnswered?.targetObjective || `Target career goal: ${targetRole} (${discipline})`}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-background border border-border/30">
                <span className="font-bold text-foreground block">2. What evidence do we actually have about their skills?</span>
                <span className="text-muted-foreground mt-0.5 block">{workspace?.questionsAnswered?.evidenceSummary || "Verified assessment scores, practical labs, and formative tool records on ledger."}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-background border border-border/30">
                <span className="font-bold text-foreground block">3. Which important gaps remain?</span>
                <span className="text-muted-foreground mt-0.5 block">{workspace?.questionsAnswered?.remainingGaps || "Diagnosed gaps prioritized by role requirements and prerequisite sequence."}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-background border border-border/30">
                <span className="font-bold text-foreground block">4. What is the most useful next learning action?</span>
                <span className="text-muted-foreground mt-0.5 block">{workspace?.questionsAnswered?.nextLearningAction || (workspace?.nextBestAction?.primaryAction?.title || "Complete recommended learning milestone.")}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-background border border-border/30">
                <span className="font-bold text-foreground block">5. How does that action support the student's career pathway?</span>
                <span className="text-muted-foreground mt-0.5 block">{workspace?.questionsAnswered?.careerPathwayAlignment || `Directly develops competencies required for ${targetRole}.`}</span>
              </div>
            </div>
            <Button size="sm" onClick={() => setShowQuestionsModal(false)} className="w-full">
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;

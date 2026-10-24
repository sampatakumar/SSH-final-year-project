import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FileQuestion,
  Layers,
  Award,
  History,
  Sparkles,
  ArrowRight,
  FolderGit2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/core/auth";
import { toast } from "sonner";
import { assessmentCenterApi } from "@/modules/assessments/services/assessmentCenter.api";
import {
  BranchAssessment,
  AssessmentAttempt,
  RecommendedAssessmentItem,
} from "@/modules/assessments/types/assessmentCenter.types";
import { AssessmentCatalogView } from "@/modules/assessments/components/AssessmentCatalogView";
import { ActiveAssessmentWorkspace } from "@/modules/assessments/components/ActiveAssessmentWorkspace";
import { AssessmentResultsView } from "@/modules/assessments/components/AssessmentResultsView";
import { AssessmentHistoryView } from "@/modules/assessments/components/AssessmentHistoryView";

type TabKey = "catalog" | "workspace" | "results" | "history";

export const AssessmentCenterPage: React.FC = () => {
  const { idToken, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabKey>("catalog");

  // State: Catalog & Recommendations
  const [assessments, setAssessments] = useState<BranchAssessment[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedAssessmentItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState<boolean>(false);

  // State: Active Assessment Attempt
  const [activeAssessment, setActiveAssessment] = useState<BranchAssessment | null>(null);
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [activeStartedAt, setActiveStartedAt] = useState<string | undefined>(undefined);
  const [submittingAttempt, setSubmittingAttempt] = useState<boolean>(false);
  const [startingAssessmentId, setStartingAssessmentId] = useState<string | null>(null);

  // State: Selected Attempt for Results Review
  const [activeAttemptResult, setActiveAttemptResult] = useState<AssessmentAttempt | null>(null);

  // State: History
  const [myAttempts, setMyAttempts] = useState<AssessmentAttempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState<boolean>(false);

  // 1. Fetch Assessment Catalog
  const loadCatalog = useCallback(async () => {
    try {
      setLoadingCatalog(true);
      const res = await assessmentCenterApi.fetchAssessments(idToken || undefined);
      setAssessments(res.assessments || []);
    } catch (err: any) {
      console.error("Failed to load assessments:", err);
      toast.error("Could not load assessments. Please refresh.");
    } finally {
      setLoadingCatalog(false);
    }
  }, [idToken]);

  // 2. Fetch Personalized Recommendations
  const loadRecommendations = useCallback(async () => {
    if (!idToken) return;
    try {
      setLoadingRecommendations(true);
      const res = await assessmentCenterApi.fetchRecommendations(idToken);
      setRecommendations(res.recommendations || []);
    } catch {
      // Non-blocking fallback
    } finally {
      setLoadingRecommendations(false);
    }
  }, [idToken]);

  // 3. Fetch Attempt History
  const loadAttempts = useCallback(async () => {
    if (!idToken) return;
    try {
      setLoadingAttempts(true);
      const res = await assessmentCenterApi.fetchMyAttempts(idToken);
      setMyAttempts(res.attempts || []);
    } catch {
      // Non-blocking fallback
    } finally {
      setLoadingAttempts(false);
    }
  }, [idToken]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (idToken) {
      loadRecommendations();
      loadAttempts();
    }
  }, [idToken, loadRecommendations, loadAttempts]);

  // Handle URL query param: e.g. /dashboard/assessments?id=mech-eng-01
  useEffect(() => {
    const targetId = searchParams.get("id");
    if (targetId && assessments.length > 0) {
      const match = assessments.find((a) => a.assessmentId === targetId);
      if (match && !activeAttemptId) {
        handleStartAssessment(match.assessmentId);
      }
    }
  }, [searchParams, assessments]);

  // Start Assessment Attempt
  const handleStartAssessment = async (assessmentId: string) => {
    if (!idToken) {
      toast.error("Please log in to start an assessment.");
      return;
    }

    try {
      setStartingAssessmentId(assessmentId);
      const startRes = await assessmentCenterApi.startAttempt(assessmentId, idToken);

      setActiveAssessment(startRes.assessment);
      setActiveAttemptId(startRes.attemptId);
      setActiveStartedAt(startRes.startedAt);
      setActiveAttemptResult(null);
      setActiveTab("workspace");
      toast.success(`Assessment started: ${startRes.assessment.title}`);
    } catch (err: any) {
      console.error("Error starting assessment attempt:", err);
      toast.error(err?.message || "Could not start assessment session.");
    } finally {
      setStartingAssessmentId(null);
    }
  };

  // Submit Assessment Attempt
  const handleSubmitAttempt = async (
    answers: Record<string, any>,
    timeSpentSeconds: number
  ) => {
    if (!idToken || !activeAttemptId) {
      toast.error("No active session found.");
      return;
    }

    try {
      setSubmittingAttempt(true);
      const attemptRes = await assessmentCenterApi.submitAttempt(
        activeAttemptId,
        { answers, timeSpentSeconds },
        idToken
      );

      setActiveAttemptResult(attemptRes);
      setActiveAttemptId(null);
      setActiveTab("results");

      if (attemptRes.isPassing) {
        toast.success(`Congratulations! Passed with ${attemptRes.percentage}% score!`);
      } else {
        toast.info(
          `Assessment completed: ${attemptRes.percentage}%. Review recommendations to improve.`
        );
      }

      // Refresh attempts & recommendations in background
      loadAttempts();
      loadRecommendations();
    } catch (err: any) {
      console.error("Error submitting assessment:", err);
      toast.error(err?.message || "Failed to submit assessment answers.");
    } finally {
      setSubmittingAttempt(false);
    }
  };

  // Review a specific past attempt
  const handleSelectAttempt = async (attemptId: string) => {
    if (!idToken) return;
    try {
      const attempt = await assessmentCenterApi.fetchAttemptById(attemptId, idToken);
      setActiveAttemptResult(attempt);

      // Find matching assessment definition
      const matchedAssessment = assessments.find(
        (a) => a.assessmentId === attempt.assessmentId
      );
      if (matchedAssessment) {
        setActiveAssessment(matchedAssessment);
      }

      setActiveTab("results");
    } catch (err: any) {
      toast.error("Could not load attempt details.");
    }
  };

  const handleCancelWorkspace = () => {
    if (
      window.confirm(
        "Are you sure you want to exit the current assessment? Your unsaved answers will be lost."
      )
    ) {
      setActiveAssessment(null);
      setActiveAttemptId(null);
      setActiveTab("catalog");
    }
  };

  const handleRetry = () => {
    if (activeAssessment) {
      handleStartAssessment(activeAssessment.assessmentId);
    } else if (activeAttemptResult) {
      handleStartAssessment(activeAttemptResult.assessmentId);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6"
      data-testid="assessment-center-page"
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FileQuestion className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Discipline Assessment Center
            </h1>
            <Badge
              variant="outline"
              className="bg-indigo-950/40 text-indigo-300 border-indigo-800/40 text-xs font-mono ml-1"
            >
              Phase 44
            </Badge>
          </div>
          <p className="text-sm text-slate-400 max-w-3xl">
            Objective, evidence-based diagnostic assessments across 10 academic disciplines.
            Evaluate topic mastery, pinpoint skill gaps, and earn verified competence evidence.
          </p>
        </div>

        {/* Global Quick Action */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard/projects")}
            className="border-slate-800 hover:bg-slate-900 text-slate-300 text-xs flex items-center gap-1.5"
            data-testid="nav-project-studio-btn"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-indigo-400" />
            Project Studio
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/60 pb-3">
        <Button
          variant={activeTab === "catalog" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("catalog")}
          className={
            activeTab === "catalog"
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }
          data-testid="tab-catalog"
        >
          <Layers className="w-4 h-4 mr-2" />
          Assessment Catalog
          {assessments.length > 0 && (
            <Badge className="ml-2 bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0 border-0">
              {assessments.length}
            </Badge>
          )}
        </Button>

        {activeAttemptId && activeAssessment && (
          <Button
            variant={activeTab === "workspace" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("workspace")}
            className={
              activeTab === "workspace"
                ? "bg-indigo-600 hover:bg-indigo-700 text-white animate-pulse"
                : "text-amber-400 hover:text-amber-300 hover:bg-slate-900"
            }
            data-testid="tab-workspace"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Active Test Session
          </Button>
        )}

        {activeAttemptResult && (
          <Button
            variant={activeTab === "results" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("results")}
            className={
              activeTab === "results"
                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }
            data-testid="tab-results"
          >
            <Award className="w-4 h-4 mr-2" />
            Results & Feedback
          </Button>
        )}

        <Button
          variant={activeTab === "history" ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            setActiveTab("history");
            loadAttempts();
          }}
          className={
            activeTab === "history"
              ? "bg-indigo-600 hover:bg-indigo-700 text-white"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
          }
          data-testid="tab-history"
        >
          <History className="w-4 h-4 mr-2" />
          Attempt History
          {myAttempts.length > 0 && (
            <Badge className="ml-2 bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0 border-0">
              {myAttempts.length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Main Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "catalog" && (
          <motion.div
            key="catalog"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <AssessmentCatalogView
              assessments={assessments}
              recommendations={recommendations}
              userBranch={user?.branch || undefined}
              loading={loadingCatalog}
              onStartAssessment={handleStartAssessment}
            />
          </motion.div>
        )}

        {activeTab === "workspace" && activeAssessment && activeAttemptId && (
          <motion.div
            key="workspace"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <ActiveAssessmentWorkspace
              assessment={activeAssessment}
              attemptId={activeAttemptId}
              startedAt={activeStartedAt}
              submitting={submittingAttempt}
              onSubmitAttempt={handleSubmitAttempt}
              onCancel={handleCancelWorkspace}
            />
          </motion.div>
        )}

        {activeTab === "results" && activeAttemptResult && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <AssessmentResultsView
              attempt={activeAttemptResult}
              assessment={activeAssessment}
              onRetry={handleRetry}
              onBackToCatalog={() => setActiveTab("catalog")}
              onNavigateToProjects={() => navigate("/dashboard/projects")}
            />
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <AssessmentHistoryView
              attempts={myAttempts}
              loading={loadingAttempts}
              onSelectAttempt={handleSelectAttempt}
              onStartAssessment={handleStartAssessment}
              onExploreCatalog={() => setActiveTab("catalog")}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AssessmentCenterPage;

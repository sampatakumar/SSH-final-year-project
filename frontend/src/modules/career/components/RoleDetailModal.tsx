import React, { useState, useEffect } from "react";
import { CareerRole, RoleReadinessDiagnosis } from "../types/careerPathway.types";
import { careerPathwayApi } from "../services/careerPathway.api";
import {
  X,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FlaskConical,
  ClipboardCheck,
  FolderGit2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Loader2,
  BookOpen,
} from "lucide-react";
import { Link } from "react-router-dom";

interface RoleDetailModalProps {
  role: CareerRole | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPlan: (role: CareerRole) => void;
}

export const RoleDetailModal: React.FC<RoleDetailModalProps> = ({
  role,
  isOpen,
  onClose,
  onOpenPlan,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "readiness" | "activities" | "boundaries">("overview");
  const [readiness, setReadiness] = useState<RoleReadinessDiagnosis | null>(null);
  const [isLoadingReadiness, setIsLoadingReadiness] = useState(false);
  const [readinessError, setReadinessError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !role) {
      setReadiness(null);
      setReadinessError(null);
      setActiveTab("overview");
      return;
    }

    let isMounted = true;
    setIsLoadingReadiness(true);
    setReadinessError(null);

    careerPathwayApi
      .evaluateRoleReadiness(role.roleId)
      .then((data) => {
        if (isMounted) setReadiness(data);
      })
      .catch((err) => {
        if (isMounted) setReadinessError(err.message || "Failed to load role readiness.");
      })
      .finally(() => {
        if (isMounted) setIsLoadingReadiness(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, role]);

  if (!isOpen || !role) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-detail-title"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-card rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-start justify-between gap-4 bg-muted/20">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                {role.roleFamily}
              </span>
              <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                {role.disciplineCategory}
              </span>
              {role.regulatoryNotes && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  Licensure Notice
                </span>
              )}
            </div>
            <h2 id="role-detail-title" className="text-2xl font-bold text-foreground tracking-tight">
              {role.title}
            </h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
              {role.description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border bg-card px-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Requirements & Competencies
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("readiness")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "readiness"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>My Verified Evidence</span>
            {readiness && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary/20 text-primary">
                {readiness.heuristicReadinessIndex}%
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("activities")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "activities"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Platform Practice Labs & Tests
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("boundaries")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "boundaries"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Platform Boundaries & Disclaimers
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-foreground">
          {/* TAB 1: OVERVIEW & REQUIREMENTS */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Core Skills Table */}
              <div>
                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">
                  Core Required Competencies
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {role.coreSkills.map((c) => (
                    <div
                      key={c.skill}
                      className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-medium text-foreground block">{c.skill}</span>
                        <span className="text-xs text-muted-foreground">Target Score: {c.targetScore}%</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                          c.importance === "critical"
                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {c.importance}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prerequisites & Portfolio Expectations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border bg-muted/10">
                  <h5 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    Prerequisite Foundations
                  </h5>
                  <ul className="space-y-1.5 text-xs text-muted-foreground list-disc list-inside">
                    {role.prerequisiteCompetencies.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-border bg-muted/10">
                  <h5 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FolderGit2 className="w-3.5 h-3.5 text-amber-500" />
                    Portfolio Deliverable Expectations
                  </h5>
                  <ul className="space-y-1.5 text-xs text-muted-foreground list-disc list-inside">
                    {role.portfolioExpectations.map((exp) => (
                      <li key={exp}>{exp}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Cross-Disciplinary Rationale */}
              {role.mobilityRationale && (
                <div className="p-3.5 rounded-xl border border-sky-500/20 bg-sky-500/5 text-xs text-sky-700 dark:text-sky-300">
                  <span className="font-semibold block mb-1">Cross-Disciplinary Mobility Analysis:</span>
                  <p>{role.mobilityRationale}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MY VERIFIED EVIDENCE */}
          {activeTab === "readiness" && (
            <div className="space-y-5">
              {isLoadingReadiness ? (
                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="text-xs">Evaluating your verified multi-source evidence...</span>
                </div>
              ) : readinessError ? (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                  {readinessError}
                </div>
              ) : readiness ? (
                <>
                  {/* Readiness Summary Banner */}
                  <div className="p-4 rounded-xl bg-muted/30 border border-border flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground block">
                        Evidence-Based Heuristic Index
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-extrabold text-foreground">
                          {readiness.heuristicReadinessIndex}%
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                          {readiness.readinessBand}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground block mt-1">
                        Evidence coverage: {readiness.evidenceCoveragePercent}% of required core competencies.
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-right">
                      <div>
                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 block">
                          {readiness.counts.demonstrated}
                        </span>
                        <span className="text-[11px] text-muted-foreground">Demonstrated</span>
                      </div>
                      <div>
                        <span className="text-lg font-bold text-muted-foreground block">
                          {readiness.counts.unassessed}
                        </span>
                        <span className="text-[11px] text-muted-foreground">Unassessed</span>
                      </div>
                    </div>
                  </div>

                  {/* Skills Breakdown by Status */}
                  <div className="space-y-4">
                    {/* Demonstrated Skills */}
                    {readiness.skillsBreakdown.demonstrated.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Demonstrated Competencies (Score &gt;= 70%)
                        </h5>
                        <div className="space-y-1.5">
                          {readiness.skillsBreakdown.demonstrated.map((d) => (
                            <div
                              key={d.skill}
                              className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-semibold text-foreground">{d.skill}</span>
                                <span className="text-muted-foreground ml-2">via {d.sourceType.replace(/_/g, " ")}</span>
                              </div>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">{d.score}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Partial Skills */}
                    {readiness.skillsBreakdown.partial.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Partially Evidenced (Score 40% - 69%)
                        </h5>
                        <div className="space-y-1.5">
                          {readiness.skillsBreakdown.partial.map((p) => (
                            <div
                              key={p.skill}
                              className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-semibold text-foreground">{p.skill}</span>
                                <span className="text-muted-foreground ml-2">via {p.sourceType.replace(/_/g, " ")}</span>
                              </div>
                              <span className="font-bold text-amber-600 dark:text-amber-400">{p.score}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Unassessed Skills */}
                    {readiness.skillsBreakdown.unassessed.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5" />
                          Unassessed Competencies (No Evidence Yet - Not Scored as Zero)
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {readiness.skillsBreakdown.unassessed.map((u) => (
                            <div
                              key={u.skill}
                              className="p-2 rounded-lg border border-border bg-card text-xs flex items-center justify-between text-muted-foreground"
                            >
                              <span>{u.skill}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">Target: {u.targetScore}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Scientific & Heuristic Disclaimer */}
                  <p className="text-[11px] text-muted-foreground italic leading-relaxed pt-2 border-t border-border">
                    {readiness.disclaimer}
                  </p>
                </>
              ) : null}
            </div>
          )}

          {/* TAB 3: LINKED SSH ACTIVITIES */}
          {activeTab === "activities" && (
            <div className="space-y-6">
              {/* Practical Labs */}
              <div>
                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-indigo-500" />
                  Practical Learning Labs
                </h4>
                {role.linkedActivities?.labs && role.linkedActivities.labs.length > 0 ? (
                  <div className="space-y-2">
                    {role.linkedActivities.labs.map((lab) => (
                      <div
                        key={lab.labId}
                        className="p-3.5 rounded-xl border border-border bg-muted/10 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-foreground block text-xs">{lab.title}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {lab.difficulty} • ~{lab.estimatedMinutes} mins
                          </span>
                        </div>
                        <Link
                          to={`/dashboard/labs?labId=${lab.labId}`}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          Launch Lab
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No specific lab mappings for this role.</p>
                )}
              </div>

              {/* Standard Assessments */}
              <div>
                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <ClipboardCheck className="w-4 h-4 text-emerald-500" />
                  Assessment Center Standard Tests
                </h4>
                {role.linkedActivities?.assessments && role.linkedActivities.assessments.length > 0 ? (
                  <div className="space-y-2">
                    {role.linkedActivities.assessments.map((a) => (
                      <div
                        key={a.assessmentId}
                        className="p-3.5 rounded-xl border border-border bg-muted/10 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-foreground block text-xs">{a.title}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {a.difficulty} • ~{a.durationMinutes} mins
                          </span>
                        </div>
                        <Link
                          to={`/dashboard/assessments`}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          Take Test
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No specific assessment mapped.</p>
                )}
              </div>

              {/* Project Studio */}
              <div>
                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <FolderGit2 className="w-4 h-4 text-amber-500" />
                  Project Studio Milestone Blueprints
                </h4>
                {role.linkedActivities?.projects && role.linkedActivities.projects.length > 0 ? (
                  <div className="space-y-2">
                    {role.linkedActivities.projects.map((p) => (
                      <div
                        key={p.templateId}
                        className="p-3.5 rounded-xl border border-border bg-muted/10 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-foreground block text-xs">{p.title}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {p.difficulty} • ~{p.estimatedHours} hours
                          </span>
                        </div>
                        <Link
                          to={`/dashboard/projects`}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          Start Project
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No specific project template mapped.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PLATFORM BOUNDARIES & DISCLAIMERS */}
          {activeTab === "boundaries" && (
            <div className="space-y-5">
              {role.regulatoryNotes && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="font-bold text-xs uppercase tracking-wider">
                      Statutory & Licensure Boundary
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed">{role.regulatoryNotes}</p>
                </div>
              )}

              <div className="p-4 rounded-xl bg-muted/20 border border-border">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
                  Competencies Outside Smart Skill Hub Software Scope
                </h4>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  Smart Skill Hub evaluates digital artifacts, code execution, calculations, and structured rubric deliverables. The following competencies require accredited in-person or physical laboratory equipment:
                </p>
                <ul className="space-y-1.5 text-xs text-foreground list-disc list-inside">
                  {role.unassessableCompetencies.map((u) => (
                    <li key={u}>{u}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border flex items-center justify-between bg-card">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => onOpenPlan(role)}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5"
          >
            <span>Generate Preparation Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

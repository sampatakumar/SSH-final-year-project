import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  BookOpen,
  Award,
  FolderGit2,
  Sparkles,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/core/auth";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import { projectStudioApi } from "@/modules/projects/services/projectStudio.api";
import { StudentProject, ProjectTemplate } from "@/modules/projects/types/projectStudio.types";
import { ProjectCatalogView } from "@/modules/projects/components/ProjectCatalogView";
import { ActiveProjectWorkspace } from "@/modules/projects/components/ActiveProjectWorkspace";
import { EvidencePortfolioView } from "@/modules/projects/components/EvidencePortfolioView";
import { ManualResumeProjectsTab, ProjectItem } from "@/modules/projects/components/ManualResumeProjectsTab";

type TabKey = "workspace" | "catalog" | "portfolio" | "resume";

export const Projects = () => {
  const { idToken, user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("workspace");

  // State: Guided Projects & Blueprints
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [myProjects, setMyProjects] = useState<StudentProject[]>([]);
  const [activeWorkspaceProject, setActiveWorkspaceProject] = useState<StudentProject | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(true);
  const [loadingMyProjects, setLoadingMyProjects] = useState<boolean>(true);
  const [startingTemplateId, setStartingTemplateId] = useState<string | null>(null);
  const [savingDeliverables, setSavingDeliverables] = useState<boolean>(false);
  const [submittingEvaluation, setSubmittingEvaluation] = useState<boolean>(false);
  const [syncingProjectId, setSyncingProjectId] = useState<string | null>(null);

  // State: Manual Resume Projects (100% backward compatible)
  const [manualProjects, setManualProjects] = useState<ProjectItem[]>([]);
  const [loadingManualProjects, setLoadingManualProjects] = useState<boolean>(true);

  // 1. Fetch Guided Templates
  const loadTemplates = useCallback(async () => {
    try {
      setLoadingTemplates(true);
      const res = await projectStudioApi.fetchTemplates(idToken || undefined);
      setTemplates(res.templates || []);
    } catch {
      // Non-blocking fallback
    } finally {
      setLoadingTemplates(false);
    }
  }, [idToken]);

  // 2. Fetch Student Projects
  const loadMyProjects = useCallback(async () => {
    if (!idToken) {
      setMyProjects([]);
      setLoadingMyProjects(false);
      return;
    }
    try {
      setLoadingMyProjects(true);
      const res = await projectStudioApi.fetchMyProjects(idToken);
      setMyProjects(res.projects || []);

      // If user had an active workspace open, refresh its data
      if (activeWorkspaceProject) {
        const refreshed = (res.projects || []).find((p) => p._id === activeWorkspaceProject._id);
        if (refreshed) setActiveWorkspaceProject(refreshed);
      }
    } catch {
      // Non-blocking fallback
    } finally {
      setLoadingMyProjects(false);
    }
  }, [idToken, activeWorkspaceProject]);

  // 3. Fetch Manual Resume Projects
  const loadManualProjects = useCallback(async () => {
    if (!idToken) {
      setManualProjects([]);
      setLoadingManualProjects(false);
      return;
    }
    try {
      setLoadingManualProjects(true);
      const res = await apiRequest<{ projects: ProjectItem[] }>("/projects", { token: idToken });
      setManualProjects(res.data.projects || []);
    } catch {
      // Non-blocking
    } finally {
      setLoadingManualProjects(false);
    }
  }, [idToken]);

  useEffect(() => {
    void loadTemplates();
    void loadMyProjects();
    void loadManualProjects();
  }, [loadTemplates, loadMyProjects, loadManualProjects]);

  // Handler: Start a project from a blueprint
  const handleStartProject = async (templateId: string) => {
    if (!idToken) {
      toast.error("Please sign in to start a guided project.");
      return;
    }
    try {
      setStartingTemplateId(templateId);
      const newProject = await projectStudioApi.startProject(idToken, templateId);
      setMyProjects((prev) => [newProject, ...prev]);
      setActiveWorkspaceProject(newProject);
      setActiveTab("workspace");
      toast.success(`Started "${newProject.title}". Advancing to project workspace.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to start project");
    } finally {
      setStartingTemplateId(null);
    }
  };

  // Handler: Milestone status update
  const handleUpdateMilestone = async (
    milestoneId: string,
    status: "pending" | "in_progress" | "completed",
    notes: string
  ) => {
    if (!idToken || !activeWorkspaceProject) return;
    try {
      const updated = await projectStudioApi.updateMilestone(
        activeWorkspaceProject._id,
        milestoneId,
        status,
        notes,
        idToken
      );
      setActiveWorkspaceProject(updated);
      setMyProjects((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      toast.success("Milestone progress recorded.");
    } catch (err: any) {
      toast.error(err.message || "Failed to update milestone");
    }
  };

  // Handler: Save Deliverables Draft
  const handleSaveDeliverables = async (deliverables: any[], writtenExplanations: string) => {
    if (!idToken || !activeWorkspaceProject) return;
    try {
      setSavingDeliverables(true);
      const updated = await projectStudioApi.saveDeliverables(
        activeWorkspaceProject._id,
        { deliverables, writtenExplanations },
        idToken
      );
      setActiveWorkspaceProject(updated);
      setMyProjects((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
    } catch (err: any) {
      toast.error(err.message || "Failed to save deliverables");
    } finally {
      setSavingDeliverables(false);
    }
  };

  // Handler: Submit for Rubric Evaluation
  const handleSubmitProject = async (writtenExplanations: string) => {
    if (!idToken || !activeWorkspaceProject) return;
    try {
      setSubmittingEvaluation(true);
      const evaluated = await projectStudioApi.submitProject(
        activeWorkspaceProject._id,
        writtenExplanations,
        idToken
      );
      setActiveWorkspaceProject(evaluated);
      setMyProjects((prev) => prev.map((p) => (p._id === evaluated._id ? evaluated : p)));

      if (evaluated.status === "completed") {
        toast.success(`Congratulations! Your project scored ${evaluated.evaluation?.percentScore}% and passed rubric evaluation.`);
      } else {
        toast.info("Evaluation complete: revisions requested. Please inspect rubric feedback.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to evaluate project submission");
    } finally {
      setSubmittingEvaluation(false);
    }
  };

  // Handler: Toggle Evidence Portfolio Visibility
  const handleToggleVisibility = async (projectId: string, visibility: boolean) => {
    if (!idToken) return;
    try {
      const updated = await projectStudioApi.togglePortfolioVisibility(projectId, visibility, idToken);
      setMyProjects((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      toast.success(visibility ? "Project is now public in your evidence portfolio." : "Project is now private.");
    } catch (err: any) {
      toast.error(err.message || "Failed to update portfolio visibility");
    }
  };

  // Handler: Sync to Resume Showcase
  const handleSyncToResume = async (projectId: string) => {
    if (!idToken) return;
    try {
      setSyncingProjectId(projectId);
      const result = await projectStudioApi.syncToResume(projectId, idToken);
      setMyProjects((prev) => prev.map((p) => (p._id === projectId ? result.project : p)));
      await loadManualProjects();
      toast.success("Project successfully synced to Resume Showcase!");
    } catch (err: any) {
      toast.error(err.message || "Failed to sync to resume");
    } finally {
      setSyncingProjectId(null);
    }
  };

  const activeProjectsList = myProjects.filter((p) =>
    ["in_progress", "changes_requested", "submitted"].includes(p.status)
  );
  const completedProjectsList = myProjects.filter((p) => p.status === "completed");

  return (
    <div className="page-shell page-shell-xl space-y-8">
      {/* Header Banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                Phase 43: Branch-Aware Project Studio
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Multi-Discipline Engineering & Applied Arts
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gradient mb-2 tracking-tight">
              Project Studio & Evidence Portfolio
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
              Apply your academic discipline through guided, milestone-driven blueprints. Submit tangible evidence deliverables, receive deterministic rubric evaluations, and curate an evidence-backed portfolio.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="hero"
              onClick={() => {
                setActiveWorkspaceProject(null);
                setActiveTab("catalog");
              }}
              className="glow-primary text-xs"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Explore Blueprints
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl glass border border-border/50 overflow-x-auto scrollbar-none">
        <button
          data-testid="tab-workspace"
          onClick={() => {
            setActiveTab("workspace");
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "workspace"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
              : "text-muted-foreground hover:text-foreground hover:bg-card/50"
          }`}
        >
          <Layers className="h-4 w-4" />
          Project Workspace
          {activeProjectsList.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-primary-foreground/20 text-xs">
              {activeProjectsList.length}
            </span>
          )}
        </button>

        <button
          data-testid="tab-catalog"
          onClick={() => {
            setActiveTab("catalog");
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "catalog"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
              : "text-muted-foreground hover:text-foreground hover:bg-card/50"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Blueprint Catalog ({templates.length})
        </button>

        <button
          data-testid="tab-portfolio"
          onClick={() => {
            setActiveTab("portfolio");
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "portfolio"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
              : "text-muted-foreground hover:text-foreground hover:bg-card/50"
          }`}
        >
          <Award className="h-4 w-4" />
          Evidence Portfolio
          {completedProjectsList.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono">
              {completedProjectsList.length}
            </span>
          )}
        </button>

        <button
          data-testid="tab-resume"
          onClick={() => {
            setActiveTab("resume");
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "resume"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
              : "text-muted-foreground hover:text-foreground hover:bg-card/50"
          }`}
        >
          <FolderGit2 className="h-4 w-4" />
          Resume Showcase ({manualProjects.length})
        </button>
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {/* Tab 1: Project Workspace */}
        {activeTab === "workspace" && (
          <motion.div
            key="workspace-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {activeWorkspaceProject ? (
              <ActiveProjectWorkspace
                project={activeWorkspaceProject}
                template={templates.find((t) => t.templateId === activeWorkspaceProject.templateId)}
                onUpdateMilestone={handleUpdateMilestone}
                onSaveDeliverables={handleSaveDeliverables}
                onSubmitProject={handleSubmitProject}
                onBack={() => setActiveWorkspaceProject(null)}
                onViewPortfolio={() => setActiveTab("portfolio")}
                saving={savingDeliverables}
                submitting={submittingEvaluation}
              />
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    Active Guided Projects ({activeProjectsList.length})
                  </h3>
                </div>

                {loadingMyProjects ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                      <div key={i} className="glass h-48 rounded-2xl animate-pulse bg-card/20" />
                    ))}
                  </div>
                ) : activeProjectsList.length === 0 ? (
                  <div className="glass rounded-2xl p-16 text-center border-dashed border-2 border-border/50">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Layers className="h-8 w-8 text-primary opacity-80" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">No Active Project in Progress</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-6">
                      Explore academic project blueprints tailored to your discipline and career interests to begin guided development.
                    </p>
                    <Button
                      variant="hero"
                      size="sm"
                      onClick={() => setActiveTab("catalog")}
                      className="glow-primary text-xs"
                    >
                      Browse Blueprint Catalog
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeProjectsList.map((project) => {
                      const completedCount = (project.milestoneProgress || []).filter(
                        (m) => m.completed || m.status === "completed"
                      ).length;
                      const totalCount = (project.milestoneProgress || []).length || 1;
                      const percent = project.progressPercentage ?? Math.round((completedCount / totalCount) * 100);
                      const isChanges = project.status === "changes_requested";

                      return (
                        <div
                          key={project._id}
                          className="glass rounded-2xl p-6 border border-border/50 hover:border-primary/40 transition-all flex flex-col justify-between hover:shadow-lg hover:shadow-primary/5"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <Badge variant="outline" className="text-[11px] bg-primary/5 text-primary border-primary/20">
                                {project.branchSlug}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-[11px] uppercase font-mono ${
                                  isChanges
                                    ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                                    : "bg-blue-500/10 text-blue-500 border-blue-500/30"
                                }`}
                              >
                                {project.status.replace("_", " ")}
                              </Badge>
                            </div>

                            <h4 className="text-base font-bold text-foreground mb-1.5 line-clamp-1">{project.title}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                              {project.writtenExplanations || project.description}
                            </p>

                            <div className="space-y-2 mb-6">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Milestones Progress:</span>
                                <span className="font-bold text-primary">{completedCount}/{totalCount} ({percent}%)</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-background/60 overflow-hidden border border-border/40">
                                <div
                                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                            <Button
                              variant="hero"
                              size="sm"
                              className="w-full text-xs glow-primary"
                              onClick={() => setActiveWorkspaceProject(project)}
                            >
                              Open Project Workspace
                              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 2: Blueprint Catalog */}
        {activeTab === "catalog" && (
          <motion.div
            key="catalog-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ProjectCatalogView
              templates={templates}
              loading={loadingTemplates}
              onStartProject={handleStartProject}
              startingTemplateId={startingTemplateId}
            />
          </motion.div>
        )}

        {/* Tab 3: Evidence Portfolio */}
        {activeTab === "portfolio" && (
          <motion.div
            key="portfolio-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <EvidencePortfolioView
              completedProjects={completedProjectsList}
              loading={loadingMyProjects}
              onToggleVisibility={handleToggleVisibility}
              onSyncToResume={handleSyncToResume}
              onSelectProjectWorkspace={(proj) => {
                setActiveWorkspaceProject(proj);
                setActiveTab("workspace");
              }}
              syncingProjectId={syncingProjectId}
            />
          </motion.div>
        )}

        {/* Tab 4: Resume Showcase (Manual Projects) */}
        {activeTab === "resume" && (
          <motion.div
            key="resume-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ManualResumeProjectsTab
              projects={manualProjects}
              loading={loadingManualProjects}
              onRefresh={loadManualProjects}
              setProjects={setManualProjects}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Projects;
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/core/auth";
import { apiRequest } from "@/lib/api";
import {
  RefreshCw,
  Loader2,
  Edit3,
  Sliders,
  Eye,
  ListOrdered,
  Sparkles,
  Target,
  Palette,
  CheckCircle2,
  Copy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import type { ResumeData, ResumeBuilderConfig, CustomSection } from "../templates/types";
import { TEMPLATE_REGISTRY } from "../templates/TemplateRegistry";
import { ResumeEditorHeader } from "./ResumeEditorHeader";
import { ResumeDesignPanel } from "./ResumeDesignPanel";
import { ResumeFormattingPanel } from "./ResumeFormattingPanel";
import { ResumeSectionsPanel } from "./ResumeSectionsPanel";
import { ResumePreviewWorkspace } from "./ResumePreviewWorkspace";
import { ResumeStatusBar } from "./ResumeStatusBar";

import { PersonalSectionEditor } from "../sections/PersonalSectionEditor";
import { SummarySectionEditor } from "../sections/SummarySectionEditor";
import { ExperienceSectionEditor } from "../sections/ExperienceSectionEditor";
import { ProjectsSectionEditor } from "../sections/ProjectsSectionEditor";
import { EducationSectionEditor } from "../sections/EducationSectionEditor";
import { SkillsSectionEditor } from "../sections/SkillsSectionEditor";
import { AchievementsSectionEditor } from "../sections/AchievementsSectionEditor";
import { CustomSectionEditor } from "./CustomSectionEditor";

import { AiResumeAssistant } from "../ai/AiResumeAssistant";
import { JobTailorPanel } from "../ai/JobTailorPanel";

import { generateResumePdfBlob, printResumeViaBrowser } from "../services/pdf-export.service";
import {
  normalizeResumeData,
  adaptMasterProfileToResume,
  mergeProfileWithSavedResume,
} from "../services/resume-normalizer";
import type { UserProjectItem } from "../services/resume-profile-adapter";
import { calculateResumeDensity, optimizeConfigForOnePage } from "../preview/resume-density.utils";
import { calculateAtsReadiness, calculateCompletenessScore } from "../services/resume-scoring.utils";

export interface ResumeEditorProps {
  initialResume?: Partial<ResumeData> & { _id?: string; title?: string };
  onBack: () => void;
  onSaved?: (savedResume: any) => void;
  onNavigateToRoadmap?: () => void;
}

export const ResumeEditor: React.FC<ResumeEditorProps> = ({
  initialResume,
  onBack,
  onSaved,
  onNavigateToRoadmap,
}) => {
  const { backendUser, idToken } = useAuth();

  const [userProjects, setUserProjects] = useState<UserProjectItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [showAiAssistantModal, setShowAiAssistantModal] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Layout Right Tab Switcher: "edit" | "design" | "ai" | "tailor" | "sync"
  const [rightTab, setRightTab] = useState<"edit" | "design" | "ai" | "tailor" | "sync">("edit");
  const [activeSection, setActiveSection] = useState<string>("personal");
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>();
  const [mobileView, setMobileView] = useState<"form" | "sections" | "styles" | "preview">("preview");
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // Primary Resume State
  const [resumeData, setResumeData] = useState<ResumeData>(() =>
    initialResume
      ? normalizeResumeData(initialResume, backendUser, [])
      : adaptMasterProfileToResume(backendUser, [], "ats-classic")
  );

  const [resumeTitle, setResumeTitle] = useState<string>(
    initialResume?.title ||
      (backendUser?.displayName ? `${backendUser.displayName}'s Resume` : "My Resume")
  );

  // History Stack for Undo / Redo
  const [history, setHistory] = useState<ResumeData[]>([]);
  const [future, setFuture] = useState<ResumeData[]>([]);

  // Push state to history stack before modifying
  const pushStateToHistory = useCallback((currentData: ResumeData) => {
    setHistory((prev) => {
      const next = [...prev, currentData];
      return next.slice(-25); // retain last 25 states
    });
    setFuture([]);
  }, []);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setFuture((prev) => [resumeData, ...prev]);
    setResumeData(previous);
    toast.info("Action undone");
  }, [history, resumeData]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((prev) => prev.slice(1));
    setHistory((prev) => [...prev, resumeData]);
    setResumeData(next);
    toast.info("Action redone");
  }, [future, resumeData]);

  // Keyboard Shortcuts for Undo (Ctrl+Z) & Redo (Ctrl+Shift+Z / Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is actively in a native text input
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        if (!e.shiftKey) {
          if (!isInput) {
            e.preventDefault();
            handleUndo();
          }
        } else {
          if (!isInput) {
            e.preventDefault();
            handleRedo();
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        if (!isInput) {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  const [isSaving, setIsSaving] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<"saving" | "saved" | "error" | "idle">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Autosave Debounce Ref
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);
  const hasHydratedRef = useRef(false);

  // Fetch projects & Hydrate once on mount
  useEffect(() => {
    let isMounted = true;

    if (hasHydratedRef.current) return;

    const loadProfileAndProjects = async () => {
      let fetchedProjects: UserProjectItem[] = [];

      if (idToken) {
        try {
          const res = await apiRequest<{ projects: UserProjectItem[] }>("/projects", {
            token: idToken,
          });
          if (Array.isArray(res.data?.projects)) {
            fetchedProjects = res.data.projects;
            if (isMounted) setUserProjects(fetchedProjects);
          }
        } catch {
          // Optional projects fetch
        }
      }

      if (isMounted) {
        if (initialResume && initialResume._id) {
          // Editing existing saved resume
          setResumeData(mergeProfileWithSavedResume(initialResume, backendUser, fetchedProjects));
        } else {
          // Brand new resume
          setResumeData(adaptMasterProfileToResume(backendUser, fetchedProjects, "ats-classic"));
          if (!initialResume?.title && backendUser?.displayName) {
            setResumeTitle(`${backendUser.displayName}'s Resume`);
          }
        }
        hasHydratedRef.current = true;
        setIsHydrated(true);
      }
    };

    loadProfileAndProjects();

    return () => {
      isMounted = false;
    };
  }, [backendUser, idToken, initialResume?._id]);

  const config = resumeData.config!;

  // Grounded Metrics
  const density = useMemo(() => {
    return calculateResumeDensity(resumeData, config);
  }, [resumeData, config]);

  const atsReport = useMemo(() => {
    return calculateAtsReadiness(resumeData, config);
  }, [resumeData, config]);

  const completenessReport = useMemo(() => {
    return calculateCompletenessScore(resumeData);
  }, [resumeData]);

  // Section Counts
  const sectionCounts = useMemo(() => {
    return {
      personal: 1,
      summary: resumeData.professionalSummary ? 1 : 0,
      experience: resumeData.experience?.length || 0,
      projects: resumeData.projects?.length || 0,
      education: resumeData.education?.length || 0,
      skills:
        (resumeData.skills?.languages?.length || 0) +
        (resumeData.skills?.frameworks?.length || 0) +
        (resumeData.skills?.tools?.length || 0),
      achievements: resumeData.achievements?.length || 0,
    };
  }, [resumeData]);

  // Update Config Helper (pushes to history)
  const handleUpdateConfig = useCallback(
    (newConfig: ResumeBuilderConfig) => {
      pushStateToHistory(resumeData);
      setResumeData((prev) => ({
        ...prev,
        config: newConfig,
        customSections: newConfig.customSections || prev.customSections,
      }));
    },
    [pushStateToHistory, resumeData]
  );

  // Direct In-Canvas Text Editing Dispatcher
  const handleDirectEdit = useCallback(
    (path: string, value: any) => {
      pushStateToHistory(resumeData);
      setResumeData((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as ResumeData;
        const keys = path.split(".");

        if (keys.length === 1) {
          (next as any)[keys[0]] = value;
        } else if (keys.length === 2) {
          if (!(next as any)[keys[0]]) (next as any)[keys[0]] = {};
          (next as any)[keys[0]][keys[1]] = value;
        } else if (keys.length === 3) {
          const [secKey, indexStr, field] = keys;
          const idx = parseInt(indexStr, 10);
          if (Array.isArray((next as any)[secKey]) && (next as any)[secKey][idx]) {
            (next as any)[secKey][idx][field] = value;
          }
        } else if (keys.length === 4) {
          const [secKey, indexStr, subArrayKey, subIdxStr] = keys;
          const idx = parseInt(indexStr, 10);
          const subIdx = parseInt(subIdxStr, 10);
          if (
            Array.isArray((next as any)[secKey]) &&
            (next as any)[secKey][idx] &&
            Array.isArray((next as any)[secKey][idx][subArrayKey])
          ) {
            (next as any)[secKey][idx][subArrayKey][subIdx] = value;
          }
        }

        return next;
      });
    },
    [pushStateToHistory, resumeData]
  );

  // Contextual Section Action Dispatcher
  const handleSectionAction = useCallback(
    (action: string, sectionId: string, itemId?: string) => {
      pushStateToHistory(resumeData);

      if (action === "ai") {
        setActiveSection(sectionId);
        if (itemId) setSelectedItemId(itemId);
        setShowAiAssistantModal(true);
        return;
      }

      if (action === "edit") {
        setActiveSection(sectionId);
        if (itemId) setSelectedItemId(itemId);
        setRightTab("edit");
        setMobileView("form");
        return;
      }

      if (action === "moveUp" || action === "moveDown") {
        const order = [...(config.sectionOrder || [])];
        const idx = order.indexOf(sectionId);
        if (idx === -1) return;
        const targetIdx = action === "moveUp" ? idx - 1 : idx + 1;
        if (targetIdx >= 0 && targetIdx < order.length) {
          const temp = order[idx];
          order[idx] = order[targetIdx];
          order[targetIdx] = temp;
          setResumeData((prev) => ({
            ...prev,
            config: { ...prev.config!, sectionOrder: order },
          }));
          toast.success(`Section moved ${action === "moveUp" ? "up" : "down"}`);
        }
        return;
      }

      if (action === "hide") {
        const hidden = [...(config.hiddenSections || [])];
        if (!hidden.includes(sectionId)) {
          hidden.push(sectionId);
          setResumeData((prev) => ({
            ...prev,
            config: { ...prev.config!, hiddenSections: hidden },
          }));
          toast.success("Section hidden from canvas & PDF");
        }
        return;
      }

      if (action === "delete") {
        if (itemId) {
          // Delete specific item from array
          setResumeData((prev) => {
            const next = JSON.parse(JSON.stringify(prev)) as ResumeData;
            if (sectionId === "projects" && next.projects) {
              next.projects = next.projects.filter((_, i) => String(i) !== itemId && (next.projects![i]?.id !== itemId && next.projects![i]?.title !== itemId));
            } else if (sectionId === "experience" && next.experience) {
              next.experience = next.experience.filter((_, i) => String(i) !== itemId);
            } else if (sectionId === "education" && next.education) {
              next.education = next.education.filter((_, i) => String(i) !== itemId);
            } else if (sectionId === "achievements" && next.achievements) {
              next.achievements = next.achievements.filter((_, i) => String(i) !== itemId);
            }
            return next;
          });
          toast.success("Item removed");
        } else {
          // Hide section
          const hidden = [...(config.hiddenSections || []), sectionId];
          setResumeData((prev) => ({
            ...prev,
            config: { ...prev.config!, hiddenSections: hidden },
          }));
          toast.success("Section removed");
        }
        return;
      }

      if (action === "duplicate") {
        setResumeData((prev) => {
          const next = JSON.parse(JSON.stringify(prev)) as ResumeData;
          if (sectionId === "projects" && next.projects && next.projects.length > 0) {
            const target = itemId ? next.projects[parseInt(itemId, 10)] || next.projects[0] : next.projects[0];
            // Use canonical field name: name (not title)
            next.projects.push({ ...target, name: `${target.name} (Copy)` });
          } else if (sectionId === "experience" && next.experience && next.experience.length > 0) {
            const target = itemId ? next.experience[parseInt(itemId, 10)] || next.experience[0] : next.experience[0];
            // Use canonical field name: role (not position)
            next.experience.push({ ...target, role: `${target.role} (Copy)` });
          }
          return next;
        });
        toast.success("Item duplicated");
        return;
      }

      if (action === "addItem") {
        setResumeData((prev) => {
          const next = JSON.parse(JSON.stringify(prev)) as ResumeData;
          // All new items use canonical field names from types.ts with EMPTY defaults.
          // Never seed fake placeholder text into user resume data.
          if (sectionId === "projects") {
            if (!next.projects) next.projects = [];
            next.projects.push({
              name: "",           // canonical: name (not title)
              technologies: "",   // canonical: string (not array)
              githubUrl: "",
              demoUrl: "",        // canonical: demoUrl (not liveUrl)
              bullets: [],
            });
          } else if (sectionId === "experience") {
            if (!next.experience) next.experience = [];
            next.experience.push({
              company: "",        // canonical: company
              role: "",           // canonical: role (not position)
              date: "",           // canonical: date (not duration)
              location: "",
              bullets: [],
            });
          } else if (sectionId === "education") {
            if (!next.education) next.education = [];
            next.education.push({
              school: "",         // canonical: school (not institution)
              degree: "",
              date: "",           // canonical: date (not year)
              grade: "",          // canonical: grade (not score)
              location: "",
            });
          } else if (sectionId === "achievements") {
            if (!next.achievements) next.achievements = [];
            next.achievements.push({
              title: "",
              date: "",
              bullets: [],
            });
          }
          return next;
        });
        toast.success(`New item added to ${sectionId}`);
      }
    },
    [config, pushStateToHistory, resumeData]
  );

  // Section Reordering via Drag and Drop
  const handleReorderSections = useCallback(
    (sourceSectionId: string, targetSectionId: string) => {
      pushStateToHistory(resumeData);
      const order = [...(config.sectionOrder || [])];
      const srcIdx = order.indexOf(sourceSectionId);
      const targetIdx = order.indexOf(targetSectionId);
      if (srcIdx === -1 || targetIdx === -1 || srcIdx === targetIdx) return;
      const item = order.splice(srcIdx, 1)[0];
      order.splice(targetIdx, 0, item);
      setResumeData((prev) => ({
        ...prev,
        config: { ...prev.config!, sectionOrder: order },
      }));
      toast.success("Section reordered");
    },
    [config.sectionOrder, pushStateToHistory, resumeData]
  );

  // Item Reordering via Drag and Drop (Projects, Experience, Education)
  const handleReorderItems = useCallback(
    (sectionId: string, sourceIndex: number, targetIndex: number) => {
      if (sourceIndex === targetIndex) return;
      pushStateToHistory(resumeData);
      setResumeData((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as ResumeData;
        if (sectionId === "projects" && next.projects) {
          if (
            sourceIndex >= 0 &&
            sourceIndex < next.projects.length &&
            targetIndex >= 0 &&
            targetIndex < next.projects.length
          ) {
            const item = next.projects.splice(sourceIndex, 1)[0];
            next.projects.splice(targetIndex, 0, item);
          }
        } else if (sectionId === "experience" && next.experience) {
          if (
            sourceIndex >= 0 &&
            sourceIndex < next.experience.length &&
            targetIndex >= 0 &&
            targetIndex < next.experience.length
          ) {
            const item = next.experience.splice(sourceIndex, 1)[0];
            next.experience.splice(targetIndex, 0, item);
          }
        } else if (sectionId === "education" && next.education) {
          if (
            sourceIndex >= 0 &&
            sourceIndex < next.education.length &&
            targetIndex >= 0 &&
            targetIndex < next.education.length
          ) {
            const item = next.education.splice(sourceIndex, 1)[0];
            next.education.splice(targetIndex, 0, item);
          }
        }
        return next;
      });
      toast.success("Item reordered");
    },
    [pushStateToHistory, resumeData]
  );

  // One Page Optimizer Action
  const handleOptimizeForOnePage = () => {
    pushStateToHistory(resumeData);
    const optimized = optimizeConfigForOnePage(resumeData, config);
    handleUpdateConfig(optimized);
    toast.success("Spacing optimized for 1 page!");
  };

  // Sync from Master Profile Action
  const handleConfirmSyncFromProfile = () => {
    if (!backendUser) {
      toast.error("No Master Profile data available");
      setShowSyncDialog(false);
      return;
    }

    pushStateToHistory(resumeData);
    const fresh = adaptMasterProfileToResume(
      backendUser,
      userProjects,
      config.templateId || "ats-classic"
    );

    setResumeData({
      ...fresh,
      config,
      customSections: resumeData.customSections?.length ? resumeData.customSections : fresh.customSections,
    });

    if (backendUser.displayName && (!resumeTitle || resumeTitle === "My Resume")) {
      setResumeTitle(`${backendUser.displayName}'s Resume`);
    }

    setShowSyncDialog(false);
    toast.success("Resume synchronized with Master Profile!");
  };

  // Save Resume to DB (PUT if editing, POST if new/version)
  const handleSaveResume = async (isAutoSave = false, forceCreateNew = false) => {
    if (!idToken) return;

    setIsSaving(true);
    if (isAutoSave) setAutosaveStatus("saving");

    try {
      const pdfBlob = await generateResumePdfBlob(resumeData, config);
      const formData = new FormData();
      formData.append("title", resumeTitle.trim() || "My Resume");
      formData.append("format", "PDF");
      formData.append("sections", String(config.sectionOrder.length));
      formData.append("content", resumeData.professionalSummary || resumeData.name || "Resume");
      const pdfFile = new File([pdfBlob], `${resumeTitle.replace(/\s+/g, "_")}.pdf`, { type: "application/pdf" });
      formData.append("resumeFile", pdfFile);

      formData.append("builderConfig", JSON.stringify(config));

      const isEditing = Boolean(initialResume?._id) && !forceCreateNew;
      const endpoint = isEditing ? `/resumes/${initialResume?._id}` : "/resumes";

      const res = await apiRequest<{ resume: any }>(endpoint, {
        method: isEditing ? "PUT" : "POST",
        token: idToken,
        body: formData,
      });

      setLastSavedAt(new Date());
      setAutosaveStatus("saved");
      if (!isAutoSave) {
        toast.success(forceCreateNew ? "New resume version saved!" : "Resume saved successfully!");
        if (onSaved) onSaved(res.data?.resume);
      }
    } catch (error: any) {
      setAutosaveStatus("error");
      if (!isAutoSave) {
        toast.error(error.message || "Failed to save resume");
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Save as Version Handler
  const handleSaveAsVersion = async () => {
    const versionTitle = `${resumeTitle.replace(/\s*\(v\d+\)$/i, "")} (v${Date.now().toString().slice(-3)})`;
    setResumeTitle(versionTitle);
    await handleSaveResume(false, true);
  };

  // Debounced Autosave on content change
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!isHydrated || !idToken) return;

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      void handleSaveResume(true);
    }, 2000);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [resumeData, resumeTitle]);

  // PDF Export
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      // 1. High-fidelity browser print dialog directly from exact React template DOM
      await printResumeViaBrowser(resumeData, config, resumeTitle);
      toast.success("Opening high-fidelity print / Save as PDF dialog...");
    } catch (err: any) {
      // 2. Vector PDF direct download fallback
      try {
        const pdfBlob = await generateResumePdfBlob(resumeData, config);
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(resumeTitle || "resume").toLowerCase().replace(/\s+/g, "_")}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        toast.success("Resume PDF exported successfully!");
      } catch (fallbackErr: any) {
        toast.error("Failed to export PDF: " + (fallbackErr.message || String(fallbackErr)));
      }
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-background text-foreground space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-semibold">Opening Resume Workspace...</p>
      </div>
    );
  }

  const activeTemplateMeta = TEMPLATE_REGISTRY[config.templateId] || TEMPLATE_REGISTRY["ats-classic"];

  return (
    <div className="fixed inset-0 z-40 flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden">
      {/* 1. TOP HEADER WITH UNDO / REDO & AUTOSAVE */}
      <ResumeEditorHeader
        resumeTitle={resumeTitle}
        onChangeTitle={setResumeTitle}
        templateName={activeTemplateMeta.name}
        onBack={onBack}
        onOpenAiAssistant={() => setShowAiAssistantModal(true)}
        onOpenTailor={() => {
          setRightTab("tailor");
          setMobileView("form");
        }}
        onSaveAsVersion={handleSaveAsVersion}
        onExportPdf={handleExportPdf}
        isExportingPdf={isExportingPdf}
        isFullScreen={isFullScreen}
        onToggleFullScreen={() => setIsFullScreen((prev) => !prev)}
        activeRightTab={rightTab}
        onSelectRightTab={(tab) => setRightTab(tab as any)}
        canUndo={history.length > 0}
        onUndo={handleUndo}
        canRedo={future.length > 0}
        onRedo={handleRedo}
        autosaveStatus={autosaveStatus}
      />

      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden items-center justify-around bg-card border-b border-border/40 p-1 text-xs shrink-0">
        <button
          type="button"
          onClick={() => setMobileView("preview")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            mobileView === "preview" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          <Eye className="h-3.5 w-3.5 inline mr-1" /> Canvas
        </button>
        <button
          type="button"
          onClick={() => setMobileView("form")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            mobileView === "form" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          <Edit3 className="h-3.5 w-3.5 inline mr-1" /> Form
        </button>
        <button
          type="button"
          onClick={() => setMobileView("sections")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            mobileView === "sections" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          <ListOrdered className="h-3.5 w-3.5 inline mr-1" /> Sections
        </button>
        <button
          type="button"
          onClick={() => setMobileView("styles")}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            mobileView === "styles" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          <Sliders className="h-3.5 w-3.5 inline mr-1" /> Design
        </button>
      </div>

      {/* 2. MAIN 3-ZONE WORKSPACE (Left: Sections Nav, Center: Live Interactive A4 Canvas, Right: Tabbed Panel) */}
      <div className="flex-1 flex flex-row min-h-0 overflow-hidden relative">
        {/* LEFT ZONE: Section Navigator & Reordering */}
        {!isFullScreen && (
          <div
            className={`${
              isLeftCollapsed ? "hidden" : "w-64 shrink-0"
            } min-h-0 border-r border-border/50 bg-card flex flex-col overflow-y-auto custom-scrollbar p-3 space-y-3 transition-[width] duration-150 relative ${
              mobileView === "sections" ? "flex w-full absolute inset-0 z-30" : "hidden lg:flex"
            }`}
          >
            <ResumeSectionsPanel
              config={config}
              onUpdateConfig={handleUpdateConfig}
              activeSection={activeSection}
              onSelectSection={(secId) => {
                setActiveSection(secId);
                setSelectedItemId(undefined);
                setRightTab("edit");
                setMobileView("form");
              }}
              sectionCounts={sectionCounts}
              onReorderSections={handleReorderSections}
              onCollapse={() => setIsLeftCollapsed(true)}
            />
          </div>
        )}

        {/* CENTER ZONE: Live Interactive A4 Document Canvas */}
        <div
          className={`flex-1 min-w-0 h-full overflow-hidden flex flex-col relative ${
            mobileView === "preview" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Left Panel Expand Button if collapsed */}
          {!isFullScreen && isLeftCollapsed && (
            <button
              type="button"
              onClick={() => setIsLeftCollapsed(false)}
              className="hidden lg:flex absolute left-3 top-3 z-30 items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card/90 backdrop-blur-md border border-border/60 shadow-md text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all cursor-pointer"
              title="Expand Sections panel (<)"
            >
              <ChevronRight className="h-3.5 w-3.5 text-primary" />
              <span>Sections</span>
            </button>
          )}

          {/* Right Panel Expand Button if collapsed */}
          {!isFullScreen && isRightCollapsed && (
            <button
              type="button"
              onClick={() => setIsRightCollapsed(false)}
              className="hidden lg:flex absolute right-3 top-14 z-30 items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card/90 backdrop-blur-md border border-border/60 shadow-md text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all cursor-pointer"
              title="Expand Inspector panel (>)"
            >
              <span>Inspector</span>
              <ChevronLeft className="h-3.5 w-3.5 text-primary" />
            </button>
          )}

          <ResumePreviewWorkspace
            data={resumeData}
            config={config}
            activeSection={activeSection}
            selectedItemId={selectedItemId}
            onSelectSection={(secId, itemId) => {
              setActiveSection(secId);
              setSelectedItemId(itemId);
            }}
            onDirectEdit={handleDirectEdit}
            onSectionAction={handleSectionAction}
            onReorderSections={handleReorderSections}
            onReorderItems={handleReorderItems}
            isFullScreen={isFullScreen}
            onToggleFullScreen={() => setIsFullScreen((prev) => !prev)}
            estimatedPages={density.estimatedPages}
            onOptimizeForOnePage={handleOptimizeForOnePage}
            isOverflowing={density.status === "overflowing"}
          />
        </div>

        {/* RIGHT ZONE: Tabbed Contextual Editor & AI Panel */}
        {!isFullScreen && (
          <div
            className={`${
              isRightCollapsed ? "hidden" : "w-80 lg:w-[350px] shrink-0"
            } min-h-0 border-l border-border/50 bg-card flex flex-col overflow-y-auto custom-scrollbar transition-[width] duration-150 relative ${
              mobileView === "form" || mobileView === "styles" ? "flex w-full absolute inset-0 z-30" : "hidden lg:flex"
            }`}
          >
            {/* Top Sub-tabs */}
            <div className="flex items-center bg-muted/30 border-b border-border/40 p-1.5 text-xs shrink-0 gap-1 overflow-x-auto custom-scrollbar">
              <button
                type="button"
                onClick={() => setRightTab("edit")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 shrink-0 ${
                  rightTab === "edit"
                    ? "bg-card text-foreground shadow-xs border border-border/40"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Edit3 className="h-3 w-3 text-primary" /> Edit
              </button>

              <button
                type="button"
                onClick={() => setRightTab("design")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 shrink-0 ${
                  rightTab === "design"
                    ? "bg-card text-foreground shadow-xs border border-border/40"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Palette className="h-3 w-3 text-primary" /> Design
              </button>

              <button
                type="button"
                onClick={() => setRightTab("ai")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 shrink-0 ${
                  rightTab === "ai"
                    ? "bg-card text-foreground shadow-xs border border-border/40"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="h-3 w-3 text-primary" /> AI Health
              </button>

              <button
                type="button"
                onClick={() => setRightTab("tailor")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 shrink-0 ${
                  rightTab === "tailor"
                    ? "bg-card text-foreground shadow-xs border border-border/40"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Target className="h-3 w-3 text-primary" /> Tailor
              </button>

              <button
                type="button"
                onClick={() => setRightTab("sync")}
                className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 shrink-0 ${
                  rightTab === "sync"
                    ? "bg-card text-foreground shadow-xs border border-border/40"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <RefreshCw className="h-3 w-3 text-primary" /> Profile
              </button>

              {/* Collapse Right Panel button */}
              <div className="ml-auto pl-1 hidden lg:flex items-center">
                <button
                  type="button"
                  onClick={() => setIsRightCollapsed(true)}
                  className="p-1 rounded hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
                  title="Collapse Inspector panel (>)"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Tab Contents */}
            <div className="p-4 flex-1">
              {/* TAB 1: Section Forms */}
              {rightTab === "edit" && (
                <div className="space-y-4">
                  {activeSection === "personal" && (
                    <PersonalSectionEditor
                      data={resumeData}
                      onUpdate={(patch) => {
                        pushStateToHistory(resumeData);
                        setResumeData((prev) => ({ ...prev, ...patch }));
                      }}
                      onOpenSyncDialog={() => setShowSyncDialog(true)}
                      hasMasterProfile={Boolean(backendUser)}
                    />
                  )}

                  {activeSection === "summary" && (
                    <SummarySectionEditor
                      summary={resumeData.professionalSummary || ""}
                      onChange={(val) => {
                        pushStateToHistory(resumeData);
                        setResumeData((prev) => ({ ...prev, professionalSummary: val }));
                      }}
                      resumeData={resumeData}
                      idToken={idToken}
                    />
                  )}

                  {activeSection === "experience" && (
                    <ExperienceSectionEditor
                      experience={resumeData.experience || []}
                      onChange={(updated) => {
                        pushStateToHistory(resumeData);
                        setResumeData((prev) => ({ ...prev, experience: updated }));
                      }}
                      idToken={idToken}
                    />
                  )}

                  {activeSection === "projects" && (
                    <ProjectsSectionEditor
                      projects={resumeData.projects || []}
                      onChange={(updated) => {
                        pushStateToHistory(resumeData);
                        setResumeData((prev) => ({ ...prev, projects: updated }));
                      }}
                      availableGitHubProjects={userProjects}
                      idToken={idToken}
                    />
                  )}

                  {activeSection === "education" && (
                    <EducationSectionEditor
                      education={resumeData.education || []}
                      onChange={(updated) => {
                        pushStateToHistory(resumeData);
                        setResumeData((prev) => ({ ...prev, education: updated }));
                      }}
                    />
                  )}

                  {activeSection === "skills" && (
                    <SkillsSectionEditor
                      skills={resumeData.skills}
                      skillSections={resumeData.skillSections}
                      onChangeSkills={(updatedSkills) => {
                        pushStateToHistory(resumeData);
                        setResumeData((prev) => ({ ...prev, skills: updatedSkills }));
                      }}
                      onChangeSkillSections={(updatedSections) => {
                        pushStateToHistory(resumeData);
                        setResumeData((prev) => ({ ...prev, skillSections: updatedSections }));
                      }}
                    />
                  )}

                  {activeSection === "achievements" && (
                    <AchievementsSectionEditor
                      achievements={resumeData.achievements || []}
                      onChange={(updated) => {
                        pushStateToHistory(resumeData);
                        setResumeData((prev) => ({ ...prev, achievements: updated }));
                      }}
                    />
                  )}

                  {activeSection.startsWith("custom-") && (
                    <CustomSectionEditor
                      customSections={resumeData.customSections || config.customSections || []}
                      onChange={(updated) => {
                        pushStateToHistory(resumeData);
                        setResumeData((prev) => ({
                          ...prev,
                          customSections: updated,
                          config: {
                            ...prev.config!,
                            customSections: updated,
                          },
                        }));
                      }}
                    />
                  )}
                </div>
              )}

              {/* TAB 2: Design & Formatting */}
              {rightTab === "design" && (
                <div className="space-y-6">
                  <ResumeDesignPanel config={config} onUpdateConfig={handleUpdateConfig} />
                  <div className="border-t border-border/40 pt-4">
                    <ResumeFormattingPanel config={config} onUpdateConfig={handleUpdateConfig} />
                  </div>
                </div>
              )}

              {/* TAB 3: AI Resume Health Overview */}
              {rightTab === "ai" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20">
                    <div className="text-[11px] font-bold text-muted-foreground uppercase">
                      ATS Readiness Score
                    </div>
                    <div className="text-2xl font-black font-mono text-foreground">
                      {atsReport.score} <span className="text-xs text-muted-foreground font-normal">/ 100</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Status: <strong className="text-primary">{atsReport.label}</strong>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase">
                      Audited Checks ({atsReport.passedCount}/{atsReport.totalCount})
                    </span>
                    <div className="space-y-1.5 text-xs">
                      {atsReport.checks.map((chk) => (
                        <div
                          key={chk.id}
                          className="p-2.5 rounded-lg border border-border/50 bg-background flex items-start gap-2"
                        >
                          {chk.passed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          ) : (
                            <div className="h-3.5 w-3.5 rounded-full border border-amber-500/60 shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground">{chk.title}</div>
                            <div className="text-[11px] text-muted-foreground">{chk.explanation}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => setShowAiAssistantModal(true)}
                    className="w-full text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Open Full AI Assistant
                  </Button>
                </div>
              )}

              {/* TAB 4: Tailor for Job */}
              {rightTab === "tailor" && <JobTailorPanel data={resumeData} />}

              {/* TAB 5: Master Profile Sync */}
              {rightTab === "sync" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>Master Profile Connection Active</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Your resume draft inherits candidate facts from your Master Profile. Any edits you make here are resume-specific overrides and will not overwrite your Master Profile.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setShowSyncDialog(true)}
                      className="text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 mt-1"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Sync from Master Profile
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. BOTTOM PERSISTENT STATUS BAR */}
      <ResumeStatusBar
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
        atsScore={atsReport.score}
        completeness={completenessReport.score}
        estimatedPages={density.estimatedPages}
        isOverflowing={density.status === "overflowing"}
        onOptimizePage={handleOptimizeForOnePage}
        onOpenQualityAssistant={() => setShowAiAssistantModal(true)}
      />

      {/* AI Resume Assistant Dialog */}
      <AiResumeAssistant
        open={showAiAssistantModal}
        onOpenChange={setShowAiAssistantModal}
        data={resumeData}
        config={config}
        onSelectSection={(secId) => {
          setActiveSection(secId);
          setRightTab("edit");
          setMobileView("form");
        }}
        onUpdateConfig={handleUpdateConfig}
        onUpdateResume={(patch) => {
          pushStateToHistory(resumeData);
          setResumeData((prev) => ({ ...prev, ...patch }));
        }}
      />

      {/* Sync from Master Profile Confirmation Dialog */}
      <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <RefreshCw className="h-4 w-4 text-primary" /> Sync from Master Profile
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-muted-foreground pt-1">
              Update candidate details (Name, Contact info, Professional Summary, Skills, Education, Experience, and Projects) from your Master Profile?
              <br /><br />
              <strong>Note:</strong> Your selected template, section order, visibility, typography, and styling choices will remain preserved.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button variant="ghost" size="sm" onClick={() => setShowSyncDialog(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmSyncFromProfile}
              className="text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Sync Profile Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResumeEditor;

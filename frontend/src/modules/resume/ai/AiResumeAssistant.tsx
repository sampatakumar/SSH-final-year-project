import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Wand2,
  Layers,
  ArrowRight,
  Info,
  Check,
  Sliders,
  Send,
  Bot,
  User,
  RotateCcw,
  BarChart3,
  Target,
  Loader2,
  XCircle,
  Copy,
  ChevronRight,
  Zap,
} from "lucide-react";
import type { ResumeData, ResumeBuilderConfig } from "../templates/types";
import { calculateAtsReadiness, calculateCompletenessScore } from "../services/resume-scoring.utils";
import { calculateResumeDensity, optimizeConfigForOnePage } from "../preview/resume-density.utils";
import {
  ResumeApi,
  type LanguageIssue,
  type ResumeQualityRating,
  type AtsReadinessEvaluation,
  type RoleMatchAnalysis,
} from "../services/resume.api";
import { ResumeCopilotMessage } from "./ResumeCopilotMessage";
import { toast } from "sonner";

export interface AiResumeAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ResumeData;
  config: ResumeBuilderConfig;
  onSelectSection: (secId: string) => void;
  onUpdateConfig?: (newConfig: ResumeBuilderConfig) => void;
  onUpdateResume?: (patch: Partial<ResumeData>) => void;
  githubEvidence?: any[];
}

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

/**
 * Safely replaces exact substring within resume data without affecting unrelated sections
 */
function applyCorrectionToResume(
  data: ResumeData,
  originalText: string,
  proposedCorrection: string,
  section?: string
): Partial<ResumeData> | null {
  if (!originalText || !proposedCorrection || originalText === proposedCorrection) return null;

  const patch: Partial<ResumeData> = {};
  let applied = false;

  const replaceInBullets = (bullets?: string[]): string[] | null => {
    if (!Array.isArray(bullets)) return null;
    let modified = false;
    const nextBullets = bullets.map((b) => {
      if (typeof b === "string" && b.includes(originalText)) {
        modified = true;
        return b.replace(originalText, proposedCorrection);
      }
      return b;
    });
    return modified ? nextBullets : null;
  };

  // 1. Summary
  if ((!section || section === "summary" || section === "professionalSummary") && typeof data.professionalSummary === "string") {
    if (data.professionalSummary.includes(originalText)) {
      patch.professionalSummary = data.professionalSummary.replace(originalText, proposedCorrection);
      applied = true;
    }
  }

  // 2. Experience
  if ((!section || section === "experience") && Array.isArray(data.experience)) {
    const updatedExp = data.experience.map((exp) => {
      let expModified = false;
      let newRole = exp.role;
      let newCompany = exp.company;
      if (typeof newRole === "string" && newRole.includes(originalText)) {
        newRole = newRole.replace(originalText, proposedCorrection);
        expModified = true;
      }
      if (typeof newCompany === "string" && newCompany.includes(originalText)) {
        newCompany = newCompany.replace(originalText, proposedCorrection);
        expModified = true;
      }
      const newBullets = replaceInBullets(exp.bullets);
      if (newBullets) expModified = true;

      if (expModified) {
        applied = true;
        return {
          ...exp,
          role: newRole,
          company: newCompany,
          bullets: newBullets || exp.bullets,
        };
      }
      return exp;
    });
    if (applied) {
      patch.experience = updatedExp;
    }
  }

  // 3. Projects
  if ((!section || section === "projects") && Array.isArray(data.projects)) {
    const updatedProj = data.projects.map((proj: any) => {
      let projModified = false;
      let newName = proj.name;
      let newTech = proj.technologies;
      if (typeof newName === "string" && newName.includes(originalText)) {
        newName = newName.replace(originalText, proposedCorrection);
        projModified = true;
      }
      if (typeof newTech === "string" && newTech.includes(originalText)) {
        newTech = newTech.replace(originalText, proposedCorrection);
        projModified = true;
      }
      const newBullets = replaceInBullets(proj.bullets);
      if (newBullets) projModified = true;

      if (projModified) {
        applied = true;
        return {
          ...proj,
          name: newName,
          technologies: newTech,
          bullets: newBullets || proj.bullets,
        };
      }
      return proj;
    });
    if (applied) {
      patch.projects = updatedProj;
    }
  }

  // 4. Education
  if ((!section || section === "education") && Array.isArray(data.education)) {
    const updatedEdu = data.education.map((edu: any) => {
      let eduModified = false;
      let newSchool = edu.school;
      let newDegree = edu.degree;
      if (typeof newSchool === "string" && newSchool.includes(originalText)) {
        newSchool = newSchool.replace(originalText, proposedCorrection);
        eduModified = true;
      }
      if (typeof newDegree === "string" && newDegree.includes(originalText)) {
        newDegree = newDegree.replace(originalText, proposedCorrection);
        eduModified = true;
      }
      if (eduModified) {
        applied = true;
        return { ...edu, school: newSchool, degree: newDegree };
      }
      return edu;
    });
    if (applied) {
      patch.education = updatedEdu;
    }
  }

  // Fallback scan across summary if specific section didn't catch it
  if (!applied && typeof data.professionalSummary === "string" && data.professionalSummary.includes(originalText)) {
    patch.professionalSummary = data.professionalSummary.replace(originalText, proposedCorrection);
    applied = true;
  }

  return applied ? patch : null;
}

export const AiResumeAssistant: React.FC<AiResumeAssistantProps> = ({
  open,
  onOpenChange,
  data,
  config,
  onSelectSection,
  onUpdateConfig,
  onUpdateResume,
  githubEvidence,
}) => {
  const [activeTab, setActiveTab] = useState<"copilot" | "grammar" | "scores" | "role" | "ats" | "completeness" | "density" | "content">("copilot");

  // Existing Deterministic Reports for Backward-Compatibility
  const atsReport = calculateAtsReadiness(data, config);
  const completenessReport = calculateCompletenessScore(data);
  const density = calculateResumeDensity(data, config);

  // 1. Live Resume AI Copilot State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "initial-greeting",
      sender: "assistant",
      text: "👋 Welcome to your Live Resume AI Copilot! I have direct visibility into your current resume draft (including unsaved edits) and verified GitHub evidence. How can I help you improve your resume today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // 2. Language & Grammar State
  const [languageIssues, setLanguageIssues] = useState<LanguageIssue[]>([]);
  const [isReviewingLanguage, setIsReviewingLanguage] = useState(false);
  const [hasReviewedLanguage, setHasReviewedLanguage] = useState(false);

  // 3. Dual Scores State
  const [dualScores, setDualScores] = useState<{
    quality: ResumeQualityRating;
    ats: AtsReadinessEvaluation;
    recommendations: any[];
  } | null>(null);
  const [isEvaluatingScores, setIsEvaluatingScores] = useState(false);

  // 4. Target Role & Job Description State
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [roleMatchResult, setRoleMatchResult] = useState<RoleMatchAnalysis | null>(null);
  const [isAnalyzingRole, setIsAnalyzingRole] = useState(false);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if (activeTab === "copilot") {
      chatBottomRef.current?.scrollIntoView?.({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);

  const handleOptimizeSpacing = () => {
    if (onUpdateConfig) {
      const optimized = optimizeConfigForOnePage(data, config);
      onUpdateConfig(optimized);
      toast.success("Spacing optimized for 1 page!");
    }
  };

  // SEND MESSAGE TO COPILOT
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || chatInput).trim();
    if (!query || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const conversationHistory = chatMessages
        .filter((m) => m.id !== "initial-greeting")
        .map((m) => ({ role: m.sender, content: m.text }));

      const res = await ResumeApi.chatWithCopilot(data, query, conversationHistory, githubEvidence);

      if (res.success && res.data) {
        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: "assistant",
          text: res.data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setChatMessages((prev) => [...prev, assistantMsg]);
      } else {
        toast.error("Failed to receive response from Resume Copilot");
      }
    } catch (err: any) {
      toast.error(err.message || "Error communicating with AI Copilot");
    } finally {
      setIsChatLoading(false);
    }
  };

  // DIRECT APPLY FROM CHAT TO RESUME
  const handleApplyFromChat = (suggestedText: string, originalText?: string) => {
    if (!onUpdateResume) {
      toast.error("Resume editor update handler not available");
      return;
    }

    const cleanSuggested = suggestedText.trim();
    if (!cleanSuggested) return;

    // 1. If originalText was provided (from table diff or exact match), replace it cleanly
    if (originalText && originalText.trim()) {
      const cleanOriginal = originalText.trim();
      const patch = applyCorrectionToResume(data, cleanOriginal, cleanSuggested);
      if (patch) {
        onUpdateResume(patch);
        toast.success("Correction applied directly to resume!");
        return;
      }
    }

    // 2. If it's a multi-sentence paragraph and looks like a summary
    if (cleanSuggested.length > 60 && !cleanSuggested.startsWith("-") && !cleanSuggested.startsWith("•")) {
      onUpdateResume({ professionalSummary: cleanSuggested });
      toast.success("Updated Professional Summary in resume!");
      return;
    }

    // 3. If it looks like a bullet point, append to experience or projects
    if (Array.isArray(data.experience) && data.experience.length > 0) {
      const firstExp = data.experience[0];
      const updatedBullets = [...(firstExp.bullets || []), cleanSuggested.replace(/^[-*•]\s+/, "")];
      const updatedExperience = [
        { ...firstExp, bullets: updatedBullets },
        ...data.experience.slice(1),
      ];
      onUpdateResume({ experience: updatedExperience });
      toast.success("Appended bullet point to latest Experience entry!");
      return;
    }

    if (Array.isArray(data.projects) && data.projects.length > 0) {
      const firstProj = data.projects[0];
      const updatedBullets = [...(firstProj.bullets || []), cleanSuggested.replace(/^[-*•]\s+/, "")];
      const updatedProjects = [
        { ...firstProj, bullets: updatedBullets },
        ...data.projects.slice(1),
      ];
      onUpdateResume({ projects: updatedProjects });
      toast.success("Appended bullet point to latest Project entry!");
      return;
    }

    toast.info("Copied suggested text to clipboard!");
    navigator.clipboard.writeText(cleanSuggested);
  };

  // REVIEW WRITING & GRAMMAR
  const handleReviewLanguage = async () => {
    setIsReviewingLanguage(true);
    try {
      const res = await ResumeApi.reviewLanguage(data);
      if (res.success && res.data) {
        setLanguageIssues(res.data.issues || []);
        setHasReviewedLanguage(true);
        if (res.data.issues?.length === 0) {
          toast.success("Great job! No grammar, spelling, or weak phrasing issues detected.");
        } else {
          toast.info(`Found ${res.data.issues.length} writing and grammar suggestions.`);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to analyze language and grammar");
    } finally {
      setIsReviewingLanguage(false);
    }
  };

  // APPLY A SINGLE CORRECTION SAFELY
  const handleApplySingleCorrection = (issue: LanguageIssue) => {
    if (!onUpdateResume) {
      toast.error("Resume editor update handler not available");
      return;
    }

    const patch = applyCorrectionToResume(data, issue.originalText, issue.proposedCorrection, issue.section);
    if (!patch) {
      toast.error("Original text could not be located in current draft. It may have been updated.");
      setLanguageIssues((prev) => prev.filter((i) => i.id !== issue.id));
      return;
    }

    onUpdateResume(patch);
    setLanguageIssues((prev) => prev.filter((i) => i.id !== issue.id));
    toast.success(`Applied correction in ${issue.section || "resume"}!`);
  };

  // DISMISS A CORRECTION
  const handleDismissCorrection = (issueId: string) => {
    setLanguageIssues((prev) => prev.filter((i) => i.id !== issueId));
  };

  // APPLY ALL SAFE CORRECTIONS
  const handleApplyAllSafeCorrections = () => {
    if (!onUpdateResume) return;

    const safeIssues = languageIssues.filter((i) => i.safeToApply);
    if (safeIssues.length === 0) {
      toast.info("No automatic-safe corrections available.");
      return;
    }

    let workingData: ResumeData = { ...data };
    let appliedCount = 0;
    const remainingIssues = [...languageIssues];

    for (const issue of safeIssues) {
      const patch = applyCorrectionToResume(workingData, issue.originalText, issue.proposedCorrection, issue.section);
      if (patch) {
        workingData = { ...workingData, ...patch };
        appliedCount++;
        const idx = remainingIssues.findIndex((i) => i.id === issue.id);
        if (idx !== -1) remainingIssues.splice(idx, 1);
      }
    }

    if (appliedCount > 0) {
      onUpdateResume(workingData);
      setLanguageIssues(remainingIssues);
      toast.success(`Successfully applied ${appliedCount} safe corrections!`);
    } else {
      toast.info("Could not automatically locate the target text for batch replacement.");
    }
  };

  // EVALUATE DUAL SCORES
  const handleEvaluateDualScores = async () => {
    setIsEvaluatingScores(true);
    try {
      const res = await ResumeApi.evaluateScores(data, githubEvidence);
      if (res.success && res.data) {
        setDualScores(res.data);
        toast.success("Resume Quality and ATS Readiness evaluated!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to evaluate resume scores");
    } finally {
      setIsEvaluatingScores(false);
    }
  };

  // ANALYZE TARGET ROLE & JOB DESCRIPTION
  const handleAnalyzeTargetRole = async () => {
    if (!targetRole.trim() && !jobDescription.trim()) {
      toast.error("Please enter a Target Job Role or paste a Job Description");
      return;
    }

    setIsAnalyzingRole(true);
    try {
      const res = await ResumeApi.analyzeRole(data, targetRole, jobDescription);
      if (res.success && res.data) {
        setRoleMatchResult(res.data);
        toast.success(`Role match analysis complete: ${res.data.matchPercentage}% match!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to analyze target role");
    } finally {
      setIsAnalyzingRole(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col p-0 overflow-hidden bg-slate-950 border-slate-800 text-slate-100 shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-4 border-b border-slate-800 bg-slate-900/60 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                  AI Resume Assistant
                  <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                    Live Draft Copilot
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Grounded multi-turn guidance, writing proofreading, dual scoring rubric, and job tailoring
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1.5 border-b border-slate-800 text-xs shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("copilot")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "copilot"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bot className="h-3.5 w-3.5 text-cyan-400" />
            Live AI Copilot
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("grammar");
              if (!hasReviewedLanguage) handleReviewLanguage();
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "grammar"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Wand2 className="h-3.5 w-3.5 text-purple-400" />
            Writing & Grammar
            {languageIssues.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500/30 text-purple-200">
                {languageIssues.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("scores");
              if (!dualScores) handleEvaluateDualScores();
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "scores"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
            Dual Scoring
            {dualScores && (
              <span className="ml-1 text-[10px] text-emerald-300 font-mono">
                {dualScores.quality.overallScore} | {dualScores.ats.overallScore}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("role")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "role"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Target className="h-3.5 w-3.5 text-amber-400" />
            Target Role & JD
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ats")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "ats"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
            ATS Readiness ({atsReport.score})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("completeness")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "completeness"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Completeness ({completenessReport.score}%)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("density")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "density"
                ? "bg-slate-700 text-slate-200 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            Page Density
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("content")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "content"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Wand2 className="h-3.5 w-3.5 text-purple-400" />
            Content Quality
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {/* TAB 1: LIVE RESUME AI COPILOT */}
          {activeTab === "copilot" && (
            <div className="flex flex-col h-full min-h-[460px] max-h-[520px]">
              {/* Context Banner */}
              <div className="p-2.5 mb-3 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-xs flex items-center justify-between text-cyan-300 shrink-0">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>
                    <strong>Live Active Draft Context Active:</strong> The Copilot analyzes your current unsaved editor state, profile skills, and GitHub evidence without hallucinating fake facts.
                  </span>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-3 custom-scrollbar">
                {chatMessages.map((msg) => (
                  <ResumeCopilotMessage
                    key={msg.id}
                    id={msg.id}
                    sender={msg.sender}
                    text={msg.text}
                    timestamp={msg.timestamp}
                    onApplyToResume={handleApplyFromChat}
                  />
                ))}

                {isChatLoading && (
                  <div className="flex gap-2.5 items-center text-xs text-cyan-400 bg-cyan-950/20 p-2.5 rounded-lg border border-cyan-900/40 w-fit">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Analyzing current draft context with Groq AI...</span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="flex flex-wrap gap-1.5 mb-2.5 shrink-0">
                {[
                  "Review my current resume",
                  "Find grammar and spelling mistakes",
                  "Strengthen project bullets with metrics",
                  "Improve professional summary",
                  "What should I improve first?",
                  "Check ATS readability",
                ].map((promptText) => (
                  <button
                    key={promptText}
                    type="button"
                    onClick={() => handleSendMessage(promptText)}
                    disabled={isChatLoading}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors disabled:opacity-50"
                  >
                    {promptText}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800 shrink-0">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask anything about your resume, bullet phrasing, or target skills..."
                  disabled={isChatLoading}
                  className="bg-slate-900 border-slate-800 text-xs text-white placeholder:text-slate-500"
                />
                <Button
                  size="sm"
                  onClick={() => handleSendMessage()}
                  disabled={!chatInput.trim() || isChatLoading}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-3"
                >
                  {isChatLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: WRITING, GRAMMAR & PHRASING */}
          {activeTab === "grammar" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-purple-400" />
                    Language, Grammar & Phrasing Review
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Detects grammar, spelling, lowercase bullets, weak action verbs, and wordiness while protecting technical terminology.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {languageIssues.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleApplyAllSafeCorrections}
                      className="text-xs border-purple-500/40 text-purple-300 hover:bg-purple-900/30"
                    >
                      <Sparkles className="h-3 w-3 mr-1 text-purple-400" /> Apply All Safe
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleReviewLanguage}
                    disabled={isReviewingLanguage}
                    className="text-xs bg-purple-600 hover:bg-purple-500 text-white"
                  >
                    {isReviewingLanguage ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    )}
                    Re-Analyze Draft
                  </Button>
                </div>
              </div>

              {/* Issues List */}
              {languageIssues.length > 0 ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{languageIssues.length} issue(s) identified in current draft</span>
                    <span className="text-[11px]">Click "Apply Fix" to update your resume and push to Undo history</span>
                  </div>

                  {languageIssues.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/70 space-y-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              issue.category === "GRAMMAR" || issue.category === "SPELLING"
                                ? "bg-red-500/10 text-red-400 border-red-500/30"
                                : issue.category === "WEAK_ACTION_VERB"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                            }`}
                          >
                            {issue.category.replace(/_/g, " ")}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-400 border-slate-700">
                            Section: {issue.section}
                          </Badge>
                          <span
                            className={`text-[10px] font-semibold uppercase ${
                              issue.severity === "high"
                                ? "text-red-400"
                                : issue.severity === "medium"
                                ? "text-amber-400"
                                : "text-slate-400"
                            }`}
                          >
                            {issue.severity} priority
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDismissCorrection(issue.id)}
                            className="h-7 text-[11px] text-slate-400 hover:text-slate-200"
                          >
                            Dismiss
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApplySingleCorrection(issue)}
                            className="h-7 text-[11px] bg-purple-600 hover:bg-purple-500 text-white font-medium"
                          >
                            Apply Fix
                          </Button>
                        </div>
                      </div>

                      {/* Original vs Proposed */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2 rounded-lg bg-red-950/20 border border-red-900/30">
                          <span className="text-[10px] font-bold text-red-400 uppercase block mb-0.5">Original</span>
                          <span className="text-slate-300 font-mono line-through opacity-80">{issue.originalText}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-900/30">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-0.5">Proposed Correction</span>
                          <span className="text-emerald-300 font-mono font-medium">{issue.proposedCorrection}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-start gap-1.5">
                        <Info className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                        <span>{issue.explanation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : hasReviewedLanguage ? (
                <div className="p-8 text-center rounded-xl border border-emerald-800/30 bg-emerald-950/10 space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                  <h5 className="font-bold text-white text-sm">Flawless Language & Phrasing!</h5>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    No grammar errors, lowercase bullets, or weak action verbs detected in your current resume content.
                  </p>
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
                  <Wand2 className="h-8 w-8 text-purple-400 mx-auto" />
                  <h5 className="font-bold text-white text-sm">Analyze Resume Phrasing</h5>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Click "Re-Analyze Draft" above to scan for grammar mistakes, passive voice, weak action verbs, and inconsistent terminology.
                  </p>
                  <Button
                    size="sm"
                    onClick={handleReviewLanguage}
                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs"
                  >
                    Start Writing Review
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DUAL SCORING SYSTEM */}
          {activeTab === "scores" && (
            <div className="space-y-4">
              {/* Dual Score Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Score A: Resume Quality Rating */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/30 to-slate-900 border border-emerald-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        System A • Qualitative
                      </div>
                      <h4 className="text-sm font-bold text-white">Resume Quality Rating</h4>
                    </div>
                    <div className="text-2xl font-black font-mono text-emerald-300">
                      {dualScores?.quality.overallScore ?? "--"}{" "}
                      <span className="text-xs font-normal text-slate-400">/ 100</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-tight">
                    Multi-dimensional rubric evaluating grammar, technical depth, impact metrics, layout, and completeness.
                  </p>

                  {dualScores?.quality.categories && (
                    <div className="space-y-1.5 pt-1 text-xs">
                      {Object.entries(dualScores.quality.categories).map(([catKey, cat]: [string, any]) => (
                        <div key={catKey} className="space-y-0.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-300 capitalize">{catKey.replace(/([A-Z])/g, " $1")}</span>
                            <span className="font-mono text-emerald-400">{cat.score} / {cat.maxScore}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${(cat.score / cat.maxScore) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Score B: ATS Readiness Score */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/30 to-slate-900 border border-cyan-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                        System B • Parser-Safe
                      </div>
                      <h4 className="text-sm font-bold text-white">ATS Readiness Score</h4>
                    </div>
                    <div className="text-2xl font-black font-mono text-cyan-300">
                      {dualScores?.ats.overallScore ?? atsReport.score}{" "}
                      <span className="text-xs font-normal text-slate-400">/ 100</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-tight">
                    Evaluates mechanical ATS parser safety, standard section headings, contact links, and bullet quantification.
                  </p>

                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Parser Status:</span>
                      <strong className="text-cyan-300">{dualScores?.ats.label || atsReport.label}</strong>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Rubric Version:</span>
                      <span className="text-slate-300 font-mono text-[10px]">
                        {dualScores?.ats.rubricVersion || "ats-v2.0-deterministic"}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEvaluateDualScores}
                    disabled={isEvaluatingScores}
                    className="w-full text-xs border-cyan-800 text-cyan-300 hover:bg-cyan-950/40"
                  >
                    {isEvaluatingScores ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RotateCcw className="h-3 w-3 mr-1" />}
                    Re-Calculate Dual Scores
                  </Button>
                </div>
              </div>

              {/* Prioritized Action Recommendations */}
              {dualScores?.recommendations && dualScores.recommendations.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-amber-400" />
                    Prioritized Next Steps (Ranked by Impact)
                  </div>

                  <div className="space-y-2">
                    {dualScores.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl border border-slate-800 bg-slate-900/70 flex items-start gap-3 text-xs"
                      >
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30 shrink-0 font-mono"
                        >
                          P{rec.priority || i + 1}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-white">{rec.recommendation}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{rec.explanation}</div>
                          {rec.section && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                onOpenChange(false);
                                onSelectSection(rec.section);
                              }}
                              className="h-6 text-[10px] px-2 text-cyan-400 hover:text-cyan-300 p-0 mt-1"
                            >
                              Go to section <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TARGET ROLE & JOB DESCRIPTION */}
          {activeTab === "role" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-1">
                <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Target className="h-4 w-4" /> Optional Target Job Role & Description
                </h4>
                <p className="text-[11px] text-slate-400">
                  Tailor your resume against specific target expectations. The analyzer distinguishes between verified demonstrated experience and keyword padding.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Target Role Title (Optional)</label>
                  <Input
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Full-Stack Developer, Backend Engineer, DevOps Engineer"
                    className="bg-slate-900 border-slate-800 text-xs text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Target Job Description (Optional)</label>
                  <Textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the target job description or requirements to extract required vs preferred qualifications..."
                    rows={4}
                    className="bg-slate-900 border-slate-800 text-xs text-white placeholder:text-slate-500 font-mono"
                  />
                </div>

                <Button
                  size="sm"
                  onClick={handleAnalyzeTargetRole}
                  disabled={isAnalyzingRole || (!targetRole.trim() && !jobDescription.trim())}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-xs"
                >
                  {isAnalyzingRole ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                  Analyze Match Against Resume
                </Button>
              </div>

              {/* Match Result Display */}
              {roleMatchResult && (
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase">Target Role Alignment</span>
                    <div className="text-xl font-bold font-mono text-amber-400">
                      {roleMatchResult.matchPercentage}% <span className="text-xs text-slate-400 font-normal">Match</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300">{roleMatchResult.summary}</p>

                  {/* Skills Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/30 space-y-1.5">
                      <div className="text-[11px] font-bold text-emerald-400 uppercase">
                        Matched Skills ({roleMatchResult.requiredSkillsMatched?.length || 0})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {roleMatchResult.requiredSkillsMatched?.map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/30 space-y-1.5">
                      <div className="text-[11px] font-bold text-red-400 uppercase">
                        Missing Required Skills ({roleMatchResult.missingRequiredSkills?.length || 0})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {roleMatchResult.missingRequiredSkills?.map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 text-[10px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Grounding Disclaimer */}
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Ethical Grounding Rule:</strong> Never insert skills you do not possess to artificially inflate ATS match. If you have used missing technologies in coursework or personal projects, add verifiable bullet points.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ATS CHECKLIST (EXISTING) */}
          {activeTab === "ats" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    ATS Readiness Heuristic
                  </div>
                  <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1">
                    {atsReport.score} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Status: <strong className="text-cyan-400">{atsReport.label}</strong> • Evaluated on parser-safe standards
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    {atsReport.passedCount} of {atsReport.totalCount} checks passed
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {atsReport.checks.map((chk) => (
                  <div
                    key={chk.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                      chk.passed ? "bg-slate-900/50 border-slate-800" : "bg-amber-950/20 border-amber-800/40"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      {chk.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-bold text-white">{chk.title}</div>
                        <div className="text-[11px] text-slate-400 leading-tight">{chk.explanation}</div>
                      </div>
                    </div>

                    {!chk.passed && chk.fixSection && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onOpenChange(false);
                          onSelectSection(chk.fixSection!);
                        }}
                        className="h-6 text-[10px] px-2 font-semibold bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 shrink-0"
                      >
                        Edit Section
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: PAGE DENSITY (EXISTING) */}
          {activeTab === "density" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Page Layout & Fill Heuristic
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    {density.estimatedPages === 1 ? "1 Page" : `${density.estimatedPages} Pages`}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Estimated Lines: {density.estimatedLines} • Fill Capacity: {Math.round(density.fillRatio * 100)}%
                  </p>
                </div>

                {density.status === "overflowing" && onUpdateConfig && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOptimizeSpacing}
                    className="h-8 text-xs bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 font-semibold"
                  >
                    <Sparkles className="h-3 w-3 mr-1 text-amber-400" /> Optimize 1 Page
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {density.warnings.map((w, i) => (
                  <div key={i} className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-white">{w}</div>
                      {density.suggestions[i] && (
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Suggestion: {density.suggestions[i]}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {density.warnings.length === 0 && (
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-xs flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Resume density is well balanced and readable!</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 7: COMPLETENESS */}
          {activeTab === "completeness" && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Student-Aware Completeness
                  </div>
                  <div className="text-2xl font-black text-foreground font-mono flex items-baseline gap-1">
                    {completenessReport.score}%
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {completenessReport.summaryText}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {completenessReport.completedCount} of {completenessReport.items.length} items complete
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Section Audit Items
                </span>
                <div className="space-y-2">
                  {completenessReport.items.map((item) => (
                    <div
                      key={item.key}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                        item.completed ? "bg-background border-border/60" : "bg-muted/40 border-border/60"
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        {item.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-muted-foreground/40 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold text-foreground">{item.label}</div>
                          <div className="text-[11px] text-muted-foreground leading-tight">{item.hint}</div>
                        </div>
                      </div>

                      {!item.completed && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            onOpenChange(false);
                            onSelectSection(item.sectionId);
                          }}
                          className="h-6 text-[10px] px-2 font-semibold bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 shrink-0"
                        >
                          Add {item.label}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: CONTENT QUALITY */}
          {activeTab === "content" && (
            <div className="space-y-4 pt-2">
              <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-xs space-y-1">
                <div className="font-bold text-primary flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" /> Zero Hallucination Grounding Rule
                </div>
                <p className="text-muted-foreground leading-relaxed text-[11px]">
                  AI Resume Assistant is strictly grounded in your verified profile facts, skills matrix, and project evidence. It will never fabricate fake metrics, revenue numbers, or unverified claims.
                </p>
              </div>

              <div className="space-y-2.5">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Actionable Next Steps
                </span>
                <div className="space-y-2">
                  <div className="p-3 rounded-xl border border-border/60 bg-background flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-foreground">Enhance Professional Summary</div>
                      <div className="text-[11px] text-muted-foreground">
                        Generate 4 tone variants (Technical, Concise, ATS, Professional).
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onOpenChange(false);
                        onSelectSection("summary");
                      }}
                      className="h-7 text-xs"
                    >
                      Open Summary
                    </Button>
                  </div>

                  <div className="p-3 rounded-xl border border-border/60 bg-background flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-foreground">Action Verbs on Projects</div>
                      <div className="text-[11px] text-muted-foreground">
                        Begin each bullet point with strong engineering action verbs.
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onOpenChange(false);
                        onSelectSection("projects");
                      }}
                      className="h-7 text-xs"
                    >
                      Open Projects
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-3 border-t border-slate-800 bg-slate-900/60 shrink-0 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
            <span>Anti-hallucination verified • Undo/Redo supported for all edits</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs text-slate-400 hover:text-white">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AiResumeAssistant;

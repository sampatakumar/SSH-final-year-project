import React from "react";
import { Sparkles, Bot, Check, ShieldCheck, HelpCircle } from "lucide-react";
import type { UserSettingsData } from "../types/settings.types";

interface SmartMentorSettingsSectionProps {
  preferences: UserSettingsData["mentorPreferences"];
  onChange: (patch: Partial<UserSettingsData["mentorPreferences"]>) => void;
}

const RESPONSE_STYLES: Array<{
  id: "concise" | "balanced" | "detailed";
  label: string;
  description: string;
}> = [
  {
    id: "concise",
    label: "Concise",
    description: "Brief, bulleted actionable summaries.",
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "Default: thorough technical explanations with clear next steps.",
  },
  {
    id: "detailed",
    label: "Detailed",
    description: "Deep-dive architectures, code snippets & exhaustive roadmaps.",
  },
];

const FOCUS_AREAS = [
  { id: "career", label: "Career & Placement Readiness" },
  { id: "github", label: "GitHub Repositories & Hygiene" },
  { id: "skills", label: "Skill Matrix & Priority Gaps" },
  { id: "learning", label: "Learning Roadmap & Topics" },
  { id: "edutube", label: "EduTube Course Recommendations" },
  { id: "projects", label: "Hands-on Project Architecture" },
  { id: "resume", label: "Resume & ATS Optimization" },
  { id: "interview", label: "Technical Interview Preparation" },
];

const CONTEXT_SOURCES = [
  { id: "profile", label: "Profile & Career Goals" },
  { id: "skills", label: "Verified Skill Profile" },
  { id: "github", label: "GitHub Repositories & Commit Signals" },
  { id: "edutube", label: "EduTube Watch & Progress History" },
  { id: "projects", label: "Recorded Project Showcase" },
  { id: "resume", label: "Master Resume Experience" },
];

const PROACTIVE_OPTIONS = [
  { id: "next_actions", label: "Recommend concrete next actions" },
  { id: "skill_gaps", label: "Highlight critical skill gap warnings" },
  { id: "learning_resources", label: "Suggest targeted learning tracks" },
  { id: "github_improvements", label: "Proactively suggest README & repo fixes" },
  { id: "project_improvements", label: "Recommend portfolio additions" },
];

export const SmartMentorSettingsSection: React.FC<SmartMentorSettingsSectionProps> = ({
  preferences,
  onChange,
}) => {
  const toggleArrayItem = (list: string[], item: string): string[] => {
    if (list.includes(item)) {
      return list.filter((i) => i !== item);
    }
    return [...list, item];
  };

  return (
    <div className="p-6 rounded-2xl bg-surface/90 border border-border/50 shadow-neo-raised space-y-6">
      <div>
        <h3 className="text-base font-black text-foreground flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Smart Mentor AI Configuration
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Customize response style, intelligence focus, and context grounding sources for your AI mentor.
        </p>
      </div>

      {/* Response Style */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-foreground block uppercase tracking-wider">
          Response Style
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {RESPONSE_STYLES.map((style) => {
            const isSelected = preferences.responseStyle === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => onChange({ responseStyle: style.id })}
                className={`p-3.5 rounded-xl text-left border transition-all ${
                  isSelected
                    ? "bg-primary/10 border-primary shadow-neo-raised-sm"
                    : "bg-surface border-border/40 hover:border-border/80"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-foreground capitalize">
                    {style.label}
                  </span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  {style.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Focus Areas */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-foreground block uppercase tracking-wider">
          Mentor Focus Areas
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {FOCUS_AREAS.map((item) => {
            const checked = preferences.focusAreas.includes(item.id);
            return (
              <label
                key={item.id}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-surface border border-border/40 hover:border-primary/40 cursor-pointer transition-all shadow-neo-raised-sm"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChange({
                      focusAreas: toggleArrayItem(preferences.focusAreas, item.id),
                    })
                  }
                  className="rounded border-border/60 text-primary focus:ring-primary h-4 w-4 bg-background"
                />
                <span className="text-xs font-semibold text-foreground/90">
                  {item.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Context Sources Grounding */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-foreground block uppercase tracking-wider">
          Context Sources Used
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {CONTEXT_SOURCES.map((item) => {
            const checked = preferences.contextSources.includes(item.id);
            return (
              <label
                key={item.id}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-surface border border-border/40 hover:border-primary/40 cursor-pointer transition-all shadow-neo-raised-sm"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChange({
                      contextSources: toggleArrayItem(preferences.contextSources, item.id),
                    })
                  }
                  className="rounded border-border/60 text-primary focus:ring-primary h-4 w-4 bg-background"
                />
                <span className="text-xs font-semibold text-foreground/90">
                  {item.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Proactive Guidance */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-foreground block uppercase tracking-wider">
          Proactive Guidance Rules
        </label>
        <div className="space-y-2">
          {PROACTIVE_OPTIONS.map((item) => {
            const checked = preferences.proactiveGuidance.includes(item.id);
            return (
              <label
                key={item.id}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-surface border border-border/40 hover:border-primary/40 cursor-pointer transition-all shadow-neo-raised-sm"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChange({
                      proactiveGuidance: toggleArrayItem(
                        preferences.proactiveGuidance,
                        item.id
                      ),
                    })
                  }
                  className="rounded border-border/60 text-primary focus:ring-primary h-4 w-4 bg-background"
                />
                <span className="text-xs font-semibold text-foreground/90">
                  {item.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};

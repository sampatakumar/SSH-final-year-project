import React from "react";
import { GraduationCap, PlayCircle, Target, Sparkles, History, CheckCircle2 } from "lucide-react";
import type { UserSettingsData } from "../types/settings.types";

interface EduTubeSettingsSectionProps {
  preferences: UserSettingsData["eduTubePreferences"];
  onChange: (patch: Partial<UserSettingsData["eduTubePreferences"]>) => void;
}

export const EduTubeSettingsSection: React.FC<EduTubeSettingsSectionProps> = ({
  preferences,
  onChange,
}) => {
  const togglePreference = (key: keyof UserSettingsData["eduTubePreferences"]) => {
    onChange({ [key]: !preferences[key] });
  };

  const ITEMS: Array<{
    key: keyof UserSettingsData["eduTubePreferences"];
    title: string;
    description: string;
    icon: any;
  }> = [
    {
      key: "personalizedRecommendations",
      title: "AI Personalized Recommendations",
      description: "Generate 6 tailored feed sections matching your skill gaps and target role.",
      icon: Sparkles,
    },
    {
      key: "continueLearning",
      title: "Continue Learning Persistence",
      description: "Save playback position and restore in-progress lessons upon return.",
      icon: PlayCircle,
    },
    {
      key: "trackHistory",
      title: "Watch History Tracking",
      description: "Maintain a personal log of watched engineering courses and lessons.",
      icon: History,
    },
    {
      key: "trackProgress",
      title: "Lesson Completion Tracking",
      description: "Record completed lessons to compute skill progress and personalize milestones.",
      icon: CheckCircle2,
    },
    {
      key: "recommendFromGaps",
      title: "Recommend from Active Skill Gaps",
      description: "Surface targeted lessons addressing identified competency deficits.",
      icon: Target,
    },
    {
      key: "recommendFromRoadmap",
      title: "Recommend from Learning Roadmap",
      description: "Align recommended course tracks with your career milestone objectives.",
      icon: GraduationCap,
    },
  ];

  return (
    <div className="p-6 rounded-2xl bg-surface/90 border border-border/50 shadow-neo-raised space-y-6">
      <div>
        <h3 className="text-base font-black text-foreground flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          EduTube Learning Preferences
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Control video recommendations, progress tracking, and persistence options for EduTube.
        </p>
      </div>

      <div className="space-y-3">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const checked = Boolean(preferences[item.key]);
          return (
            <div
              key={item.key}
              onClick={() => togglePreference(item.key)}
              className="flex items-start justify-between gap-4 p-4 rounded-xl bg-surface border border-border/40 hover:border-primary/40 cursor-pointer shadow-neo-raised-sm transition-all"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 mt-0.5">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-bold text-foreground">{item.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={checked}
                onChange={() => {}}
                className="rounded border-border/60 text-primary focus:ring-primary h-4 w-4 mt-1 bg-background shrink-0 pointer-events-none"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

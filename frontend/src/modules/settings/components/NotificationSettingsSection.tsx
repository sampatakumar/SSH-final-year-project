import React from "react";
import { Bell, ShieldAlert, Sparkles, GitBranch, GraduationCap, Target } from "lucide-react";
import type { UserSettingsData } from "../types/settings.types";

interface NotificationSettingsSectionProps {
  preferences: UserSettingsData["notificationPreferences"];
  onChange: (patch: Partial<UserSettingsData["notificationPreferences"]>) => void;
}

export const NotificationSettingsSection: React.FC<NotificationSettingsSectionProps> = ({
  preferences,
  onChange,
}) => {
  const toggleKey = (key: keyof UserSettingsData["notificationPreferences"]) => {
    onChange({ [key]: !preferences[key] });
  };

  const NOTIFICATIONS: Array<{
    key: keyof UserSettingsData["notificationPreferences"];
    title: string;
    description: string;
    icon: any;
  }> = [
    {
      key: "skillGapAlerts",
      title: "Skill Gap Priority Alerts",
      description: "Notify me when high-priority or critical skill gaps are detected.",
      icon: Target,
    },
    {
      key: "learningRecommendations",
      title: "Learning Milestone Recommendations",
      description: "Receive updates when new syllabus tracks or milestones are ready.",
      icon: Sparkles,
    },
    {
      key: "githubAlerts",
      title: "GitHub Repository Hygiene Alerts",
      description: "Alert me when repositories are missing descriptions or README documentation.",
      icon: GitBranch,
    },
    {
      key: "mentorRecommendations",
      title: "Smart Mentor Proactive Suggestions",
      description: "Receive weekly roadmap tips and technical placement preparation advice.",
      icon: Bell,
    },
    {
      key: "eduTubeReminders",
      title: "EduTube Learning Reminders",
      description: "Gentle reminders to maintain learning consistency on active courses.",
      icon: GraduationCap,
    },
  ];

  return (
    <div className="p-6 rounded-2xl bg-surface/90 border border-border/50 shadow-neo-raised space-y-6">
      <div>
        <h3 className="text-base font-black text-foreground flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Notification Preferences
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Choose which proactive career alerts and learning reminders you want to receive.
        </p>
      </div>

      <div className="space-y-3">
        {NOTIFICATIONS.map((item) => {
          const Icon = item.icon;
          const checked = Boolean(preferences[item.key]);
          return (
            <div
              key={item.key}
              onClick={() => toggleKey(item.key)}
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

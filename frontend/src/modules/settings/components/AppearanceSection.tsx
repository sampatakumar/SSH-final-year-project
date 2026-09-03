import React from "react";
import { useTheme } from "next-themes";
import { Palette, Moon, Sun, Laptop, Check } from "lucide-react";
import type { UserSettingsData } from "../types/settings.types";

interface AppearanceSectionProps {
  preferences: UserSettingsData["appearancePreferences"];
  onChange: (patch: Partial<UserSettingsData["appearancePreferences"]>) => void;
}

export const AppearanceSection: React.FC<AppearanceSectionProps> = ({
  preferences,
  onChange,
}) => {
  const { theme, setTheme } = useTheme();

  const THEMES: Array<{
    id: "dark" | "light" | "system";
    label: string;
    description: string;
    icon: any;
  }> = [
    {
      id: "dark",
      label: "Dark Mode",
      description: "Default: Neo-dark engineered theme for maximum focus.",
      icon: Moon,
    },
    {
      id: "light",
      label: "Light Mode",
      description: "Clean, high-contrast daylight aesthetic.",
      icon: Sun,
    },
    {
      id: "system",
      label: "System Match",
      description: "Automatically synchronizes with your OS appearance.",
      icon: Laptop,
    },
  ];

  const handleSelectTheme = (selectedTheme: "dark" | "light" | "system") => {
    setTheme(selectedTheme);
    onChange({ theme: selectedTheme });
  };

  return (
    <div className="p-6 rounded-2xl bg-surface/90 border border-border/50 shadow-neo-raised space-y-6">
      <div>
        <h3 className="text-base font-black text-foreground flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Appearance & Theme
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Customize the visual interface and display preferences of Smart Skill Hub.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {THEMES.map((item) => {
          const Icon = item.icon;
          const isSelected = (theme || preferences.theme) === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectTheme(item.id)}
              className={`p-4 rounded-xl text-left border transition-all shadow-neo-raised-sm ${
                isSelected
                  ? "bg-primary/10 border-primary shadow-neo-raised"
                  : "bg-surface border-border/40 hover:border-border/80"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="p-2 rounded-lg bg-surface border border-border/40 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                {isSelected && <Check className="h-4 w-4 text-primary" />}
              </div>
              <p className="text-xs font-bold text-foreground">{item.label}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                {item.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

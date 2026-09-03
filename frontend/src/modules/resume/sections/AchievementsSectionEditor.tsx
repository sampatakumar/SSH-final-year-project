import React from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Achievement } from "../templates/types";

export interface AchievementsSectionEditorProps {
  achievements: Achievement[];
  onChange: (updated: Achievement[]) => void;
}

export const AchievementsSectionEditor: React.FC<AchievementsSectionEditorProps> = ({
  achievements = [],
  onChange,
}) => {
  const handleAddAchievement = () => {
    const newAch: Achievement = {
      title: "",
      date: "",
      bullets: [],
    };
    onChange([...achievements, newAch]);
  };

  const handleUpdateAchievement = (index: number, patch: Partial<Achievement>) => {
    onChange(achievements.map((ach, i) => (i === index ? { ...ach, ...patch } : ach)));
  };

  const handleRemoveAchievement = (index: number) => {
    onChange(achievements.filter((_, i) => i !== index));
  };

  const handleMoveAchievement = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= achievements.length) return;
    const next = [...achievements];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-primary" /> Honors, Awards & Achievements
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Hackathons, leadership awards, academic honors, and competitive rankings.
          </p>
        </div>
        <Button size="sm" onClick={handleAddAchievement} className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" /> Add Award
        </Button>
      </div>

      {/* List */}
      {achievements.length === 0 ? (
        <div className="p-6 text-center rounded-xl border border-dashed border-border/70 text-muted-foreground space-y-2">
          <Trophy className="h-8 w-8 mx-auto text-muted-foreground/50" />
          <p className="text-xs">No awards added yet.</p>
          <Button size="sm" variant="outline" onClick={handleAddAchievement} className="h-7 text-xs">
            Add Your First Award
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {achievements.map((ach, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-border/60 bg-background/80 space-y-2.5 relative group"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                    #{idx + 1}
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {ach.title || "Honor / Award Title"}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={idx === 0}
                    onClick={() => handleMoveAchievement(idx, "up")}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Move up"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={idx === achievements.length - 1}
                    onClick={() => handleMoveAchievement(idx, "down")}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Move down"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemoveAchievement(idx)}
                    className="h-6 w-6 text-destructive hover:bg-destructive/10"
                    title="Delete award"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Award Title / Description
                  </label>
                  <Input
                    placeholder="e.g. Winner of National Cloud Hackathon 2024 (1st Place)"
                    value={ach.title}
                    onChange={(e) => handleUpdateAchievement(idx, { title: e.target.value })}
                    className="text-xs h-8 bg-card"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Date / Year
                  </label>
                  <Input
                    placeholder="e.g. 2024"
                    value={ach.date || ""}
                    onChange={(e) => handleUpdateAchievement(idx, { date: e.target.value })}
                    className="text-xs h-8 bg-card"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

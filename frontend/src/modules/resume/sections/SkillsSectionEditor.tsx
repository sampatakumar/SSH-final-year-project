import React, { useState } from "react";
import { Cpu, Plus, Trash2, Tag, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TechnicalSkills, SkillSection } from "../templates/types";

export interface SkillsSectionEditorProps {
  skills?: TechnicalSkills;
  skillSections?: SkillSection[];
  onChangeSkills: (skills: TechnicalSkills) => void;
  onChangeSkillSections: (sections: SkillSection[]) => void;
}

export const SkillsSectionEditor: React.FC<SkillsSectionEditorProps> = ({
  skills = { languages: [], frameworks: [], tools: [], libraries: [] },
  skillSections = [],
  onChangeSkills,
  onChangeSkillSections,
}) => {
  const [newCategoryTitle, setNewCategoryTitle] = useState("");

  const updateBucket = (
    key: "languages" | "frameworks" | "tools" | "libraries",
    rawText: string
  ) => {
    const parsed = rawText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    onChangeSkills({
      ...skills,
      [key]: parsed,
    });
  };

  const handleAddCustomSection = () => {
    if (!newCategoryTitle.trim()) return;
    const next: SkillSection = {
      title: newCategoryTitle.trim(),
      skills: [],
    };
    onChangeSkillSections([...skillSections, next]);
    setNewCategoryTitle("");
  };

  const handleUpdateCustomSection = (index: number, text: string) => {
    const parsed = text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    onChangeSkillSections(
      skillSections.map((sec, i) => (i === index ? { ...sec, skills: parsed } : sec))
    );
  };

  const handleRemoveCustomSection = (index: number) => {
    onChangeSkillSections(skillSections.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Cpu className="h-4 w-4 text-primary" /> Technical Skills Matrix
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Categorized technical competencies, programming languages, and frameworks.
          </p>
        </div>
      </div>

      {/* 4 Standard Categories */}
      <div className="space-y-3">
        <div className="p-3.5 rounded-xl border border-border/60 bg-background/80 space-y-1.5">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-primary" /> Programming Languages
          </label>
          <Input
            value={(skills.languages || []).join(", ")}
            onChange={(e) => updateBucket("languages", e.target.value)}
            placeholder="e.g. TypeScript, JavaScript, Python, Go, C++, SQL"
            className="text-xs h-8 bg-card"
          />
        </div>

        <div className="p-3.5 rounded-xl border border-border/60 bg-background/80 space-y-1.5">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-primary" /> Frameworks & Libraries
          </label>
          <Input
            value={(skills.frameworks || []).join(", ")}
            onChange={(e) => updateBucket("frameworks", e.target.value)}
            placeholder="e.g. React, Next.js, Node.js, Express, TailwindCSS, GraphQL"
            className="text-xs h-8 bg-card"
          />
        </div>

        <div className="p-3.5 rounded-xl border border-border/60 bg-background/80 space-y-1.5">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-primary" /> Developer Tools & DevOps
          </label>
          <Input
            value={(skills.tools || []).join(", ")}
            onChange={(e) => updateBucket("tools", e.target.value)}
            placeholder="e.g. Git, Docker, Kubernetes, AWS, Firebase, Postman, Linux"
            className="text-xs h-8 bg-card"
          />
        </div>

        <div className="p-3.5 rounded-xl border border-border/60 bg-background/80 space-y-1.5">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-primary" /> Databases & Architecture
          </label>
          <Input
            value={(skills.libraries || []).join(", ")}
            onChange={(e) => updateBucket("libraries", e.target.value)}
            placeholder="e.g. MongoDB, PostgreSQL, Redis, REST APIs, Microservices"
            className="text-xs h-8 bg-card"
          />
        </div>
      </div>

      {/* Additional Custom Skill Categories */}
      {skillSections.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-border/40">
          <span className="text-xs font-bold text-muted-foreground uppercase">
            Custom Skill Categories
          </span>
          {skillSections.map((sec, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl border border-border/60 bg-background/80 space-y-1.5 relative group"
            >
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-foreground">{sec.title}</label>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleRemoveCustomSection(idx)}
                  className="h-6 w-6 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <Input
                value={(sec.skills || []).join(", ")}
                onChange={(e) => handleUpdateCustomSection(idx, e.target.value)}
                placeholder="Comma separated skills..."
                className="text-xs h-8 bg-card"
              />
            </div>
          ))}
        </div>
      )}

      {/* Add Custom Skill Category Form */}
      <div className="flex gap-2 pt-1">
        <Input
          placeholder="New Category Title (e.g. Cloud & Big Data)"
          value={newCategoryTitle}
          onChange={(e) => setNewCategoryTitle(e.target.value)}
          className="text-xs h-8 bg-card"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleAddCustomSection}
          className="h-8 text-xs font-semibold shrink-0"
        >
          <Plus className="h-3 w-3 mr-1" /> Add Category
        </Button>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { Plus, Trash2, PlusCircle, Bookmark, Calendar, Link as LinkIcon, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CustomSection, CustomSectionEntry } from "../templates/types";

export interface CustomSectionEditorProps {
  customSections: CustomSection[];
  onChange: (updated: CustomSection[]) => void;
}

const SECTION_PRESETS = [
  "Certifications",
  "Publications",
  "Volunteer Experience",
  "Relevant Coursework",
  "Awards & Honors",
  "Languages",
  "Leadership & Activities",
  "Custom"
];

export const CustomSectionEditor: React.FC<CustomSectionEditorProps> = ({
  customSections = [],
  onChange,
}) => {
  const [selectedPreset, setSelectedPreset] = useState("Certifications");
  const [customTitleInput, setCustomTitleInput] = useState("");

  const handleAddSection = (title: string) => {
    const finalTitle = title.trim() || "Custom Section";
    const newSection: CustomSection = {
      id: `sec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      title: finalTitle,
      entries: [
        {
          id: `ent-${Date.now().toString(36)}`,
          title: "",
          subtitle: "",
          date: "",
          bullets: [""]
        }
      ]
    };
    onChange([...customSections, newSection]);
    setCustomTitleInput("");
  };

  const handleRemoveSection = (sectionId: string) => {
    onChange(customSections.filter((s) => s.id !== sectionId));
  };

  const handleUpdateSectionTitle = (sectionId: string, newTitle: string) => {
    onChange(
      customSections.map((s) => (s.id === sectionId ? { ...s, title: newTitle } : s))
    );
  };

  const handleAddEntry = (sectionId: string) => {
    onChange(
      customSections.map((s) => {
        if (s.id !== sectionId) return s;
        const newEntry: CustomSectionEntry = {
          id: `ent-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
          title: "",
          subtitle: "",
          date: "",
          bullets: [""]
        };
        return { ...s, entries: [...s.entries, newEntry] };
      })
    );
  };

  const handleRemoveEntry = (sectionId: string, entryId: string) => {
    onChange(
      customSections.map((s) => {
        if (s.id !== sectionId) return s;
        return { ...s, entries: s.entries.filter((e) => e.id !== entryId) };
      })
    );
  };

  const handleUpdateEntry = (
    sectionId: string,
    entryId: string,
    patch: Partial<CustomSectionEntry>
  ) => {
    onChange(
      customSections.map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          entries: s.entries.map((e) => (e.id === entryId ? { ...e, ...patch } : e))
        };
      })
    );
  };

  return (
    <div className="space-y-4">
      {/* Preset Quick-Add Toolbar */}
      <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-primary" />
            <span>Add Additional Resume Section</span>
          </h3>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {SECTION_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleAddSection(preset === "Custom" ? "Additional Information" : preset)}
              className="text-xs px-2.5 py-1 rounded-lg border border-border/60 bg-background hover:border-primary/50 hover:text-primary transition-all font-medium flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Rendered Custom Sections */}
      {customSections.map((section, sIdx) => (
        <div
          key={section.id}
          className="bg-card p-4 rounded-xl border border-border/50 shadow-sm space-y-3 relative group"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
            <Input
              value={section.title}
              onChange={(e) => handleUpdateSectionTitle(section.id, e.target.value)}
              className="h-8 font-bold text-sm bg-transparent border-transparent hover:border-border focus:border-primary px-2"
              placeholder="Section Title (e.g. Certifications)"
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveSection(section.id)}
              className="h-7 w-7 text-destructive hover:bg-destructive/10"
              title="Delete Section"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Entries */}
          <div className="space-y-3">
            {section.entries.map((entry, eIdx) => (
              <div
                key={entry.id}
                className="p-3 bg-background/60 rounded-lg border border-border/40 space-y-2 relative"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                    <Input
                      value={entry.title}
                      onChange={(e) =>
                        handleUpdateEntry(section.id, entry.id, { title: e.target.value })
                      }
                      placeholder="Title / Certificate / Award name"
                      className="text-xs h-7"
                    />
                    <Input
                      value={entry.date || ""}
                      onChange={(e) =>
                        handleUpdateEntry(section.id, entry.id, { date: e.target.value })
                      }
                      placeholder="Date / Year (e.g. 2024)"
                      className="text-xs h-7"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveEntry(section.id, entry.id)}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <Input
                  value={entry.subtitle || ""}
                  onChange={(e) =>
                    handleUpdateEntry(section.id, entry.id, { subtitle: e.target.value })
                  }
                  placeholder="Subtitle / Issuer / Organization (optional)"
                  className="text-xs h-7"
                />

                <Textarea
                  value={entry.bullets?.join("\n") || ""}
                  onChange={(e) =>
                    handleUpdateEntry(section.id, entry.id, {
                      bullets: e.target.value.split(/\r?\n/)
                    })
                  }
                  placeholder="Key details or bullet points (one per line)..."
                  rows={2}
                  className="text-xs resize-y"
                />
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleAddEntry(section.id)}
            className="w-full text-xs h-7 border-dashed"
          >
            <Plus className="h-3 w-3 mr-1" /> Add Entry to {section.title}
          </Button>
        </div>
      ))}
    </div>
  );
};

export default CustomSectionEditor;

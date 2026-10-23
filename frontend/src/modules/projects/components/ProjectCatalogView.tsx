import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Layers,
  Clock,
  CheckCircle2,
  FileText,
  Award,
  ArrowRight,
  BookOpen,
  Sparkles,
  ChevronRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ProjectTemplate } from "../types/projectStudio.types";

interface ProjectCatalogViewProps {
  templates: ProjectTemplate[];
  loading: boolean;
  onStartProject: (templateId: string) => Promise<void>;
  startingTemplateId: string | null;
}

const DISCIPLINE_FILTERS = [
  { label: "All Disciplines", value: "all" },
  { label: "Mechanical Engineering", value: "mech" },
  { label: "ECE / Electronics", value: "ece" },
  { label: "EEE / Electrical", value: "eee" },
  { label: "Civil Engineering", value: "civil" },
  { label: "Chemical Engineering", value: "chem" },
  { label: "Biotechnology", value: "biotech" },
  { label: "Business / MBA", value: "bba" },
  { label: "Finance & Accounting", value: "bcom" },
  { label: "Arts & Humanities", value: "arts" },
  { label: "Nursing & Health", value: "nursing" },
  { label: "CSE & IT", value: "cse" },
];

export const ProjectCatalogView: React.FC<ProjectCatalogViewProps> = ({
  templates,
  loading,
  onStartProject,
  startingTemplateId,
}) => {
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [inspectingTemplate, setInspectingTemplate] = useState<ProjectTemplate | null>(null);

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      // Discipline filter
      if (selectedDiscipline !== "all") {
        const matchesSlug = tpl.branchSlugs.some((b) =>
          b.toLowerCase().includes(selectedDiscipline.toLowerCase())
        );
        const matchesCat = tpl.disciplineCategory
          .toLowerCase()
          .includes(selectedDiscipline.toLowerCase());
        if (!matchesSlug && !matchesCat) return false;
      }

      // Difficulty filter
      if (
        selectedDifficulty !== "all" &&
        tpl.difficulty.toLowerCase() !== selectedDifficulty.toLowerCase()
      ) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = tpl.title.toLowerCase().includes(q);
        const matchDesc = tpl.description.toLowerCase().includes(q);
        const matchSkills = (tpl.relevantSkills || []).some((s) => s.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchSkills) return false;
      }

      return true;
    });
  }, [templates, selectedDiscipline, selectedDifficulty, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl glass border border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search guided project blueprints, skills, or disciplines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background/50 border-border/40"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground ml-1 hidden sm:block" />
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="h-10 rounded-md border border-border/50 bg-background/60 px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          >
            <option value="all">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Discipline Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {DISCIPLINE_FILTERS.map((item) => (
          <button
            key={item.value}
            onClick={() => setSelectedDiscipline(item.value)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              selectedDiscipline === item.value
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                : "bg-card/40 hover:bg-card/80 text-muted-foreground border border-border/40"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass h-72 rounded-2xl animate-pulse bg-card/20" />
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border-dashed border-2 border-border/50">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-60" />
          <h3 className="text-lg font-bold text-foreground">No Project Templates Found</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1 mb-4">
            Try adjusting your search criteria or discipline filter to discover cross-disciplinary blueprints.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedDiscipline("all");
              setSelectedDifficulty("all");
              setSearchQuery("");
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const isStarting = startingTemplateId === template.templateId;
            return (
              <motion.div
                key={template.templateId}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-6 border border-border/50 flex flex-col justify-between hover:border-primary/40 transition-all group hover:shadow-lg hover:shadow-primary/5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge variant="outline" className="text-[11px] font-medium bg-primary/5 text-primary border-primary/20">
                      {template.disciplineCategory}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={`text-[11px] capitalize ${
                        template.difficulty === "Advanced"
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          : template.difficulty === "Intermediate"
                          ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      }`}
                    >
                      {template.difficulty}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {template.title}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
                    {template.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary/70" />
                      {template.estimatedEffort}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-primary/70" />
                      {template.milestones?.length || 4} Milestones
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-primary/70" />
                      {template.deliverables?.length || 3} Deliverables
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {(template.relevantSkills || []).slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-card/60 border border-border/40 text-muted-foreground font-mono"
                      >
                        {skill}
                      </span>
                    ))}
                    {(template.relevantSkills || []).length > 3 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-card/40 text-muted-foreground">
                        +{template.relevantSkills.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setInspectingTemplate(template)}
                  >
                    <Info className="h-3.5 w-3.5 mr-1" />
                    Inspect Details
                  </Button>
                  <Button
                    variant="hero"
                    size="sm"
                    disabled={isStarting}
                    className="flex-1 text-xs glow-primary"
                    onClick={() => onStartProject(template.templateId)}
                  >
                    {isStarting ? (
                      "Initializing..."
                    ) : (
                      <>
                        Start Project
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Blueprint Inspect Modal */}
      <Dialog
        open={Boolean(inspectingTemplate)}
        onOpenChange={(open) => !open && setInspectingTemplate(null)}
      >
        {inspectingTemplate && (
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto glass border-border/50">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                  {inspectingTemplate.disciplineCategory}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {inspectingTemplate.difficulty}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {inspectingTemplate.estimatedEffort}
                </Badge>
              </div>
              <DialogTitle className="text-xl font-bold text-foreground">
                {inspectingTemplate.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                {inspectingTemplate.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 my-4 text-xs">
              {/* Learning Objectives */}
              <div>
                <h4 className="font-semibold text-foreground text-sm flex items-center gap-1.5 mb-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Learning Objectives
                </h4>
                <ul className="space-y-1.5 pl-2">
                  {inspectingTemplate.learningObjectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-primary font-bold">•</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Milestones Progression */}
              <div>
                <h4 className="font-semibold text-foreground text-sm flex items-center gap-1.5 mb-2.5">
                  <Layers className="h-4 w-4 text-primary" />
                  Structured Milestones
                </h4>
                <div className="space-y-2">
                  {inspectingTemplate.milestones.map((m, idx) => (
                    <div
                      key={m.milestoneId}
                      className="p-3 rounded-xl bg-card/40 border border-border/30 flex items-start gap-3"
                    >
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-semibold text-foreground">{m.title}</div>
                        <div className="text-muted-foreground text-[11px] mt-0.5">{m.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Required Deliverables */}
              <div>
                <h4 className="font-semibold text-foreground text-sm flex items-center gap-1.5 mb-2.5">
                  <FileText className="h-4 w-4 text-primary" />
                  Evidence Deliverables
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {inspectingTemplate.deliverables.map((d) => (
                    <div
                      key={d.key}
                      className="p-2.5 rounded-xl bg-card/30 border border-border/30"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-foreground">{d.label}</span>
                        {d.required && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-destructive/10 text-destructive font-mono">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{d.description || d.type}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evaluation Rubric */}
              <div>
                <h4 className="font-semibold text-foreground text-sm flex items-center gap-1.5 mb-2.5">
                  <Award className="h-4 w-4 text-primary" />
                  Evaluation Rubric (Passing: 70%)
                </h4>
                <div className="space-y-2">
                  {inspectingTemplate.rubric.map((r) => (
                    <div
                      key={r.dimensionKey}
                      className="p-2.5 rounded-xl bg-card/30 border border-border/30 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-medium text-foreground">{r.dimensionName}</span>
                        <div className="text-[10px] text-muted-foreground">{r.description}</div>
                      </div>
                      <span className="text-xs font-bold text-primary shrink-0 ml-3">
                        {r.weight || r.maxScore} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setInspectingTemplate(null)}>
                Close
              </Button>
              <Button
                variant="hero"
                size="sm"
                className="glow-primary"
                disabled={startingTemplateId === inspectingTemplate.templateId}
                onClick={async () => {
                  const id = inspectingTemplate.templateId;
                  setInspectingTemplate(null);
                  await onStartProject(id);
                }}
              >
                Start This Project
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

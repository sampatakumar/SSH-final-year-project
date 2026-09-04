import React, { useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, Sparkles, FolderGit2, Github, ExternalLink, Wand2, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import type { Project } from "../templates/types";
import type { UserProjectItem } from "../services/resume-profile-adapter";
import { normalizeProjectKey } from "../services/resume-profile-adapter";

export interface ProjectsSectionEditorProps {
  projects: Project[];
  onChange: (updated: Project[]) => void;
  availableGitHubProjects?: UserProjectItem[];
  idToken: string | null;
}

export const ProjectsSectionEditor: React.FC<ProjectsSectionEditorProps> = ({
  projects = [],
  onChange,
  availableGitHubProjects = [],
  idToken,
}) => {
  const [expandingKey, setExpandingKey] = useState<string | null>(null);

  const handleAddProject = () => {
    const newProj: Project = {
      name: "",
      technologies: "",
      demoUrl: "",
      githubUrl: "",
      bullets: [""],
    };
    onChange([...projects, newProj]);
  };

  const handleUpdateProject = (index: number, patch: Partial<Project>) => {
    onChange(projects.map((proj, i) => (i === index ? { ...proj, ...patch } : proj)));
  };

  const handleRemoveProject = (index: number) => {
    onChange(projects.filter((_, i) => i !== index));
  };

  const handleMoveProject = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= projects.length) return;
    const next = [...projects];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    onChange(next);
  };

  // Add from GitHub Suggestion
  const handleAddFromGitHub = (ghProj: UserProjectItem) => {
    // Check if already in projects using normalized project key
    const ghKey = normalizeProjectKey(ghProj.title);
    const alreadyExists = projects.some(
      (p) => normalizeProjectKey(p.name) === ghKey
    );
    if (alreadyExists) {
      toast.info(`"${ghProj.title}" is already in your projects list.`);
      return;
    }

    const newProj: Project = {
      name: ghProj.title,
      technologies: Array.isArray(ghProj.stack) ? ghProj.stack.join(", ") : "",
      githubUrl: ghProj.githubUrl || "",
      demoUrl: ghProj.demoUrl || "",
      bullets: ghProj.description
        ? [ghProj.description.trim()]
        : ["Architected full-stack features with scalable modular components."],
    };

    onChange([...projects, newProj]);
    toast.success(`Added "${ghProj.title}" from GitHub Intelligence!`);
  };

  // Bullets
  const handleUpdateBullet = (pIdx: number, bIdx: number, text: string) => {
    const proj = projects[pIdx];
    if (!proj) return;
    const nextBullets = [...proj.bullets];
    nextBullets[bIdx] = text;
    handleUpdateProject(pIdx, { bullets: nextBullets });
  };

  const handleAddBullet = (pIdx: number) => {
    const proj = projects[pIdx];
    if (!proj) return;
    handleUpdateProject(pIdx, { bullets: [...proj.bullets, ""] });
  };

  const handleRemoveBullet = (pIdx: number, bIdx: number) => {
    const proj = projects[pIdx];
    if (!proj) return;
    handleUpdateProject(pIdx, {
      bullets: proj.bullets.filter((_, i) => i !== bIdx),
    });
  };

  // AI Bullet Enhancement
  const handleEnhanceBullet = async (pIdx: number, bIdx: number) => {
    const proj = projects[pIdx];
    if (!proj) return;
    const currentBullet = proj.bullets[bIdx]?.trim();
    if (!currentBullet) {
      toast.error("Please enter a bullet point first");
      return;
    }

    const key = `${pIdx}-${bIdx}`;
    setExpandingKey(key);

    try {
      if (idToken) {
        try {
          const res = await apiRequest<{ improvedBullet?: string; bullet?: string }>(
            "/ai/project-bullet/extend",
            {
              method: "POST",
              token: idToken,
              body: {
                bullet: currentBullet,
                projectName: proj.name,
                technologies: proj.technologies,
                atsOptimized: true,
              },
            }
          );
          const improved = res.data?.improvedBullet || res.data?.bullet;
          if (improved?.trim()) {
            handleUpdateBullet(pIdx, bIdx, improved.trim());
            toast.success("Project bullet enhanced!");
            return;
          }
        } catch {
          // Fallback to grounded local improvement
        }
      }

      // Grounded deterministic improvement
      const enhanced = currentBullet.replace(
        /^(worked on|helped with|did|created)\s+/i,
        "Engineered and deployed "
      );
      handleUpdateBullet(pIdx, bIdx, enhanced);
      toast.success("Project bullet polished!");
    } finally {
      setExpandingKey(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <FolderGit2 className="h-4 w-4 text-primary" /> Projects & Architecture
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Showcase technical depth, system architecture, and repository evidence.
          </p>
        </div>
        <Button size="sm" onClick={handleAddProject} className="h-7 text-xs gap-1">
          <Plus className="h-3 w-3" /> Add Project
        </Button>
      </div>

      {/* Suggested from GitHub Intelligence Banner */}
      {(() => {
        const unadded = availableGitHubProjects.filter(
          (gh) => !projects.some((p) => p.name.trim().toLowerCase() === String(gh.title || "").trim().toLowerCase())
        );
        if (unadded.length === 0) return null;

        return (
          <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Github className="h-3.5 w-3.5 text-primary" /> Suggested from GitHub Intelligence
              </span>
              <span className="text-[10px] text-muted-foreground">{unadded.length} available</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {unadded.map((gh) => (
                <button
                  key={gh._id || gh.title}
                  type="button"
                  onClick={() => handleAddFromGitHub(gh)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-primary/30 bg-background/80 hover:bg-primary/10 hover:border-primary text-foreground transition-all"
                >
                  <Plus className="h-3 w-3 text-primary" />
                  <span className="font-semibold">{gh.title}</span>
                  {gh.stack?.length ? (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ({gh.stack.slice(0, 2).join(", ")})
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="p-6 text-center rounded-xl border border-dashed border-border/70 text-muted-foreground space-y-2">
          <FolderGit2 className="h-8 w-8 mx-auto text-muted-foreground/50" />
          <p className="text-xs">No projects added yet.</p>
          <Button size="sm" variant="outline" onClick={handleAddProject} className="h-7 text-xs">
            Add Your First Project
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((proj, pIdx) => (
            <div
              key={pIdx}
              className="p-4 rounded-xl border border-border/60 bg-background/80 space-y-3 relative group"
            >
              {/* Card Title & Reordering */}
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                    #{pIdx + 1}
                  </span>
                  <span className="text-xs font-bold text-foreground truncate max-w-[200px]">
                    {proj.name || "Project Name"}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={pIdx === 0}
                    onClick={() => handleMoveProject(pIdx, "up")}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Move up"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={pIdx === projects.length - 1}
                    onClick={() => handleMoveProject(pIdx, "down")}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Move down"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemoveProject(pIdx)}
                    className="h-6 w-6 text-destructive hover:bg-destructive/10"
                    title="Delete project"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Project Name
                  </label>
                  <Input
                    placeholder="e.g. Smart Skill Hub"
                    value={proj.name}
                    onChange={(e) => handleUpdateProject(pIdx, { name: e.target.value })}
                    className="text-xs h-8 bg-card"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Technologies Used
                  </label>
                  <Input
                    placeholder="e.g. React, Node.js, MongoDB, Docker"
                    value={proj.technologies || ""}
                    onChange={(e) => handleUpdateProject(pIdx, { technologies: e.target.value })}
                    className="text-xs h-8 bg-card"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    GitHub URL (Optional)
                  </label>
                  <Input
                    placeholder="https://github.com/user/project"
                    value={proj.githubUrl || ""}
                    onChange={(e) => handleUpdateProject(pIdx, { githubUrl: e.target.value })}
                    className="text-xs h-8 bg-card"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                    Live Demo URL (Optional)
                  </label>
                  <Input
                    placeholder="https://project-demo.app"
                    value={proj.demoUrl || ""}
                    onChange={(e) => handleUpdateProject(pIdx, { demoUrl: e.target.value })}
                    className="text-xs h-8 bg-card"
                  />
                </div>
              </div>

              {/* Project Quality Advice Note */}
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 text-[11px] text-muted-foreground space-y-1">
                <div className="font-semibold text-foreground flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> AI Project Coach Structure
                </div>
                <p>
                  Structure bullets: <strong>1. Problem solved</strong> $\to$ <strong>2. Architecture & Tech</strong> $\to$ <strong>3. Your specific technical implementation</strong>.
                </p>
              </div>

              {/* Bullets Section */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-muted-foreground block">
                    Key Project Highlights ({proj.bullets.length})
                  </label>
                </div>

                <div className="space-y-2">
                  {proj.bullets.map((b, bIdx) => (
                    <div key={bIdx} className="space-y-1 bg-card p-2 rounded-lg border border-border/40">
                      <div className="flex gap-1.5 items-start">
                        <Textarea
                          rows={2}
                          value={b}
                          onChange={(e) => handleUpdateBullet(pIdx, bIdx, e.target.value)}
                          placeholder="Implemented architecture, designed database models, integrated external APIs..."
                          className="text-xs min-h-[42px] py-1.5 bg-background custom-scrollbar"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveBullet(pIdx, bIdx)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                          title="Remove bullet"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* AI Quick Polish */}
                      <div className="flex items-center gap-1 pt-0.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={expandingKey === `${pIdx}-${bIdx}`}
                          onClick={() => handleEnhanceBullet(pIdx, bIdx)}
                          className="h-6 text-[10px] px-2 text-primary hover:bg-primary/10 gap-1"
                        >
                          <Sparkles className="h-2.5 w-2.5" /> Improve with AI
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleAddBullet(pIdx)}
                  className="h-6 text-[11px] text-primary hover:bg-primary/10 font-semibold"
                >
                  + Add Project Bullet
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

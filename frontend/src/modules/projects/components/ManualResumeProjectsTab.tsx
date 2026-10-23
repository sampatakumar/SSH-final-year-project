import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ExternalLink, Github, Trash2, Upload, Pencil, FolderGit2, Code2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AIDescriptionGeneratorDialog from "@/components/AIDescriptionGeneratorDialog";
import { AI_PROMPT_PRESETS } from "@/config/aiPromptPresets";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/core/auth";

export interface ProjectItem {
  _id: string;
  title: string;
  description: string;
  stack: string[];
  date?: string;
  githubUrl?: string;
  demoUrl?: string;
  source: "manual" | "readme";
  updatedAt: string;
}

const initialForm = {
  title: "",
  description: "",
  stack: "",
  date: "",
  githubUrl: "",
  demoUrl: "",
};

interface ManualResumeProjectsTabProps {
  projects: ProjectItem[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  setProjects: React.Dispatch<React.SetStateAction<ProjectItem[]>>;
}

export const ManualResumeProjectsTab: React.FC<ManualResumeProjectsTabProps> = ({
  projects,
  loading,
  onRefresh,
  setProjects,
}) => {
  const { idToken } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [readmeUploading, setReadmeUploading] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDescriptionGenerator, setShowDescriptionGenerator] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);

  const openCreateDialog = () => {
    setEditingProjectId(null);
    setForm(initialForm);
    setShowAddDialog(true);
  };

  const openEditDialog = (project: ProjectItem) => {
    setEditingProjectId(project._id);
    setForm({
      title: project.title,
      description: project.description,
      stack: project.stack.join(", "),
      date: project.date ?? "",
      githubUrl: project.githubUrl ?? "",
      demoUrl: project.demoUrl ?? "",
    });
    setShowAddDialog(true);
  };

  const handleCreateOrUpdateProject = async () => {
    if (!idToken) return;
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    try {
      setSubmitting(true);
      const endpoint = editingProjectId ? `/projects/${editingProjectId}` : "/projects";
      const method = editingProjectId ? "PATCH" : "POST";

      const response = await apiRequest<{ project: ProjectItem }>(endpoint, {
        method,
        token: idToken,
        body: {
          title: form.title,
          description: form.description,
          stack: form.stack,
          date: form.date,
          githubUrl: form.githubUrl,
          demoUrl: form.demoUrl,
        },
      });

      if (editingProjectId) {
        setProjects((current) =>
          current.map((item) => (item._id === response.data.project._id ? response.data.project : item))
        );
      } else {
        setProjects((current) => [response.data.project, ...current]);
      }

      setForm(initialForm);
      setEditingProjectId(null);
      setShowAddDialog(false);
      toast.success(editingProjectId ? "Project updated successfully" : "Project created successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save project");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReadmeUpload = async (file: File | null) => {
    if (!idToken || !file) return;
    try {
      setReadmeUploading(true);
      const formData = new FormData();
      formData.append("readmeFile", file);
      const response = await apiRequest<{ project: ProjectItem }>("/projects/from-readme", {
        method: "POST",
        token: idToken,
        body: formData,
      });
      setProjects((current) => [response.data.project, ...current]);
      toast.success("Project imported from README");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to import README");
    } finally {
      setReadmeUploading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!idToken) return;
    try {
      await apiRequest<{ projectId: string }>(`/projects/${projectId}`, {
        method: "DELETE",
        token: idToken,
      });
      setProjects((current) => current.filter((project) => project._id !== projectId));
      toast.success("Project deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete project");
    }
  };

  const handleDeleteAllProjects = async () => {
    if (!idToken || !projects.length || deletingAll) return;

    const confirmed = window.confirm("Delete all projects? This action cannot be undone.");
    if (!confirmed) return;

    try {
      setDeletingAll(true);
      const results = await Promise.allSettled(
        projects.map((project) =>
          apiRequest<{ projectId: string }>(`/projects/${project._id}`, { method: "DELETE", token: idToken })
        )
      );

      const successCount = results.filter((item) => item.status === "fulfilled").length;
      if (successCount > 0) {
        setProjects([]);
      }
      toast.success(`Deleted all projects`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete all projects");
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 glass p-4 rounded-2xl border border-border/50">
        <div>
          <h3 className="font-bold text-foreground text-base">Resume Showcase Projects</h3>
          <p className="text-xs text-muted-foreground">Manage personal repositories and manual project bullets for your resume.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={readmeUploading}
            onClick={() => document.getElementById("manual-readme-upload")?.click()}
            className="text-xs"
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" /> {readmeUploading ? "Analyzing..." : "Import README"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteAllProjects}
            disabled={deletingAll || !projects.length}
            className="text-xs hover:bg-destructive/10 hover:text-destructive border-destructive/30"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete All
          </Button>
          <Button variant="hero" size="sm" onClick={openCreateDialog} className="text-xs glow-primary">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Project
          </Button>
          <input
            id="manual-readme-upload"
            type="file"
            accept=".md,.markdown,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              void handleReadmeUpload(file);
              e.currentTarget.value = "";
            }}
          />
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="glass h-64 rounded-2xl animate-pulse bg-card/20" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center border-dashed border-2 border-border/50">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderGit2 className="h-8 w-8 text-primary opacity-80" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">No Resume Projects Added</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-6">
            Add manual project entries or sync completed blueprints from the Project Studio tab.
          </p>
          <Button variant="hero" size="sm" onClick={openCreateDialog} className="glow-primary text-xs">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Create Project Entry
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <motion.div
              key={project._id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-2xl p-6 border border-border/50 flex flex-col justify-between hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge variant="outline" className="text-[10px] uppercase font-mono">
                    {project.source === "readme" ? "README Import" : "Manual Entry"}
                  </Badge>
                  {project.date && <span className="text-[11px] text-muted-foreground">{project.date}</span>}
                </div>

                <h4 className="text-base font-bold text-foreground mb-2 line-clamp-1">{project.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-3 mb-4 leading-relaxed">{project.description}</p>

                <div className="flex flex-wrap gap-1 mb-6">
                  {project.stack.map((tech) => (
                    <span key={tech} className="text-[10px] px-2 py-0.5 rounded-md bg-card/60 border border-border/40 text-muted-foreground font-mono">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/30">
                <div className="flex items-center gap-2">
                  {project.githubUrl && (
                    <a href={project.githubUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                      <Github className="h-4 w-4" />
                    </a>
                  )}
                  {project.demoUrl && (
                    <a href={project.demoUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(project)} className="h-7 px-2 text-xs">
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteProject(project._id)} className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit Project Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-xl glass border-border/50">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{editingProjectId ? "Edit Project" : "Add Project"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 my-2 text-xs">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Project Title *</label>
              <Input
                placeholder="e.g. Distributed Task Scheduler"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="bg-background/50 border-border/40"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-foreground">Description *</label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDescriptionGenerator(true)}
                  className="h-6 text-[10px] text-primary hover:bg-primary/10"
                >
                  <Sparkles className="h-3 w-3 mr-1" /> Generate with AI
                </Button>
              </div>
              <Textarea
                rows={4}
                placeholder="Describe objectives, technologies applied, and concrete results..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-background/50 border-border/40 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Tech Stack (comma-separated)</label>
                <Input
                  placeholder="React, TypeScript, Node.js"
                  value={form.stack}
                  onChange={(e) => setForm({ ...form, stack: e.target.value })}
                  className="bg-background/50 border-border/40"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Timeline / Date</label>
                <Input
                  placeholder="Jan 2024 - Present"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="bg-background/50 border-border/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">GitHub Repository URL</label>
                <Input
                  placeholder="https://github.com/..."
                  value={form.githubUrl}
                  onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                  className="bg-background/50 border-border/40"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Live Demo / Viewer URL</label>
                <Input
                  placeholder="https://..."
                  value={form.demoUrl}
                  onChange={(e) => setForm({ ...form, demoUrl: e.target.value })}
                  className="bg-background/50 border-border/40"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button variant="hero" size="sm" onClick={handleCreateOrUpdateProject} disabled={submitting} className="glow-primary">
              {submitting ? "Saving..." : editingProjectId ? "Update Project" : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generator Dialog */}
      <AIDescriptionGeneratorDialog
        open={showDescriptionGenerator}
        onOpenChange={setShowDescriptionGenerator}
        title={`Generate Description for ${form.title || "Project"}`}
        context={`Project Title: ${form.title}\nTech Stack: ${form.stack}`}
        promptPreset={AI_PROMPT_PRESETS.PROJECT_DESCRIPTION}
        onApply={(generated) => setForm({ ...form, description: generated })}
      />
    </div>
  );
};

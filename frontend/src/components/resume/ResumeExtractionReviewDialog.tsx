import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  User,
  GraduationCap,
  Briefcase,
  Code2,
  FolderGit2,
  Trophy,
  Globe,
  Sparkles,
  ArrowRight,
  RefreshCw,
  X,
  Edit3,
  Check,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ResumeApi, type ResumeUploadExtractionResponse, type ExtractedProfileData } from "@/modules/resume/services/resume.api";

interface ResumeExtractionReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extractionData: ResumeUploadExtractionResponse | null;
  currentUserProfile?: any;
  onApplied?: (updatedUser: any) => void;
  onUploadDifferent?: () => void;
}

export const ResumeExtractionReviewDialog: React.FC<ResumeExtractionReviewDialogProps> = ({
  open,
  onOpenChange,
  extractionData,
  currentUserProfile = {},
  onApplied,
  onUploadDifferent,
}) => {
  if (!extractionData) return null;

  const [activeTab, setActiveTab] = useState<"personal" | "education" | "skills" | "experience" | "projects" | "achievements">("personal");
  const [formData, setFormData] = useState<ExtractedProfileData>(() => extractionData.extractedProfile);
  const [applying, setApplying] = useState(false);

  // Field Conflicts detection
  const conflicts = useMemo(() => {
    const list: Array<{ field: string; label: string; current: string; extracted: string; path: string }> = [];
    if (currentUserProfile.displayName && formData.profile?.displayName && currentUserProfile.displayName !== formData.profile.displayName) {
      list.push({ field: "displayName", label: "Full Name", current: currentUserProfile.displayName, extracted: formData.profile.displayName, path: "profile.displayName" });
    }
    if (currentUserProfile.phone && formData.profile?.phone && currentUserProfile.phone !== formData.profile.phone) {
      list.push({ field: "phone", label: "Phone Number", current: currentUserProfile.phone, extracted: formData.profile.phone, path: "profile.phone" });
    }
    if (currentUserProfile.headline && formData.profile?.headline && currentUserProfile.headline !== formData.profile.headline) {
      list.push({ field: "headline", label: "Headline / Target Role", current: currentUserProfile.headline, extracted: formData.profile.headline, path: "profile.headline" });
    }
    if (currentUserProfile.linkedInUrl && formData.preferences?.linkedInUrl && currentUserProfile.linkedInUrl !== formData.preferences.linkedInUrl) {
      list.push({ field: "linkedInUrl", label: "LinkedIn URL", current: currentUserProfile.linkedInUrl, extracted: formData.preferences.linkedInUrl, path: "preferences.linkedInUrl" });
    }
    if (currentUserProfile.githubUrl && formData.preferences?.githubUrl && currentUserProfile.githubUrl !== formData.preferences.githubUrl) {
      list.push({ field: "githubUrl", label: "GitHub URL", current: currentUserProfile.githubUrl, extracted: formData.preferences.githubUrl, path: "preferences.githubUrl" });
    }
    return list;
  }, [currentUserProfile, formData]);

  const resolveConflict = (field: string, choice: "current" | "extracted", value: string) => {
    if (choice === "current") {
      if (field === "displayName") setFormData(prev => ({ ...prev, profile: { ...prev.profile, displayName: currentUserProfile.displayName } }));
      if (field === "phone") setFormData(prev => ({ ...prev, profile: { ...prev.profile, phone: currentUserProfile.phone } }));
      if (field === "headline") setFormData(prev => ({ ...prev, profile: { ...prev.profile, headline: currentUserProfile.headline } }));
      if (field === "linkedInUrl") setFormData(prev => ({ ...prev, preferences: { ...prev.preferences, linkedInUrl: currentUserProfile.linkedInUrl } }));
      if (field === "githubUrl") setFormData(prev => ({ ...prev, preferences: { ...prev.preferences, githubUrl: currentUserProfile.githubUrl } }));
    } else {
      if (field === "displayName") setFormData(prev => ({ ...prev, profile: { ...prev.profile, displayName: value } }));
      if (field === "phone") setFormData(prev => ({ ...prev, profile: { ...prev.profile, phone: value } }));
      if (field === "headline") setFormData(prev => ({ ...prev, profile: { ...prev.profile, headline: value } }));
      if (field === "linkedInUrl") setFormData(prev => ({ ...prev, preferences: { ...prev.preferences, linkedInUrl: value } }));
      if (field === "githubUrl") setFormData(prev => ({ ...prev, preferences: { ...prev.preferences, githubUrl: value } }));
    }
    toast.success(`Updated ${field} preference`);
  };

  const handleApply = async () => {
    try {
      setApplying(true);
      const res = await ResumeApi.applyToProfile(formData);
      toast.success("Profile updated successfully from your resume!");
      onApplied?.(res.user);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to apply extracted details to profile");
    } finally {
      setApplying(false);
    }
  };

  const getConfidenceBadge = (confidence?: "HIGH" | "MEDIUM" | "LOW") => {
    if (confidence === "HIGH") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
          <CheckCircle2 className="w-3 h-3 mr-1" /> High Confidence
        </span>
      );
    }
    if (confidence === "MEDIUM") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/60 text-amber-400 border border-amber-800/60">
          Medium Confidence
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
        Review Suggested
      </span>
    );
  };

  const navItems = [
    { id: "personal", label: "Personal & Contact", icon: User, count: formData.profile?.displayName ? 1 : 0 },
    { id: "education", label: "Education", icon: GraduationCap, count: formData.educationEntries?.length || 0 },
    { id: "skills", label: "Skills", icon: Code2, count: (formData.skillSections || []).reduce((acc, s) => acc + (s.skills?.length || 0), 0) },
    { id: "experience", label: "Experience", icon: Briefcase, count: formData.experience?.length || 0 },
    { id: "projects", label: "Projects", icon: FolderGit2, count: formData.projects?.length || 0 },
    { id: "achievements", label: "Achievements", icon: Trophy, count: formData.achievements?.length || 0 },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-950 border-slate-800 text-slate-100 flex flex-col p-0 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight text-white">
                Resume Analyzed Successfully
              </DialogTitle>
              {getConfidenceBadge(extractionData.confidence?.overall)}
            </div>
            <DialogDescription className="text-xs text-slate-400">
              Review and confirm the details extracted from <span className="text-cyan-300 font-medium">{extractionData.extractionMeta.originalFileName}</span>. You can edit any field before applying.
            </DialogDescription>
          </div>
        </div>

        {/* Conflicts Banner (if any) */}
        {conflicts.length > 0 && (
          <div className="bg-amber-950/30 border-b border-amber-800/40 p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <h5 className="text-xs font-semibold text-amber-300">
                  {conflicts.length} Profile Value Conflict{conflicts.length > 1 ? "s" : ""} Detected
                </h5>
                <div className="space-y-2">
                  {conflicts.map((c) => (
                    <div key={c.field} className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                      <span className="font-medium text-slate-300">{c.label}:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400 line-through">Current: {c.current}</span>
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                        <span className="text-cyan-300 font-medium">Resume: {c.extracted}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 ml-auto">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => resolveConflict(c.field, "current", c.current)}
                          className="h-7 px-2 text-[11px] border-slate-700 hover:bg-slate-800"
                        >
                          Keep Current
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => resolveConflict(c.field, "extracted", c.extracted)}
                          className="h-7 px-2 text-[11px] bg-cyan-600 hover:bg-cyan-500 text-white"
                        >
                          Use Resume
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Body: Navigation Tabs + Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Side Tabs */}
          <div className="w-52 border-r border-slate-800 bg-slate-900/40 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.count > 0 && (
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-slate-800 text-slate-300">
                      {item.count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          {/* Form Editor Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* PERSONAL TAB */}
            {activeTab === "personal" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">Personal Information & Links</h4>
                  {getConfidenceBadge(extractionData.confidence?.fields?.displayName?.confidence)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400">Full Name</label>
                    <Input
                      value={formData.profile?.displayName || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, profile: { ...prev.profile, displayName: e.target.value } }))}
                      className="bg-slate-900 border-slate-800 text-slate-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400">Headline / Role</label>
                    <Input
                      value={formData.profile?.headline || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, profile: { ...prev.profile, headline: e.target.value } }))}
                      className="bg-slate-900 border-slate-800 text-slate-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400">Email Address</label>
                    <Input
                      value={formData.contact?.email || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact: { ...prev.contact, email: e.target.value } }))}
                      className="bg-slate-900 border-slate-800 text-slate-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400">Phone Number</label>
                    <Input
                      value={formData.profile?.phone || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, profile: { ...prev.profile, phone: e.target.value } }))}
                      className="bg-slate-900 border-slate-800 text-slate-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400">LinkedIn Profile URL</label>
                    <Input
                      value={formData.preferences?.linkedInUrl || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, preferences: { ...prev.preferences, linkedInUrl: e.target.value } }))}
                      className="bg-slate-900 border-slate-800 text-slate-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400">GitHub Profile URL</label>
                    <Input
                      value={formData.preferences?.githubUrl || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, preferences: { ...prev.preferences, githubUrl: e.target.value } }))}
                      className="bg-slate-900 border-slate-800 text-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400">Professional Summary / About</label>
                  <Textarea
                    rows={4}
                    value={formData.profile?.about || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, profile: { ...prev.profile, about: e.target.value } }))}
                    className="bg-slate-900 border-slate-800 text-slate-100"
                  />
                </div>
              </div>
            )}

            {/* EDUCATION TAB */}
            {activeTab === "education" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">Extracted Education ({formData.educationEntries?.length || 0})</h4>
                  {getConfidenceBadge(extractionData.confidence?.fields?.education?.confidence)}
                </div>

                {(formData.educationEntries || []).length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No education entries explicitly found in resume.</p>
                ) : (
                  formData.educationEntries.map((edu, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-slate-400">Degree</label>
                          <Input
                            value={edu.degree || ""}
                            onChange={(e) => {
                              const updated = [...(formData.educationEntries || [])];
                              updated[idx].degree = e.target.value;
                              setFormData(prev => ({ ...prev, educationEntries: updated }));
                            }}
                            className="h-8 text-xs bg-slate-950 border-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400">Specialization</label>
                          <Input
                            value={edu.specialization || ""}
                            onChange={(e) => {
                              const updated = [...(formData.educationEntries || [])];
                              updated[idx].specialization = e.target.value;
                              setFormData(prev => ({ ...prev, educationEntries: updated }));
                            }}
                            className="h-8 text-xs bg-slate-950 border-slate-800"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400">College / University</label>
                          <Input
                            value={edu.college || ""}
                            onChange={(e) => {
                              const updated = [...(formData.educationEntries || [])];
                              updated[idx].college = e.target.value;
                              setFormData(prev => ({ ...prev, educationEntries: updated }));
                            }}
                            className="h-8 text-xs bg-slate-950 border-slate-800"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] text-slate-400">Graduation Year</label>
                            <Input
                              value={edu.endDate || ""}
                              onChange={(e) => {
                                const updated = [...(formData.educationEntries || [])];
                                updated[idx].endDate = e.target.value;
                                setFormData(prev => ({ ...prev, educationEntries: updated }));
                              }}
                              className="h-8 text-xs bg-slate-950 border-slate-800"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-400">Grade / CGPA</label>
                            <Input
                              value={edu.grade || ""}
                              onChange={(e) => {
                                const updated = [...(formData.educationEntries || [])];
                                updated[idx].grade = e.target.value;
                                setFormData(prev => ({ ...prev, educationEntries: updated }));
                              }}
                              className="h-8 text-xs bg-slate-950 border-slate-800"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* SKILLS TAB */}
            {activeTab === "skills" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">Extracted Skills</h4>
                  {getConfidenceBadge(extractionData.confidence?.fields?.skills?.confidence)}
                </div>

                {(formData.skillSections || []).length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No skills explicitly found in resume.</p>
                ) : (
                  formData.skillSections.map((sec, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <h5 className="text-xs font-semibold text-cyan-300">{sec.title || "Skills"}</h5>
                      <div className="flex flex-wrap gap-2">
                        {(sec.skills || []).map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2.5 py-1 rounded-md text-xs font-medium bg-cyan-950/40 border border-cyan-800/40 text-cyan-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* EXPERIENCE TAB */}
            {activeTab === "experience" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">Extracted Experience ({formData.experience?.length || 0})</h4>
                  {getConfidenceBadge(extractionData.confidence?.fields?.experience?.confidence)}
                </div>

                {(formData.experience || []).length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No formal experience found in resume.</p>
                ) : (
                  formData.experience.map((exp, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{exp.role || "Role"}</span>
                        <span className="text-slate-400">{exp.date}</span>
                      </div>
                      <p className="text-cyan-400">{exp.company} • {exp.location}</p>
                      {Array.isArray(exp.bullets) && exp.bullets.length > 0 && (
                        <ul className="list-disc list-inside space-y-1 text-slate-300 pt-1">
                          {exp.bullets.map((b, bIdx) => (
                            <li key={bIdx}>{b}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* PROJECTS TAB */}
            {activeTab === "projects" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">Extracted Projects ({formData.projects?.length || 0})</h4>
                  {getConfidenceBadge(extractionData.confidence?.fields?.projects?.confidence)}
                </div>

                {(formData.projects || []).length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No projects found in resume.</p>
                ) : (
                  formData.projects.map((proj, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{proj.title}</span>
                        {proj.date && <span className="text-slate-400">{proj.date}</span>}
                      </div>
                      <p className="text-slate-300">{proj.description}</p>
                      {proj.stack && (
                        <p className="text-cyan-400">Tech: {Array.isArray(proj.stack) ? proj.stack.join(", ") : proj.stack}</p>
                      )}
                      {proj.githubUrl && (
                        <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline inline-block">
                          {proj.githubUrl}
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ACHIEVEMENTS TAB */}
            {activeTab === "achievements" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">Extracted Achievements & Certifications ({formData.achievements?.length || 0})</h4>
                  {getConfidenceBadge(extractionData.confidence?.fields?.achievements?.confidence)}
                </div>

                {(formData.achievements || []).length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No achievements found in resume.</p>
                ) : (
                  formData.achievements.map((ach, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{ach.title}</span>
                        {ach.date && <span className="text-slate-400">{ach.date}</span>}
                      </div>
                      {Array.isArray(ach.bullets) && ach.bullets.length > 0 && (
                        <ul className="list-disc list-inside space-y-1 text-slate-300 pt-1">
                          {ach.bullets.map((b, bIdx) => (
                            <li key={bIdx}>{b}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={onUploadDifferent}
            className="text-xs text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Upload Different Resume
          </Button>

          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-800 text-slate-300 hover:bg-slate-900"
            >
              Review Later
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              disabled={applying}
              className="bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:from-cyan-400 hover:to-indigo-500 font-medium px-5 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              {applying ? "Applying..." : "Apply to Profile"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

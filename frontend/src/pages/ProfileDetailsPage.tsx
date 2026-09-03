import { motion } from "framer-motion";
import { 
  Globe, User, Plus, Trash2, Sparkles, 
  Cpu, GraduationCap, Briefcase, Trophy, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AIDescriptionGeneratorDialog from "@/components/AIDescriptionGeneratorDialog";
import { AI_PROMPT_PRESETS } from "@/config/aiPromptPresets";
import { useAuth } from "@/core/auth";
import { useEffect, useRef, useState, type ComponentType, type Dispatch, type SetStateAction } from "react";
import { ProfileApi } from "@/modules/profile/services/profile.api";
import { toast } from "sonner";

// ==========================================
// TYPES & CONSTANTS
// ==========================================
const emptySkillRow = "";
type SkillSectionRow = { title: string; skills: string[]; };
type ExperienceRow = { role: string; company: string; location: string; date: string; bullets: string; };
type AchievementRow = { title: string; date: string; bullets: string; };
type EducationRow = { degree: string; specialization: string; college: string; location: string; endDate: string; grade: string; };

const emptyExperienceRow: ExperienceRow = { role: "", company: "", location: "", date: "", bullets: "" };
const emptyAchievementRow: AchievementRow = { title: "", date: "", bullets: "" };
const emptyEducationRow: EducationRow = { degree: "", specialization: "", college: "", location: "", endDate: "", grade: "" };

const defaultSkillSections = (): SkillSectionRow[] => [
  { title: "Communication", skills: [emptySkillRow] },
  { title: "Technical", skills: [emptySkillRow] },
  { title: "Collaboration", skills: [emptySkillRow] },
  { title: "Leadership", skills: [emptySkillRow] }
];

// ==========================================
// UTILITIES
// ==========================================
const normalizeSkillSections = (items?: SkillSectionRow[]) => items && items.length ? items.map((item, index) => ({ title: item.title?.trim() || defaultSkillSections()[index % 4].title, skills: item.skills && item.skills.length ? item.skills : [emptySkillRow] })) : defaultSkillSections();
const normalizeExperienceRows = (items?: ExperienceRow[]) => (items && items.length ? items : [emptyExperienceRow]);
const normalizeAchievementRows = (items?: AchievementRow[]) => (items && items.length ? items : [emptyAchievementRow]);
const normalizeEducationRows = (items?: EducationRow[]) => (items && items.length ? items : [emptyEducationRow]);
const parseLines = (value: string) => value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
const unique = (items: string[]) => Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));

const buildSettingsSnapshot = (payload: {
  displayName: string;
  phone: string;
  about: string;
  customDomain: string;
  linkedInUrl: string;
  githubUrl: string;
  leetCodeId: string;
  geeksForGeeksId: string;
  educationRows: EducationRow[];
  skillSections: SkillSectionRow[];
  experienceRows: ExperienceRow[];
  achievementRows: AchievementRow[];
}) =>
  JSON.stringify(payload);

export default function ProfileDetailsPage() {
  const auth = useAuth();
  const backendUser = (auth as any).user || (auth as any).backendUser;
  const idToken = auth.idToken;
  const refreshProfile = (auth as any).refreshProfile;

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [generatorTarget, setGeneratorTarget] = useState<{ kind: "experience" | "achievement"; index: number } | null>(null);

  // Form States
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [about, setAbout] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [leetCodeId, setLeetCodeId] = useState("");
  const [geeksForGeeksId, setGeeksForGeeksId] = useState("");

  const [skillSections, setSkillSections] = useState<SkillSectionRow[]>(defaultSkillSections);
  const [experienceRows, setExperienceRows] = useState<ExperienceRow[]>([emptyExperienceRow]);
  const [achievementRows, setAchievementRows] = useState<AchievementRow[]>([emptyAchievementRow]);
  const [educationRows, setEducationRows] = useState<EducationRow[]>([emptyEducationRow]);
  
  const lastLoadedSnapshotRef = useRef<string>("");

  // Populate form state from canonical user object
  const populateFromUser = (user: any) => {
    if (!user) return;
    const initialSkillSections = normalizeSkillSections(
      user.skillSections && user.skillSections.length
        ? user.skillSections.map((item: any) => ({ title: item.title, skills: item.skills && item.skills.length ? item.skills : [emptySkillRow] }))
        : undefined
    );
    const initialExp = normalizeExperienceRows(
      user.experience?.map((item: any) => ({ ...item, bullets: (item.bullets || []).join("\n") }))
    );
    const initialAch = normalizeAchievementRows(
      user.achievements?.map((item: any) => ({ ...item, bullets: (item.bullets || []).join("\n") }))
    );
    const initialEdu = normalizeEducationRows(user.educationEntries);

    const nextDisplayName = user.displayName ?? "";
    const nextPhone = user.phone ?? "";
    const nextAbout = user.about ?? "";
    const nextCustomDomain = user.customDomain ?? "";
    const nextLinkedIn = user.linkedInUrl ?? "";
    const nextGithub = user.githubUrl ?? "";
    const nextLeetCode = user.leetCodeId ?? "";
    const nextGfg = user.geeksForGeeksId ?? "";

    setDisplayName(nextDisplayName);
    setPhone(nextPhone);
    setAbout(nextAbout);
    setCustomDomain(nextCustomDomain);
    setLinkedInUrl(nextLinkedIn);
    setGithubUrl(nextGithub);
    setLeetCodeId(nextLeetCode);
    setGeeksForGeeksId(nextGfg);
    setSkillSections(initialSkillSections);
    setExperienceRows(initialExp);
    setAchievementRows(initialAch);
    setEducationRows(initialEdu);

    lastLoadedSnapshotRef.current = buildSettingsSnapshot({
      displayName: nextDisplayName,
      phone: nextPhone,
      about: nextAbout,
      customDomain: nextCustomDomain,
      linkedInUrl: nextLinkedIn,
      githubUrl: nextGithub,
      leetCodeId: nextLeetCode,
      geeksForGeeksId: nextGfg,
      educationRows: initialEdu,
      skillSections: initialSkillSections,
      experienceRows: initialExp,
      achievementRows: initialAch
    });
  };

  // Initial load from server exactly once on mount
  useEffect(() => {
    let isMounted = true;
    const loadInitialProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const fetchedUser = await ProfileApi.getProfile();
        if (isMounted && fetchedUser) {
          populateFromUser(fetchedUser);
        }
      } catch (err) {
        if (isMounted && backendUser) {
          populateFromUser(backendUser);
        }
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    };

    loadInitialProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Updates
  const updateObjectRow = <T,>(setter: Dispatch<SetStateAction<T[]>>, index: number, patch: Partial<T>) => {
    setter((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removeRow = <T,>(setter: Dispatch<SetStateAction<T[]>>, index: number, fallback: T) => {
    setter((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [fallback];
    });
  };

  const handleSkillTitleChange = (sectionIndex: number, title: string) => {
    setSkillSections((prev) => prev.map((section, idx) => (idx === sectionIndex ? { ...section, title } : section)));
  };

  const handleSkillItemChange = (sectionIndex: number, skillIndex: number, value: string) => {
    setSkillSections((prev) =>
      prev.map((section, idx) =>
        idx === sectionIndex
          ? { ...section, skills: section.skills.map((skill, sIdx) => (sIdx === skillIndex ? value : skill)) }
          : section
      )
    );
  };

  const addSkillItem = (sectionIndex: number) => {
    setSkillSections((prev) =>
      prev.map((section, idx) => (idx === sectionIndex ? { ...section, skills: [...section.skills, emptySkillRow] } : section))
    );
  };

  const removeSkillItem = (sectionIndex: number, skillIndex: number) => {
    setSkillSections((prev) =>
      prev.map((section, idx) => {
        if (idx !== sectionIndex) return section;
        const nextSkills = section.skills.filter((_, sIdx) => sIdx !== skillIndex);
        return { ...section, skills: nextSkills.length ? nextSkills : [emptySkillRow] };
      })
    );
  };

  const addSkillSection = () => {
    setSkillSections((prev) => [...prev, { title: "Specialized", skills: [emptySkillRow] }]);
  };

  const removeSkillSection = (sectionIndex: number) => {
    setSkillSections((prev) => {
      const next = prev.filter((_, idx) => idx !== sectionIndex);
      return next.length ? next : defaultSkillSections();
    });
  };

  // Save changes to backend via PATCH /api/v1/auth/me
  const handleSave = async () => {
    if (isLoadingProfile) return;

    const trimmedDisplayName = displayName.trim();
    if (!trimmedDisplayName) {
      toast.error("Full Name is required.");
      return;
    }
    if (trimmedDisplayName.length < 2) {
      toast.error("Full Name must contain at least 2 characters.");
      return;
    }

    const currentSnapshot = buildSettingsSnapshot({
      displayName: trimmedDisplayName,
      phone: phone.trim(),
      about: about.trim(),
      customDomain: customDomain.trim(),
      linkedInUrl: linkedInUrl.trim(),
      githubUrl: githubUrl.trim(),
      leetCodeId: leetCodeId.trim(),
      geeksForGeeksId: geeksForGeeksId.trim(),
      educationRows,
      skillSections,
      experienceRows,
      achievementRows
    });

    if (currentSnapshot === lastLoadedSnapshotRef.current) {
      toast.info("No profile changes detected.");
      return;
    }

    setSaving(true);
    try {
      const sanitizedSkillSections = skillSections
        .map((section) => ({
          title: section.title.trim() || "Skills",
          skills: unique(section.skills)
        }))
        .filter((section) => section.skills.length > 0);

      const allSkills = unique(sanitizedSkillSections.flatMap((s) => s.skills));

      const payload = {
        displayName: trimmedDisplayName,
        phone: phone.trim(),
        about: about.trim(),
        customDomain: customDomain.trim(),
        linkedInUrl: linkedInUrl.trim(),
        githubUrl: githubUrl.trim(),
        leetCodeId: leetCodeId.trim(),
        geeksForGeeksId: geeksForGeeksId.trim(),
        educationEntries: educationRows
          .map((row) => ({
            degree: row.degree.trim(),
            specialization: row.specialization.trim(),
            college: row.college.trim(),
            location: row.location.trim(),
            endDate: row.endDate.trim(),
            grade: row.grade.trim()
          }))
          .filter((row) => row.degree || row.college || row.specialization),
        education: educationRows
          .map((row) => [row.degree, row.specialization, row.college].filter(Boolean).join(" - ").trim())
          .filter(Boolean),
        skillSections: sanitizedSkillSections,
        skillLanguages: allSkills,
        skillFrameworks: [],
        skillTools: [],
        skillLibraries: [],
        experience: experienceRows
          .map((row) => ({
            role: row.role.trim(),
            company: row.company.trim(),
            location: row.location.trim(),
            date: row.date.trim(),
            bullets: parseLines(row.bullets)
          }))
          .filter((row) => row.role || row.company),
        achievements: achievementRows
          .map((row) => ({
            title: row.title.trim(),
            date: row.date.trim(),
            bullets: parseLines(row.bullets)
          }))
          .filter((row) => row.title)
      };

      const updatedUser = await ProfileApi.updateProfile(payload);

      if (updatedUser) {
        populateFromUser(updatedUser);
        try {
          if (typeof refreshProfile === "function") {
            await refreshProfile();
          }
        } catch (syncErr) {
          console.warn("Background auth profile refresh warning:", syncErr);
        }
      }

      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Couldn't save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Generate Profile Summary using AI via POST /api/v1/ai/profile-summary
  const handleGenerateProfileSummary = async () => {
    if (isLoadingProfile) return;
    setGeneratingSummary(true);
    try {
      const sanitizedSkillSections = skillSections
        .map((section) => ({
          title: section.title.trim() || "Skills",
          skills: unique(section.skills)
        }))
        .filter((section) => section.skills.length > 0);

      const allSkills = unique(sanitizedSkillSections.flatMap((s) => s.skills));
      const educationLines = educationRows
        .map((row) => [row.degree, row.specialization, row.college].filter(Boolean).join(" - ").trim())
        .filter(Boolean);
      const achievements = achievementRows
        .filter((r) => r.title)
        .map((r) => ({
          title: r.title.trim(),
          date: r.date.trim(),
          bullets: parseLines(r.bullets)
        }));
      const projects = experienceRows
        .filter((r) => r.role || r.company)
        .map((r) => ({
          title: `${r.role} at ${r.company}`.trim(),
          description: r.bullets,
          stack: [],
          date: r.date
        }));

      const res = await ProfileApi.generateProfileSummary({
        skills: allSkills.length ? allSkills : undefined,
        educationLines: educationLines.length ? educationLines : undefined,
        achievements: achievements.length ? achievements : undefined,
        projects: projects.length ? projects : undefined,
        tone: "professional",
        maxWords: 90
      });

      const summaryText = res.profileSummary || res.summary;
      if (summaryText) {
        // ONLY update about / summary without touching other fields
        setAbout(summaryText);
        toast.success("Professional summary generated successfully!");
      }
    } catch (err: any) {
      toast.error(err.message || "Unable to generate your summary right now. Try again.");
    } finally {
      setGeneratingSummary(false);
    }
  };

  const getGeneratorConfig = () => {
    if (!generatorTarget) {
      return {
        title: "Generate Description",
        defaultPrompt: AI_PROMPT_PRESETS.settingsExperience,
        context: "",
        onApply: (_value: string) => {}
      };
    }

    if (generatorTarget.kind === "experience") {
      const row = experienceRows[generatorTarget.index] ?? emptyExperienceRow;
      return {
        title: "Generate Experience Points",
        defaultPrompt: AI_PROMPT_PRESETS.settingsExperience,
        context: [
          `Role: ${row.role || "N/A"}`,
          `Company: ${row.company || "N/A"}`,
          `Location: ${row.location || "N/A"}`,
          `Duration: ${row.date || "N/A"}`,
          `Current notes: ${row.bullets || "N/A"}`
        ].join("\n"),
        onApply: (value: string) => updateObjectRow(setExperienceRows, generatorTarget.index, { bullets: value })
      };
    }

    const row = achievementRows[generatorTarget.index] ?? emptyAchievementRow;
    return {
      title: "Generate Achievement Points",
      defaultPrompt: AI_PROMPT_PRESETS.settingsAchievement,
      context: [
        `Achievement title: ${row.title || "N/A"}`,
        `Date: ${row.date || "N/A"}`,
        `Current notes: ${row.bullets || "N/A"}`
      ].join("\n"),
      onApply: (value: string) => updateObjectRow(setAchievementRows, generatorTarget.index, { bullets: value })
    };
  };

  const generatorConfig = getGeneratorConfig();

  // Section Header Component for consistent UI
  const SectionHeader = ({ icon: Icon, title, description }: { icon: ComponentType<{ className?: string }>; title: string; description: string }) => (
    <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border/40">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold text-lg text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );

  return (
    <div className="page-shell page-shell-sm space-y-8 pb-16">
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gradient mb-2 tracking-tight">Profile Details</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage your professional identity, career information, and profile data used across Smart Skill Hub.
            </p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving || isLoadingProfile}
            className="w-full sm:w-auto glow-primary h-10 px-6 rounded-full font-medium transition-all hover:scale-105 active:scale-95"
          >
            {saving ? "Saving..." : isLoadingProfile ? "Loading..." : "Save Changes"}
          </Button>
        </div>
      </motion.div>

      {/* Loading Skeleton Indicator */}
      {isLoadingProfile ? (
        <div className="flex items-center justify-center p-12 glass rounded-2xl">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm font-medium">Loading profile details...</span>
          </div>
        </div>
      ) : (
        <>
          {/* General Profile */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <SectionHeader icon={User} title="Personal Details" description="Your core contact information and summary." />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Full Name</label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-background/50 focus-visible:ring-primary" placeholder="Your full name" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Phone</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-background/50 focus-visible:ring-primary" placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Email</label>
                <Input value={backendUser?.email ?? ""} readOnly className="bg-background/30 text-muted-foreground cursor-not-allowed" />
              </div>
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between gap-3 mb-2">
                <label className="text-xs font-medium text-foreground block">Professional Summary (About)</label>
                <Button type="button" variant="outline" size="sm" onClick={handleGenerateProfileSummary} disabled={generatingSummary || isLoadingProfile} className="h-8 text-xs glow-primary hover:text-primary transition-colors">
                  <Sparkles className="h-3 w-3 mr-1.5" /> {generatingSummary ? "Generating..." : "Auto-Generate"}
                </Button>
              </div>
              <Textarea rows={4} value={about} onChange={(e) => setAbout(e.target.value)} className="bg-background/50 focus-visible:ring-primary resize-y" placeholder="Brief elevator pitch summarizing your core tech stack, experience, and value..." />
            </div>
          </motion.div>

          {/* External Profiles */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <SectionHeader icon={Globe} title="External Profiles & Domain" description="Connect your developer presence and portfolio." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Custom Domain / Portfolio URL</label>
                <Input value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} className="bg-background/50 focus-visible:ring-primary" placeholder="yourportfolio.dev" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">LinkedIn URL</label>
                <Input value={linkedInUrl} onChange={(e) => setLinkedInUrl(e.target.value)} className="bg-background/50 focus-visible:ring-primary" placeholder="https://linkedin.com/in/username" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">GitHub URL</label>
                <Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className="bg-background/50 focus-visible:ring-primary" placeholder="https://github.com/username" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">LeetCode Username</label>
                <Input value={leetCodeId} onChange={(e) => setLeetCodeId(e.target.value)} className="bg-background/50 focus-visible:ring-primary" placeholder="leetcode_user" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">GeeksforGeeks Username</label>
                <Input value={geeksForGeeksId} onChange={(e) => setGeeksForGeeksId(e.target.value)} className="bg-background/50 focus-visible:ring-primary" placeholder="gfg_user" />
              </div>
            </div>
          </motion.div>

          {/* Skills Matrix */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-border/40">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Cpu className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">Skills Matrix</h3>
                  <p className="text-xs text-muted-foreground">Categorized competencies for ATS tailoring.</p>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addSkillSection} className="glow-primary text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Category
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {skillSections.map((section, sIdx) => (
                <div key={sIdx} className="p-4 rounded-xl bg-surface/80 border border-border/40 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      value={section.title}
                      onChange={(e) => handleSkillTitleChange(sIdx, e.target.value)}
                      className="font-bold text-xs bg-transparent border-none p-0 focus-visible:ring-0 text-foreground"
                      placeholder="Category Name"
                    />
                    <button
                      type="button"
                      onClick={() => removeSkillSection(sIdx)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {section.skills.map((skill, itemIdx) => (
                      <div key={itemIdx} className="flex items-center gap-2">
                        <Input
                          value={skill}
                          onChange={(e) => handleSkillItemChange(sIdx, itemIdx, e.target.value)}
                          placeholder="e.g. React, Docker, Python"
                          className="text-xs bg-background/50 h-8 focus-visible:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => removeSkillItem(sIdx, itemIdx)}
                          className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addSkillItem(sIdx)}
                    className="w-full text-xs font-semibold h-7 text-primary hover:bg-primary/10 gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Skill
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Experience History */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-border/40">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">Work Experience</h3>
                  <p className="text-xs text-muted-foreground">Chronological professional background.</p>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setExperienceRows((prev) => [...prev, emptyExperienceRow])} className="glow-primary text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Experience
              </Button>
            </div>

            <div className="space-y-6">
              {experienceRows.map((row, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-surface/80 border border-border/40 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-muted-foreground">Experience #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeRow(setExperienceRows, idx, emptyExperienceRow)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-medium text-foreground mb-1 block">Role / Title</label>
                      <Input value={row.role} onChange={(e) => updateObjectRow(setExperienceRows, idx, { role: e.target.value })} placeholder="Software Engineer" className="text-xs bg-background/50 h-8" />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-foreground mb-1 block">Company</label>
                      <Input value={row.company} onChange={(e) => updateObjectRow(setExperienceRows, idx, { company: e.target.value })} placeholder="Google / Microsoft" className="text-xs bg-background/50 h-8" />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-foreground mb-1 block">Location</label>
                      <Input value={row.location} onChange={(e) => updateObjectRow(setExperienceRows, idx, { location: e.target.value })} placeholder="Bangalore, India" className="text-xs bg-background/50 h-8" />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-foreground mb-1 block">Date / Duration</label>
                      <Input value={row.date} onChange={(e) => updateObjectRow(setExperienceRows, idx, { date: e.target.value })} placeholder="Jan 2024 - Present" className="text-xs bg-background/50 h-8" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <label className="text-[11px] font-medium text-foreground block">Key Bullet Points (1 per line)</label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setGeneratorTarget({ kind: "experience", index: idx })}
                        className="h-7 text-[11px] glow-primary gap-1"
                      >
                        <Sparkles className="h-3 w-3" /> AI Bullets
                      </Button>
                    </div>
                    <Textarea
                      rows={3}
                      value={row.bullets}
                      onChange={(e) => updateObjectRow(setExperienceRows, idx, { bullets: e.target.value })}
                      placeholder="Architected RESTful APIs reducing latency by 35%..."
                      className="text-xs bg-background/50 resize-y"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Education */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-border/40">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">Education</h3>
                  <p className="text-xs text-muted-foreground">Academic credentials and institutions.</p>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setEducationRows((prev) => [...prev, emptyEducationRow])} className="glow-primary text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Education
              </Button>
            </div>

            <div className="space-y-4">
              {educationRows.map((row, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-surface/80 border border-border/40 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-muted-foreground">Education Entry #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeRow(setEducationRows, idx, emptyEducationRow)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-foreground mb-1 block">Degree</label>
                      <Input value={row.degree} onChange={(e) => updateObjectRow(setEducationRows, idx, { degree: e.target.value })} placeholder="B.Tech / B.S." className="text-xs bg-background/50 h-8" />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-foreground mb-1 block">Specialization</label>
                      <Input value={row.specialization} onChange={(e) => updateObjectRow(setEducationRows, idx, { specialization: e.target.value })} placeholder="Computer Science" className="text-xs bg-background/50 h-8" />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-foreground mb-1 block">College / University</label>
                      <Input value={row.college} onChange={(e) => updateObjectRow(setEducationRows, idx, { college: e.target.value })} placeholder="IIT / NIT / University" className="text-xs bg-background/50 h-8" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Achievements */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-border/40">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">Key Achievements</h3>
                  <p className="text-xs text-muted-foreground">Competitions, hackathons, and honors.</p>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setAchievementRows((prev) => [...prev, emptyAchievementRow])} className="glow-primary text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Achievement
              </Button>
            </div>

            <div className="space-y-6">
              {achievementRows.map((row, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-surface/80 border border-border/40 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-muted-foreground">Achievement #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeRow(setAchievementRows, idx, emptyAchievementRow)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-medium text-foreground mb-1 block">Title</label>
                      <Input value={row.title} onChange={(e) => updateObjectRow(setAchievementRows, idx, { title: e.target.value })} placeholder="1st Place - National AI Hackathon" className="text-xs bg-background/50 h-8" />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-foreground mb-1 block">Date</label>
                      <Input value={row.date} onChange={(e) => updateObjectRow(setAchievementRows, idx, { date: e.target.value })} placeholder="Nov 2024" className="text-xs bg-background/50 h-8" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <label className="text-[11px] font-medium text-foreground block">Key Bullet Points (1 per line)</label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setGeneratorTarget({ kind: "achievement", index: idx })}
                        className="h-7 text-[11px] glow-primary gap-1"
                      >
                        <Sparkles className="h-3 w-3" /> AI Bullets
                      </Button>
                    </div>
                    <Textarea
                      rows={2}
                      value={row.bullets}
                      onChange={(e) => updateObjectRow(setAchievementRows, idx, { bullets: e.target.value })}
                      placeholder="Developed an automated resume parser using LLM embeddings..."
                      className="text-xs bg-background/50 resize-y"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}

      {/* AI Description Generator Dialog */}
      <AIDescriptionGeneratorDialog
        open={Boolean(generatorTarget)}
        onOpenChange={(open) => {
          if (!open) setGeneratorTarget(null);
        }}
        title={generatorConfig.title}
        defaultPrompt={generatorConfig.defaultPrompt}
        context={generatorConfig.context}
        onApply={generatorConfig.onApply}
      />
    </div>
  );
}

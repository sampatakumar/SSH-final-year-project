import { motion } from "framer-motion";
import { 
  Globe, User, Plus, Trash2, Sparkles, 
  Cpu, GraduationCap, Briefcase, Trophy, Loader2,
  BookOpen, Compass, Target, Check, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import AIDescriptionGeneratorDialog from "@/components/AIDescriptionGeneratorDialog";
import { AI_PROMPT_PRESETS } from "@/config/aiPromptPresets";
import { useAuth } from "@/core/auth";
import { useEffect, useRef, useState, type ComponentType, type Dispatch, type SetStateAction } from "react";
import { ProfileApi } from "@/modules/profile/services/profile.api";
import {
  AcademicApi,
  type AcademicOptionsResponse,
  type AcademicDegreeOption,
  type AcademicBranchOption,
  type CareerRoleOption,
} from "@/modules/profile/services/academic.api";
import { toast } from "sonner";
import { ResumeUploadDropzone } from "@/components/resume/ResumeUploadDropzone";
import { ResumeExtractionReviewDialog } from "@/components/resume/ResumeExtractionReviewDialog";
import { type ResumeUploadExtractionResponse } from "@/modules/resume/services/resume.api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ==========================================
// TYPES & CONSTANTS
// ==========================================
const emptySkillRow = "";
type SkillSectionRow = { title: string; skills: string[]; };
type ExperienceRow = { role: string; company: string; location: string; date: string; bullets: string; };
type AchievementRow = { title: string; date: string; bullets: string; };
type EducationRow = { degree: string; specialization: string; college: string; location: string; endDate: string; grade: string; };

export type AcademicProfileState = {
  degreeSlug: string;
  degreeName: string;
  branchSlug: string;
  branchName: string;
  specializationSlug: string;
  specializationName: string;
  stream: string;
  currentYear: number | null;
  currentSemester: number | null;
  institution: string;
  academicScheme: string;
};

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
  academic: AcademicProfileState;
  targetRole: string;
  targetRoles: string[];
  careerInterests: string[];
  customBranchName: string;
  customSpecName: string;
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

  // Resume Upload & Extraction State
  const [showResumeUploadModal, setShowResumeUploadModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [extractedResumeData, setExtractedResumeData] = useState<ResumeUploadExtractionResponse | null>(null);

  // Form States
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [about, setAbout] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [leetCodeId, setLeetCodeId] = useState("");
  const [geeksForGeeksId, setGeeksForGeeksId] = useState("");

  // Academic Taxonomy State
  const [degreeSlug, setDegreeSlug] = useState("");
  const [degreeName, setDegreeName] = useState("");
  const [branchSlug, setBranchSlug] = useState("");
  const [branchName, setBranchName] = useState("");
  const [customBranchName, setCustomBranchName] = useState("");
  const [specializationSlug, setSpecializationSlug] = useState("");
  const [specializationName, setSpecializationName] = useState("");
  const [customSpecName, setCustomSpecName] = useState("");
  const [stream, setStream] = useState("");
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [currentSemester, setCurrentSemester] = useState<number | null>(null);
  const [institution, setInstitution] = useState("");
  const [academicScheme, setAcademicScheme] = useState("");

  // Career Goals State
  const [targetRole, setTargetRole] = useState("Full Stack Developer");
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [careerInterests, setCareerInterests] = useState<string[]>([]);
  const [newInterestInput, setNewInterestInput] = useState("");

  // Catalog Options
  const [catalogOptions, setCatalogOptions] = useState<AcademicOptionsResponse | null>(null);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [branchRoles, setBranchRoles] = useState<CareerRoleOption[]>([]);

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

    const userAcademic = user.academic || {};
    const nextDegreeSlug = userAcademic.degreeSlug || "";
    const nextDegreeName = userAcademic.degreeName || "";
    const nextBranchSlug = userAcademic.branchSlug || "";
    const nextBranchName = userAcademic.branchName || "";
    const nextSpecSlug = userAcademic.specializationSlug || "";
    const nextSpecName = userAcademic.specializationName || "";
    const nextStream = userAcademic.stream || "";
    const nextYear = userAcademic.currentYear ?? null;
    const nextSem = userAcademic.currentSemester ?? null;
    const nextInst = userAcademic.institution || "";
    const nextScheme = userAcademic.academicScheme || "";

    const nextTargetRole = user.targetRole || "Full Stack Developer";
    const nextTargetRoles = Array.isArray(user.targetRoles) && user.targetRoles.length > 0
      ? user.targetRoles
      : [nextTargetRole];
    const nextInterests = Array.isArray(user.careerInterests) ? user.careerInterests : [];

    setDegreeSlug(nextDegreeSlug);
    setDegreeName(nextDegreeName);
    setBranchSlug(nextBranchSlug);
    setBranchName(nextBranchName);
    setSpecializationSlug(nextSpecSlug);
    setSpecializationName(nextSpecName);
    setStream(nextStream);
    setCurrentYear(nextYear);
    setCurrentSemester(nextSem);
    setInstitution(nextInst);
    setAcademicScheme(nextScheme);
    setTargetRole(nextTargetRole);
    setTargetRoles(nextTargetRoles);
    setCareerInterests(nextInterests);

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
      achievementRows: initialAch,
      academic: {
        degreeSlug: nextDegreeSlug,
        degreeName: nextDegreeName,
        branchSlug: nextBranchSlug,
        branchName: nextBranchName,
        specializationSlug: nextSpecSlug,
        specializationName: nextSpecName,
        stream: nextStream,
        currentYear: nextYear,
        currentSemester: nextSem,
        institution: nextInst,
        academicScheme: nextScheme,
      },
      targetRole: nextTargetRole,
      targetRoles: nextTargetRoles,
      careerInterests: nextInterests,
      customBranchName: "",
      customSpecName: "",
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

    const loadCatalog = async () => {
      try {
        setIsLoadingCatalog(true);
        const options = await AcademicApi.getOptions();
        if (isMounted && options) {
          setCatalogOptions(options);
        }
      } catch (err) {
        console.error("Error loading academic options:", err);
      } finally {
        if (isMounted) {
          setIsLoadingCatalog(false);
        }
      }
    };

    loadInitialProfile();
    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch recommended career roles whenever branchSlug changes
  useEffect(() => {
    if (!branchSlug) {
      setBranchRoles([]);
      return;
    }
    let isMounted = true;
    AcademicApi.getBranchRoles(branchSlug)
      .then((roles) => {
        if (isMounted) setBranchRoles(roles);
      })
      .catch((err) => console.error("Error loading branch roles:", err));
    return () => {
      isMounted = false;
    };
  }, [branchSlug]);

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

  // Dependent Selection Handlers
  const handleDegreeChange = (slug: string) => {
    setDegreeSlug(slug);
    const found = catalogOptions?.degrees.find((d) => d.slug === slug);
    if (found) {
      setDegreeName(found.name);
      setStream(found.stream);
    } else {
      setDegreeName("");
    }
  };

  const handleBranchChange = (slug: string) => {
    setBranchSlug(slug);
    const found = catalogOptions?.branches.find((b) => b.slug === slug);
    if (found) {
      setBranchName(found.name);
      if (found.stream) setStream(found.stream);
      setSpecializationSlug("");
      setSpecializationName("");
    } else if (slug === "other-eng" || slug === "custom") {
      setBranchName("Other Discipline");
      setSpecializationSlug("");
      setSpecializationName("");
    }
  };

  const handleSpecializationChange = (slug: string) => {
    setSpecializationSlug(slug);
    const branch = catalogOptions?.branches.find((b) => b.slug === branchSlug);
    const foundSpec = branch?.specializations.find((s) => s.slug === slug);
    if (foundSpec) {
      setSpecializationName(foundSpec.name);
    } else if (slug === "general") {
      setSpecializationName("General / Core");
    } else {
      setSpecializationName("");
    }
  };

  const toggleTargetRole = (roleTitle: string) => {
    const trimmed = roleTitle.trim();
    if (!trimmed) return;
    setTargetRoles((prev) => {
      const exists = prev.includes(trimmed);
      const next = exists ? prev.filter((r) => r !== trimmed) : [...prev, trimmed];
      if (next.length > 0 && (!targetRole || (exists && targetRole === trimmed))) {
        setTargetRole(next[0]);
      }
      return next;
    });
  };

  const addCareerInterest = () => {
    const trimmed = newInterestInput.trim();
    if (!trimmed) return;
    if (!careerInterests.includes(trimmed)) {
      setCareerInterests((prev) => [...prev, trimmed]);
    }
    setNewInterestInput("");
  };

  const removeCareerInterest = (interest: string) => {
    setCareerInterests((prev) => prev.filter((i) => i !== interest));
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

    const effectiveBranchName =
      branchSlug === "other-eng" || branchSlug === "custom"
        ? customBranchName.trim() || branchName
        : branchName;
    const effectiveSpecName =
      specializationSlug === "custom"
        ? customSpecName.trim() || specializationName
        : specializationName;

    const academicPayload: AcademicProfileState = {
      degreeSlug,
      degreeName,
      branchSlug,
      branchName: effectiveBranchName,
      specializationSlug,
      specializationName: effectiveSpecName,
      stream,
      currentYear: currentYear ? Number(currentYear) : null,
      currentSemester: currentSemester ? Number(currentSemester) : null,
      institution: institution.trim(),
      academicScheme: academicScheme.trim(),
    };

    const effectiveTargetRoles =
      targetRoles.length > 0 ? targetRoles : [targetRole || "Full Stack Developer"];
    const effectivePrimaryRole = effectiveTargetRoles[0] || targetRole || "Full Stack Developer";

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
      achievementRows,
      academic: academicPayload,
      targetRole: effectivePrimaryRole,
      targetRoles: effectiveTargetRoles,
      careerInterests,
      customBranchName,
      customSpecName,
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

      // Keep educationRows[0] in harmony with academic credential if first entry was empty
      const harmonizedEduRows = [...educationRows];
      if (
        harmonizedEduRows.length > 0 &&
        !harmonizedEduRows[0].degree &&
        (degreeName || effectiveBranchName || institution)
      ) {
        harmonizedEduRows[0] = {
          ...harmonizedEduRows[0],
          degree: degreeName || harmonizedEduRows[0].degree,
          specialization: effectiveBranchName || harmonizedEduRows[0].specialization,
          college: institution.trim() || harmonizedEduRows[0].college,
        };
      }

      const payload = {
        displayName: trimmedDisplayName,
        phone: phone.trim(),
        about: about.trim(),
        customDomain: customDomain.trim(),
        linkedInUrl: linkedInUrl.trim(),
        githubUrl: githubUrl.trim(),
        leetCodeId: leetCodeId.trim(),
        geeksForGeeksId: geeksForGeeksId.trim(),
        targetRole: effectivePrimaryRole,
        targetRoles: effectiveTargetRoles,
        careerInterests,
        academic: academicPayload,
        educationEntries: harmonizedEduRows
          .map((row) => ({
            degree: row.degree.trim(),
            specialization: row.specialization.trim(),
            college: row.college.trim(),
            location: row.location.trim(),
            endDate: row.endDate.trim(),
            grade: row.grade.trim()
          }))
          .filter((row) => row.degree || row.college || row.specialization),
        education: harmonizedEduRows
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
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowResumeUploadModal(true)}
              className="w-full sm:w-auto h-10 px-5 rounded-full border-cyan-500/40 bg-cyan-950/20 text-cyan-300 hover:bg-cyan-500/20 hover:text-white transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            >
              <Sparkles className="w-4 h-4 mr-2 text-cyan-400" />
              Import from Resume
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || isLoadingProfile}
              className="w-full sm:w-auto glow-primary h-10 px-6 rounded-full font-medium transition-all hover:scale-105 active:scale-95"
            >
              {saving ? "Saving..." : isLoadingProfile ? "Loading..." : "Save Changes"}
            </Button>
          </div>
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

          {/* Academic Background & Specialization */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="glass rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-border/40">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">Academic Background & Specialization</h3>
                  <p className="text-xs text-muted-foreground">Multi-branch student credentials, branch, and institutional details.</p>
                </div>
              </div>
              {stream && (
                <Badge variant="glow" className="text-xs font-semibold px-3 py-1">
                  {stream}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Qualification / Degree */}
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Qualification / Degree</label>
                <select
                  value={degreeSlug}
                  onChange={(e) => handleDegreeChange(e.target.value)}
                  className="w-full bg-background/50 border border-border/40 text-xs rounded-md px-3 h-9 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select Degree / Qualification</option>
                  {(catalogOptions?.degrees || []).map((deg) => (
                    <option key={deg.slug} value={deg.slug}>
                      {deg.shortName} — {deg.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch */}
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Academic Branch</label>
                <select
                  value={branchSlug}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  className="w-full bg-background/50 border border-border/40 text-xs rounded-md px-3 h-9 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select Branch</option>
                  {(catalogOptions?.branches || []).map((b) => (
                    <option key={b.slug} value={b.slug}>
                      {b.code ? `[${b.code}] ` : ""}{b.name}
                    </option>
                  ))}
                  <option value="custom">Other / Custom Branch</option>
                </select>
              </div>

              {/* Specialization */}
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Specialization / Domain</label>
                {(() => {
                  const currentBranchObj = (catalogOptions?.branches || []).find((b) => b.slug === branchSlug);
                  const specs = currentBranchObj?.specializations || [];
                  return (
                    <select
                      value={specializationSlug}
                      onChange={(e) => handleSpecializationChange(e.target.value)}
                      className="w-full bg-background/50 border border-border/40 text-xs rounded-md px-3 h-9 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">General / Core</option>
                      {specs.map((sp) => (
                        <option key={sp.slug} value={sp.slug}>
                          {sp.name}
                        </option>
                      ))}
                      <option value="custom">Custom Specialization</option>
                    </select>
                  );
                })()}
              </div>
            </div>

            {/* Custom Branch / Specialization fallback inputs if selected */}
            {(branchSlug === "custom" || branchSlug === "other-eng" || specializationSlug === "custom") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4 pt-4 border-t border-border/20">
                {(branchSlug === "custom" || branchSlug === "other-eng") && (
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">Custom Branch Name</label>
                    <Input
                      value={customBranchName}
                      onChange={(e) => setCustomBranchName(e.target.value)}
                      className="bg-background/50 focus-visible:ring-primary h-9 text-xs"
                      placeholder="e.g. Marine Engineering / Mechatronics"
                    />
                  </div>
                )}
                {specializationSlug === "custom" && (
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1.5 block">Custom Specialization Name</label>
                    <Input
                      value={customSpecName}
                      onChange={(e) => setCustomSpecName(e.target.value)}
                      className="bg-background/50 focus-visible:ring-primary h-9 text-xs"
                      placeholder="e.g. Edge Computing / FinTech"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Current Year, Semester, Institution, Scheme */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mt-5">
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Current Year</label>
                <select
                  value={currentYear ?? ""}
                  onChange={(e) => setCurrentYear(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-background/50 border border-border/40 text-xs rounded-md px-3 h-9 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="5">5th Year</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Current Semester</label>
                <select
                  value={currentSemester ?? ""}
                  onChange={(e) => setCurrentSemester(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-background/50 border border-border/40 text-xs rounded-md px-3 h-9 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Institution / College</label>
                <Input
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="bg-background/50 focus-visible:ring-primary h-9 text-xs"
                  placeholder="e.g. National Institute of Technology"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Academic Scheme / Regulation</label>
                <Input
                  value={academicScheme}
                  onChange={(e) => setAcademicScheme(e.target.value)}
                  className="bg-background/50 focus-visible:ring-primary h-9 text-xs"
                  placeholder="e.g. 2022 Scheme / CBCS"
                />
              </div>
            </div>
          </motion.div>

          {/* Career Pathways & Role Goals */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="glass rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-border/40">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Compass className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">Career Pathways & Role Goals</h3>
                  <p className="text-xs text-muted-foreground">Select preferred career tracks and explore discipline-aligned pathways.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">Active Target:</span>
                <Badge variant="glow" className="text-xs font-bold gap-1 px-3 py-1">
                  <Target className="h-3 w-3" /> {targetRole || "Full Stack Developer"}
                </Badge>
              </div>
            </div>

            {/* Recommended Career Roles for Chosen Branch */}
            {branchRoles.length > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-surface/70 border border-border/40">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-foreground">
                      Recommended Pathways for {branchName || "Selected Branch"}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Click to add/remove from your goals</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {branchRoles.map((role) => {
                    const isSelected = targetRoles.includes(role.title);
                    const relType = role.mapping?.relationshipType || "primary";
                    return (
                      <button
                        key={role.slug}
                        type="button"
                        onClick={() => toggleTargetRole(role.title)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/40"
                            : "bg-background/60 hover:bg-background/90 text-foreground border border-border/50"
                        }`}
                      >
                        {isSelected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5 text-muted-foreground" />}
                        <span>{role.title}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                        }`}>
                          {relType}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected Target Roles Matrix */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground mb-2 block">
                  Your Selected Career Goals ({targetRoles.length})
                </label>
                <div className="flex flex-wrap items-center gap-2 p-3 min-h-12 rounded-xl bg-background/50 border border-border/40">
                  {targetRoles.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">
                      No career roles selected yet. Click any recommended role or pick from the catalog below.
                    </span>
                  ) : (
                    targetRoles.map((r, rIdx) => (
                      <Badge
                        key={rIdx}
                        variant={r === targetRole ? "glow" : "secondary"}
                        className="text-xs gap-1.5 py-1 px-3 cursor-pointer"
                        onClick={() => setTargetRole(r)}
                        title="Click to set as primary target"
                      >
                        {r === targetRole && <Target className="h-3 w-3 text-primary" />}
                        <span>{r}</span>
                        {targetRoles.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTargetRole(r);
                            }}
                            className="hover:text-destructive p-0.5 rounded transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  The first selected role serves as your primary AI mentor & gap analysis target. Click any badge to set it as primary.
                </p>
              </div>

              {/* Add Role from Full Catalog */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Explore All Career Catalog Roles</label>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        toggleTargetRole(e.target.value);
                      }
                    }}
                    className="w-full bg-background/50 border border-border/40 text-xs rounded-md px-3 h-9 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">+ Add role from full catalog...</option>
                    {(catalogOptions?.careerCategories || []).map((cat) => (
                      <optgroup key={cat} label={cat}>
                        {(catalogOptions?.careerRoles || [])
                          .filter((r) => r.category === cat)
                          .map((r) => (
                            <option key={r.slug} value={r.title} disabled={targetRoles.includes(r.title)}>
                              {r.title} {targetRoles.includes(r.title) ? "✓ Added" : ""}
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Career Interests & Domain Tags */}
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Career Interests & Domain Tags</label>
                  <div className="flex gap-2">
                    <Input
                      value={newInterestInput}
                      onChange={(e) => setNewInterestInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCareerInterest();
                        }
                      }}
                      className="bg-background/50 focus-visible:ring-primary h-9 text-xs"
                      placeholder="e.g. Embedded IoT, FinTech, Robotics"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCareerInterest}
                      className="glow-primary text-xs shrink-0 h-9 px-3 gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add
                    </Button>
                  </div>
                  {careerInterests.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {careerInterests.map((interest, iIdx) => (
                        <Badge key={iIdx} variant="glass" className="text-[11px] gap-1 px-2.5 py-0.5">
                          <span>{interest}</span>
                          <button
                            type="button"
                            onClick={() => removeCareerInterest(interest)}
                            className="hover:text-destructive transition-colors ml-1"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Skills Matrix */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="glass rounded-2xl p-6 shadow-sm relative overflow-hidden">
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

      {/* Resume Upload Modal */}
      <Dialog open={showResumeUploadModal} onOpenChange={setShowResumeUploadModal}>
        <DialogContent className="max-w-2xl bg-slate-950 border-slate-800 text-slate-100 p-6 shadow-2xl">
          <DialogHeader className="space-y-1.5 pb-2">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight text-white">
                Import Details from Resume
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-400">
              Upload your PDF, DOCX, TXT, or RTF resume to automatically populate your profile fields.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <ResumeUploadDropzone
              onExtracted={(data) => {
                setExtractedResumeData(data);
                setShowResumeUploadModal(false);
                setShowReviewModal(true);
              }}
              onCancel={() => setShowResumeUploadModal(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Resume Extraction Review & Conflict Resolver Dialog */}
      <ResumeExtractionReviewDialog
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        extractionData={extractedResumeData}
        currentUserProfile={{
          displayName,
          phone,
          headline: backendUser?.headline,
          linkedInUrl,
          githubUrl,
        }}
        onApplied={(updatedUser) => {
          if (updatedUser) {
            populateFromUser(updatedUser);
          }
          if (typeof refreshProfile === "function") {
            void refreshProfile();
          }
        }}
        onUploadDifferent={() => {
          setShowReviewModal(false);
          setShowResumeUploadModal(true);
        }}
      />
    </div>
  );
}

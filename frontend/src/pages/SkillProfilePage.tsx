import { useState, useEffect } from "react";
import {
  ArrowUpDown,
  CheckCircle2,
  Code2,
  FileText,
  Filter,
  GitBranch,
  Info,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SmartSkillApi, EvaluatedSkill, SkillProfileData } from "@/lib/api";
import { toast } from "sonner";

const SkillProfilePage = () => {
  const [profile, setProfile] = useState<SkillProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSource, setSelectedSource] = useState("all");
  const [selectedSkillDetail, setSelectedSkillDetail] = useState<EvaluatedSkill | null>(null);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const data = await SmartSkillApi.getSkillProfile();
      setProfile(data);
    } catch (err: any) {
      console.warn("Could not load skill profile:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleReevaluate = async () => {
    try {
      setIsEvaluating(true);
      toast.info("Running deterministic multi-source evaluation...");
      const result = await SmartSkillApi.evaluateSkills();
      setProfile(result.profile);
      toast.success("Skill Profile re-evaluated!");
    } catch (err: any) {
      toast.error(err.message || "Evaluation failed");
    } finally {
      setIsEvaluating(false);
    }
  };

  const skills = profile?.skills || [];

  // Extract unique categories
  const categories = ["all", ...Array.from(new Set(skills.map((s) => s.category))).filter(Boolean)];

  // Filter skills
  const filteredSkills = skills.filter((skill) => {
    const matchesSearch =
      skill.canonicalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || skill.category === selectedCategory;
    const matchesSource = selectedSource === "all" || (skill.sources || []).includes(selectedSource);
    return matchesSearch && matchesCategory && matchesSource;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Title & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/30 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Unified Skill Profile
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Transparent, multi-source evaluation synthesized across Resume claims, GitHub repositories, and isolated Coding assessments.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleReevaluate}
          disabled={isEvaluating}
          className="shadow-neo-raised-sm bg-background border-border/40 gap-2 h-9 text-xs font-semibold"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isEvaluating ? "animate-spin text-primary" : ""}`} />
          {isEvaluating ? "Synthesizing..." : "Re-evaluate Skills"}
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-surface border border-border/40 rounded-2xl shadow-neo-raised flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search skills (e.g. React, Docker, Arrays)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background h-9 text-xs border-border/40"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-background text-foreground text-xs font-medium border border-border/40 rounded-xl px-3 py-2 h-9 focus:outline-none focus:ring-1 focus:ring-primary shadow-neo-raised-sm"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All Categories" : cat}
              </option>
            ))}
          </select>

          {/* Source Filter */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="bg-background text-foreground text-xs font-medium border border-border/40 rounded-xl px-3 py-2 h-9 focus:outline-none focus:ring-1 focus:ring-primary shadow-neo-raised-sm"
          >
            <option value="all">All Sources</option>
            <option value="resume">Resume Claims</option>
            <option value="github">GitHub Observed</option>
            <option value="coding">Coding Assessments</option>
          </select>
        </div>
      </div>

      {/* Skills Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
          <p>Loading evaluated skill profile...</p>
        </div>
      ) : filteredSkills.length === 0 ? (
        <div className="py-16 text-center border border-border/40 bg-surface rounded-2xl p-8 space-y-3">
          <p className="text-sm text-muted-foreground">No skills match the selected filter criteria.</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
              setSelectedSource("all");
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => (
            <div
              key={skill.canonicalName}
              className="p-5 rounded-2xl border border-border/30 bg-surface hover:border-primary/40 transition-all shadow-neo-raised flex flex-col justify-between space-y-4 cursor-pointer group"
              onClick={() => setSelectedSkillDetail(skill)}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                      {skill.canonicalName}
                    </h3>
                    <span className="text-xs text-muted-foreground font-medium">{skill.category}</span>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                      skill.level === "Strong Evidence" || skill.level === "Proficient"
                        ? "bg-primary/10 text-primary border-primary/30"
                        : skill.level === "Competent"
                        ? "bg-success/10 text-success border-success/30"
                        : "bg-warning/10 text-warning border-warning/30"
                    }`}
                  >
                    {skill.level}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                    <span className="text-muted-foreground">Evaluation Score</span>
                    <span className="font-bold text-foreground">{skill.score} / 100</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden border border-border/20">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(5, skill.score))}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border/20">
                  <span>Confidence: {Math.round(skill.confidence * 100)}%</span>
                  <span>{skill.evidenceCount} Evidence Signal{skill.evidenceCount > 1 ? "s" : ""}</span>
                </div>
              </div>

              {/* Source Badges */}
              <div className="flex items-center justify-between pt-2 border-t border-border/20 text-xs">
                <div className="flex items-center gap-1.5">
                  {(skill.sources || []).map((src) => (
                    <span
                      key={src}
                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-background border border-border/30 text-foreground capitalize"
                    >
                      {src === "resume" && <FileText className="h-3 w-3 text-primary" />}
                      {src === "github" && <GitBranch className="h-3 w-3 text-primary" />}
                      {src === "coding" && <Code2 className="h-3 w-3 text-primary" />}
                      {src}
                    </span>
                  ))}
                </div>
                <span className="text-[11px] text-primary font-semibold group-hover:underline">
                  Inspect Evidence →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inspect Evidence Modal */}
      {selectedSkillDetail && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-surface border border-border/40 rounded-2xl max-w-lg w-full p-6 shadow-neo-raised-lg space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-border/30 pb-3">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> {selectedSkillDetail.canonicalName}
                </h3>
                <span className="text-xs text-muted-foreground font-medium">
                  {selectedSkillDetail.category}
                </span>
              </div>
              <button
                onClick={() => setSelectedSkillDetail(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Score & Level Banner */}
            <div className="p-4 bg-background rounded-xl border border-border/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-muted-foreground block">Evaluation Level</span>
                <span className="text-base font-bold text-primary">{selectedSkillDetail.level}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-muted-foreground block">Composite Score</span>
                <span className="text-xl font-extrabold text-foreground">{selectedSkillDetail.score} / 100</span>
              </div>
            </div>

            {/* Methodology Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Mathematical Factor Breakdown
              </h4>
              <p className="text-xs text-foreground bg-background/70 p-3 rounded-xl border border-border/30 font-mono leading-relaxed">
                {selectedSkillDetail.explanation}
              </p>
            </div>

            {/* Concrete Observations */}
            {selectedSkillDetail.observations && selectedSkillDetail.observations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Concrete Evidence Signals
                </h4>
                <ul className="space-y-1.5">
                  {selectedSkillDetail.observations.map((obs, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-muted-foreground flex items-start gap-2 bg-background/40 p-2 rounded-lg border border-border/20"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button size="sm" onClick={() => setSelectedSkillDetail(null)} className="w-full">
              Close Inspection
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillProfilePage;

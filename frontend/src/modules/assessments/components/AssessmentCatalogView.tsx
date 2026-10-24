import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Clock,
  HelpCircle,
  Award,
  Sparkles,
  Search,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Filter,
} from "lucide-react";
import {
  BranchAssessment,
  RecommendedAssessmentItem,
} from "../types/assessmentCenter.types";

interface AssessmentCatalogViewProps {
  assessments: BranchAssessment[];
  recommendations: RecommendedAssessmentItem[];
  userBranch?: string;
  loading?: boolean;
  onStartAssessment: (assessmentId: string) => void;
}

const DISCIPLINE_CATEGORIES = [
  "All",
  "Engineering & Technology",
  "Electronics & Electrical",
  "Business & Commerce",
  "Sciences & Biotechnology",
  "Arts & Humanities",
  "Healthcare & Allied Health",
  "Computing & Software",
];

export const AssessmentCatalogView: React.FC<AssessmentCatalogViewProps> = ({
  assessments,
  recommendations,
  userBranch,
  loading = false,
  onStartAssessment,
}) => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBlueprint, setActiveBlueprint] = useState<BranchAssessment | null>(null);

  const filteredAssessments = assessments.filter((a) => {
    const matchesCategory =
      selectedCategory === "All" || a.disciplineCategory === selectedCategory;
    const matchesDifficulty =
      selectedDifficulty === "All" || a.difficulty === selectedDifficulty;
    const matchesSearch =
      !searchQuery.trim() ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.relevantSkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  return (
    <div className="space-y-6" data-testid="assessment-catalog-view">
      {/* Personalized Recommendations Section */}
      {recommendations.length > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <h3 className="text-base font-semibold text-foreground">
              Recommended for Your Pathway
            </h3>
            {userBranch && (
              <Badge variant="outline" className="text-xs uppercase">
                {userBranch}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Prioritized assessments tailored to your academic branch, career readiness gaps, and active project prerequisites.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.slice(0, 3).map((item, idx) => (
              <Card
                key={`rec-${item.assessment.assessmentId}-${idx}`}
                className="bg-card border-border hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Badge
                      variant="secondary"
                      className="text-xs bg-primary/10 text-primary font-normal"
                    >
                      {item.reasonLabel}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {item.assessment.estimatedDuration}
                    </span>
                  </div>
                  <CardTitle className="text-sm font-semibold leading-tight line-clamp-1">
                    {item.assessment.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3 text-xs text-muted-foreground line-clamp-2">
                  {item.assessment.description}
                </CardContent>
                <CardFooter className="pt-0 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8 px-2"
                    onClick={() => setActiveBlueprint(item.assessment)}
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs h-8 gap-1"
                    onClick={() => onStartAssessment(item.assessment.assessmentId)}
                  >
                    Start <ArrowRight className="h-3 w-3" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Discovery & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assessments, topics, or skills..."
            className="pl-9 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Difficulty:
          </div>
          {["All", "Beginner", "Intermediate", "Advanced"].map((diff) => (
            <Button
              key={diff}
              variant={selectedDifficulty === diff ? "default" : "outline"}
              size="sm"
              className="text-xs h-8 px-3 rounded-full"
              onClick={() => setSelectedDifficulty(diff)}
            >
              {diff}
            </Button>
          ))}
        </div>
      </div>

      {/* Discipline Category Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {DISCIPLINE_CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "secondary" : "ghost"}
            size="sm"
            className={`text-xs h-7 px-3 rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? "bg-secondary text-secondary-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Assessment Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-64 rounded-xl bg-card border border-border animate-pulse p-5 space-y-4"
            >
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="h-16 bg-muted rounded w-full" />
              <div className="h-8 bg-muted rounded w-full mt-auto" />
            </div>
          ))}
        </div>
      ) : filteredAssessments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">No Assessments Found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            No published assessments match the current filter criteria. Try selecting another discipline or clearing your search query.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 text-xs"
            onClick={() => {
              setSelectedCategory("All");
              setSelectedDifficulty("All");
              setSearchQuery("");
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssessments.map((assessment) => (
            <Card
              key={assessment.assessmentId}
              className="bg-card border-border hover:border-primary/40 transition-all flex flex-col justify-between group shadow-sm hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="outline" className="text-xs font-normal">
                    {assessment.disciplineCategory}
                  </Badge>
                  <Badge
                    variant={
                      assessment.difficulty === "Advanced"
                        ? "destructive"
                        : assessment.difficulty === "Intermediate"
                        ? "default"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {assessment.difficulty}
                  </Badge>
                </div>
                <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors leading-snug">
                  {assessment.title}
                </CardTitle>
                <CardDescription className="text-xs line-clamp-2 mt-1">
                  {assessment.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pb-4">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-primary" /> {assessment.estimatedDuration}
                  </span>
                  <span className="flex items-center gap-1">
                    <HelpCircle className="h-3.5 w-3.5 text-primary" /> {assessment.questions.length} Questions
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="h-3.5 w-3.5 text-success" /> 70% to Pass
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-foreground">Skills Evaluated:</span>
                  <div className="flex flex-wrap gap-1">
                    {assessment.relevantSkills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                        {skill}
                      </Badge>
                    ))}
                    {assessment.relevantSkills.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{assessment.relevantSkills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-0 border-t border-border/50 p-4 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-9 flex-1"
                  onClick={() => setActiveBlueprint(assessment)}
                >
                  View Blueprint
                </Button>
                <Button
                  size="sm"
                  className="text-xs h-9 flex-1 gap-1"
                  onClick={() => onStartAssessment(assessment.assessmentId)}
                >
                  Start Assessment <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Blueprint Detail Modal */}
      <Dialog open={Boolean(activeBlueprint)} onOpenChange={(open) => !open && setActiveBlueprint(null)}>
        {activeBlueprint && (
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  {activeBlueprint.disciplineCategory}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {activeBlueprint.difficulty}
                </Badge>
              </div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {activeBlueprint.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {activeBlueprint.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/40 border border-border text-center text-xs">
                <div>
                  <span className="text-muted-foreground block">Estimated Time</span>
                  <span className="font-semibold text-foreground">{activeBlueprint.estimatedDuration}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Questions Count</span>
                  <span className="font-semibold text-foreground">{activeBlueprint.questions.length} Items</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Passing Threshold</span>
                  <span className="font-semibold text-success">
                    {activeBlueprint.passingCriteria?.minScore || 70}%
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider mb-2">
                  Learning Objectives
                </h4>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  {activeBlueprint.learningObjectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {activeBlueprint.prerequisites.length > 0 && (
                <div>
                  <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider mb-1.5">
                    Recommended Prerequisites
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeBlueprint.prerequisites.map((p, i) => (
                      <Badge key={i} variant="outline" className="text-xs font-normal">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider mb-1.5">
                  Question Format Breakdown
                </h4>
                <div className="space-y-1.5 text-xs">
                  {activeBlueprint.questions.map((q, idx) => (
                    <div
                      key={q.questionId}
                      className="flex items-center justify-between p-2 rounded bg-card border border-border/60"
                    >
                      <span className="text-muted-foreground">
                        Question {idx + 1}: <strong className="text-foreground">{q.topic}</strong>
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] font-mono capitalize">
                          {q.type.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">{q.points} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {activeBlueprint.explanationAndRemediation && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
                  <strong className="text-foreground block mb-1">Remediation & Review Hint:</strong>
                  {activeBlueprint.explanationAndRemediation}
                </div>
              )}

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setActiveBlueprint(null)}>
                  Close
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    const id = activeBlueprint.assessmentId;
                    setActiveBlueprint(null);
                    onStartAssessment(id);
                  }}
                >
                  Start Assessment Now <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default AssessmentCatalogView;

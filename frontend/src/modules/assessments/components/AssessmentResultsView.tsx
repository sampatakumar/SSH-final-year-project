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
import { Progress } from "@/components/ui/progress";
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FolderGit2,
  BookOpen,
} from "lucide-react";
import {
  AssessmentAttempt,
  BranchAssessment,
} from "../types/assessmentCenter.types";

interface AssessmentResultsViewProps {
  attempt: AssessmentAttempt;
  assessment?: BranchAssessment | null;
  onRetry: () => void;
  onBackToCatalog: () => void;
  onNavigateToProjects?: () => void;
}

export const AssessmentResultsView: React.FC<AssessmentResultsViewProps> = ({
  attempt,
  assessment,
  onRetry,
  onBackToCatalog,
  onNavigateToProjects,
}) => {
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  const isPassing = attempt.isPassing ?? (attempt.percentage ?? 0) >= 70;
  const percentage = attempt.percentage ?? 0;
  const score = attempt.score ?? 0;
  const maxScore = attempt.maxScore ?? 100;
  const questionResults = attempt.questionResults || [];
  const topicPerformance = attempt.topicPerformance || [];
  const strengths = attempt.strengths || [];
  const areasForImprovement = attempt.areasForImprovement || [];
  const recommendedNextSteps = attempt.recommendedNextSteps || [];

  const toggleQuestionExpand = (qId: string) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6" data-testid="assessment-results-view">
      {/* Hero Score Banner */}
      <Card
        className={`border shadow-sm overflow-hidden ${
          isPassing
            ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10"
            : "border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/10"
        }`}
      >
        <div className="p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <Badge
                variant={isPassing ? "default" : "outline"}
                className={`text-xs uppercase font-semibold px-2.5 py-0.5 ${
                  isPassing
                    ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                    : "border-amber-500/50 text-amber-600 dark:text-amber-400"
                }`}
              >
                {isPassing ? "Passed Threshold (≥70%)" : "Retake Recommended (<70%)"}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">
                Attempt #{attempt._id ? attempt._id.slice(-6) : "1"}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {assessment?.title || attempt.assessmentId}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
              {isPassing
                ? "You have demonstrated passing foundational knowledge in this discipline assessment! Your verified score has been logged to your skill assessment history."
                : "Your score is below the 70% mastery threshold. Review the topic explanations and remediation guidance below before retaking this assessment."}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" /> Time Spent:{" "}
                <strong className="text-foreground">{formatSeconds(attempt.timeSpentSeconds || 0)}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-primary" /> Evaluation:{" "}
                <strong className="text-foreground">Deterministic Rubric Key</strong>
              </span>
            </div>
          </div>

          {/* Circular / Large Score Badge */}
          <div className="flex flex-col items-center justify-center shrink-0 p-5 rounded-2xl bg-card border border-border shadow-sm min-w-[140px] text-center">
            <span
              className={`text-4xl sm:text-5xl font-black tracking-tight ${
                isPassing ? "text-emerald-500" : "text-amber-500"
              }`}
            >
              {percentage}%
            </span>
            <span className="text-xs font-semibold text-muted-foreground mt-1">
              {score} / {maxScore} Points
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              Passing Mark: 70%
            </span>
          </div>
        </div>
      </Card>

      {/* Strengths & Improvement Areas Pill Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Demonstrated Strengths
            </CardTitle>
            <CardDescription className="text-xs">
              Topics where you scored ≥ 80% and demonstrated solid comprehension.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {strengths.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {strengths.map((str, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-xs py-1 px-2.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-medium"
                  >
                    {str}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No high-mastery topics identified yet. Focus on foundational review.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" /> Areas for Improvement
            </CardTitle>
            <CardDescription className="text-xs">
              Topics requiring conceptual review before attempting advanced projects.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {areasForImprovement.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {areasForImprovement.map((area, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-xs py-1 px-2.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-medium"
                  >
                    {area}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Excellent! All evaluated topics met or exceeded mastery criteria.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Topic-Level Performance Breakdown */}
      {topicPerformance.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              Topic-Level Mastery Analysis
            </CardTitle>
            <CardDescription className="text-xs">
              Granular performance across the specific engineering or conceptual dimensions tested.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topicPerformance.map((topicItem, idx) => (
              <div key={idx} className="space-y-1.5 p-3 rounded-lg bg-muted/30 border border-border/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{topicItem.topic}</span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 font-semibold ${
                        topicItem.masteryLevel === "Proficient"
                          ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                          : topicItem.masteryLevel === "Competent"
                          ? "border-primary text-primary"
                          : "border-amber-500 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {topicItem.masteryLevel}
                    </Badge>
                    <span className="font-mono text-muted-foreground">
                      {topicItem.score} / {topicItem.maxScore} pts ({topicItem.percentage}%)
                    </span>
                  </div>
                </div>
                <Progress value={topicItem.percentage} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Question-by-Question Detailed Review */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">
            Detailed Question Review & Explanations
          </CardTitle>
          <CardDescription className="text-xs">
            Inspect your submitted responses alongside correct answers, rationale, and remediation notes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {questionResults.map((qr, idx) => {
            const isExpanded = expandedQuestions[qr.questionId] ?? true;
            return (
              <div
                key={qr.questionId}
                className={`rounded-xl border transition-all overflow-hidden ${
                  qr.isCorrect
                    ? "border-emerald-500/20 bg-emerald-500/[0.02]"
                    : "border-amber-500/20 bg-amber-500/[0.02]"
                }`}
              >
                <div
                  className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-muted/40"
                  onClick={() => toggleQuestionExpand(qr.questionId)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {qr.isCorrect ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-amber-500 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-foreground line-clamp-1">
                      Q{idx + 1}: {qr.topic}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-mono font-semibold ${
                        qr.isCorrect ? "text-emerald-500" : "text-amber-500"
                      }`}
                    >
                      {qr.pointsEarned} / {qr.maxPoints} pts
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 pt-1 border-t border-border/40 space-y-3 text-xs">
                    <p className="text-foreground leading-relaxed font-medium">{qr.prompt}</p>

                    <div className="p-3 rounded-lg bg-card border border-border/60 space-y-1.5">
                      <div className="flex items-start gap-2">
                        <span className="text-muted-foreground min-w-[110px]">Your Answer:</span>
                        <span className="font-mono text-foreground font-semibold">
                          {Array.isArray(qr.submittedAnswer)
                            ? qr.submittedAnswer.join(", ").toUpperCase()
                            : String(qr.submittedAnswer ?? "No response").toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {qr.explanation && (
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
                        <strong className="text-primary block flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" /> Educational Explanation:
                        </strong>
                        <p className="text-muted-foreground leading-relaxed">{qr.explanation}</p>
                      </div>
                    )}

                    {qr.remediationGuidance && !qr.isCorrect && (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">
                        <strong className="block mb-0.5">Remediation Suggestion:</strong>
                        <span>{qr.remediationGuidance}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Suggested Next Steps & Cross-Module Action Bar */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> Recommended Next Steps
          </CardTitle>
          <CardDescription className="text-xs">
            Evidence-grounded recommendations based on your assessment results.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommendedNextSteps.map((step, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-border/80 bg-muted/20 flex flex-col justify-between space-y-2"
              >
                <div>
                  <h4 className="text-xs font-semibold text-foreground">{step.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {step.description}
                  </p>
                </div>
                {step.actionType === "start_project" && onNavigateToProjects && (
                  <Button
                    size="sm"
                    className="text-xs h-8 gap-1 self-start"
                    onClick={onNavigateToProjects}
                  >
                    <FolderGit2 className="h-3.5 w-3.5" /> Open Project Studio
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="border-t border-border/50 p-4 flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={onBackToCatalog} className="text-xs">
            Return to Assessment Catalog
          </Button>

          <Button size="sm" onClick={onRetry} className="text-xs gap-1.5 font-semibold">
            <RotateCcw className="h-3.5 w-3.5" /> Retake Assessment
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AssessmentResultsView;

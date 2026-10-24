import React, { useState } from "react";
import { PracticalLab, PracticalLabAttempt } from "../types/practicalLab.types";
import { practicalLabApi } from "../services/practicalLab.api";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Sparkles,
  BookOpen,
  ArrowRight,
  RotateCcw,
  ShieldAlert,
  Compass,
} from "lucide-react";
import { Link } from "react-router-dom";

interface LabWorkspaceProps {
  lab: PracticalLab;
  token?: string;
  onBack: () => void;
  onAttemptCompleted?: (attempt: PracticalLabAttempt) => void;
}

export const LabWorkspace: React.FC<LabWorkspaceProps> = ({
  lab,
  token,
  onBack,
  onAttemptCompleted,
}) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<PracticalLabAttempt | null>(null);
  const [startedAt] = useState<string>(new Date().toISOString());

  const handleInputChange = (taskId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [taskId]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate that at least one task answer is provided
    const answeredKeys = Object.keys(answers).filter(
      (k) => answers[k] !== undefined && answers[k] !== ""
    );
    if (answeredKeys.length === 0) {
      setSubmitError("Please enter answers for the practical tasks before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const submission = await practicalLabApi.submitLabAttempt(
        lab.labId,
        {
          submittedAnswers: answers,
          startedAt,
        },
        token
      );
      setResult(submission);
      if (onAttemptCompleted) {
        onAttemptCompleted(submission);
      }
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit lab attempt. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setResult(null);
    setSubmitError(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Practical Labs Catalog</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            {lab.disciplineCategory}
          </span>
          <span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {lab.estimatedMinutes} mins
          </span>
        </div>
      </div>

      {/* Lab Header */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{lab.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{lab.description}</p>

        {/* Skills & Objectives */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/60">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Target Competencies
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {lab.relevantSkills.map((skill, i) => (
                <span
                  key={i}
                  className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              Learning Objectives
            </h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
              {lab.learningObjectives.map((obj, i) => (
                <li key={i}>{obj}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Educational Disclaimer Banner */}
      {lab.disclaimer && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
          <div>
            <span className="font-semibold">Educational Model Notice: </span>
            {lab.disclaimer}
          </div>
        </div>
      )}

      {/* Scenario Parameters Box */}
      {lab.scenario && (
        <div className="rounded-xl border border-border bg-muted/40 p-5 space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
            <Compass className="h-4 w-4 text-primary" />
            Engineering Scenario & Given Data
          </h3>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {lab.scenario.context}
          </p>

          {lab.scenario.assumptions && (
            <div className="text-xs text-muted-foreground italic">
              <span className="font-medium text-foreground">Assumptions: </span>
              {lab.scenario.assumptions}
            </div>
          )}

          {lab.scenario.parameters && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/50">
              {Object.entries(lab.scenario.parameters).map(([key, val]) => (
                <div key={key} className="rounded-md bg-card p-2 border border-border/50">
                  <div className="text-[10px] uppercase font-mono text-muted-foreground truncate">
                    {key}
                  </div>
                  <div className="text-xs font-semibold text-foreground truncate">{String(val)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submission Result Banner */}
      {result && (
        <div
          className={`rounded-xl border p-6 shadow-sm transition-all ${
            result.isPassing
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-amber-500/30 bg-amber-500/5"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              {result.isPassing ? (
                <div className="rounded-full bg-emerald-500/20 p-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
              ) : (
                <div className="rounded-full bg-amber-500/20 p-2 text-amber-600 dark:text-amber-400">
                  <HelpCircle className="h-7 w-7" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {result.isPassing ? "Practical Competence Demonstrated!" : "Attempt Review & Remediation"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {typeof result.evaluationFeedback === "string"
                    ? result.evaluationFeedback
                    : result.evaluationFeedback?.summary || "Authoritative server-side evaluation complete."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-black text-foreground">
                  {result.percentage}%
                </div>
                <div className="text-[11px] font-medium text-muted-foreground">
                  {result.serverScore} / {result.maxScore} points
                </div>
              </div>
              <span
                className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                  result.isPassing
                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                    : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                }`}
              >
                {result.masteryLevel}
              </span>
            </div>
          </div>

          {/* Action Recommendations */}
          {result.nextActionRecommendations && result.nextActionRecommendations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-2">
                Personalized Next Steps
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.nextActionRecommendations.map((action, idx) => (
                  <Link
                    key={idx}
                    to={action.destination}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5 text-xs font-medium text-foreground hover:border-primary/50 hover:bg-muted/30 transition-colors"
                  >
                    <div>
                      <div className="font-semibold">{action.title}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1">
                        {action.description}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground ml-2" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retry Lab</span>
            </button>
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <span>Back to Catalog</span>
            </button>
          </div>
        </div>
      )}

      {/* Tasks Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {lab.tasks.map((task, index) => {
          const taskRes = result?.taskResults?.find((r) => r.taskId === task.taskId);

          return (
            <div
              key={task.taskId}
              className={`rounded-xl border bg-card p-5 shadow-sm transition-all ${
                taskRes
                  ? taskRes.isCorrect
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : "border-rose-500/40 bg-rose-500/5"
                  : "border-border"
              }`}
            >
              {/* Task Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Task {index + 1} • {task.points} pts
                  </span>
                </div>
                {taskRes && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                      taskRes.isCorrect
                        ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                        : "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                    }`}
                  >
                    {taskRes.isCorrect ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        Correct (+{taskRes.pointsEarned} pts)
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3" />
                        Needs Review (0 pts)
                      </>
                    )}
                  </span>
                )}
              </div>

              {/* Prompt */}
              <p className="text-sm font-medium text-foreground mb-4">{task.prompt}</p>

              {/* Task Input Section */}
              {task.type === "multiple_choice" && task.options ? (
                <div className="space-y-2">
                  {task.options.map((opt) => (
                    <label
                      key={opt.optionId}
                      className={`flex items-start gap-3 rounded-lg border p-3 text-xs cursor-pointer transition-colors ${
                        answers[task.taskId] === opt.optionId
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border bg-card hover:bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <input
                        type="radio"
                        name={task.taskId}
                        value={opt.optionId}
                        checked={answers[task.taskId] === opt.optionId}
                        onChange={(e) => handleInputChange(task.taskId, e.target.value)}
                        disabled={Boolean(result)}
                        className="mt-0.5 text-primary"
                      />
                      <div className="flex-1">
                        <span className="font-semibold text-foreground">{opt.label}</span>
                        {opt.description && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {opt.description}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 max-w-xs">
                    <input
                      type="number"
                      step="any"
                      placeholder={task.roundingDecimals ? `e.g. 0.${"0".repeat(task.roundingDecimals)}` : "Enter numeric value..."}
                      value={answers[task.taskId] !== undefined ? answers[task.taskId] : ""}
                      onChange={(e) => handleInputChange(task.taskId, e.target.value)}
                      disabled={Boolean(result)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-75"
                    />
                  </div>
                  {task.unit && (
                    <span className="rounded-md bg-muted px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">
                      {task.unit}
                    </span>
                  )}
                </div>
              )}

              {/* Solution & Explanation on Result */}
              {taskRes && (
                <div className="mt-4 rounded-lg bg-card/80 p-3.5 border border-border/60 text-xs space-y-1.5">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    <span>Solution & Engineering Rationale</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {taskRes.solutionExplanation || taskRes.explanation}
                  </p>
                  {taskRes.remediationGuidance && !taskRes.isCorrect && (
                    <p className="text-amber-700 dark:text-amber-400 font-medium">
                      💡 Tip: {taskRes.remediationGuidance}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {submitError && (
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
            {submitError}
          </div>
        )}

        {/* Submit Actions */}
        {!result && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  <span>Evaluating Answers...</span>
                </>
              ) : (
                <>
                  <span>Submit for Evaluation</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

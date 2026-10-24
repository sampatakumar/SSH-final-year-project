import React, { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Send,
  XCircle,
} from "lucide-react";
import {
  BranchAssessment,
  AssessmentQuestion,
} from "../types/assessmentCenter.types";

interface ActiveAssessmentWorkspaceProps {
  assessment: BranchAssessment;
  attemptId: string;
  startedAt?: string;
  submitting?: boolean;
  onSubmitAttempt: (answers: Record<string, any>, timeSpentSeconds: number) => void;
  onCancel: () => void;
}

export const ActiveAssessmentWorkspace: React.FC<ActiveAssessmentWorkspaceProps> = ({
  assessment,
  attemptId,
  startedAt,
  submitting = false,
  onSubmitAttempt,
  onCancel,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const questions = assessment.questions || [];
  const currentQuestion: AssessmentQuestion | undefined = questions[currentIndex];

  // Live timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const isQuestionAnswered = (qId: string) => {
    const val = answers[qId];
    if (val === undefined || val === null || val === "") return false;
    if (Array.isArray(val)) return val.length > 0;
    return true;
  };

  const answeredCount = questions.filter((q) => isQuestionAnswered(q.questionId)).length;
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  // Single choice answer handler
  const handleSingleSelect = (qId: string, optId: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: optId }));
  };

  // Multiple select answer handler
  const handleMultiToggle = (qId: string, optId: string) => {
    const currentList: string[] = Array.isArray(answers[qId]) ? answers[qId] : [];
    if (currentList.includes(optId)) {
      setAnswers((prev) => ({
        ...prev,
        [qId]: currentList.filter((item) => item !== optId),
      }));
    } else {
      setAnswers((prev) => ({
        ...prev,
        [qId]: [...currentList, optId],
      }));
    }
  };

  // Numeric answer handler
  const handleNumericChange = (qId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  // Case study response handler
  const handleTextChange = (qId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: text }));
  };

  // Clear answer for current question
  const handleClearCurrent = () => {
    if (!currentQuestion) return;
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQuestion.questionId];
      return copy;
    });
  };

  const handleConfirmSubmit = () => {
    setShowConfirmModal(false);
    onSubmitAttempt(answers, elapsedSeconds);
  };

  if (!currentQuestion) {
    return (
      <div className="p-8 text-center" data-testid="active-assessment-workspace">
        <p className="text-muted-foreground text-sm">No questions found in this assessment.</p>
        <Button variant="outline" size="sm" onClick={onCancel} className="mt-4">
          Return to Catalog
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="active-assessment-workspace">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs uppercase">
              {assessment.disciplineCategory}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              Attempt: #{attemptId.slice(-6)}
            </span>
          </div>
          <h2 className="text-lg font-bold text-foreground line-clamp-1">{assessment.title}</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 border border-border text-xs font-mono">
            <Clock className="h-4 w-4 text-primary" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground">
            Exit
          </Button>
        </div>
      </div>

      {/* Progress & Question Stepper Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Question <strong className="text-foreground">{currentIndex + 1}</strong> of{" "}
            <strong className="text-foreground">{questions.length}</strong>
          </span>
          <span>
            Answered: <strong>{answeredCount}</strong> / {questions.length} ({progressPercent}%)
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />

        {/* Question Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {questions.map((q, idx) => {
            const answered = isQuestionAnswered(q.questionId);
            const isCurrent = idx === currentIndex;
            return (
              <Button
                key={q.questionId}
                variant={isCurrent ? "default" : answered ? "secondary" : "outline"}
                size="sm"
                data-testid={`question-step-${idx}`}
                className={`h-8 w-8 p-0 text-xs font-semibold rounded-lg shrink-0 transition-all ${
                  isCurrent
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : answered
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "text-muted-foreground"
                }`}
                onClick={() => setCurrentIndex(idx)}
              >
                {idx + 1}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Active Question Card */}
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-4 border-b border-border/50">
          <div className="flex items-center justify-between gap-2 mb-2">
            <Badge variant="secondary" className="text-xs font-normal">
              Topic: {currentQuestion.topic}
            </Badge>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground capitalize">
                {currentQuestion.type.replace(/_/g, " ")}
              </span>
              <Badge variant="outline" className="text-xs font-semibold text-primary">
                {currentQuestion.points} Points
              </Badge>
            </div>
          </div>

          <CardTitle className="text-base font-medium leading-relaxed text-foreground">
            {currentQuestion.prompt}
          </CardTitle>

          {currentQuestion.caseStudyContext && (
            <div className="mt-3 p-3 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground block mb-1">Scenario Context:</strong>
              {currentQuestion.caseStudyContext}
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-6 space-y-4">
          {/* 1. Single Choice Options */}
          {currentQuestion.type === "single_choice" && (
            <div className="space-y-2.5" role="radiogroup" aria-label={currentQuestion.prompt}>
              {(currentQuestion.options || []).map((opt) => {
                const selected = answers[currentQuestion.questionId] === opt.optionId;
                return (
                  <div
                    key={opt.optionId}
                    role="radio"
                    aria-checked={selected}
                    tabIndex={0}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selected
                        ? "border-primary bg-primary/5 text-foreground shadow-sm"
                        : "border-border hover:border-border/80 hover:bg-muted/30 text-muted-foreground"
                    }`}
                    onClick={() => handleSingleSelect(currentQuestion.questionId, opt.optionId)}
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Enter") {
                        handleSingleSelect(currentQuestion.questionId, opt.optionId);
                      }
                    }}
                  >
                    <div
                      className={`h-4 w-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center transition-colors ${
                        selected ? "border-primary bg-primary" : "border-muted-foreground/60"
                      }`}
                    >
                      {selected && <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                    </div>
                    <span className="text-sm leading-snug">{opt.text}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. Multiple Select Options */}
          {currentQuestion.type === "multiple_select" && (
            <div className="space-y-3">
              <div className="text-xs text-primary font-medium flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5" /> Select all that apply. Partial credit awarded.
              </div>
              <div className="space-y-2.5">
                {(currentQuestion.options || []).map((opt) => {
                  const selectedList = answers[currentQuestion.questionId] || [];
                  const selected = selectedList.includes(opt.optionId);
                  return (
                    <div
                      key={opt.optionId}
                      role="checkbox"
                      aria-checked={selected}
                      tabIndex={0}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selected
                          ? "border-primary bg-primary/5 text-foreground shadow-sm"
                          : "border-border hover:border-border/80 hover:bg-muted/30 text-muted-foreground"
                      }`}
                      onClick={() => handleMultiToggle(currentQuestion.questionId, opt.optionId)}
                      onKeyDown={(e) => {
                        if (e.key === " " || e.key === "Enter") {
                          handleMultiToggle(currentQuestion.questionId, opt.optionId);
                        }
                      }}
                    >
                      <div
                        className={`h-4 w-4 rounded border mt-0.5 shrink-0 flex items-center justify-center transition-colors ${
                          selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/60"
                        }`}
                      >
                        {selected && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </div>
                      <span className="text-sm leading-snug">{opt.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Numeric Input */}
          {currentQuestion.type === "numeric" && (
            <div className="space-y-3 max-w-md">
              <div className="text-xs text-muted-foreground">
                Enter your numerical result. Calculation tolerance: ±{currentQuestion.tolerance || 0}{" "}
                {currentQuestion.unit || ""}.
              </div>
              <div className="relative">
                <Input
                  type="number"
                  step="any"
                  placeholder="Enter numeric value..."
                  value={answers[currentQuestion.questionId] ?? ""}
                  onChange={(e) => handleNumericChange(currentQuestion.questionId, e.target.value)}
                  className="pr-16 text-base font-mono"
                />
                {currentQuestion.unit && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {currentQuestion.unit}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 4. Case Study Short Response */}
          {currentQuestion.type === "case_study_response" && (
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground block">
                Provide your structured written reasoning addressing all criteria above:
              </span>
              <Textarea
                rows={5}
                placeholder="Type your structured engineering or business response here..."
                value={answers[currentQuestion.questionId] || ""}
                onChange={(e) => handleTextChange(currentQuestion.questionId, e.target.value)}
                className="text-sm leading-relaxed"
              />
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t border-border/50 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={!isQuestionAnswered(currentQuestion.questionId)}
              onClick={handleClearCurrent}
              className="text-xs text-muted-foreground gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Clear
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => prev - 1)}
              className="text-xs gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </Button>

            {currentIndex < questions.length - 1 ? (
              <Button
                size="sm"
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="text-xs gap-1"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="default"
                disabled={submitting}
                onClick={() => setShowConfirmModal(true)}
                className="text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
              >
                <Send className="h-3.5 w-3.5" /> Submit Assessment
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Confirm Assessment Submission
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              You are about to submit your responses for server-side evaluation and scoring.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Questions:</span>
                <span className="font-semibold text-foreground">{questions.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Answered:</span>
                <span className="font-semibold text-success">{answeredCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Unanswered:</span>
                <span className={`font-semibold ${questions.length - answeredCount > 0 ? "text-amber-500" : "text-muted-foreground"}`}>
                  {questions.length - answeredCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Time Spent:</span>
                <span className="font-mono text-foreground">{formatTimer(elapsedSeconds)}</span>
              </div>
            </div>

            {questions.length - answeredCount > 0 && (
              <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  You have {questions.length - answeredCount} unanswered question(s). Unanswered questions receive 0 points.
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setShowConfirmModal(false)}>
              Keep Working
            </Button>
            <Button
              size="sm"
              disabled={submitting}
              onClick={handleConfirmSubmit}
              className="gap-1.5 font-semibold"
            >
              {submitting ? "Evaluating..." : "Confirm & Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActiveAssessmentWorkspace;

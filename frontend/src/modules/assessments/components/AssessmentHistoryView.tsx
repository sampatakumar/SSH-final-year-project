import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Eye,
  Calendar,
  FileQuestion,
  TrendingUp,
} from "lucide-react";
import { AssessmentAttempt } from "../types/assessmentCenter.types";

interface AssessmentHistoryViewProps {
  attempts: AssessmentAttempt[];
  loading?: boolean;
  onSelectAttempt: (attemptId: string) => void;
  onStartAssessment: (assessmentId: string) => void;
  onExploreCatalog: () => void;
}

export const AssessmentHistoryView: React.FC<AssessmentHistoryViewProps> = ({
  attempts,
  loading = false,
  onSelectAttempt,
  onStartAssessment,
  onExploreCatalog,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <Clock className="w-8 h-8 animate-spin text-indigo-400 mb-3" />
        <p className="text-sm">Loading your assessment history...</p>
      </div>
    );
  }

  if (!attempts || attempts.length === 0) {
    return (
      <Card className="bg-slate-900/60 border-slate-800 text-slate-100 p-8 text-center" data-testid="empty-history-state">
        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
            <FileQuestion className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Assessment History Found</h3>
          <p className="text-sm text-slate-400 mb-6">
            You haven't completed any discipline assessments yet. Evaluate your knowledge, pinpoint topic-level strengths, and earn verified skill evidence.
          </p>
          <Button
            onClick={onExploreCatalog}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"
            data-testid="explore-catalog-btn"
          >
            Explore Assessment Catalog
          </Button>
        </div>
      </Card>
    );
  }

  const completedAttempts = attempts.filter((a) => a.status === "submitted");
  const passedAttempts = completedAttempts.filter((a) => a.isPassing);
  const passRate =
    completedAttempts.length > 0
      ? Math.round((passedAttempts.length / completedAttempts.length) * 100)
      : 0;
  const avgScore =
    completedAttempts.length > 0
      ? Math.round(
          completedAttempts.reduce((acc, a) => acc + (a.percentage || 0), 0) /
            completedAttempts.length
        )
      : 0;

  return (
    <div className="space-y-6" data-testid="assessment-history-view">
      {/* Top Aggregates Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900/60 border-slate-800/80 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-medium">Total Attempts</p>
              <p className="text-2xl font-bold text-slate-100">{attempts.length}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800/80 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-medium">Pass Rate</p>
              <p className="text-2xl font-bold text-slate-100">{passRate}%</p>
            </div>
          </div>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800/80 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-medium">Average Score</p>
              <p className="text-2xl font-bold text-slate-100">{avgScore}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Attempts List */}
      <Card className="bg-slate-900/60 border-slate-800/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-200">Attempt Records</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Immutable log of your branch evaluations, question diagnostics, and topic performance.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-800">
            {attempts.map((attempt) => {
              const formattedDate = attempt.submittedAt || attempt.startedAt
                ? new Date(attempt.submittedAt || attempt.startedAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Recent";

              const durationMins = Math.round((attempt.timeSpentSeconds || 0) / 60);

              return (
                <div
                  key={attempt._id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors"
                  data-testid={`attempt-row-${attempt._id}`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-100 text-sm truncate">
                        {attempt.assessmentId}
                      </span>
                      <Badge variant="outline" className="text-xs font-mono border-slate-700 text-slate-400">
                        v{attempt.version || 1}
                      </Badge>
                      {attempt.status === "submitted" ? (
                        attempt.isPassing ? (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Passed
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">
                            <XCircle className="w-3 h-3 mr-1" />
                            Needs Improvement
                          </Badge>
                        )
                      ) : (
                        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
                          In Progress
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {formattedDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {durationMins > 0 ? `${durationMins} mins` : "< 1 min"}
                      </span>
                      {attempt.scoringMethod && (
                        <span className="text-slate-500">
                          Scoring: {attempt.scoringMethod}
                        </span>
                      )}
                    </div>

                    {attempt.topicPerformance && attempt.topicPerformance.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {attempt.topicPerformance.map((topic, idx) => (
                          <span
                            key={idx}
                            className={`text-[10px] px-2 py-0.5 rounded-full border ${
                              topic.masteryLevel === "Proficient"
                                ? "bg-emerald-950/30 text-emerald-300 border-emerald-800/40"
                                : topic.masteryLevel === "Competent"
                                ? "bg-blue-950/30 text-blue-300 border-blue-800/40"
                                : "bg-amber-950/30 text-amber-300 border-amber-800/40"
                            }`}
                          >
                            {topic.topic}: {topic.percentage}%
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Score & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800/60">
                    {attempt.status === "submitted" && (
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-100">
                          {attempt.score ?? 0}{" "}
                          <span className="text-xs text-slate-400 font-normal">
                            / {attempt.maxScore ?? 100}
                          </span>
                        </div>
                        <div
                          className={`text-xs font-semibold ${
                            attempt.isPassing ? "text-emerald-400" : "text-amber-400"
                          }`}
                        >
                          {attempt.percentage ?? 0}%
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {attempt.status === "submitted" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSelectAttempt(attempt._id)}
                          className="border-slate-700 hover:bg-slate-800 text-slate-200 text-xs flex items-center gap-1.5"
                          data-testid={`review-btn-${attempt._id}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onStartAssessment(attempt.assessmentId)}
                        className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs flex items-center gap-1.5"
                        data-testid={`retake-btn-${attempt.assessmentId}`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Retake
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssessmentHistoryView;

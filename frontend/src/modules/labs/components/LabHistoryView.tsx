import React from "react";
import { PracticalLabAttempt } from "../types/practicalLab.types";
import { CheckCircle2, XCircle, Clock, Calendar, ArrowRight, Award } from "lucide-react";

interface LabHistoryViewProps {
  attempts: PracticalLabAttempt[];
  onSelectAttempt?: (attempt: PracticalLabAttempt) => void;
  onExploreLabs: () => void;
}

export const LabHistoryView: React.FC<LabHistoryViewProps> = ({
  attempts,
  onSelectAttempt,
  onExploreLabs,
}) => {
  if (attempts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 text-center">
        <Award className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
        <h3 className="text-base font-semibold text-foreground">No Practical Lab Attempts Yet</h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
          You haven't completed any discipline practical labs yet. Launch an interactive exercise to practice calculations and earn verified skill proof.
        </p>
        <button
          onClick={onExploreLabs}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <span>Explore Available Labs</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {attempts.map((attempt) => {
        const isPass = attempt.isPassing || attempt.percentage >= 70;
        const formattedDate = attempt.submittedAt
          ? new Date(attempt.submittedAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Recently";

        return (
          <div
            key={attempt._id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={`rounded-full p-2 ${
                  isPass
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}
              >
                {isPass ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">{attempt.title}</h4>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="font-medium text-foreground">{attempt.disciplineCategory}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formattedDate}
                  </span>
                  {attempt.durationMinutes ? (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {attempt.durationMinutes}m
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-base font-bold text-foreground">{attempt.percentage}%</div>
                <div className="text-[11px] font-medium text-muted-foreground">
                  {attempt.serverScore} / {attempt.maxScore} pts
                </div>
              </div>
              <span
                className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                  isPass
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                }`}
              >
                {attempt.masteryLevel || (isPass ? "Proficient" : "Remediate")}
              </span>

              {onSelectAttempt && (
                <button
                  onClick={() => onSelectAttempt(attempt)}
                  className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="View Attempt Details"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

import React, { useState } from "react";
import {
  Compass,
  ChevronDown,
  ChevronUp,
  Code2,
  Terminal,
  FolderGit2,
  HelpCircle,
  Flag,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { LearningPackageData } from "../types/smartMentor.types";

interface LearningPackageViewProps {
  learningPackage: LearningPackageData;
}

export const LearningPackageView: React.FC<LearningPackageViewProps> = ({ learningPackage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openModuleIndex, setOpenModuleIndex] = useState<number | null>(0);

  if (!learningPackage) return null;

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-left space-y-3 transition-all duration-200">
      {/* Header and Toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xs">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <span>{learningPackage.title}</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border/40">
                Role: {learningPackage.targetRole}
              </span>
            </h4>
            <p className="text-[11px] text-muted-foreground font-medium">
              10-point end-to-end roadmap connecting verified courses, coding sandbox, and projects
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsOpen((prev) => !prev)}
          className="h-8 text-xs font-bold gap-1 rounded-xl border-primary/30 hover:bg-primary/10 text-primary"
        >
          <span>{isOpen ? "Hide Package" : "View 10-Point Roadmap"}</span>
          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {/* Prerequisites Preview */}
      {learningPackage.prerequisites && learningPackage.prerequisites.length > 0 && (
        <div className="text-xs flex items-center gap-1.5 flex-wrap pt-1 text-muted-foreground">
          <span className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
            Prerequisites:
          </span>
          {learningPackage.prerequisites.map((p, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md bg-background/80 border border-border/30 text-[10px] font-medium text-foreground"
            >
              {p}
            </span>
          ))}
        </div>
      )}

      {/* Expanded Roadmap Drawer */}
      {isOpen && (
        <div className="pt-3 border-t border-border/30 space-y-4 animate-in fade-in-50 duration-200">
          {/* 1. Ordered Modules */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase text-primary tracking-wider block">
              1. Ordered Learning Modules ({learningPackage.modules.length} Phases)
            </span>
            <div className="space-y-2">
              {learningPackage.modules.map((mod, idx) => {
                const isModOpen = openModuleIndex === idx;
                return (
                  <div
                    key={mod.order}
                    className={`rounded-xl border transition-colors ${
                      isModOpen ? "bg-background border-border/60" : "bg-background/50 border-border/30"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenModuleIndex(isModOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-3 text-left text-xs font-bold text-foreground"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] flex items-center justify-center font-black">
                          {mod.order}
                        </span>
                        <span>{mod.title}</span>
                        {mod.isSkippedBasedOnProfile && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Already Mastered in Profile
                          </span>
                        )}
                      </div>
                      {isModOpen ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                    </button>

                    {isModOpen && (
                      <div className="px-3 pb-3 pt-1 border-t border-border/20 text-xs space-y-2.5">
                        {/* Core Concepts */}
                        <div>
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                            Key Concepts:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {mod.coreConcepts.map((c, cIdx) => (
                              <span
                                key={cIdx}
                                className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted/60 text-foreground"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Hands-on Exercises */}
                        <div>
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                            Hands-on Exercises:
                          </span>
                          <ul className="list-disc list-inside text-[11px] text-muted-foreground space-y-0.5 mt-1 font-medium">
                            {mod.handsOnExercises.map((ex, eIdx) => (
                              <li key={eIdx}>{ex}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Milestone */}
                        <div className="flex items-center gap-1.5 text-[11px] text-primary font-semibold pt-1">
                          <Flag className="h-3 w-3 shrink-0" />
                          <span>Milestone: {mod.milestone}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Capstone & Mini Projects */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase text-primary tracking-wider block">
              2. Practical Portfolio & Capstone Projects
            </span>
            <div className="p-3 rounded-xl bg-background border border-primary/20 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <FolderGit2 className="h-4 w-4 text-primary" />
                <span>Capstone: {learningPackage.projects.capstoneProject?.title}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                {learningPackage.projects.capstoneProject?.description}
              </p>
              {learningPackage.projects.capstoneProject?.architectureTip && (
                <div className="p-2 rounded-lg bg-primary/10 text-primary text-[11px] font-medium border border-primary/20">
                  <strong>Architecture Tip: </strong>
                  {learningPackage.projects.capstoneProject.architectureTip}
                </div>
              )}
            </div>
          </div>

          {/* 3. Coding Sandbox Challenges */}
          {learningPackage.codingChallenges && learningPackage.codingChallenges.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase text-primary tracking-wider block">
                3. Sandbox Practice Challenges
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {learningPackage.codingChallenges.map((ch, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-background border border-border/30 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-foreground block">{ch.title}</span>
                      <span className="text-[10px] text-muted-foreground">{ch.category}</span>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold rounded-lg gap-1" asChild>
                      <Link to="/dashboard/coding">
                        <Terminal className="h-3 w-3" />
                        Solve
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Placement Revision Questions */}
          {learningPackage.revisionInterview?.keyQuestions && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase text-primary tracking-wider block">
                4. Placement & Interview Revision Checklist
              </span>
              <ul className="space-y-1 text-xs text-muted-foreground font-medium">
                {learningPackage.revisionInterview.keyQuestions.map((q, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <HelpCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 5. Next Steps */}
          <div className="pt-2 border-t border-border/20 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {learningPackage.nextSteps.map((st, idx) => (
                <Button key={idx} size="sm" variant="outline" className="h-7 text-[10px] font-bold gap-1 rounded-lg" asChild>
                  <Link to={st.route}>
                    {st.step}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          {/* Mastery Warning */}
          <div className="p-2.5 rounded-xl bg-muted/60 border border-border/30 text-[11px] text-muted-foreground flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Mastery Notice: </strong>
              {learningPackage.masteryNote}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

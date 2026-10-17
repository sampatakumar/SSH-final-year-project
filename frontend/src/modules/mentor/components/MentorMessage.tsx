import React, { useState } from "react";
import { User, Sparkles, Cpu, Copy, Check, CheckCircle2, Terminal } from "lucide-react";
import { toast } from "sonner";
import { MentorActionCard } from "./MentorActionCard";
import { CourseRecommendationCard } from "./CourseRecommendationCard";
import { CourseComparisonView } from "./CourseComparisonView";
import { LearningPackageView } from "./LearningPackageView";
import type { MentorMessageItem } from "../types/smartMentor.types";

interface MentorMessageProps {
  message: MentorMessageItem;
}

export const MentorMessage: React.FC<MentorMessageProps> = ({ message }) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("Advice copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySnippet = (snippet: string, id: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedCodeId(id);
    toast.success("Code snippet copied!");
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const formatInline = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, "<strong class='font-bold text-foreground'>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em class='italic text-foreground/80'>$1</em>")
      .replace(/`([^`]+)`/g, "<code class='px-1.5 py-0.5 rounded bg-muted/80 text-primary font-mono text-[11px] font-semibold border border-border/40'>$1</code>");
  };

  // Structured Markdown Parser (Tables, Code blocks, Headers, Lists)
  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");
    const blocks: React.ReactNode[] = [];
    let i = 0;
    let blockKey = 0;

    while (i < lines.length) {
      const line = lines[i];

      // 1. Code Block: ```lang ... ```
      if (line.trim().startsWith("```")) {
        const lang = line.trim().slice(3).trim() || "code";
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing ```
        const fullCode = codeLines.join("\n");
        const codeId = `mentor-code-${blockKey++}`;

        blocks.push(
          <div key={codeId} className="my-2.5 rounded-xl border border-border/60 bg-slate-950/90 overflow-hidden text-xs shadow-xs">
            <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-b border-border/40 text-[10px] text-muted-foreground">
              <span className="font-mono font-semibold uppercase flex items-center gap-1.5 text-foreground/80">
                <Terminal className="h-3 w-3 text-primary" /> {lang}
              </span>
              <button
                type="button"
                onClick={() => handleCopySnippet(fullCode, codeId)}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-muted/60 text-foreground hover:bg-muted transition-colors text-[10px]"
              >
                {copiedCodeId === codeId ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copiedCodeId === codeId ? "Copied" : "Copy Code"}</span>
              </button>
            </div>
            <pre className="p-3 font-mono text-[11px] leading-relaxed text-slate-100 overflow-x-auto custom-scrollbar">
              {fullCode}
            </pre>
          </div>
        );
        continue;
      }

      // 2. Markdown Table
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
          tableLines.push(lines[i].trim());
          i++;
        }

        if (tableLines.length >= 2) {
          const headerCells = tableLines[0]
            .split("|")
            .map((c) => c.trim())
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

          const bodyRows = tableLines.slice(2).map((rowLine) =>
            rowLine
              .split("|")
              .map((c) => c.trim())
              .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
          );

          const tableId = `tbl-${blockKey++}`;

          blocks.push(
            <div key={tableId} className="my-3 overflow-x-auto rounded-xl border border-border/60 bg-surface/80 custom-scrollbar shadow-xs">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/50 text-[11px] font-bold text-foreground">
                    {headerCells.map((h, hIdx) => (
                      <th key={hIdx} className="px-3 py-2 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-[11px] text-foreground/90">
                  {bodyRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-muted/30 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="px-3 py-2 align-top"
                          dangerouslySetInnerHTML={{ __html: formatInline(cell) }}
                        />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // 3. Headers
      if (line.startsWith("#### ")) {
        blocks.push(
          <h4 key={blockKey++} className="text-xs font-black text-foreground mt-3 mb-1 uppercase tracking-wider">
            {line.replace("#### ", "")}
          </h4>
        );
        i++;
        continue;
      }
      if (line.startsWith("### ")) {
        blocks.push(
          <h3 key={blockKey++} className="text-sm font-bold text-foreground mt-3 mb-1.5 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
            {line.replace("### ", "")}
          </h3>
        );
        i++;
        continue;
      }

      // 4. Bullet Items
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const bulletText = line.trim().replace(/^[-*]\s+/, "");
        blocks.push(
          <li key={blockKey++} className="text-xs text-foreground/90 leading-relaxed ml-4 list-disc my-0.5">
            <span dangerouslySetInnerHTML={{ __html: formatInline(bulletText) }} />
          </li>
        );
        i++;
        continue;
      }

      // 5. Numbered Items
      if (/^\d+\.\s+/.test(line.trim())) {
        const itemText = line.trim().replace(/^\d+\.\s+/, "");
        blocks.push(
          <li key={blockKey++} className="text-xs text-foreground/90 leading-relaxed ml-4 list-decimal my-0.5">
            <span dangerouslySetInnerHTML={{ __html: formatInline(itemText) }} />
          </li>
        );
        i++;
        continue;
      }

      // 6. Empty Line
      if (!line.trim()) {
        blocks.push(<div key={blockKey++} className="h-1.5" />);
        i++;
        continue;
      }

      // 7. Regular Paragraph
      blocks.push(
        <p
          key={blockKey++}
          className="text-xs text-foreground/90 leading-relaxed my-1"
          dangerouslySetInnerHTML={{ __html: formatInline(line) }}
        />
      );
      i++;
    }

    return blocks;
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-2xl animate-in fade-in duration-200 transition-all ${
        isUser
          ? "bg-primary/5 border border-primary/20 ml-auto max-w-2xl shadow-neo-raised-sm"
          : "bg-surface/90 border border-border/40 max-w-3xl shadow-neo-raised-sm"
      }`}
    >
      <div
        className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border ${
          isUser
            ? "bg-primary/20 text-primary border-primary/30"
            : "bg-surface border-border/50 text-foreground"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4 text-primary" />}
      </div>

      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-foreground">
              {isUser ? "You" : "Smart Mentor"}
            </span>

            {!isUser && message.source && (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 border ${
                  message.source === "groq"
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}
              >
                {message.source === "groq" ? (
                  <>
                    <Sparkles className="h-2.5 w-2.5" />
                    GPT-OSS-120B
                  </>
                ) : (
                  <>
                    <Cpu className="h-2.5 w-2.5" />
                    Local Engine
                  </>
                )}
              </span>
            )}
          </div>

          {!isUser && (
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Copy advice"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>

        {/* Message Content */}
        <div className="space-y-1">{renderFormattedContent(message.content)}</div>

        {/* Verified Course Recommendations & 10-Point Learning Package */}
        {!isUser && message.courseRecommendations && (
          <div className="pt-3 mt-3 border-t border-border/30 space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] font-black text-foreground uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>
                Verified Courses & Playlists ({message.courseRecommendations.intent?.technologyName || "Learning"})
              </span>
            </div>

            {/* Course Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {message.courseRecommendations.shortlist?.map((c) => (
                <CourseRecommendationCard
                  key={c.id}
                  course={c}
                  isStartingPick={
                    c.id === message.courseRecommendations?.recommendedStartingCourseId
                  }
                />
              ))}
            </div>

            {/* Course Comparison & Trade-Offs View */}
            {message.courseRecommendations.comparison && (
              <CourseComparisonView comparison={message.courseRecommendations.comparison} />
            )}

            {/* 10-Point Structured Learning Package */}
            {(message.learningPackage || message.courseRecommendations.learningPackage) && (
              <LearningPackageView
                learningPackage={
                  (message.learningPackage || message.courseRecommendations.learningPackage)!
                }
              />
            )}
          </div>
        )}

        {/* Action Items Recommendation Panel */}
        {!isUser && message.actions && message.actions.length > 0 && (
          <div className="pt-3 mt-3 border-t border-border/30 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-black text-foreground uppercase tracking-wider">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <span>Recommended Next Actions</span>
            </div>
            <div className="space-y-2">
              {message.actions.map((act, aIdx) => (
                <MentorActionCard key={aIdx} action={act} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorMessage;

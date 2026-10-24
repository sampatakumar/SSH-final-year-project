import React, { useState } from "react";
import {
  FileText,
  Edit3,
  Eye,
  Copy,
  Check,
  Download,
  Bookmark,
  BookmarkCheck,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  BookOpen,
  ExternalLink,
  Save,
  CheckCircle2,
} from "lucide-react";
import { EngineeringReportDraft } from "../types/tools.types";
import { toolsApi } from "../services/tools.api";

interface SharedEngineeringReportBuilderProps {
  reportDraft: EngineeringReportDraft;
  activityRecordId?: string | null;
  onUpdateDraft?: (updated: EngineeringReportDraft) => void;
  onSaveToPortfolio?: () => void;
  isSavedToPortfolio?: boolean;
}

export const SharedEngineeringReportBuilder: React.FC<SharedEngineeringReportBuilderProps> = ({
  reportDraft,
  activityRecordId,
  onUpdateDraft,
  onSaveToPortfolio,
  isSavedToPortfolio = false,
}) => {
  const [activeTab, setActiveTab] = useState<"view" | "edit">("view");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Editable form state
  const [editableTitle, setEditableTitle] = useState(reportDraft.title || "");
  const [editableObjective, setEditableObjective] = useState(reportDraft.objective || "");
  const [editableDiscussion, setEditableDiscussion] = useState(reportDraft.engineeringDiscussion || "");
  const [editableNotes, setEditableNotes] = useState(reportDraft.studentNotes || "");

  const handleCopyMarkdown = () => {
    const mdLines = [
      `# ${editableTitle}`,
      `**Discipline:** ${reportDraft.discipline} | **Tool:** ${reportDraft.toolDisplayName}`,
      `**Generated:** ${reportDraft.generatedAt} | **Author:** ${reportDraft.authorName}`,
      `**Verification Status:** ${reportDraft.verificationStatus}`,
      ``,
      `## 1. Problem Statement & Objective`,
      editableObjective,
      ``,
      `## 2. Theoretical Governing Formulas`,
      `\`\`\``,
      reportDraft.governingEquations,
      `\`\`\``,
      ``,
      `## 3. Supplied Operating Inputs`,
      ...Object.entries(reportDraft.suppliedInputs || {}).map(([k, v]) => `- **${k}:** ${v}`),
      ``,
      `## 4. Authoritative Computed Results`,
      ...Object.entries(reportDraft.numericalResults || {}).map(([k, v]) => `- **${k}:** ${v}`),
      ``,
      `## 5. Engineering Discussion & Interpretation`,
      editableDiscussion,
      ``,
      `## 6. Assumptions & Idealizations`,
      ...reportDraft.assumptions.map((a) => `- ${a}`),
      ``,
      `## 7. Limitations & Caveats`,
      ...reportDraft.limitations.map((l) => `- ${l}`),
      ``,
      `## 8. Missing Inputs Checklist`,
      ...reportDraft.missingInputsChecklist.map((m) => `- [${m.importance}] **${m.item}:** ${m.explanation}`),
      ``,
      editableNotes ? `## 9. Student Notes & Next Steps\n${editableNotes}\n` : "",
      `---`,
      `*Notice:* ${reportDraft.safetyNotice}`,
    ];

    navigator.clipboard.writeText(mdLines.filter(Boolean).join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const fullPayload = {
      ...reportDraft,
      title: editableTitle,
      objective: editableObjective,
      engineeringDiscussion: editableDiscussion,
      studentNotes: editableNotes,
    };
    const blob = new Blob([JSON.stringify(fullPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportDraft.toolId}_engineering_report_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveDraft = async () => {
    const updated: EngineeringReportDraft = {
      ...reportDraft,
      title: editableTitle,
      objective: editableObjective,
      engineeringDiscussion: editableDiscussion,
      studentNotes: editableNotes,
      lastEditedAt: new Date().toISOString(),
    };

    if (activityRecordId) {
      setSaving(true);
      try {
        await toolsApi.updateReportDraft(activityRecordId, updated);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      } catch (err) {
        console.warn("Failed to persist report draft edit:", err);
      } finally {
        setSaving(false);
      }
    }

    if (onUpdateDraft) {
      onUpdateDraft(updated);
    }
  };

  return (
    <div className="rounded-xl border border-border/80 bg-card/80 backdrop-blur-md overflow-hidden shadow-sm space-y-0">
      {/* Report Header Bar */}
      <div className="p-4 border-b border-border/60 bg-muted/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                {activeTab === "view" ? editableTitle : "Edit Engineering Study Report"}
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                Draft Report
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {reportDraft.discipline} Studio • ID: {reportDraft.reportId}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Tab switcher */}
          <div className="flex items-center p-1 rounded-lg bg-background border border-border text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("view")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === "view"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === "edit"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Draft</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="p-1.5 px-2.5 rounded-lg border border-border bg-background hover:bg-muted/50 text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Copy Report as Markdown"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? "Copied" : "Copy MD"}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJson}
            className="p-1.5 px-2.5 rounded-lg border border-border bg-background hover:bg-muted/50 text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Download JSON Artifact"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">JSON</span>
          </button>

          {onSaveToPortfolio && (
            <button
              type="button"
              onClick={onSaveToPortfolio}
              className={`p-1.5 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isSavedToPortfolio
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-border bg-background hover:bg-muted/50 text-foreground"
              }`}
            >
              {isSavedToPortfolio ? (
                <>
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>In Portfolio</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Save to Portfolio</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 space-y-6">
        {/* Verification Status Banner */}
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-400 tracking-wide">
                {reportDraft.verificationStatus === "VERIFIED_DETERMINISTIC"
                  ? "NUMERICAL PROOF: VERIFIED DETERMINISTIC"
                  : reportDraft.verificationStatus}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                Authoritative Math Guaranteed
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Numerical calculations are executed deterministically through verified domain equations.
              AI provides qualitative contextual interpretation, assumptions detection, and report structuring without free-form arithmetic.
            </p>
          </div>
        </div>

        {activeTab === "view" ? (
          /* PREVIEW TAB */
          <div className="space-y-6">
            {/* Objective & Problem Statement */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                1. Study Objective & Problem Statement
              </h4>
              <div className="p-3.5 rounded-lg border border-border/60 bg-muted/20 text-xs text-foreground leading-relaxed">
                {editableObjective}
              </div>
            </div>

            {/* Governing Formula */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                2. Governing Equations
              </h4>
              <div className="p-3 rounded-lg border border-border/60 bg-muted/40 font-mono text-xs text-primary font-medium">
                {reportDraft.governingEquations}
              </div>
            </div>

            {/* Numerical Results Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  3. Verified Calculation Results
                </h4>
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Exact Algebraic Precision
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {Object.entries(reportDraft.numericalResults || {}).map(([key, val]) => (
                  <div key={key} className="p-2.5 rounded-lg border border-border/50 bg-background/80">
                    <div className="text-[10px] font-mono text-muted-foreground truncate">{key}</div>
                    <div className="text-sm font-bold text-foreground mt-0.5 truncate">{String(val)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Intermediate Calculation Steps */}
            {reportDraft.calculationSteps && reportDraft.calculationSteps.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  4. Intermediate Substitution Steps
                </h4>
                <div className="p-3 rounded-lg border border-border/40 bg-muted/10 font-mono text-xs text-foreground/90 space-y-1">
                  {reportDraft.calculationSteps.map((step, idx) => (
                    <div key={idx}>{step}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Engineering Discussion & AI Interpretation */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                5. Engineering Interpretation & Discussion
              </h4>
              <div className="p-4 rounded-lg border border-border/60 bg-card/50 text-xs text-foreground/95 leading-relaxed space-y-2">
                <p>{editableDiscussion}</p>
                {reportDraft.applicableTheory && (
                  <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                    <span className="font-semibold text-foreground">Theoretical Foundation: </span>
                    {reportDraft.applicableTheory}
                  </p>
                )}
              </div>
            </div>

            {/* Assumptions & Limitations Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  Assumptions & Idealizations
                </h4>
                <ul className="p-3.5 rounded-lg border border-border/50 bg-muted/10 space-y-1.5 text-xs text-foreground/85">
                  {reportDraft.assumptions.map((assump, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>{assump}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  Model Limitations & Caveats
                </h4>
                <ul className="p-3.5 rounded-lg border border-border/50 bg-muted/10 space-y-1.5 text-xs text-foreground/85">
                  {reportDraft.limitations.map((lim, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{lim}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Missing Inputs & Field Verification Checklist */}
            {reportDraft.missingInputsChecklist && reportDraft.missingInputsChecklist.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-primary" />
                  On-Site / Detailed Design Verification Checklist
                </h4>
                <div className="space-y-1.5">
                  {reportDraft.missingInputsChecklist.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border border-border/50 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="font-medium text-foreground">{item.item}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{item.explanation}</div>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium shrink-0 self-start sm:self-center ${
                          item.importance === "CRITICAL"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : item.importance === "RECOMMENDED"
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {item.importance}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Troubleshooting Discrepancies (if present) */}
            {reportDraft.troubleshootingAdvice && reportDraft.troubleshootingAdvice.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Laboratory Troubleshooting & Real vs Ideal Discrepancies
                </h4>
                <div className="p-3.5 rounded-lg border border-border/50 bg-muted/15 space-y-1.5 text-xs text-foreground/85">
                  {reportDraft.troubleshootingAdvice.map((adv, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold shrink-0">→</span>
                      <span>{adv}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Student Personal Notes */}
            {editableNotes && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Student Notes & Portfolio Evidence Remarks
                </h4>
                <div className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-foreground">
                  {editableNotes}
                </div>
              </div>
            )}

            {/* Genuine Learning Ecosystem Links */}
            {reportDraft.learningPathwayLinks && reportDraft.learningPathwayLinks.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/50">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  Recommended Next Steps in Student Learning Ecosystem
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {reportDraft.learningPathwayLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.route}
                      className="p-3 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-between text-xs group"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {link.title}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {link.type.replace(/_/g, " ")} • ID: {link.id}
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Safety & Educational Use Disclaimer */}
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{reportDraft.safetyNotice}</span>
            </div>
          </div>
        ) : (
          /* EDIT DRAFT TAB */
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Report Title
              </label>
              <input
                type="text"
                value={editableTitle}
                onChange={(e) => setEditableTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
                placeholder="Title of this technical study"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Study Objective & Problem Statement
              </label>
              <textarea
                rows={3}
                value={editableObjective}
                onChange={(e) => setEditableObjective(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none leading-relaxed"
                placeholder="Describe the engineering problem and operating conditions..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Engineering Discussion & Commentary
              </label>
              <textarea
                rows={6}
                value={editableDiscussion}
                onChange={(e) => setEditableDiscussion(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none leading-relaxed"
                placeholder="Edit or expand the engineering analysis, trade-offs, or observations..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Student Remarks & Field Observations
              </label>
              <textarea
                rows={3}
                value={editableNotes}
                onChange={(e) => setEditableNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none leading-relaxed"
                placeholder="Add personal notes, lab group numbers, or physical test remarks..."
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-muted-foreground">
                Authoritative math and formulas cannot be edited directly to protect calculation integrity.
              </span>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                {saving ? (
                  <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{saveSuccess ? "Draft Saved!" : "Save Draft Changes"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedEngineeringReportBuilder;

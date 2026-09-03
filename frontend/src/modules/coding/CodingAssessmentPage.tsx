import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Editor from "@monaco-editor/react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Code2,
  FolderOpen,
  Play,
  RefreshCw,
  Send,
  Sparkles,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartSkillApi, CodingTaskSummary, CodingTaskDetail, CodingExecutionResult } from "@/lib/api";
import { toast } from "sonner";

const CodingAssessmentPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState<CodingTaskSummary[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("two-sum");
  const [taskDetail, setTaskDetail] = useState<CodingTaskDetail | null>(null);
  const [code, setCode] = useState<string>("");
  const [isLoadingTask, setIsLoadingTask] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState<CodingExecutionResult | null>(null);
  const [activeTab, setActiveTab] = useState<"description" | "tests" | "console">("description");
  const [showTaskListModal, setShowTaskListModal] = useState(false);

  // Load all tasks on mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const list = await SmartSkillApi.getCodingTasks();
        setTasks(list);
        const paramId = searchParams.get("taskId");
        if (paramId && list.some((t) => t.id === paramId)) {
          setSelectedTaskId(paramId);
        } else if (list.length > 0) {
          setSelectedTaskId(list[0].id);
        }
      } catch (err: any) {
        toast.error("Failed to load task catalog: " + err.message);
      }
    };
    fetchTasks();
  }, []);

  // Load task detail when selectedTaskId changes
  useEffect(() => {
    if (!selectedTaskId) return;

    const fetchDetail = async () => {
      try {
        setIsLoadingTask(true);
        const detail = await SmartSkillApi.getTaskDetail(selectedTaskId);
        setTaskDetail(detail);
        setCode(detail.starterCode || "");
        setExecutionResult(null);
        setSearchParams({ taskId: selectedTaskId });
      } catch (err: any) {
        toast.error("Failed to load task: " + err.message);
      } finally {
        setIsLoadingTask(false);
      }
    };
    fetchDetail();
  }, [selectedTaskId]);

  const handleRunSample = async () => {
    if (!code.trim()) {
      toast.error("Please enter some code first.");
      return;
    }

    try {
      setIsRunning(true);
      setActiveTab("console");
      toast.info("Executing sample test cases in isolated Docker sandbox...");
      const result = await SmartSkillApi.runCode(code, selectedTaskId);
      setExecutionResult(result);
      if (result.status === "completed") {
        toast.success("Sample execution completed!");
      } else {
        toast.warning(`Execution finished with status: ${result.status}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Execution failed");
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!code.trim()) {
      toast.error("Please enter code before submitting.");
      return;
    }

    try {
      setIsSubmitting(true);
      setActiveTab("console");
      toast.info("Submitting solution against all test suites in Docker sandbox...");
      const result = await SmartSkillApi.submitSolution(selectedTaskId, code);
      setExecutionResult(result);

      if (result.status === "passed") {
        toast.success(`🎉 Solution PASSED all ${result.total} test cases! +${result.score} pts`);
      } else {
        toast.error(`Solution failed ${result.failed}/${result.total} test cases.`);
      }
    } catch (err: any) {
      toast.error(err.message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/30 pb-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTaskListModal(true)}
            className="h-9 px-3 gap-2 bg-surface border-border/40 font-bold text-xs shadow-neo-raised-sm"
          >
            <FolderOpen className="h-4 w-4 text-primary" />
            <span>{taskDetail?.title || "Select Task"}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>

          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
              taskDetail?.difficulty === "Easy"
                ? "bg-success/10 text-success border-success/30"
                : taskDetail?.difficulty === "Medium"
                ? "bg-warning/10 text-warning border-warning/30"
                : "bg-destructive/10 text-destructive border-destructive/30"
            }`}
          >
            {taskDetail?.difficulty || "Easy"}
          </span>

          <span className="text-xs text-muted-foreground font-medium hidden md:inline">
            💎 {taskDetail?.points || 10} points • 🔒 {taskDetail?.totalTestsCount || 0} Test Suites
          </span>
        </div>

        {/* Run & Submit Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunSample}
            disabled={isRunning || isSubmitting}
            className="h-9 gap-1.5 bg-background border-border/40 text-xs font-bold shadow-neo-raised-sm"
          >
            <Play className={`h-3.5 w-3.5 ${isRunning ? "animate-spin text-primary" : "text-success"}`} />
            {isRunning ? "Running..." : "Run Samples"}
          </Button>

          <Button
            size="sm"
            onClick={handleSubmitSolution}
            disabled={isRunning || isSubmitting}
            className="h-9 gap-1.5 text-xs font-bold shadow-neo-raised-sm bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Send className={`h-3.5 w-3.5 ${isSubmitting ? "animate-spin" : ""}`} />
            {isSubmitting ? "Evaluating..." : "Submit Solution"}
          </Button>
        </div>
      </div>

      {/* Main IDE Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-14rem)] min-h-[500px]">
        {/* Left Col: Problem Description & Tabs (5 cols) */}
        <div className="lg:col-span-5 bg-surface border border-border/40 rounded-2xl shadow-neo-raised flex flex-col overflow-hidden">
          {/* Sub-Tabs */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/30 bg-background/50 text-xs">
            <button
              onClick={() => setActiveTab("description")}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                activeTab === "description" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab("tests")}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                activeTab === "tests" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sample Tests ({taskDetail?.sampleTests?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("console")}
              className={`px-3 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 ${
                activeTab === "console" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Terminal className="h-3 w-3" /> Console {executionResult && "●"}
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs leading-relaxed custom-scrollbar">
            {isLoadingTask ? (
              <div className="py-12 text-center text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin mx-auto text-primary mb-2" />
                Loading task details...
              </div>
            ) : activeTab === "description" ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground mb-1">{taskDetail?.title}</h2>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(taskDetail?.skills || []).map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-foreground/90 whitespace-pre-line leading-relaxed">
                  {taskDetail?.description}
                </div>

                {/* Examples */}
                {taskDetail?.examples && taskDetail.examples.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Examples
                    </h3>
                    {taskDetail.examples.map((ex, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-background/80 rounded-xl border border-border/30 space-y-1 font-mono text-[11px]"
                      >
                        <div>
                          <b className="text-muted-foreground">Input:</b> <span className="text-foreground">{ex.input}</span>
                        </div>
                        <div>
                          <b className="text-muted-foreground">Output:</b> <span className="text-primary">{ex.output}</span>
                        </div>
                        {ex.explanation && (
                          <div className="text-[10px] text-muted-foreground font-sans pt-1">
                            {ex.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === "tests" ? (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Public Sample Test Cases
                </h3>
                {(taskDetail?.sampleTests || []).map((t, idx) => (
                  <div
                    key={t.id || idx}
                    className="p-3 bg-background rounded-xl border border-border/30 space-y-1 font-mono text-[11px]"
                  >
                    <span className="font-bold text-foreground block">{t.name}</span>
                    <div className="text-muted-foreground">
                      Expected: <span className="text-primary">{JSON.stringify(t.expected)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* CONSOLE OUTPUT TAB */
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-border/20 pb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-primary" /> Execution Console
                  </span>
                  {executionResult && (
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Runtime: {executionResult.executionTimeMs}ms
                    </span>
                  )}
                </div>

                {!executionResult ? (
                  <p className="text-xs text-muted-foreground py-8 text-center">
                    Click "Run Samples" or "Submit Solution" to view live sandbox execution results.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {/* Status Pill */}
                    <div
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        executionResult.status === "passed" || executionResult.status === "completed"
                          ? "bg-success/10 border-success/30 text-success"
                          : "bg-destructive/10 border-destructive/30 text-destructive"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {executionResult.status === "passed" || executionResult.status === "completed" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        <span className="font-bold uppercase text-xs">
                          {executionResult.status}
                        </span>
                      </div>
                      {executionResult.total !== undefined && (
                        <span className="text-xs font-extrabold">
                          {executionResult.passed} / {executionResult.total} Test Cases Passed
                        </span>
                      )}
                    </div>

                    {/* Test Cases Results List */}
                    {executionResult.tests && executionResult.tests.length > 0 && (
                      <div className="space-y-1.5">
                        {executionResult.tests.map((test, idx) => (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-lg border text-xs flex items-center justify-between font-mono ${
                              test.passed
                                ? "bg-background/80 border-success/30 text-success"
                                : "bg-background/80 border-destructive/30 text-destructive"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{test.passed ? "✓" : "✗"}</span>
                              <span className="text-foreground">{test.name}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {test.executionTimeMs ? `${test.executionTimeMs}ms` : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Stdout / Stderr */}
                    {executionResult.stdout && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Standard Output:</span>
                        <pre className="p-2.5 bg-black/60 text-green-400 rounded-xl font-mono text-[11px] overflow-x-auto">
                          {executionResult.stdout}
                        </pre>
                      </div>
                    )}

                    {executionResult.stderr && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-destructive uppercase">Standard Error:</span>
                        <pre className="p-2.5 bg-destructive/10 text-destructive rounded-xl font-mono text-[11px] overflow-x-auto">
                          {executionResult.stderr}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Monaco Editor (7 cols) */}
        <div className="lg:col-span-7 bg-surface border border-border/40 rounded-2xl shadow-neo-raised flex flex-col overflow-hidden">
          {/* Editor Header Bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 bg-background/50 text-xs">
            <span className="font-bold text-muted-foreground flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-primary" /> solution.js
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCode(taskDetail?.starterCode || "")}
              className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
            >
              Reset Starter Code
            </Button>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 min-h-[350px]">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              language="javascript"
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "JetBrains Mono, monospace",
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "on",
              }}
            />
          </div>
        </div>
      </div>

      {/* Problem Selector Modal */}
      {showTaskListModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-surface border border-border/40 rounded-2xl max-w-lg w-full p-6 shadow-neo-raised-lg space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-primary" /> Coding Problem Catalog
              </h3>
              <button
                onClick={() => setShowTaskListModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {tasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTaskId(t.id);
                    setShowTaskListModal(false);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedTaskId === t.id
                      ? "bg-primary/10 border-primary/40 shadow-neo-pressed"
                      : "bg-background border-border/30 hover:border-primary/30"
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{t.title}</h4>
                    <span className="text-[10px] text-muted-foreground">{t.category} • {t.points} pts</span>
                  </div>
                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                      t.difficulty === "Easy"
                        ? "bg-success/10 text-success border-success/30"
                        : t.difficulty === "Medium"
                        ? "bg-warning/10 text-warning border-warning/30"
                        : "bg-destructive/10 text-destructive border-destructive/30"
                    }`}
                  >
                    {t.difficulty}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodingAssessmentPage;

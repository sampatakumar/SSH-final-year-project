import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  FileCode,
  File,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ResumeApi, type ResumeUploadExtractionResponse } from "@/modules/resume/services/resume.api";

interface ResumeUploadDropzoneProps {
  onExtracted: (result: ResumeUploadExtractionResponse) => void;
  onCancel?: () => void;
  compact?: boolean;
}

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt", ".rtf", ".png", ".jpg", ".jpeg"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const ResumeUploadDropzone: React.FC<ResumeUploadDropzoneProps> = ({
  onExtracted,
  onCancel,
  compact = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"IDLE" | "UPLOADING" | "ANALYZING" | "EXTRACTING" | "READY" | "ERROR">("IDLE");
  const [statusMessage, setStatusMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
    if (ext === ".pdf") return <FileText className="w-8 h-8 text-rose-400" />;
    if (ext === ".docx") return <File className="w-8 h-8 text-blue-400" />;
    if (ext === ".txt" || ext === ".rtf") return <FileCode className="w-8 h-8 text-emerald-400" />;
    return <File className="w-8 h-8 text-cyan-400" />;
  };

  const validateFile = (file: File): boolean => {
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setErrorMessage("This file type isn't supported. Please upload a PDF, DOCX, TXT, or RTF resume.");
      setStatus("ERROR");
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage("Your resume is too large. Maximum file size is 10 MB.");
      setStatus("ERROR");
      return false;
    }

    return true;
  };

  const isMountedRef = useRef(true);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      timersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const processUpload = async (file: File) => {
    setSelectedFile(file);
    setErrorMessage("");
    setStatus("UPLOADING");
    setStatusMessage("Uploading document...");
    setProgress(25);

    try {
      const t1 = setTimeout(() => {
        if (!isMountedRef.current) return;
        setStatus("ANALYZING");
        setStatusMessage("Analyzing document structure...");
        setProgress(55);
      }, 600);
      timersRef.current.push(t1);

      const t2 = setTimeout(() => {
        if (!isMountedRef.current) return;
        setStatus("EXTRACTING");
        setStatusMessage("Extracting structured profile with AI...");
        setProgress(85);
      }, 1300);
      timersRef.current.push(t2);

      const result = await ResumeApi.uploadAndExtract(file);

      if (!isMountedRef.current) return;
      setProgress(100);
      setStatus("READY");
      setStatusMessage("Resume analyzed successfully!");
      toast.success("Resume analyzed successfully! Review your extracted details.");
      
      const t3 = setTimeout(() => {
        if (!isMountedRef.current) return;
        onExtracted(result);
      }, 400);
      timersRef.current.push(t3);
    } catch (err: any) {
      if (!isMountedRef.current) return;
      console.error("Resume upload error:", err);
      setStatus("ERROR");
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "We read your resume, but couldn't automatically organize all details. You can review and enter them manually.";
      setErrorMessage(message);
      toast.error(message);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        void processUpload(file);
      }
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        void processUpload(file);
      }
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setStatus("IDLE");
    setStatusMessage("");
    setErrorMessage("");
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isBusy = status === "UPLOADING" || status === "ANALYZING" || status === "EXTRACTING";

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.rtf,.png,.jpg,.jpeg"
        className="hidden"
        onChange={handleFileChange}
        disabled={isBusy}
      />

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isBusy && !selectedFile && fileInputRef.current?.click()}
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${
          dragOver
            ? "border-cyan-400 bg-cyan-950/30 shadow-[0_0_25px_rgba(6,182,212,0.25)]"
            : status === "ERROR"
            ? "border-rose-500/50 bg-rose-950/10"
            : status === "READY"
            ? "border-emerald-500/50 bg-emerald-950/10"
            : "border-slate-800 bg-slate-900/50 hover:border-cyan-500/40 hover:bg-slate-900/80 cursor-pointer"
        } ${compact ? "p-6" : "p-8 md:p-12"}`}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            {isBusy ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center space-y-4 max-w-sm w-full"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 flex items-center justify-center border border-cyan-500/30">
                    <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
                  </div>
                  <div className="absolute -inset-1 rounded-2xl border border-cyan-400/40 animate-ping opacity-25" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-semibold text-white tracking-wide">{statusMessage}</h4>
                  <p className="text-xs text-slate-400">Powered by Smart Skill Hub AI Extraction Engine</p>
                </div>

                <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700/50">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>

                {selectedFile && (
                  <p className="text-xs text-slate-400 truncate max-w-xs">
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </motion.div>
            ) : selectedFile && status !== "ERROR" ? (
              <motion.div
                key="selected"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center space-y-4"
              >
                <div className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl shadow-inner">
                  {getFileIcon(selectedFile.name)}
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-semibold text-white truncate max-w-md">{selectedFile.name}</h4>
                  <p className="text-xs text-slate-400">{formatFileSize(selectedFile.size)} • Ready for processing</p>
                </div>

                <div className="flex items-center space-x-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <X className="w-4 h-4 mr-1.5" /> Remove
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30"
                  >
                    <RefreshCw className="w-4 h-4 mr-1.5" /> Replace
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center space-y-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/10 to-indigo-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)] group-hover:scale-105 transition-transform duration-300">
                  <Upload className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-semibold text-white tracking-wide">
                    Drag & drop your resume or <span className="text-cyan-400 hover:underline">browse files</span>
                  </h3>
                  <p className="text-sm text-slate-400 max-w-md">
                    Upload your existing resume to automatically extract your skills, experience, education, and links.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {["PDF", "DOCX", "TXT", "RTF", "PNG / JPG"].map((fmt) => (
                    <span
                      key={fmt}
                      className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300"
                    >
                      {fmt}
                    </span>
                  ))}
                  <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-cyan-950/40 border border-cyan-800/40 text-cyan-300">
                    Max 10 MB
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {status === "ERROR" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center space-x-2 text-sm text-rose-400 bg-rose-950/30 border border-rose-800/50 rounded-lg px-4 py-2"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                className="ml-auto text-rose-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { Download, FileText, AlertCircle, RefreshCw, Eye, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveResumeViewerUrl } from "@/lib/api";
import { getAuthToken, firebaseAuth } from "@/lib/firebase";

export interface ResumeDocumentViewerProps {
  resume: {
    _id: string;
    title?: string;
    format?: string;
    filePath?: string;
    content?: string;
    signedUrlExpiresAt?: string;
  };
}

export const ResumeDocumentViewer: React.FC<ResumeDocumentViewerProps> = ({ resume }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExtractedContent, setShowExtractedContent] = useState(false);

  const blobUrlRef = React.useRef<string | null>(null);

  const loadDocument = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const targetUrl = resolveResumeViewerUrl(resume);

      if (!targetUrl) {
        throw new Error("No readable document path is available for this resume.");
      }

      let idToken = await getAuthToken();
      if (!idToken && firebaseAuth.currentUser) {
        idToken = await firebaseAuth.currentUser.getIdToken();
      }

      const isBackendRoute = targetUrl.includes("/api/v1/") || !/^https?:\/\//i.test(targetUrl);

      const response = await fetch(targetUrl, {
        headers: {
          ...(idToken && isBackendRoute ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        cache: "no-store",
      });

      if (!response.ok) {
        let serverMessage = "";
        try {
          const json = await response.json();
          serverMessage = json.message || json.error || "";
        } catch {
          // non-JSON error response
        }

        if (response.status === 404) {
          throw new Error(
            serverMessage || "Original document is unavailable."
          );
        }

        if (response.status === 502 || response.status === 503) {
          throw new Error(
            serverMessage || `Document storage service unavailable (HTTP ${response.status}). File preview cannot be loaded.`
          );
        }

        throw new Error(
          serverMessage || `Document storage service unavailable (HTTP ${response.status}). File preview cannot be loaded.`
        );
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error("Retrieved document is empty.");
      }

      const objectUrl = URL.createObjectURL(blob);
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      blobUrlRef.current = objectUrl;
      setBlobUrl(objectUrl);
    } catch (err: any) {
      console.warn("[resume-viewer] Preview failed:", err.message);
      setError(err.message || "Failed to load document preview");
    } finally {
      setIsLoading(false);
    }
  }, [resume._id, resume.filePath]);

  useEffect(() => {
    loadDocument();

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [loadDocument]);

  const handleOpenExternal = () => {
    if (blobUrl) {
      if (resume.format === "PDF") {
        window.open(blobUrl, "_blank", "noopener,noreferrer");
      } else {
        const a = document.createElement("a");
        a.href = blobUrl;
        const ext = (resume.format || "doc").toLowerCase();
        a.download = `${resume.title || "resume"}.${ext === "image" ? "png" : ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } else if (resume.filePath && resume.filePath.startsWith("https://")) {
      window.open(resume.filePath, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="space-y-4">
      {/* Viewer Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">
            {showExtractedContent ? "Extracted Text Content" : "Document Viewer"}
          </p>
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
            {resume.format || "PDF"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {resume.content && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowExtractedContent(!showExtractedContent)}
              className="text-xs h-8"
            >
              {showExtractedContent ? <><Eye className="h-3.5 w-3.5 mr-1.5" /> View PDF</> : <><FileText className="h-3.5 w-3.5 mr-1.5" /> View Text</>}
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenExternal}
            disabled={!blobUrl && (!resume.filePath || !resume.filePath.startsWith("https://"))}
            className="text-xs h-8"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" /> Open External
          </Button>
        </div>
      </div>

      {/* Viewer Content Area */}
      {showExtractedContent ? (
        <div className="max-h-96 overflow-y-auto bg-background/90 rounded-xl border border-border/50 p-4 custom-scrollbar">
          <pre className="text-xs whitespace-pre-wrap text-foreground font-mono leading-relaxed">
            {resume.content}
          </pre>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 bg-background/50 rounded-xl border border-border/50 text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm font-medium text-foreground">Loading document preview...</p>
          <p className="text-xs text-muted-foreground">Fetching authenticated file stream from storage</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-12 bg-background/50 rounded-xl border border-destructive/30 text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-destructive/80" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">Unable to preview this document</p>
            <p className="text-xs text-muted-foreground max-w-md">
              {error}
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={loadDocument} className="text-xs">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
            </Button>
            {resume.content && (
              <Button size="sm" variant="secondary" onClick={() => setShowExtractedContent(true)} className="text-xs">
                <FileText className="h-3.5 w-3.5 mr-1.5" /> View Extracted Text
              </Button>
            )}
          </div>
        </div>
      ) : blobUrl && resume.format === "PDF" ? (
        <iframe
          src={blobUrl}
          title={resume.title || "Resume Document Preview"}
          className="w-full h-[70vh] md:h-[600px] rounded-xl border border-border/50 bg-white shadow-inner"
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-12 bg-background/50 rounded-xl border border-border/50 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">In-page preview not available for {resume.format || "this format"}.</p>
          {resume.content && (
            <Button size="sm" variant="outline" onClick={() => setShowExtractedContent(true)} className="mt-3 text-xs">
              View Extracted Text
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeDocumentViewer;

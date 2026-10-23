import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Award,
  CheckCircle2,
  Copy,
  ExternalLink,
  Key,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartSkillApi, PublicBadgeVerification } from "@/lib/api";
import { toast } from "sonner";

export const PublicBadgeVerificationPage: React.FC = () => {
  const { badgeId } = useParams<{ badgeId: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PublicBadgeVerification | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!badgeId) {
      setError("No badge identifier provided.");
      setLoading(false);
      return;
    }

    const fetchVerification = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await SmartSkillApi.verifyPublicBadge(badgeId);
        setData(res);
      } catch (err: any) {
        setError(err.message || "Failed to verify badge.");
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [badgeId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Verification link copied to clipboard!");
  };

  const badge = data?.badge;
  const isVerified = data?.exists && data?.isValid && !data?.isRevoked;
  const isRevoked = data?.isRevoked;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 md:p-8">
      {/* Top Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between pb-6 border-b border-border/30">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/30">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Smart Skill Hub
          </span>
        </Link>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground border border-border/40">
          Public Verification Registry
        </span>
      </header>

      {/* Main Verification Card */}
      <main className="max-w-2xl mx-auto w-full my-8">
        {loading ? (
          <div className="p-12 text-center bg-surface/50 border border-border/40 rounded-3xl shadow-neo-raised backdrop-blur-md">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-bold text-foreground">Cryptographic Verification in Progress</h2>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              Validating HMAC-SHA256 digital signature against public authority...
            </p>
          </div>
        ) : error || !data?.exists ? (
          <div className="p-8 md:p-10 bg-destructive/5 border border-destructive/30 rounded-3xl shadow-neo-raised text-center">
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4 border border-destructive/20">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-destructive">Badge Verification Failed</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              {error || data?.message || "No record of this credential exists in the Smart Skill Hub registry."}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild variant="outline" size="sm">
                <Link to="/">Return to Homepage</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden bg-surface border border-border/40 rounded-3xl shadow-neo-raised p-6 md:p-10 backdrop-blur-md">
            {/* Ambient Background Glow */}
            <div
              className={`absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl opacity-20 pointer-events-none ${
                isVerified ? "bg-emerald-500" : isRevoked ? "bg-rose-500" : "bg-amber-500"
              }`}
            />

            {/* Verification Status Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/30">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${
                    isVerified
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                      : isRevoked
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-500"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-500"
                  }`}
                >
                  {isVerified ? (
                    <ShieldCheck className="w-7 h-7" />
                  ) : (
                    <ShieldAlert className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${
                        isVerified
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                          : isRevoked
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/30"
                          : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                      }`}
                    >
                      {isVerified ? "Verified Credential" : isRevoked ? "Revoked Credential" : "Invalid Signature"}
                    </span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-black text-foreground mt-1">
                    {badge?.competencyName || "Technical Competency"}
                  </h1>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="gap-2 text-xs font-semibold self-start sm:self-center"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Link
              </Button>
            </div>

            {/* Revocation Warning if Revoked */}
            {isRevoked && (
              <div className="my-5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block text-sm text-rose-300">
                    This badge was officially revoked.
                  </strong>
                  <span>Reason: {data.revocationReason || "Revoked by issuer."}</span>
                  {data.revokedAt && (
                    <span className="block mt-1 font-mono text-[11px] opacity-80">
                      Revocation timestamp: {new Date(data.revokedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Credential Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              <div className="p-4 rounded-2xl bg-background/50 border border-border/30">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-primary" /> Recipient
                </span>
                <p className="text-base font-bold text-foreground mt-1">
                  {badge?.recipientIdentifier || "SSH Verified Learner"}
                </p>
                <span className="text-[11px] text-muted-foreground font-mono">
                  Privacy-protected verification reference
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-background/50 border border-border/30">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-primary" /> Credential Type
                </span>
                <p className="text-base font-bold text-foreground mt-1 capitalize">
                  {badge?.badgeType?.replace(/_/g, " ") || "Competency Badge"}
                </p>
                <span className="text-[11px] text-muted-foreground font-mono">
                  Skill: {badge?.canonicalSkill}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-background/50 border border-border/30">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-primary" /> Authority Key ID
                </span>
                <p className="text-xs font-mono font-semibold text-foreground mt-1">
                  {badge?.keyId || "ssh-badge-key-2026-v1"}
                </p>
                <span className="text-[11px] text-muted-foreground font-mono">
                  HMAC-SHA256 Authenticated
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-background/50 border border-border/30">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Evaluation Rubric
                </span>
                <p className="text-base font-bold text-foreground mt-1">
                  Version {badge?.rubricVersion || "1.0.0"}
                </p>
                <span className="text-[11px] text-muted-foreground font-mono">
                  Issued: {badge?.issuedAt ? new Date(badge.issuedAt).toLocaleDateString() : "Recent"}
                </span>
              </div>
            </div>

            {/* Evidence Categories Provenance */}
            {badge?.evidenceSummary && (
              <div className="space-y-3 pt-4 border-t border-border/30">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Empirical Evidence Pillars Evaluated
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-background/40 border border-border/20">
                    <span className="text-[11px] font-semibold text-muted-foreground block">
                      Knowledge Checks
                    </span>
                    <span className="text-sm font-bold text-foreground flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      {badge.evidenceSummary.knowledgeScore}% Avg Score
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-background/40 border border-border/20">
                    <span className="text-[11px] font-semibold text-muted-foreground block">
                      Applied Challenges
                    </span>
                    <span className="text-sm font-bold text-foreground flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      {badge.evidenceSummary.appliedProblemsSolved} Problem Solved
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-background/40 border border-border/20">
                    <span className="text-[11px] font-semibold text-muted-foreground block">
                      Spaced Retention
                    </span>
                    <span className="text-sm font-bold text-foreground flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Stage {badge.evidenceSummary.retentionStage} Verified
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Authority Statement */}
            <div className="mt-6 pt-4 border-t border-border/30 text-center text-xs text-muted-foreground">
              <p>
                Issued by <strong className="text-foreground">{badge?.issuer || "Smart Skill Hub"}</strong>.
                This badge verifies an evidence-based competency claim issued through deterministic assessment synthesis.
                It is not an accredited university degree.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center py-4 text-xs text-muted-foreground border-t border-border/20">
        Smart Skill Hub Public Credential Registry &bull; Protected under Cryptographic Proof Protocol
      </footer>
    </div>
  );
};

export default PublicBadgeVerificationPage;

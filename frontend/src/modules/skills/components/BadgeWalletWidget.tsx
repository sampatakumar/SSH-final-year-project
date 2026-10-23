import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  Calendar,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  Key,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartSkillApi, CompetencyBadgeItem } from "@/lib/api";
import { toast } from "sonner";

export const BadgeWalletWidget: React.FC = () => {
  const [badges, setBadges] = useState<CompetencyBadgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const userBadges = await SmartSkillApi.getMyBadges();
      setBadges(userBadges || []);
    } catch (err: any) {
      console.warn("Failed to load badges:", err.message);
      toast.error("Could not load verifiable badges.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBadges();
  }, []);

  const handleCopyVerificationUrl = (badgeId: string) => {
    const url = `${window.location.origin}/badges/verify/${badgeId}`;
    navigator.clipboard.writeText(url);
    toast.success("Verification link copied to clipboard!");
  };

  const handleAddToResume = (badge: CompetencyBadgeItem) => {
    const resumeBullet = `Verified Competency: ${badge.competencyName} (Smart Skill Hub Certified, Credential ID: ${badge.badgeId})`;
    navigator.clipboard.writeText(resumeBullet);
    toast.success("Resume certification entry copied to clipboard!", {
      description: "Paste into your Resume Builder Certifications or Achievements section.",
    });
  };

  const handleRevokeBadge = async (badgeId: string) => {
    if (!window.confirm("Are you sure you want to revoke this credential? Verifiers will see it marked as revoked.")) {
      return;
    }

    try {
      setRevokingId(badgeId);
      await SmartSkillApi.revokeBadge(badgeId, "Revoked by student request");
      toast.success("Badge has been revoked.");
      await fetchBadges();
    } catch (err: any) {
      toast.error(err.message || "Could not revoke badge.");
    } finally {
      setRevokingId(null);
    }
  };

  const activeBadges = badges.filter((b) => b.status === "active");
  const revokedBadges = badges.filter((b) => b.status === "revoked");

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-5 rounded-3xl border border-border/40 shadow-neo-raised">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Award className="w-6 h-6 text-primary" />
            Verified Credential Wallet
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Tamper-proof, cryptographically signed competency credentials issued by Smart Skill Hub.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchBadges}
          disabled={loading}
          className="text-xs font-semibold gap-1.5 h-9"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          Refresh Wallet
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-surface/40 border border-border/30 rounded-3xl">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-muted-foreground font-mono">
            Loading cryptographic credentials...
          </p>
        </div>
      ) : activeBadges.length === 0 && revokedBadges.length === 0 ? (
        <div className="p-10 text-center bg-surface/30 border border-border/30 rounded-3xl space-y-3">
          <Award className="w-12 h-12 text-muted-foreground mx-auto opacity-40" />
          <h3 className="text-base font-bold text-foreground">No Badges Awarded Yet</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Satisfy knowledge checks on EduTube, sandbox coding challenges, and spaced retention reviews in the Competency Matrix to earn your first verifiable badge.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Badges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeBadges.map((badge) => {
              const isCapstone = badge.badgeType === "capstone_competence";
              return (
                <div
                  key={badge.badgeId}
                  className={`p-6 rounded-3xl border shadow-neo-raised flex flex-col justify-between transition-all duration-200 relative overflow-hidden ${
                    isCapstone
                      ? "bg-gradient-to-br from-surface to-emerald-950/20 border-emerald-500/30"
                      : "bg-surface border-border/40"
                  }`}
                >
                  {/* Subtle Glow */}
                  {isCapstone && (
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                  )}

                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-inner ${
                            isCapstone
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : "bg-primary/10 border-primary/30 text-primary"
                          }`}
                        >
                          {isCapstone ? <Sparkles className="w-5 h-5" /> : <Award className="w-5 h-5" />}
                        </div>
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                            {badge.skill}
                          </span>
                          <h3 className="text-base font-extrabold text-foreground leading-tight">
                            {badge.competencyName}
                          </h3>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                        <ShieldCheck className="w-3 h-3" />
                        Active & Verified
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2.5 rounded-xl bg-background/50 border border-border/20">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                          Badge Pillar
                        </span>
                        <span className="font-semibold text-foreground capitalize mt-0.5 block">
                          {badge.badgeType.replace(/_/g, " ")}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-background/50 border border-border/20">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                          Issued Date
                        </span>
                        <span className="font-semibold text-foreground mt-0.5 block">
                          {new Date(badge.issuedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Cryptographic Provenance Snippet */}
                    <div className="p-2.5 rounded-xl bg-background/60 border border-border/30 text-[11px] font-mono text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Key ID:</span>
                        <span className="text-foreground">{badge.keyId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Digital Sig:</span>
                        <span className="text-foreground truncate max-w-[160px]">
                          {badge.signature}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 mt-4 border-t border-border/30 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Button asChild size="sm" variant="default" className="text-xs font-bold gap-1.5 h-8">
                        <Link to={`/badges/verify/${badge.badgeId}`} target="_blank">
                          <ExternalLink className="w-3 h-3" /> Verify Publicly
                        </Link>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyVerificationUrl(badge.badgeId)}
                        className="text-xs font-semibold gap-1.5 h-8"
                      >
                        <Copy className="w-3 h-3" /> Copy URL
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAddToResume(badge)}
                        className="text-xs font-semibold gap-1.5 h-8"
                      >
                        <FileText className="w-3 h-3" /> Add to Resume
                      </Button>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevokeBadge(badge.badgeId)}
                      disabled={revokingId === badge.badgeId}
                      title="Revoke badge"
                      aria-label="Revoke credential"
                      className="text-xs text-muted-foreground hover:text-destructive h-8 px-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Revoked Badges if any */}
          {revokedBadges.length > 0 && (
            <div className="space-y-3 pt-6 border-t border-border/30">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                Revoked Credentials ({revokedBadges.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 opacity-60">
                {revokedBadges.map((badge) => (
                  <div
                    key={badge.badgeId}
                    className="p-4 rounded-2xl bg-surface border border-rose-500/30 text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground">{badge.competencyName}</span>
                      <span className="text-[10px] font-bold text-rose-500 uppercase px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                        Revoked
                      </span>
                    </div>
                    <p className="text-muted-foreground text-[11px]">
                      Reason: {badge.revocationReason || "Revoked by user request"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BadgeWalletWidget;

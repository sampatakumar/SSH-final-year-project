import React, { useState } from "react";
import {
  GitBranch,
  CheckCircle2,
  RefreshCw,
  Unlink,
  AlertTriangle,
  Shield,
  Plus,
  Mail,
  KeyRound,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/core/auth";
import { SettingsApi } from "../services/settings.api";
import type { GitHubIntegrationStatus } from "../types/settings.types";

interface ConnectedAccountsSectionProps {
  integration: GitHubIntegrationStatus | undefined;
  onRefresh: () => void;
}

export const ConnectedAccountsSection: React.FC<ConnectedAccountsSectionProps> = ({
  integration,
  onRefresh,
}) => {
  const { firebaseUser, backendUser, linkProvider, unlinkProvider, getFriendlyErrorMessage } = useAuth();

  // Developer OAuth state
  const [isConnectingGhData, setIsConnectingGhData] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnectingGhData, setIsDisconnectingGhData] = useState(false);

  // Auth provider linking state
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [isLinkingGithub, setIsLinkingGithub] = useState(false);
  const [unlinkingProviderId, setUnlinkingProviderId] = useState<string | null>(null);

  const isGhDataConnected = Boolean(integration?.connected);

  // Determine which auth providers are linked on Firebase user
  const providerData = firebaseUser?.providerData || [];
  const isGoogleLinked = providerData.some((p) => p.providerId === "google.com") || (backendUser?.authProviders || []).includes("google.com");
  const isGithubAuthLinked = providerData.some((p) => p.providerId === "github.com") || (backendUser?.authProviders || []).includes("github.com");
  const isPasswordLinked = providerData.some((p) => p.providerId === "password") || (backendUser?.authProviders || []).includes("password");

  const totalLinkedAuthProviders = providerData.length || (backendUser?.authProviders || []).length || 1;

  // 1. Link Google Auth Provider
  const handleLinkGoogle = async () => {
    if (!window.confirm("Connect Google to your Smart Skill Hub account? This will allow you to sign in with Google seamlessly.")) {
      return;
    }
    setIsLinkingGoogle(true);
    try {
      await linkProvider("google");
      toast.success("Google account linked successfully!");
      onRefresh();
    } catch (err: unknown) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  // 2. Link GitHub Auth Provider
  const handleLinkGithubAuth = async () => {
    if (!window.confirm("Connect GitHub for authentication? This allows you to sign in with GitHub.")) {
      return;
    }
    setIsLinkingGithub(true);
    try {
      await linkProvider("github");
      toast.success("GitHub account linked successfully for authentication!");
      onRefresh();
    } catch (err: unknown) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setIsLinkingGithub(false);
    }
  };

  // 3. Unlink Auth Provider
  const handleUnlink = async (providerId: string, providerName: string) => {
    if (totalLinkedAuthProviders <= 1) {
      toast.error("You cannot unlink your only sign-in method. Please connect another authentication method first.");
      return;
    }

    if (!window.confirm(`Are you sure you want to disconnect ${providerName} from your account?`)) {
      return;
    }

    setUnlinkingProviderId(providerId);
    try {
      await unlinkProvider(providerId);
      toast.success(`${providerName} unlinked successfully.`);
      onRefresh();
    } catch (err: unknown) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setUnlinkingProviderId(null);
    }
  };

  // 4. Developer GitHub Data OAuth Flow
  const handleConnectGhData = async () => {
    setIsConnectingGhData(true);
    try {
      const { authUrl } = await SettingsApi.getGitHubConnectUrl();
      if (authUrl) {
        window.location.href = authUrl;
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate GitHub OAuth flow.");
      setIsConnectingGhData(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await SettingsApi.syncGitHub();
      toast.success(`Synchronized ${res.repositoriesCount} GitHub repositories for @${res.username}!`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "GitHub synchronization failed.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectGhData = async () => {
    if (!window.confirm("Are you sure you want to disconnect your GitHub developer access? Smart Mentor and GitHub Intelligence will lose live repository data.")) {
      return;
    }

    setIsDisconnectingGhData(true);
    try {
      await SettingsApi.disconnectGitHub();
      toast.success("GitHub developer account disconnected.");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to disconnect GitHub developer account.");
    } finally {
      setIsDisconnectingGhData(false);
    }
  };

  const formatLastSynced = (dateStr?: string | null) => {
    if (!dateStr) return "Never";
    try {
      const date = new Date(dateStr);
      const diffMinutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
      if (diffMinutes < 1) return "Just now";
      if (diffMinutes < 60) return `${diffMinutes} min ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      return date.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-surface/90 border border-border/50 shadow-neo-raised space-y-7">
      
      {/* Section Header */}
      <div>
        <h3 className="text-base font-black text-foreground flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Connected Accounts & Authentication
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Manage your sign-in identity providers and authorize developer data connections.
        </p>
      </div>

      {/* Part 1: Sign-in Authentication Providers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            1. Sign-In Authentication Providers
          </span>
          <span className="text-[11px] text-muted-foreground">
            {totalLinkedAuthProviders} method{totalLinkedAuthProviders > 1 ? "s" : ""} active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Google Auth Card */}
          <div className="p-4 rounded-xl bg-surface border border-border/40 flex flex-col justify-between shadow-neo-raised-sm space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.1 7.5 23 12 23z" />
                </svg>
                <div>
                  <h5 className="text-xs font-bold text-foreground">Google</h5>
                  <p className="text-[10px] text-muted-foreground">Sign in with Google</p>
                </div>
              </div>
              {isGoogleLinked && (
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Connected
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-border/20">
              {isGoogleLinked ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleUnlink("google.com", "Google")}
                  disabled={unlinkingProviderId === "google.com" || totalLinkedAuthProviders <= 1}
                  className="w-full text-[11px] h-7 text-muted-foreground hover:text-destructive"
                >
                  <Unlink className="w-3 h-3 mr-1" /> Disconnect
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleLinkGoogle}
                  disabled={isLinkingGoogle}
                  className="w-full text-[11px] h-7 font-bold border-border/60 hover:border-primary/40"
                >
                  <Plus className="w-3 h-3 mr-1" /> Connect Google
                </Button>
              )}
            </div>
          </div>

          {/* GitHub Auth Card */}
          <div className="p-4 rounded-xl bg-surface border border-border/40 flex flex-col justify-between shadow-neo-raised-sm space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5 shrink-0 fill-current text-foreground" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <div>
                  <h5 className="text-xs font-bold text-foreground">GitHub Auth</h5>
                  <p className="text-[10px] text-muted-foreground">Sign in with GitHub</p>
                </div>
              </div>
              {isGithubAuthLinked && (
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Connected
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-border/20">
              {isGithubAuthLinked ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleUnlink("github.com", "GitHub")}
                  disabled={unlinkingProviderId === "github.com" || totalLinkedAuthProviders <= 1}
                  className="w-full text-[11px] h-7 text-muted-foreground hover:text-destructive"
                >
                  <Unlink className="w-3 h-3 mr-1" /> Disconnect
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleLinkGithubAuth}
                  disabled={isLinkingGithub}
                  className="w-full text-[11px] h-7 font-bold border-border/60 hover:border-primary/40"
                >
                  <Plus className="w-3 h-3 mr-1" /> Connect GitHub
                </Button>
              )}
            </div>
          </div>

          {/* Email / Password Auth Card */}
          <div className="p-4 rounded-xl bg-surface border border-border/40 flex flex-col justify-between shadow-neo-raised-sm space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Mail className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <h5 className="text-xs font-bold text-foreground">Email & Password</h5>
                  <p className="text-[10px] text-muted-foreground truncate max-w-[130px]">
                    {firebaseUser?.email || backendUser?.email || "Account email"}
                  </p>
                </div>
              </div>
              {isPasswordLinked && (
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Active
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-border/20 text-center">
              <span className="text-[10px] text-muted-foreground font-medium">
                Primary Account Identity
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Part 2: Developer Platform Connections (GitHub Intelligence Data Authorization) */}
      <div className="space-y-3 pt-3 border-t border-border/30">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            2. Developer Platform Data Connections
          </span>
          <span className="text-[10px] text-primary font-bold">
            Repository & Code Intelligence
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border/40 space-y-4 shadow-neo-raised-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-neo-raised-sm">
                <GitBranch className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-foreground">GitHub Intelligence Access</h4>
                  {isGhDataConnected ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success/15 border border-success/30 text-success text-[10px] font-black uppercase">
                      <CheckCircle2 className="h-3 w-3" />
                      Authorized
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold uppercase border border-border/40">
                      Not connected
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isGhDataConnected
                    ? `@${integration?.githubUsername} • ${integration?.repositoriesCount ?? 0} repositories synchronized with Smart Mentor`
                    : "Authorize repository access to enable automated code metrics, README analysis, and career insights."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isGhDataConnected ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="text-xs font-bold gap-1.5 h-8 px-3.5 rounded-xl border-border/60 hover:border-primary/40 shadow-neo-raised-sm"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-primary" : ""}`} />
                    <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDisconnectGhData}
                    disabled={isDisconnectingGhData}
                    className="text-xs font-bold gap-1.5 h-8 px-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Unlink className="h-3.5 w-3.5" />
                    <span>Disconnect</span>
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={handleConnectGhData}
                  disabled={isConnectingGhData}
                  className="w-full sm:w-auto text-xs font-bold gap-2 h-9 px-4 rounded-xl bg-primary text-primary-foreground shadow-neo-raised hover:brightness-105 active:scale-95"
                >
                  <GitBranch className="h-4 w-4" />
                  <span>{isConnectingGhData ? "Connecting..." : "Authorize GitHub Data"}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Sync Status Details when connected */}
          {isGhDataConnected && (
            <div className="pt-3 border-t border-border/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-3">
                <span>Last Synced: <strong className="text-foreground font-semibold">{formatLastSynced(integration?.lastSyncedAt)}</strong></span>
                <span>Status: <strong className="text-foreground font-semibold capitalize">{integration?.syncStatus || "synced"}</strong></span>
              </div>

              {integration?.syncStatus === "failed" && integration.syncError && (
                <div className="flex items-center gap-1.5 text-destructive font-medium">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>{integration.syncError}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

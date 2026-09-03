import React, { useState } from "react";
import { User, LogOut, Trash2, CheckCircle2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/core/auth";

export const AccountSection: React.FC = () => {
  const { firebaseUser, backendUser, signOutUser, sendPasswordReset, getFriendlyErrorMessage } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const currentUser = backendUser || firebaseUser;
  const email = firebaseUser?.email || backendUser?.email || "user@smartskillhub.com";
  const displayName = backendUser?.displayName || firebaseUser?.displayName || "Developer";
  const targetRole = backendUser?.targetRole || "Full Stack Developer";

  const providerNames = (firebaseUser?.providerData || []).map((p) => {
    if (p.providerId === "google.com") return "Google";
    if (p.providerId === "github.com") return "GitHub";
    if (p.providerId === "password") return "Email & Password";
    return p.providerId;
  });

  const displayProviders = providerNames.length > 0
    ? providerNames.join(" + ")
    : (backendUser?.authProviders || ["Firebase Auth"]).join(" + ");

  const handlePasswordReset = async () => {
    if (!email) {
      toast.error("No account email found.");
      return;
    }

    setIsSendingReset(true);
    try {
      await sendPasswordReset(email);
      toast.success(`Password reset email sent to ${email}`);
    } catch (err: unknown) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOutUser();
      toast.success("Signed out successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to sign out.");
      setIsSigningOut(false);
    }
  };

  const handleDeleteAccount = () => {
    toast.error("Account deletion requires confirmation via administrator or support.");
  };

  return (
    <div className="p-6 rounded-2xl bg-surface/90 border border-border/50 shadow-neo-raised space-y-6">
      <div>
        <h3 className="text-base font-black text-foreground flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Account & Security
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Manage your account credentials, authentication provider, and session status.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-surface border border-border/40 space-y-4 shadow-neo-raised-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
              Account Email
            </label>
            <p className="text-xs font-bold text-foreground">{email}</p>
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
              Active Sign-In Methods
            </label>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              {displayProviders}
            </span>
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
              Display Name
            </label>
            <p className="text-xs font-bold text-foreground">{displayName}</p>
          </div>

          <div>
            <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1">
              Target Role
            </label>
            <p className="text-xs font-bold text-primary">{targetRole}</p>
          </div>
        </div>

        <div className="pt-3 border-t border-border/30 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Want to update your password? We will send a secure reset link to your email.
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handlePasswordReset}
            disabled={isSendingReset}
            className="text-xs font-bold gap-1.5 h-8 px-3 rounded-xl border-border/60 hover:border-primary/40 shadow-neo-raised-sm"
          >
            <KeyRound className="h-3.5 w-3.5 text-primary" />
            <span>{isSendingReset ? "Sending..." : "Reset Password"}</span>
          </Button>
        </div>
      </div>

      {/* Danger Zone / Session Controls */}
      <div className="pt-4 border-t border-border/30 flex flex-wrap items-center justify-between gap-4">
        <Button
          size="sm"
          variant="outline"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="text-xs font-bold gap-2 h-9 px-4 rounded-xl border-border/60 hover:border-primary/40 shadow-neo-raised-sm"
        >
          <LogOut className="h-3.5 w-3.5 text-primary" />
          <span>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={handleDeleteAccount}
          className="text-xs font-bold gap-2 h-9 px-4 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete Account</span>
        </Button>
      </div>
    </div>
  );
};

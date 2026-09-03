import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Clock,
  ShieldCheck,
  Edit3,
  LogOut,
  AlertCircle,
  KeyRound,
  Check,
  UserCheck,
} from "lucide-react";
import { updateEmail, verifyBeforeUpdateEmail } from "firebase/auth";
import { useAuth } from "@/core/auth";
import { firebaseAuth } from "@/core/auth/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const {
    firebaseUser,
    authInitialized,
    reloadUser,
    syncVerifiedUser,
    resendVerificationEmail,
    signOutUser,
    getFriendlyErrorMessage,
  } = useAuth();

  const [isVerified, setIsVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [checking, setChecking] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Change Email Modal State
  const [isChangeEmailOpen, setIsChangeEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);

  const email = firebaseUser?.email || "your email address";

  // If already verified or user logs out, handle routing
  useEffect(() => {
    if (!authInitialized) return;

    if (!firebaseUser) {
      navigate("/login", { replace: true });
      return;
    }

    if (firebaseUser.emailVerified) {
      setIsVerified(true);
      void syncAndRedirect();
    }
  }, [authInitialized, firebaseUser]);

  const syncAndRedirect = async () => {
    try {
      await syncVerifiedUser();
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1200);
    } catch {
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1200);
    }
  };

  // Periodic automatic polling for email verification
  useEffect(() => {
    if (isVerified) return;

    const checkStatus = async () => {
      try {
        setChecking(true);
        const updated = await reloadUser();
        if (updated && updated.emailVerified) {
          setIsVerified(true);
          toast.success("Email verified successfully!");
          if (pollingRef.current) clearInterval(pollingRef.current);
          await syncAndRedirect();
        }
      } catch {
        // Silent error during background poll
      } finally {
        setChecking(false);
      }
    };

    void checkStatus();
    pollingRef.current = setInterval(checkStatus, 3500);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isVerified]);

  // Cooldown timer for resending verification email
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResendEmail = async () => {
    if (cooldown > 0) return;
    setResending(true);
    try {
      await resendVerificationEmail();
      setCooldown(30);
      toast.success("Custom verification email sent! Please check your inbox.");
    } catch (err: unknown) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  const handleChangeEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || newEmail.trim().toLowerCase() === email.toLowerCase()) {
      toast.error("Please enter a new, different email address.");
      return;
    }

    const user = firebaseAuth.currentUser || (firebaseUser as any);
    if (!user) {
      toast.error("No active session found. Please sign in again.");
      return;
    }

    try {
      setChangingEmail(true);
      const targetEmail = newEmail.trim().toLowerCase();

      // Modern Firebase email change mechanism
      if (typeof verifyBeforeUpdateEmail === "function") {
        await verifyBeforeUpdateEmail(user, targetEmail);
      } else {
        await updateEmail(user, targetEmail);
        await resendVerificationEmail();
      }

      await reloadUser();
      setIsChangeEmailOpen(false);
      setNewEmail("");
      setCooldown(30);
      toast.success(`Verification link sent to new email: ${targetEmail}`);
    } catch (err: any) {
      console.error("[VerifyEmailPage] Failed to change email:", err);
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setChangingEmail(false);
    }
  };

  const handleWrongEmail = async () => {
    await signOutUser();
    navigate("/register", { replace: true });
  };

  const handleBackToLogin = async () => {
    await signOutUser();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans selection:bg-primary/30">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/15 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Top Header Bar */}
      <header className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between max-w-7xl mx-auto z-20">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-cyan-500 flex items-center justify-center shadow-neo-raised group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight group-hover:text-primary transition-colors">
            Smart Skill Hub
          </span>
        </Link>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToLogin}
          className="text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </Button>
      </header>

      {/* Main Verification Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg my-auto pt-20 pb-10 relative z-10"
      >
        <div className="rounded-3xl bg-[#0d121f]/95 border border-slate-800 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          
          <AnimatePresence mode="wait">
            {isVerified ? (
              /* Success State */
              <motion.div
                key="verified-state"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 py-6 text-center"
              >
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white tracking-tight">Email Verified!</h3>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Your Smart Skill Hub workspace is ready.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-primary font-medium flex items-center justify-center gap-2 shadow-inner">
                  <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                  <span>Loading your personalized dashboard...</span>
                </div>
              </motion.div>
            ) : (
              /* Waiting State */
              <motion.div
                key="waiting-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Visual Header & Animated Envelope */}
                <div className="text-center space-y-3">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="w-16 h-16 rounded-3xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.35)]">
                      <Mail className="w-8 h-8 text-primary" />
                    </div>
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500" />
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary">
                      Check Your Inbox
                    </span>
                    <h2 className="text-2xl font-black text-white tracking-tight pt-1">
                      Verify your email
                    </h2>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                      We've dispatched a custom verification link to:
                    </p>
                    <div className="pt-1">
                      <span className="inline-block px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-mono font-bold text-cyan-300 shadow-inner">
                        {email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                    <span>Onboarding Progress</span>
                    <span className="text-primary font-black">Step 2 of 3</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-semibold">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-full h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> Account
                      </span>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-full h-1.5 rounded-full bg-primary animate-pulse" />
                      <span className="text-primary font-bold">
                        Verification
                      </span>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-full h-1.5 rounded-full bg-slate-800" />
                      <span className="text-slate-500">
                        SSH Access
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium py-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>Waiting for verification...</span>
                </div>

                {/* Actions Row */}
                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <Button
                    onClick={handleResendEmail}
                    disabled={resending || cooldown > 0}
                    className="w-full h-11 rounded-xl text-xs font-bold gap-2 bg-primary hover:bg-primary/90 text-white shadow-neo-raised"
                  >
                    {resending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending Branded Email...</span>
                      </>
                    ) : cooldown > 0 ? (
                      <>
                        <Clock className="w-4 h-4 text-slate-300" />
                        <span>Resend available in {cooldown}s</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Resend verification email</span>
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    {/* Change Email Dialog */}
                    <Dialog open={isChangeEmailOpen} onOpenChange={setIsChangeEmailOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-9 text-xs font-semibold border-slate-700 hover:bg-slate-800 text-slate-300 gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Change Email</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md bg-[#0d121f] border-slate-800 text-white">
                        <DialogHeader>
                          <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <Edit3 className="w-4 h-4 text-primary" />
                            <span>Change Account Email</span>
                          </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleChangeEmailSubmit} className="space-y-4 pt-2">
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Entered the wrong email? Enter your correct email address below. We'll send a fresh Smart Skill Hub verification email to your new address.
                          </p>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-300">New Email Address</label>
                            <Input
                              type="email"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              placeholder="developer@example.com"
                              required
                              className="h-10 bg-slate-900 border-slate-700 text-xs"
                              autoFocus
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setIsChangeEmailOpen(false)}
                              className="text-xs"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={changingEmail || !newEmail.trim()}
                              className="text-xs font-bold gap-1.5"
                            >
                              {changingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                              <span>Update & Send Link</span>
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBackToLogin}
                      className="flex-1 h-9 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      Back to Sign In
                    </Button>
                  </div>

                  {/* Wrong Email direct helper */}
                  <div className="text-center text-xs text-slate-400 pt-1">
                    Wrong email?{" "}
                    <button
                      type="button"
                      onClick={handleWrongEmail}
                      className="text-primary font-semibold hover:underline cursor-pointer"
                    >
                      Correct your email
                    </button>
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </div>
  );
}

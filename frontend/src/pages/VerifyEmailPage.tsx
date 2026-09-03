import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  LogOut,
  Clock,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/core/auth";
import { Button } from "@/components/ui/button";
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
      }, 1500);
    } catch {
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1500);
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
      } catch (err) {
        // Silent error during polling
      } finally {
        setChecking(false);
      }
    };

    // Check immediately on mount, then start interval
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
      toast.success("Verification email sent! Please check your inbox.");
    } catch (err: unknown) {
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  const handleWrongEmail = async () => {
    await signOutUser();
    navigate("/register");
  };

  return (
    <div className="min-h-screen bg-[#070A12] text-foreground flex flex-col justify-center items-center px-4 relative overflow-hidden selection:bg-indigo-500/30">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Header bar */}
      <header className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between max-w-7xl mx-auto z-20">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)] group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight group-hover:text-indigo-200 transition-colors">
            Smart Skill Hub
          </span>
        </Link>
      </header>

      {/* Main Verification Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md my-auto pt-16 pb-8"
      >
        <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] text-center">
          
          <AnimatePresence mode="wait">
            {isVerified ? (
              /* Success State */
              <motion.div
                key="verified-state"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 py-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">Email Verified!</h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    Your Smart Skill Hub account is active.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 text-xs text-indigo-300 flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Preparing your developer workspace...</span>
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
                {/* Animated Email Icon */}
                <div className="relative w-16 h-16 mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-[0_0_25px_rgba(99,102,241,0.25)]">
                    <Mail className="w-8 h-8" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500" />
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">Verify your email</h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                    We've sent a verification link to:
                  </p>
                  <div className="mt-2 inline-block px-3 py-1 rounded-lg bg-slate-950 border border-white/10 text-xs font-mono font-bold text-indigo-300">
                    {email}
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Check your inbox and click the link to activate your developer account. This page will automatically update once verified.
                </p>

                {/* Auto Status Indicator */}
                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium py-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>Waiting for verification...</span>
                </div>

                {/* Resend Action */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <Button
                    onClick={handleResendEmail}
                    disabled={resending || cooldown > 0}
                    variant="outline"
                    className="w-full h-10 rounded-xl text-xs font-semibold border-white/10 bg-slate-950/60 hover:bg-white/10 text-white"
                  >
                    {resending ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin text-indigo-400" /> Sending...
                      </>
                    ) : cooldown > 0 ? (
                      <>
                        <Clock className="w-3.5 h-3.5 mr-2 text-slate-400" /> Resend available in {cooldown}s
                      </>
                    ) : (
                      <>
                        Resend verification email
                      </>
                    )}
                  </Button>

                  {/* Wrong Email Flow */}
                  <div className="text-center text-xs text-slate-400 pt-1">
                    Wrong email?{" "}
                    <button
                      type="button"
                      onClick={handleWrongEmail}
                      className="text-indigo-400 font-semibold hover:underline cursor-pointer"
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

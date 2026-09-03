import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";
import {
  CheckCircle2,
  XCircle,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  MailCheck,
} from "lucide-react";
import { firebaseAuth } from "@/core/auth/firebase";
import { useAuth } from "@/core/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type ActionMode = "verifyEmail" | "resetPassword" | "unknown";
type ActionStatus = "loading" | "success" | "error" | "ready";

export default function AuthActionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { reloadUser, syncVerifiedUser, signOutUser } = useAuth();

  const mode = (searchParams.get("mode") as ActionMode) || "unknown";
  const oobCode = searchParams.get("oobCode") || "";

  const [status, setStatus] = useState<ActionStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [accountEmail, setAccountEmail] = useState("");

  // Password Reset Form State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!oobCode) {
      setStatus("error");
      setErrorMessage("Invalid or missing action code. Please request a new link.");
      return;
    }

    if (mode === "verifyEmail") {
      handleEmailVerification(oobCode);
    } else if (mode === "resetPassword") {
      handleVerifyResetCode(oobCode);
    } else {
      setStatus("error");
      setErrorMessage(`Unsupported authentication action mode: ${mode}`);
    }
  }, [mode, oobCode]);

  // ==========================================
  // MODE 1: EMAIL VERIFICATION
  // ==========================================
  const handleEmailVerification = async (code: string) => {
    try {
      setStatus("loading");
      await applyActionCode(firebaseAuth, code);

      // If user is currently signed in on this browser, reload auth state & synchronize with MongoDB
      if (firebaseAuth.currentUser) {
        await reloadUser();
        await syncVerifiedUser();
      }

      setStatus("success");
      toast.success("Email address verified successfully!");
    } catch (error: any) {
      console.error("[AuthAction] Email verification failed:", error);
      setStatus("error");
      const codeStr = error.code || "";
      if (codeStr === "auth/invalid-action-code") {
        setErrorMessage("This verification link is invalid or has already been used.");
      } else if (codeStr === "auth/expired-action-code") {
        setErrorMessage("This verification link has expired. Please request a new one.");
      } else {
        setErrorMessage(error.message || "Failed to verify email address. Please try again.");
      }
    }
  };

  // ==========================================
  // MODE 2: PASSWORD RESET
  // ==========================================
  const handleVerifyResetCode = async (code: string) => {
    try {
      setStatus("loading");
      const email = await verifyPasswordResetCode(firebaseAuth, code);
      setAccountEmail(email);
      setStatus("ready");
    } catch (error: any) {
      console.error("[AuthAction] Password reset code verification failed:", error);
      setStatus("error");
      const codeStr = error.code || "";
      if (codeStr === "auth/invalid-action-code") {
        setErrorMessage("This password reset link is invalid or has already been used.");
      } else if (codeStr === "auth/expired-action-code") {
        setErrorMessage("This password reset link has expired. Please request a new one.");
      } else {
        setErrorMessage(error.message || "Failed to verify password reset code.");
      }
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      await confirmPasswordReset(firebaseAuth, oobCode, newPassword);
      setStatus("success");
      toast.success("Your password has been updated successfully!");
    } catch (error: any) {
      console.error("[AuthAction] Confirm password reset failed:", error);
      toast.error(error.message || "Failed to update password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans text-slate-100 selection:bg-primary/30">
      {/* Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-primary/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8 group">
          <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-neo-raised group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              Smart Skill Hub
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                Security
              </span>
            </span>
          </div>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#0d121f]/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6"
        >
          {/* ==========================================
              STATE: LOADING
             ========================================== */}
          {status === "loading" && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-neo-raised">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">
                  {mode === "verifyEmail" ? "Verifying your email..." : "Validating security link..."}
                </h3>
                <p className="text-xs text-slate-400">
                  Please hold on while we secure your account credentials.
                </p>
              </div>
            </div>
          )}

          {/* ==========================================
              STATE: ERROR
             ========================================== */}
          {status === "error" && (
            <div className="py-6 flex flex-col items-center justify-center space-y-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-neo-raised">
                <XCircle className="w-7 h-7 text-rose-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white">Verification Link Issue</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  {errorMessage}
                </p>
              </div>

              <div className="pt-2 w-full space-y-3">
                {mode === "verifyEmail" ? (
                  <Button
                    onClick={() => navigate("/verify-email")}
                    className="w-full h-11 text-xs font-bold gap-2 shadow-neo-raised-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Request New Verification Email</span>
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate("/forgot-password")}
                    className="w-full h-11 text-xs font-bold gap-2 shadow-neo-raised-sm"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Request New Password Reset</span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => navigate("/login")}
                  className="w-full h-11 text-xs font-bold border-slate-700 hover:bg-slate-800/80"
                >
                  Back to Sign In
                </Button>
              </div>
            </div>
          )}

          {/* ==========================================
              STATE: EMAIL VERIFICATION SUCCESS
             ========================================== */}
          {status === "success" && mode === "verifyEmail" && (
            <div className="py-6 flex flex-col items-center justify-center space-y-5 text-center">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-neo-raised animate-in zoom-in-95 duration-300">
                <MailCheck className="w-8 h-8 text-emerald-400" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-black uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Email Verified</span>
                </div>
                <h3 className="text-xl font-black text-white">Welcome to Smart Skill Hub!</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Your email address has been confirmed. You now have full access to your career roadmap, skill gaps, EduTube layer, and developer sandbox.
                </p>
              </div>

              <div className="pt-4 w-full">
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="w-full h-12 text-xs font-black uppercase tracking-wider gap-2 bg-gradient-to-r from-primary to-cyan-500 hover:opacity-95 shadow-neo-raised transition-all"
                >
                  <span>Enter Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ==========================================
              STATE: PASSWORD RESET FORM (READY)
             ========================================== */}
          {status === "ready" && mode === "resetPassword" && (
            <form onSubmit={handlePasswordResetSubmit} className="space-y-5">
              <div className="text-center space-y-1.5 pb-2 border-b border-slate-800/80">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white">Reset Your Password</h3>
                {accountEmail && (
                  <p className="text-xs text-slate-400">
                    Account: <strong className="text-slate-200">{accountEmail}</strong>
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">New Password</label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      required
                      minLength={8}
                      className="pl-10 pr-10 h-11 bg-slate-900/80 border-slate-700 text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-400 hover:text-white"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Confirm Password</label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                      minLength={8}
                      className="pl-10 pr-10 h-11 bg-slate-900/80 border-slate-700 text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting || !newPassword || !confirmPassword}
                className="w-full h-11 text-xs font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-neo-raised"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </Button>
            </form>
          )}

          {/* ==========================================
              STATE: PASSWORD RESET SUCCESS
             ========================================== */}
          {status === "success" && mode === "resetPassword" && (
            <div className="py-6 flex flex-col items-center justify-center space-y-5 text-center">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-neo-raised">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">Password Reset Complete!</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Your Smart Skill Hub password has been updated securely. You can now sign in with your new credentials.
                </p>
              </div>

              <div className="pt-4 w-full">
                <Button
                  onClick={() => navigate("/login")}
                  className="w-full h-12 text-xs font-black uppercase tracking-wider gap-2 bg-gradient-to-r from-primary to-cyan-500 hover:opacity-95 shadow-neo-raised"
                >
                  <span>Sign In Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

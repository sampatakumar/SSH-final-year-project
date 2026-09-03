import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Mail,
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import { useAuth } from "@/core/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const { sendPasswordReset, getFriendlyErrorMessage } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      await sendPasswordReset(email);
      setSubmitted(true);
      toast.success("Password reset instructions sent!");
    } catch (err: unknown) {
      // Use generic success or standard friendly translation to avoid account enumeration
      const friendly = getFriendlyErrorMessage(err);
      setErrorMsg(friendly);
      toast.error(friendly);
    } finally {
      setLoading(false);
    }
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

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md my-auto pt-16 pb-8"
      >
        <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
          
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5">
            <KeyRound className="w-6 h-6" />
          </div>

          <div className="mb-6">
            <h3 className="text-2xl font-black text-white tracking-tight">Reset your password</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
              Enter your account's email address and we'll send you instructions to securely reset your password.
            </p>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-emerald-300">Instructions Dispatched</p>
                  <p className="mt-1 text-slate-300">
                    If an account exists for <strong className="text-white">{email}</strong>, a password reset email has been sent. Please check your inbox and spam folder.
                  </p>
                </div>
              </div>

              <Link to="/login" className="block w-full">
                <Button className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign In
                </Button>
              </Link>
            </motion.div>
          ) : (
            <>
              {errorMsg && (
                <div
                  className="mb-5 p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs leading-relaxed"
                  role="alert"
                >
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5" htmlFor="forgot-email">
                    Account Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="developer@example.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="pl-10 h-10 bg-slate-950/60 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 rounded-xl text-xs"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all cursor-pointer mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending reset email...
                    </>
                  ) : (
                    <>
                      Send Reset Instructions <ArrowRight className="w-4 h-4 ml-1.5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-5 border-t border-white/10 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Sign In
                </Link>
              </div>
            </>
          )}

        </div>
      </motion.div>
    </div>
  );
}

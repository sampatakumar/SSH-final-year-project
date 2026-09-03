import React, { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle2,
  GitBranch,
  GraduationCap,
  Briefcase,
  Target,
} from "lucide-react";
import { useAuth } from "@/core/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawReturnTo = searchParams.get("returnTo") || "/dashboard";
  const returnTo = rawReturnTo.startsWith("/") && !rawReturnTo.startsWith("//") ? rawReturnTo : "/dashboard";

  const {
    registerWithEmail,
    signInWithGoogle,
    signInWithGithub,
    getFriendlyErrorMessage,
  } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingGithub, setLoadingGithub] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isSubmitting = loadingEmail || loadingGoogle || loadingGithub;

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: "None", color: "bg-slate-700" };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    switch (score) {
      case 0:
      case 1:
        return { score: 25, label: "Weak", color: "bg-rose-500", text: "text-rose-400" };
      case 2:
        return { score: 50, label: "Fair", color: "bg-amber-500", text: "text-amber-400" };
      case 3:
        return { score: 75, label: "Good", color: "bg-indigo-500", text: "text-indigo-400" };
      case 4:
        return { score: 100, label: "Strong", color: "bg-emerald-500", text: "text-emerald-400" };
      default:
        return { score: 25, label: "Weak", color: "bg-rose-500", text: "text-rose-400" };
    }
  }, [password]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || displayName.trim().length < 2) {
      setErrorMsg("Please enter your full name (at least 2 characters).");
      return;
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    setErrorMsg(null);
    setLoadingEmail(true);

    try {
      await registerWithEmail(email, password, displayName);
      toast.success("Account created! We've sent a verification link to your email.");
      navigate("/verify-email", { replace: true });
    } catch (err: unknown) {
      const friendly = getFriendlyErrorMessage(err);
      setErrorMsg(friendly);
      toast.error(friendly);
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoadingGoogle(true);
    try {
      await signInWithGoogle();
      toast.success("Signed in with Google!");
      navigate(returnTo, { replace: true });
    } catch (err: unknown) {
      const friendly = getFriendlyErrorMessage(err);
      setErrorMsg(friendly);
      toast.error(friendly);
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleGithubSignIn = async () => {
    setErrorMsg(null);
    setLoadingGithub(true);
    try {
      await signInWithGithub();
      toast.success("Signed in with GitHub!");
      navigate(returnTo, { replace: true });
    } catch (err: unknown) {
      const friendly = getFriendlyErrorMessage(err);
      setErrorMsg(friendly);
      toast.error(friendly);
    } finally {
      setLoadingGithub(false);
    }
  };

  const journeySteps = [
    { icon: User, title: "1. Create Developer Identity", desc: "Consolidate skills, bio, target role, and education" },
    { icon: GitBranch, title: "2. Connect GitHub Intelligence", desc: "Automate repository health, README, and code metrics" },
    { icon: Target, title: "3. Identify Priority Skill Gaps", desc: "Get benchmarked against real employer job requirements" },
    { icon: GraduationCap, title: "4. Master Topics in EduTube", desc: "Curated learning tracks with progress & code sandbox" },
    { icon: Briefcase, title: "5. Land Top Tech Roles", desc: "ATS-optimized resumes and live hosted developer portfolios" },
  ];

  return (
    <div className="min-h-screen bg-[#070A12] text-foreground flex flex-col justify-center relative overflow-hidden selection:bg-indigo-500/30">
      {/* Ambient glows */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Header bar with Brand */}
      <header className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between max-w-7xl mx-auto z-20">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)] group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight group-hover:text-indigo-200 transition-colors">
            Smart Skill Hub
          </span>
        </Link>

        <Link
          to="/login"
          className="text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-colors"
        >
          Already have an account? <span className="text-indigo-400 font-semibold underline-offset-4 hover:underline">Sign in</span>
        </Link>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-28 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Developer Journey Visualization (Desktop) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-7 pr-6"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Start Your Career Journey
            </div>
            <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
              One account. <br />
              One developer identity. <br />
              <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                Everything connected.
              </span>
            </h2>
            <p className="text-slate-400 text-sm mt-3 max-w-md leading-relaxed">
              Join thousands of developers leveling up with automated AI mentoring, skill gap analysis, and interactive EduTube courses.
            </p>
          </div>

          {/* Timeline steps */}
          <div className="space-y-3 pt-1">
            {journeySteps.map((step, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.08] backdrop-blur-md flex items-center gap-3.5 hover:border-purple-500/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <step.icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{step.title}</h4>
                  <p className="text-[11px] text-slate-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Zero password storage in database • Firebase JWT security</span>
          </div>
        </motion.div>

        {/* Right Column: Registration Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-6 w-full max-w-md mx-auto"
        >
          <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
            
            {/* Card Title */}
            <div className="mb-6">
              <h3 className="text-2xl font-black text-white tracking-tight">Create your account</h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Build your verified developer intelligence profile.
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs leading-relaxed"
                role="alert"
                aria-live="polite"
              >
                {errorMsg}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              
              {/* Full Name */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1" htmlFor="fullname-input">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    id="fullname-input"
                    type="text"
                    placeholder="Alex Morgan"
                    autoComplete="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={isSubmitting}
                    className="pl-10 h-10 bg-slate-950/60 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 rounded-xl text-xs"
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1" htmlFor="reg-email-input">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    id="reg-email-input"
                    type="email"
                    placeholder="alex@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="pl-10 h-10 bg-slate-950/60 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 rounded-xl text-xs"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1" htmlFor="reg-password-input">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    id="reg-password-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="pl-10 pr-10 h-10 bg-slate-950/60 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 rounded-xl text-xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">Password Strength</span>
                      <span className={`font-bold ${passwordStrength.text || "text-slate-400"}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1" htmlFor="reg-confirm-password-input">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    id="reg-confirm-password-input"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="pl-10 pr-10 h-10 bg-slate-950/60 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500 rounded-xl text-xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all cursor-pointer mt-2"
              >
                {loadingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...
                  </>
                ) : (
                  <>
                    Create Account <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </Button>
            </form>

            {/* Social Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                <span className="bg-slate-900 px-3 text-slate-400 font-bold">
                  OR REGISTER WITH
                </span>
              </div>
            </div>

            {/* Social Auth Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-white/10 bg-slate-950/60 hover:bg-white/[0.06] hover:border-white/20 text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
              >
                {loadingGoogle ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.1 7.5 23 12 23z"
                    />
                  </svg>
                )}
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={handleGithubSignIn}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-white/10 bg-slate-950/60 hover:bg-white/[0.06] hover:border-white/20 text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
              >
                {loadingGithub ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                ) : (
                  <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                )}
                <span>GitHub</span>
              </button>
            </div>

            {/* Bottom link */}
            <div className="mt-5 text-center text-xs text-slate-400">
              Already have an account?{" "}
              <Link to="/login" className="text-indigo-400 font-semibold hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

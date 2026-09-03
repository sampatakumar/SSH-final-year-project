import React from "react";
import { ArrowRight, Sparkles, Zap, Shield, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductPreview } from "./ProductPreview";
import { motion } from "framer-motion";

interface HeroSectionProps {
  onGetStarted: () => void;
  onLiveDemo: () => void;
  loading?: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onGetStarted,
  onLiveDemo,
  loading = false,
}) => {
  const trustIndicators = [
    {
      icon: Sparkles,
      title: "AI-Powered",
      subtitle: "Smart Mentor",
    },
    {
      icon: Zap,
      title: "10+ Tools",
      subtitle: "All In One Platform",
    },
    {
      icon: CheckCircle2,
      title: "100% Free",
      subtitle: "To Get Started",
    },
    {
      icon: Shield,
      title: "Secure",
      subtitle: "Your Data is Safe",
    },
  ];

  return (
    <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Copy & Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 flex flex-col items-start text-left"
          >
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-6 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>All-in-One Career Growth Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] mb-6">
              Learn. Build. Grow.
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                Get Hired.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-slate-300 mb-8 leading-relaxed font-normal">
              Smart Skill Hub is your AI-powered career companion that helps you learn smarter, build better projects, showcase your skills, and land your dream job.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto mb-10">
              <Button
                onClick={onGetStarted}
                disabled={loading}
                className="h-12 px-6 rounded-xl text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.45)] hover:shadow-[0_0_30px_rgba(99,102,241,0.65)] active:scale-95 transition-all cursor-pointer border-0 w-full sm:w-auto"
              >
                Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <button
                onClick={onLiveDemo}
                className="h-12 px-6 rounded-xl text-sm sm:text-base font-semibold text-slate-200 hover:text-white bg-[#111726]/80 hover:bg-[#161F33] border border-white/10 hover:border-white/20 transition-all cursor-pointer w-full sm:w-auto"
              >
                View Live Demo
              </button>
            </div>

            {/* 4 Trust Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/[0.08] w-full">
              {trustIndicators.map((item) => (
                <div key={item.title} className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-0.5">
                    <item.icon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{item.title}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{item.subtitle}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Column: SaaS Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-7 flex justify-center w-full"
          >
            <ProductPreview />
          </motion.div>

        </div>
      </div>
    </section>
  );
};

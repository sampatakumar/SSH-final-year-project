import React from "react";
import {
  MessageSquare,
  BarChart3,
  Target,
  BookOpen,
  PlaySquare,
  Code2,
  GitBranch,
  FileText,
  Briefcase,
  TrendingUp,
} from "lucide-react";
import { FeatureCard, FeatureItem } from "./FeatureCard";
import { motion } from "framer-motion";

interface FeatureGridProps {
  onFeatureSelect: (route?: string) => void;
}

export const FeatureGrid: React.FC<FeatureGridProps> = ({ onFeatureSelect }) => {
  const features: FeatureItem[] = [
    {
      icon: MessageSquare,
      title: "Smart Mentor",
      desc: "Your AI mentor that understands your goals, analyzes your progress, and gives personalized guidance 24/7.",
      accentColor: "text-purple-400",
      badgeBg: "bg-purple-500/10 border-purple-500/30",
      glowColor: "#A855F7",
      route: "/dashboard/mentor",
    },
    {
      icon: BarChart3,
      title: "Skill Profile",
      desc: "Get a detailed analysis of your technical and soft skills with proficiency levels and recommendations.",
      accentColor: "text-emerald-400",
      badgeBg: "bg-emerald-500/10 border-emerald-500/30",
      glowColor: "#10B981",
      route: "/dashboard/skills",
    },
    {
      icon: Target,
      title: "Skill Gaps",
      desc: "Discover skill gaps for your target role and get a prioritized learning plan to bridge them faster.",
      accentColor: "text-rose-400",
      badgeBg: "bg-rose-500/10 border-rose-500/30",
      glowColor: "#F43F5E",
      route: "/dashboard/gaps",
    },
    {
      icon: BookOpen,
      title: "Learning Roadmap",
      desc: "Personalized roadmap with topics, resources, and milestones tailored to your career goals.",
      accentColor: "text-cyan-400",
      badgeBg: "bg-cyan-500/10 border-cyan-500/30",
      glowColor: "#06B6D4",
      route: "/dashboard/roadmap",
    },
    {
      icon: PlaySquare,
      title: "EduTube",
      desc: "Curated YouTube learning recommendations based on your skill gaps and roadmap.",
      accentColor: "text-pink-400",
      badgeBg: "bg-pink-500/10 border-pink-500/30",
      glowColor: "#EC4899",
      route: "/dashboard/edutube",
    },
    {
      icon: Code2,
      title: "Coding Assessment",
      desc: "Test your coding skills with real-world problems and get instant AI-powered feedback.",
      accentColor: "text-sky-400",
      badgeBg: "bg-sky-500/10 border-sky-500/30",
      glowColor: "#0EA5E9",
      route: "/dashboard/coding",
    },
    {
      icon: GitBranch,
      title: "GitHub Intelligence",
      desc: "AI analyzes your GitHub repos, code quality, README, and gives improvement tips.",
      accentColor: "text-indigo-400",
      badgeBg: "bg-indigo-500/10 border-indigo-500/30",
      glowColor: "#6366F1",
      route: "/dashboard/github",
    },
    {
      icon: FileText,
      title: "Resume AI",
      desc: "Build an ATS-friendly resume with AI suggestions and role-based optimization.",
      accentColor: "text-violet-400",
      badgeBg: "bg-violet-500/10 border-violet-500/30",
      glowColor: "#8B5CF6",
      route: "/dashboard/resumes",
    },
    {
      icon: Briefcase,
      title: "Portfolios",
      desc: "Deploy your portfolio in one click and showcase your work to the world.",
      accentColor: "text-purple-400",
      badgeBg: "bg-purple-500/10 border-purple-500/30",
      glowColor: "#7C6CFF",
      route: "/dashboard/portfolios",
    },
    {
      icon: TrendingUp,
      title: "Analytics",
      desc: "Track your progress, learning streaks, skill growth, and achievements over time.",
      accentColor: "text-amber-400",
      badgeBg: "bg-amber-500/10 border-amber-500/30",
      glowColor: "#F59E0B",
      route: "/dashboard/analytics",
    },
  ];

  return (
    <section id="features" className="py-20 sm:py-28 relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">
            Everything You Need to Accelerate Your Career
          </h2>
          <p className="text-base sm:text-lg text-slate-300">
            Powerful tools and AI guidance to help you learn, build, and grow continuously.
          </p>
        </motion.div>

        {/* 10 Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 sm:gap-6">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              feature={feature}
              onClick={() => onFeatureSelect(feature.route)}
            />
          ))}
        </div>

      </div>
    </section>
  );
};

import React from "react";
import { ArrowRight, LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

export interface FeatureItem {
  icon: LucideIcon;
  title: string;
  desc: string;
  accentColor: string; // Tailwind color class e.g. "text-purple-400"
  badgeBg: string;     // Tailwind bg class e.g. "bg-purple-500/10 border-purple-500/20"
  glowColor: string;   // Custom glow rgba
  route?: string;
}

interface FeatureCardProps {
  feature: FeatureItem;
  onClick: () => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ feature, onClick }) => {
  const Icon = feature.icon;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onClick={onClick}
      className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-[#0D111C]/90 border border-white/[0.08] hover:border-indigo-500/40 hover:bg-[#111726] shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] transition-all cursor-pointer overflow-hidden"
    >
      {/* Subtle top corner ambient glow on hover */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none"
        style={{ backgroundColor: feature.glowColor }}
      />

      <div>
        {/* Icon container */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 border ${feature.badgeBg} group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className={`w-6 h-6 ${feature.accentColor}`} />
        </div>

        {/* Feature Title */}
        <h3 className="text-lg font-bold text-white mb-2.5 tracking-tight group-hover:text-indigo-200 transition-colors">
          {feature.title}
        </h3>

        {/* Feature Description */}
        <p className="text-sm text-slate-300 leading-relaxed font-normal">
          {feature.desc}
        </p>
      </div>

      {/* Learn more footer link */}
      <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
        <span>Learn more</span>
        <ArrowRight className="w-3.5 h-3.5 ml-1.5 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </motion.div>
  );
};

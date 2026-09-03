import React from "react";
import { UserPlus, Sparkles, Rocket } from "lucide-react";
import { motion } from "framer-motion";

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      stepNumber: "1",
      title: "1. Create Your Profile",
      desc: "Tell us about your skills, goals, and experience.",
      icon: UserPlus,
      color: "text-indigo-400",
      glow: "shadow-[0_0_30px_rgba(99,102,241,0.3)]",
      border: "border-indigo-500/30",
    },
    {
      stepNumber: "2",
      title: "2. Get AI Analysis",
      desc: "Our AI analyzes your profile, GitHub, and skills to create your roadmap.",
      icon: Sparkles,
      color: "text-purple-400",
      glow: "shadow-[0_0_30px_rgba(168,85,247,0.3)]",
      border: "border-purple-500/30",
    },
    {
      stepNumber: "3",
      title: "3. Learn, Build & Grow",
      desc: "Follow your roadmap, build projects, and achieve your dream career.",
      icon: Rocket,
      color: "text-rose-400",
      glow: "shadow-[0_0_30px_rgba(244,63,94,0.3)]",
      border: "border-rose-500/30",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">
            How It Works
          </h2>
          <p className="text-base sm:text-lg text-slate-300">
            Get started in 3 simple steps
          </p>
        </motion.div>

        {/* 3 Step Workflow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 sm:gap-8 relative">
          
          {/* Subtle Desktop Connector Line */}
          <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-[2px] bg-gradient-to-r from-indigo-500/20 via-purple-500/40 to-rose-500/20 -z-0" />

          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="flex flex-col items-center text-center relative z-10"
              >
                {/* Glowing Circle Icon Container */}
                <div
                  className={`w-24 h-24 rounded-full bg-[#0D111C] border ${item.border} ${item.glow} flex items-center justify-center mb-6 group transition-transform duration-300 hover:scale-105`}
                >
                  <Icon className={`w-10 h-10 ${item.color}`} />
                </div>

                {/* Step Title */}
                <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
                  {item.title}
                </h3>

                {/* Step Description */}
                <p className="text-sm text-slate-300 max-w-xs leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

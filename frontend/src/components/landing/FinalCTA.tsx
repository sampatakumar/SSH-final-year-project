import React from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface FinalCTAProps {
  onGetStarted: () => void;
  loading?: boolean;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onGetStarted, loading = false }) => {
  return (
    <section className="py-20 sm:py-28 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">
            Ready to Accelerate Your Career?
          </h2>
          <p className="text-base sm:text-lg text-slate-300 mb-8 font-normal">
            Join thousands of learners already growing with Smart Skill Hub.
          </p>

          <Button
            onClick={onGetStarted}
            disabled={loading}
            className="h-12 px-8 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:shadow-[0_0_40px_rgba(99,102,241,0.7)] active:scale-95 transition-all cursor-pointer border-0 inline-flex items-center gap-2"
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

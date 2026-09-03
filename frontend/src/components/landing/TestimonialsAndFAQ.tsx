import React, { useState } from "react";
import { Star, Plus, Minus, Quote } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const TestimonialsAndFAQ: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const testimonials = [
    {
      quote:
        "Smart Mentor guided me better than any human mentor. It helped me crack my interview!",
      name: "Ananya R.",
      role: "Frontend Developer",
      avatarBg: "bg-rose-500",
      initials: "AR",
    },
    {
      quote:
        "The skill gap analysis is incredibly accurate. It saved me so much time!",
      name: "Rohit S.",
      role: "Backend Developer",
      avatarBg: "bg-blue-500",
      initials: "RS",
    },
    {
      quote:
        "I built my portfolio and got hired using the roadmap suggested by SSH.",
      name: "Neha K.",
      role: "Full Stack Developer",
      avatarBg: "bg-purple-500",
      initials: "NK",
    },
  ];

  const faqs = [
    {
      q: "Is Smart Skill Hub really free?",
      a: "Yes! Smart Skill Hub is free to get started. You can analyze your skills, discover skill gaps, access learning roadmaps, practice coding assessments, and receive personalized AI guidance without any payment.",
    },
    {
      q: "How does the AI Mentor work?",
      a: "Smart Mentor connects your profile, GitHub repositories, skill gap analysis, and learning roadmap. It provides contextual advice and has deterministic fallbacks to guarantee 24/7 responsiveness.",
    },
    {
      q: "Can I connect my GitHub account?",
      a: "Yes. You can link your GitHub profile to inspect repository health, code cleanliness, README completeness, and get automated suggestions for portfolio projects.",
    },
    {
      q: "Is my data secure?",
      a: "Yes. Smart Skill Hub utilizes Firebase authentication and secure database protocols. Your personal details, resumes, and project code are never sold or shared with third parties.",
    },
    {
      q: "How accurate is the skill gap analysis?",
      a: "Our skill gap engine evaluates your technical stack against modern industry requirements and target job profiles, pinpointing specific high-priority tools and concepts to bridge.",
    },
    {
      q: "What is EduTube and does it download YouTube videos?",
      a: "EduTube is an educational discovery layer that organizes high-quality programming tutorials using official embedded YouTube players. It provides watch history, notes, and playlists, and does not download videos.",
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <section id="testimonials" className="py-20 sm:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Side by side grid on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14">
          
          {/* Left Column: Loved by Learners */}
          <div className="lg:col-span-6 flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
                Loved by Learners
              </h2>
              <p className="text-sm sm:text-base text-slate-300">
                See what our users say about Smart Skill Hub
              </p>
            </motion.div>

            {/* 3 Testimonial Cards */}
            <div className="space-y-4">
              {testimonials.map((t, idx) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="p-5 sm:p-6 rounded-2xl bg-[#0D111C]/90 border border-white/[0.08] hover:border-indigo-500/30 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                >
                  <Quote className="w-5 h-5 text-indigo-400/60 mb-3" />
                  <p className="text-sm text-slate-200 font-normal leading-relaxed mb-4">
                    "{t.quote}"
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full ${t.avatarBg} flex items-center justify-center text-xs font-bold text-white shadow-sm`}
                      >
                        {t.initials}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{t.name}</div>
                        <div className="text-xs text-slate-400">{t.role}</div>
                      </div>
                    </div>

                    {/* 5 Stars */}
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Column: Frequently Asked Questions */}
          <div id="faq" className="lg:col-span-6 flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
                Frequently Asked Questions
              </h2>
              <p className="text-sm sm:text-base text-slate-300">
                Everything you need to know about the platform
              </p>
            </motion.div>

            {/* Accordion List */}
            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <motion.div
                    key={faq.q}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="rounded-xl bg-[#0D111C]/90 border border-white/[0.08] overflow-hidden transition-colors hover:border-white/15"
                  >
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left text-sm sm:text-base font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer"
                      aria-expanded={isOpen}
                    >
                      <span className="pr-4">{faq.q}</span>
                      <div className="w-6 h-6 rounded-md bg-white/[0.04] flex items-center justify-center shrink-0 text-slate-400">
                        {isOpen ? <Minus className="w-4 h-4 text-indigo-400" /> : <Plus className="w-4 h-4" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/[0.04]">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

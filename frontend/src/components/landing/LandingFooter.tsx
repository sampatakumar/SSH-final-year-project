import React from "react";
import { Sparkles, Twitter, Github, Linkedin, Youtube, Instagram } from "lucide-react";

export const LandingFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <footer className="border-t border-white/[0.08] bg-[#05070D] text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 lg:gap-8 mb-12">
          
          {/* Brand Info (2 cols) */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.4)]">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-base text-white tracking-tight">
                Smart Skill Hub
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 mb-6 max-w-sm leading-relaxed">
              Your AI-powered career companion to learn, build, and grow.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 text-slate-400">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter / X"
                className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:text-white hover:border-indigo-500/40 hover:bg-white/[0.06] transition-all"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:text-white hover:border-indigo-500/40 hover:bg-white/[0.06] transition-all"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:text-white hover:border-indigo-500/40 hover:bg-white/[0.06] transition-all"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:text-white hover:border-indigo-500/40 hover:bg-white/[0.06] transition-all"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:text-white hover:border-indigo-500/40 hover:bg-white/[0.06] transition-all"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-3">
            <div className="font-semibold text-xs text-white uppercase tracking-wider">
              Platform
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="#features"
                  onClick={(e) => handleSmoothScroll(e, "#features")}
                  className="hover:text-white transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  onClick={(e) => handleSmoothScroll(e, "#how-it-works")}
                  className="hover:text-white transition-colors"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  onClick={(e) => handleSmoothScroll(e, "#pricing")}
                  className="hover:text-white transition-colors"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#roadmap"
                  onClick={(e) => handleSmoothScroll(e, "#roadmap")}
                  className="hover:text-white transition-colors"
                >
                  Roadmap
                </a>
              </li>
            </ul>
          </div>

          {/* Resources Links */}
          <div className="space-y-3">
            <div className="font-semibold text-xs text-white uppercase tracking-wider">
              Resources
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                  Blog
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                  Docs
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                  Guides
                </span>
              </li>
              <li>
                <a
                  href="#features"
                  onClick={(e) => handleSmoothScroll(e, "#features")}
                  className="hover:text-white transition-colors"
                >
                  YouTube
                </a>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-3">
            <div className="font-semibold text-xs text-white uppercase tracking-wider">
              Company
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                  About Us
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                  Contact
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                  Terms of Service
                </span>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-3">
            <div className="font-semibold text-xs text-white uppercase tracking-wider">
              Legal
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <span className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                  Refund Policy
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 border-t border-white/[0.06] text-center text-xs text-slate-400">
          © {currentYear} Smart Skill Hub. All rights reserved.
        </div>

      </div>
    </footer>
  );
};

import React from "react";

export const TechStrip: React.FC = () => {
  const technologies = [
    {
      name: "React",
      icon: (
        <svg className="w-5 h-5 text-cyan-400" viewBox="-11.5 -10.23174 23 20.46348" fill="currentColor">
          <circle cx="0" cy="0" r="2.05" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="1" fill="none">
            <ellipse rx="11" ry="4.2" />
            <ellipse rx="11" ry="4.2" transform="rotate(60)" />
            <ellipse rx="11" ry="4.2" transform="rotate(120)" />
          </g>
        </svg>
      ),
    },
    {
      name: "Node.js",
      icon: (
        <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L3 7.5v9L12 22l9-5.5v-9L12 2zm0 2.31l6.75 4.13-2.62 1.6-4.13-2.53-4.13 2.53-2.62-1.6L12 4.31zM4.5 9.08l6.75 4.13v8.25L4.5 17.33V9.08zm15 8.25l-6.75 4.13v-8.25l6.75-4.13v8.25z" />
        </svg>
      ),
    },
    {
      name: "MongoDB",
      icon: (
        <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1.5C12 1.5 6 7.5 6 13.5C6 17.5 9 21 12 22.5C15 21 18 17.5 18 13.5C18 7.5 12 1.5 12 1.5ZM12 19.5V4.5C14.5 8 16 11.5 16 13.5C16 16.5 14 18.5 12 19.5Z" />
        </svg>
      ),
    },
    {
      name: "Express",
      icon: (
        <span className="font-mono text-sm font-black text-slate-300">ex</span>
      ),
    },
    {
      name: "TypeScript",
      icon: (
        <div className="w-4 h-4 bg-blue-600 rounded text-[9px] font-bold text-white flex items-center justify-center font-mono">
          TS
        </div>
      ),
    },
    {
      name: "Python",
      icon: (
        <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.9 2c-3.5 0-5.7 1.5-5.7 3.5v2.6h5.8v.9H3.8C1.8 9 0 11.2 0 14.7c0 3.6 1.7 5.3 4.9 5.3h1.8v-2.5c0-2 1.7-3.7 3.7-3.7h5.7c1.7 0 3-1.4 3-3V5.5c0-2.1-2.2-3.5-5.7-3.5h-1.5zm-1.6 1.8c.6 0 1.1.5 1.1 1.1s-.5 1.1-1.1 1.1-1.1-.5-1.1-1.1.5-1.1 1.1-1.1zm3.8 5.5v2.5c0 2-1.7 3.7-3.7 3.7H4.7c-1.7 0-3 1.4-3 3V21c0 2.1 2.2 3 5.7 3h1.5c3.5 0 5.7-1.5 5.7-3.5v-2.6H8.8v-.9h8.2c2 0 3.8-2.2 3.8-5.7 0-3.6-1.7-5.3-4.9-5.3h-1.8zm-1.6 12.9c-.6 0-1.1-.5-1.1-1.1s.5-1.1 1.1-1.1 1.1.5 1.1 1.1-.5 1.1-1.1 1.1z" />
        </svg>
      ),
    },
    {
      name: "GitHub",
      icon: (
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
      ),
    },
    {
      name: "Firebase",
      icon: (
        <svg className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3.89 15.672L6.255.461A.542.542 0 017.27.288l2.543 4.771zm16.791 3.518l-2.023-12.43a.542.542 0 00-.918-.28L3.254 20.916l8.03 4.52a1.626 1.626 0 001.564 0l7.833-4.52zM14.07 7.918l-1.954-3.73a.542.542 0 00-.962 0L3.435 19.387z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-12 border-y border-white/[0.06] bg-[#070A12]/60 backdrop-blur-sm relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-6">
          Trusted by learners and developers
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {technologies.map((tech) => (
            <div
              key={tech.name}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all cursor-default group"
            >
              <div className="group-hover:scale-110 transition-transform">
                {tech.icon}
              </div>
              <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">
                {tech.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

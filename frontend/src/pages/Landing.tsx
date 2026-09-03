import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/core/auth";
import {
  LandingNavbar,
  HeroSection,
  TechStrip,
  FeatureGrid,
  HowItWorks,
  TestimonialsAndFAQ,
  FinalCTA,
  LandingFooter,
} from "@/components/landing";

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { loading, firebaseUser } = useAuth();

  const handleLogin = () => {
    if (firebaseUser) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  const handleGetStarted = () => {
    if (firebaseUser) {
      navigate("/dashboard");
    } else {
      navigate("/register");
    }
  };

  const handleLiveDemo = () => {
    if (firebaseUser) {
      navigate("/dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  const handleFeatureSelect = (route?: string) => {
    if (route) {
      if (firebaseUser) {
        navigate(route);
      } else {
        navigate(`/login?returnTo=${encodeURIComponent(route)}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-x-hidden font-sans">
      {/* Global subtle ambient background glow spots */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-indigo-900/10 via-transparent to-transparent pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* 1. Fixed Navigation Bar */}
      <LandingNavbar
        onLogin={handleLogin}
        onGetStarted={handleGetStarted}
        loading={loading}
      />

      {/* 2. Hero Section + SaaS Dashboard Preview */}
      <HeroSection
        onGetStarted={handleGetStarted}
        onLiveDemo={handleLiveDemo}
        loading={loading}
      />

      {/* 3. Technology / Ecosystem Strip */}
      <TechStrip />

      {/* 4. Feature Grid Section (10 Features) */}
      <FeatureGrid onFeatureSelect={handleFeatureSelect} />

      {/* 5. How It Works Section */}
      <HowItWorks />

      {/* 6. Testimonials & FAQ Side-by-Side Section */}
      <TestimonialsAndFAQ />

      {/* 7. Final Call to Action */}
      <FinalCTA onGetStarted={handleGetStarted} loading={loading} />

      {/* 8. Footer */}
      <LandingFooter />
    </div>
  );
};

export default Landing;
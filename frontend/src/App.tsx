// Core
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./core/auth/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";

// UI Components
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";

// Pages & Layouts
import Landing from "./pages/Landing";
import DashboardLayout from "./pages/DashboardLayout";
import DashboardHome from "./modules/dashboard/DashboardHome";
import SkillProfilePage from "./modules/skills/SkillProfilePage";
import SkillGapsPage from "./modules/gaps/SkillGapsPage";
import LearningRoadmapPage from "./modules/roadmap/LearningRoadmapPage";
import SmartMentorPage from "./modules/mentor/pages/SmartMentorPage";
import EduTubePage from "./modules/edutube/pages/EduTubePage";
import HistoryPage from "./modules/edutube/pages/HistoryPage";
import SavedVideosPage from "./modules/edutube/pages/SavedVideosPage";
import PlaylistsPage from "./modules/edutube/pages/PlaylistsPage";
import PlaylistDetailPage from "./modules/edutube/pages/PlaylistDetailPage";
import CodingAssessmentPage from "./modules/coding/CodingAssessmentPage";
import GitHubIntelligencePage from "./modules/github/GitHubIntelligencePage";
import Resumes from "./modules/resume/Resumes";
import Projects from "./modules/resume/Projects";
import Portfolios from "./modules/resume/Portfolios";
import ProfileDetailsPage from "./pages/ProfileDetailsPage";
import SettingsPage from "./pages/SettingsPage";
import UserAnalyticsPage from "./pages/UserAnalyticsPage";
import AdminAnalytics from "./pages/AdminAnalytics";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import AuthActionPage from "./pages/AuthActionPage";
import OnboardingFlow from "./pages/OnboardingFlow";
import NotFound from "./pages/NotFound";
import RequireAuth from "./components/RequireAuth";

// Optimized React Query Configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Cache data for 5 mins to reduce redundant network requests
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <TooltipProvider>
          {/* Notifications */}
          <Toaster />
          <Sonner />

          {/* Routing */}
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
              <Route path="/auth/action" element={<AuthActionPage />} />

              <Route element={<RequireAuth />}>
                <Route path="/onboarding" element={<OnboardingFlow />} />
                <Route path="/edutube" element={<Navigate to="/dashboard/edutube" replace />} />
                <Route path="/edutube/watch/:videoId" element={<Navigate to="/dashboard/edutube" replace />} />
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<DashboardHome />} />
                  <Route path="mentor" element={<SmartMentorPage />} />
                  <Route path="skills" element={<SkillProfilePage />} />
                  <Route path="gaps" element={<SkillGapsPage />} />
                  <Route path="roadmap" element={<LearningRoadmapPage />} />
                  <Route path="edutube" element={<EduTubePage />} />
                  <Route path="edutube/watch/:videoId" element={<EduTubePage />} />
                  <Route path="edutube/history" element={<HistoryPage />} />
                  <Route path="edutube/saved" element={<SavedVideosPage />} />
                  <Route path="edutube/playlists" element={<PlaylistsPage />} />
                  <Route path="edutube/playlists/:playlistId" element={<PlaylistDetailPage />} />
                  <Route path="coding" element={<CodingAssessmentPage />} />
                  <Route path="github" element={<GitHubIntelligencePage />} />
                  <Route path="resumes" element={<Resumes />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="portfolios" element={<Portfolios />} />
                  <Route path="profile" element={<ProfileDetailsPage />} />
                  <Route path="profile-details" element={<Navigate to="/dashboard/profile" replace />} />
                  <Route path="analytics" element={<UserAnalyticsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="admin" element={<Navigate to="/dashboard/admin/analytics" replace />} />
                  <Route path="admin/analytics" element={<AdminAnalytics />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

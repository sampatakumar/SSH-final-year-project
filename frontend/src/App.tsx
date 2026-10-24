// Core
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./core/auth/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";

import React, { lazy, Suspense } from "react";

// UI Components
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";

// Route-level Lazy Loaded Pages & Layouts
const Landing = lazy(() => import("./pages/Landing"));
const DashboardLayout = lazy(() => import("./pages/DashboardLayout"));
const DashboardHome = lazy(() => import("./modules/dashboard/DashboardHome"));
const SkillProfilePage = lazy(() => import("./modules/skills/SkillProfilePage"));
const SkillGapsPage = lazy(() => import("./modules/gaps/SkillGapsPage"));
const LearningRoadmapPage = lazy(() => import("./modules/roadmap/LearningRoadmapPage"));
const SmartMentorPage = lazy(() => import("./modules/mentor/pages/SmartMentorPage"));
const EduTubePage = lazy(() => import("./modules/edutube/pages/EduTubePage"));
const HistoryPage = lazy(() => import("./modules/edutube/pages/HistoryPage"));
const SavedVideosPage = lazy(() => import("./modules/edutube/pages/SavedVideosPage"));
const PlaylistsPage = lazy(() => import("./modules/edutube/pages/PlaylistsPage"));
const PlaylistDetailPage = lazy(() => import("./modules/edutube/pages/PlaylistDetailPage"));
const CodingAssessmentPage = lazy(() => import("./modules/coding/CodingAssessmentPage"));
const AssessmentCenterPage = lazy(() => import("./pages/AssessmentCenterPage"));
const PracticalLabsPage = lazy(() => import("./pages/PracticalLabsPage"));
const CareerPathwayStudioPage = lazy(() => import("./pages/CareerPathwayStudioPage"));
const GitHubIntelligencePage = lazy(() => import("./modules/github/GitHubIntelligencePage"));
const Resumes = lazy(() => import("./modules/resume/Resumes"));
const Projects = lazy(() => import("./modules/resume/Projects"));
const Portfolios = lazy(() => import("./modules/resume/Portfolios"));
const ProfileDetailsPage = lazy(() => import("./pages/ProfileDetailsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const UserAnalyticsPage = lazy(() => import("./pages/UserAnalyticsPage"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const AuthActionPage = lazy(() => import("./pages/AuthActionPage"));
const OnboardingFlow = lazy(() => import("./pages/OnboardingFlow"));
const PublicBadgeVerificationPage = lazy(() => import("./pages/PublicBadgeVerificationPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
import RequireAuth from "./components/RequireAuth";
import ErrorBoundary from "./components/ErrorBoundary";

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

          {/* Routing wrapped with ErrorBoundary and Suspense */}
          <ErrorBoundary>
            <BrowserRouter>
              <Suspense
                fallback={
                  <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                }
              >
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/verify-email" element={<VerifyEmailPage />} />
                  <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
                  <Route path="/auth/action" element={<AuthActionPage />} />
                  <Route path="/badges/verify/:badgeId" element={<PublicBadgeVerificationPage />} />

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
                      <Route path="assessments" element={<AssessmentCenterPage />} />
                      <Route path="labs" element={<PracticalLabsPage />} />
                      <Route path="career-pathways" element={<CareerPathwayStudioPage />} />
                      <Route path="career" element={<Navigate to="/dashboard/career-pathways" replace />} />
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
              </Suspense>
            </BrowserRouter>
          </ErrorBoundary>

        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

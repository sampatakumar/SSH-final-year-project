import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { VideoPlayer } from "../modules/edutube/components/VideoPlayer";
import { VideoDetails } from "../modules/edutube/components/VideoDetails";
import { ReportVideoDialog } from "../modules/edutube/components/ReportVideoDialog";
import { EduTubeApi } from "../modules/edutube/services/edutube.api";

// Mock EduTubeApi
vi.mock("../modules/edutube/services/edutube.api", () => ({
  EduTubeApi: {
    getVideo: vi.fn(),
    search: vi.fn().mockResolvedValue({ items: [] }),
    isVideoSaved: vi.fn().mockResolvedValue({ isSaved: false }),
    getProgress: vi.fn().mockResolvedValue(null),
    getPlaybackProgress: vi.fn().mockResolvedValue(null),
    recordHistory: vi.fn().mockResolvedValue({ success: true }),
    saveProgress: vi.fn().mockResolvedValue({ success: true }),
    reportClassification: vi.fn().mockResolvedValue({ success: true }),
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Auth
vi.mock("@/core/auth", () => ({
  useAuth: () => ({
    authInitialized: true,
    firebaseUser: { uid: "test-user-123" },
    getIdToken: vi.fn().mockResolvedValue("mock-token"),
  }),
}));

describe("EduTube Frontend Education-Only Filtering Suite", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    );
  };

  describe("VideoPlayer Education-Only Gate", () => {
    it("1. Blocks playback and does NOT render YouTube iframe when isBlocked is true", () => {
      const { container } = renderWithProviders(
        <VideoPlayer
          videoId="blocked-music-123"
          title="Top 10 Pop Hits 2024"
          isBlocked={true}
          rejectionReason="This video contains entertainment or music content and is restricted on EduTube."
          rejectionCodes={["ENTERTAINMENT_OR_MUSIC", "OFFICIAL_MUSIC_TRACK"]}
          onBack={vi.fn()}
        />
      );

      // Verify no iframe exists
      const iframe = container.querySelector("iframe");
      expect(iframe).toBeNull();

      // Verify blocked banner and rejection explanation are visible
      expect(screen.getByText("Education-Only Gate")).toBeInTheDocument();
      expect(
        screen.getByText(/This video contains entertainment or music content and is restricted on EduTube/i)
      ).toBeInTheDocument();
      expect(screen.getByText("ENTERTAINMENT_OR_MUSIC")).toBeInTheDocument();
      expect(screen.getByText("OFFICIAL_MUSIC_TRACK")).toBeInTheDocument();
    });

    it("2. Renders Report Error button and fires onReport when clicked", () => {
      const onReportMock = vi.fn();
      renderWithProviders(
        <VideoPlayer
          videoId="blocked-music-123"
          title="Top 10 Pop Hits 2024"
          isBlocked={true}
          rejectionReason="Blocked entertainment"
          onReport={onReportMock}
          onBack={vi.fn()}
        />
      );

      const reportBtn = screen.getByText("Report Error");
      expect(reportBtn).toBeInTheDocument();
      fireEvent.click(reportBtn);
      expect(onReportMock).toHaveBeenCalledTimes(1);
    });

    it("3. Renders YouTube privacy-enhanced iframe with restricted recommendations when video is allowed", () => {
      const { container } = renderWithProviders(
        <VideoPlayer
          videoId="mit-lecture-101"
          title="MIT 6.006 Introduction to Algorithms"
          isBlocked={false}
          onBack={vi.fn()}
        />
      );

      const iframe = container.querySelector("iframe");
      expect(iframe).not.toBeNull();
      expect(iframe?.getAttribute("src")).toContain("youtube-nocookie.com/embed/mit-lecture-101");
      expect(iframe?.getAttribute("src")).toContain("rel=0");
    });
  });

  describe("VideoDetails Rejection Handling", () => {
    it("4. Displays educational restriction notice when backend rejects video details", async () => {
      (EduTubeApi.getVideo as any).mockResolvedValueOnce({
        allowed: false,
        message: "Blocked: Video classified as entertainment trailer.",
        reasonCodes: ["TRAILER_OR_ENTERTAINMENT"],
        video: null,
      });

      const onBlockedChange = vi.fn();

      renderWithProviders(
        <VideoDetails
          videoId="trailer-video-999"
          onSelectRelatedVideo={vi.fn()}
          onBlockedStatusChange={onBlockedChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("EduTube Educational Quality Notice")).toBeInTheDocument();
        expect(
          screen.getByText(/Blocked: Video classified as entertainment trailer/i)
        ).toBeInTheDocument();
        expect(screen.getByText("TRAILER_OR_ENTERTAINMENT")).toBeInTheDocument();
      });

      expect(onBlockedChange).toHaveBeenCalledWith(
        true,
        expect.objectContaining({ allowed: false })
      );
    });
  });

  describe("ReportVideoDialog", () => {
    it("5. Allows user to submit a report for incorrectly classified educational content", async () => {
      const onClose = vi.fn();
      renderWithProviders(
        <ReportVideoDialog
          isOpen={true}
          onClose={onClose}
          videoId="test-video-id"
          videoTitle="Algorithms Tutorial"
        />
      );

      expect(screen.getByText("Report Classification")).toBeInTheDocument();
      
      const submitBtn = screen.getByText("Submit Report");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(EduTubeApi.reportClassification).toHaveBeenCalledWith(
          expect.objectContaining({
            videoId: "test-video-id",
            feedbackType: "false_positive",
          })
        );
        expect(onClose).toHaveBeenCalled();
      });
    });
  });
});

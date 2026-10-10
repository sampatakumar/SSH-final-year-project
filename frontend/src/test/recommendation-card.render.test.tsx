import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RecommendationCard } from "../modules/edutube/components/RecommendationCard";

vi.mock("@/core/auth", () => ({
  useAuth: () => ({
    authInitialized: true,
    firebaseUser: { uid: "test-user-123" },
    user: { _id: "test-user-123" },
  }),
}));

describe("RecommendationCard Component", () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const sampleVideo: import("../modules/edutube/types/edutube.types").PersonalizedRecommendation = {
    videoId: "dQw4w9WgXcQ",
    title: "Understanding Transformer Attention Mechanisms in Depth",
    channelTitle: "AI Deep Dive Academy",
    description: "Comprehensive lecture on self-attention mechanisms and query-key-value routing.",
    channelId: "channel-123",
    publishedAt: "2026-01-01T00:00:00Z",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail: {
      default: "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg",
      high: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    },
    thumbnailUrl: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    personalizationScore: 94,
    recommendationScore: 0.94,
    verifiedDurationSeconds: 1250,
    duration: {
      raw: "PT20M50S",
      seconds: 1250,
      formatted: "20m 50s",
    },
    whyRecommended: ["Reinforces Deep Learning prerequisites", "Addresses your current attention mechanism gap"],
  };

  it("renders RecommendationCard without ReferenceError: Clock is not defined", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <RecommendationCard video={sampleVideo} onWatch={vi.fn()} />
      </QueryClientProvider>
    );

    expect(screen.getByText("Understanding Transformer Attention Mechanisms in Depth")).toBeInTheDocument();
    expect(screen.getByText("AI Deep Dive Academy")).toBeInTheDocument();
    expect(screen.getByText("20m 50s")).toBeInTheDocument();
    expect(screen.getByText("Watch")).toBeInTheDocument();
  });
});

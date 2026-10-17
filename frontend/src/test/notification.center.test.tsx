import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import { NotificationBell } from "../components/notifications/NotificationBell";
import { NotificationsApi, type InAppNotification } from "../lib/api";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Phase 10: In-App Notification Center Frontend Suite", () => {
  const mockNotifications: InAppNotification[] = [
    {
      _id: "notif-1",
      owner: "user-1",
      type: "learning_milestone",
      title: "Learning Milestone Completed",
      message: "You completed EduTube video lesson on React hooks.",
      destination: "/dashboard/edutube",
      isRead: false,
      readAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: "notif-2",
      owner: "user-1",
      type: "skill_gap",
      title: "Skill Gap Benchmark: Full Stack Developer",
      message: "Your gap analysis identified 3 priority gaps.",
      destination: "/dashboard/gaps",
      isRead: true,
      readAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. Renders notification bell with unread badge counter", async () => {
    vi.spyOn(NotificationsApi, "getUnreadCount").mockResolvedValue(1);

    render(
      <BrowserRouter>
        <NotificationBell />
      </BrowserRouter>
    );

    await waitFor(() => {
      const badge = screen.getByTestId("notification-badge");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent("1");
    });
  });

  it("2. Opens notification drawer on click and renders list of notifications", async () => {
    vi.spyOn(NotificationsApi, "getUnreadCount").mockResolvedValue(1);
    vi.spyOn(NotificationsApi, "getNotifications").mockResolvedValue({
      notifications: mockNotifications,
      pagination: { page: 1, limit: 30, total: 2, totalPages: 1, hasNextPage: false },
    });

    render(
      <BrowserRouter>
        <NotificationBell />
      </BrowserRouter>
    );

    const bellButton = screen.getByRole("button", { name: /notifications/i });
    fireEvent.click(bellButton);

    expect(screen.getByRole("dialog", { name: /notification center/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Learning Milestone Completed")).toBeInTheDocument();
      expect(screen.getByText("Skill Gap Benchmark: Full Stack Developer")).toBeInTheDocument();
    });
  });

  it("3. Displays clear visual distinction for unread vs read notifications", async () => {
    vi.spyOn(NotificationsApi, "getUnreadCount").mockResolvedValue(1);
    vi.spyOn(NotificationsApi, "getNotifications").mockResolvedValue({
      notifications: mockNotifications,
      pagination: { page: 1, limit: 30, total: 2, totalPages: 1, hasNextPage: false },
    });

    render(
      <BrowserRouter>
        <NotificationBell />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

    await waitFor(() => {
      expect(screen.getByText("New")).toBeInTheDocument();
    });
  });

  it("4. Calls markAsRead and navigates to approved internal destination on click", async () => {
    vi.spyOn(NotificationsApi, "getUnreadCount").mockResolvedValue(1);
    vi.spyOn(NotificationsApi, "getNotifications").mockResolvedValue({
      notifications: mockNotifications,
      pagination: { page: 1, limit: 30, total: 2, totalPages: 1, hasNextPage: false },
    });
    const markReadSpy = vi.spyOn(NotificationsApi, "markAsRead").mockResolvedValue({
      ...mockNotifications[0],
      isRead: true,
    });

    render(
      <BrowserRouter>
        <NotificationBell />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

    await waitFor(() => {
      expect(screen.getByText("Learning Milestone Completed")).toBeInTheDocument();
    });

    const itemButton = screen.getByText("Learning Milestone Completed").closest("button");
    expect(itemButton).toBeDefined();
    fireEvent.click(itemButton!);

    await waitFor(() => {
      expect(markReadSpy).toHaveBeenCalledWith("notif-1");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/edutube");
    });
  });

  it("5. Marks all notifications as read when clicking 'Mark all read'", async () => {
    vi.spyOn(NotificationsApi, "getUnreadCount").mockResolvedValue(2);
    vi.spyOn(NotificationsApi, "getNotifications").mockResolvedValue({
      notifications: mockNotifications,
      pagination: { page: 1, limit: 30, total: 2, totalPages: 1, hasNextPage: false },
    });
    const markAllSpy = vi.spyOn(NotificationsApi, "markAllAsRead").mockResolvedValue(2);

    render(
      <BrowserRouter>
        <NotificationBell />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

    await waitFor(() => {
      expect(screen.getByText(/mark all read/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/mark all read/i));

    await waitFor(() => {
      expect(markAllSpy).toHaveBeenCalled();
    });
  });

  it("6. Displays empty state message when no notifications exist", async () => {
    vi.spyOn(NotificationsApi, "getUnreadCount").mockResolvedValue(0);
    vi.spyOn(NotificationsApi, "getNotifications").mockResolvedValue({
      notifications: [],
      pagination: { page: 1, limit: 30, total: 0, totalPages: 1, hasNextPage: false },
    });

    render(
      <BrowserRouter>
        <NotificationBell />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

    await waitFor(() => {
      expect(screen.getByText(/you are all caught up!/i)).toBeInTheDocument();
    });
  });

  it("7. Displays error alert and retry button when notification fetch fails", async () => {
    vi.spyOn(NotificationsApi, "getUnreadCount").mockResolvedValue(0);
    vi.spyOn(NotificationsApi, "getNotifications").mockRejectedValue(new Error("Network connection error"));

    render(
      <BrowserRouter>
        <NotificationBell />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

    await waitFor(() => {
      expect(screen.getByText(/network connection error/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    });
  });
});

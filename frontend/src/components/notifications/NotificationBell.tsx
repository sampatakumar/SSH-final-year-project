import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Sparkles,
  BookOpen,
  Target,
  Code2,
  Clock,
  Info,
  Loader2,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  NotificationsApi,
  type InAppNotification,
} from "@/lib/api";

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch unread count for badge
  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await NotificationsApi.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Ignore background badge fetch failures silently
    }
  }, []);

  // Fetch full notifications list
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await NotificationsApi.getNotifications({
        limit: 30,
        unreadOnly: activeTab === "unread",
      });
      setNotifications(res.notifications || []);
      // Refresh count as well
      void fetchUnreadCount();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications.");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, fetchUnreadCount]);

  // Initial badge fetch on mount + periodic refresh every 60s
  useEffect(() => {
    void fetchUnreadCount();
    const interval = setInterval(() => {
      void fetchUnreadCount();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch list whenever drawer is opened or activeTab changes
  useEffect(() => {
    if (isOpen) {
      void fetchNotifications();
    }
  }, [isOpen, activeTab, fetchNotifications]);

  // Close popover on outside click or ESC key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Mark a single notification as read and safely navigate
  const handleNotificationClick = async (notif: InAppNotification) => {
    if (!notif.isRead) {
      // Optimistic local update
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      try {
        await NotificationsApi.markAsRead(notif._id);
      } catch {
        // Revert on critical error if needed
      }
    }

    setIsOpen(false);

    // Enforce safe internal navigation
    const target = notif.destination && notif.destination.startsWith("/dashboard")
      ? notif.destination
      : "/dashboard";

    navigate(target);
  };

  // Mark all unread notifications as read
  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      await NotificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark notifications read.");
    } finally {
      setIsMarkingAll(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "learning_milestone":
        return <BookOpen className="h-4 w-4 text-emerald-500" />;
      case "skill_gap":
        return <Target className="h-4 w-4 text-amber-500" />;
      case "roadmap":
        return <Sparkles className="h-4 w-4 text-primary" />;
      case "reminder":
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const formatTimestamp = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <div ref={containerRef} className={cn("relative inline-block text-left", className)}>
      {/* Notification Bell Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative h-9 w-9 text-muted-foreground hover:text-foreground transition-all shadow-neo-raised-sm hover:shadow-neo-pressed active:scale-95"
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={isOpen}
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span
            data-testid="notification-badge"
            className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm animate-pulse"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Popover / Drawer */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Notification Center"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[11px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={isMarkingAll}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-primary gap-1"
                title="Mark all notifications as read"
              >
                {isMarkingAll ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
                <span>Mark all read</span>
              </Button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-border/20 px-3 pt-2 gap-2 text-xs">
            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "pb-2 px-2 font-medium border-b-2 transition-colors",
                activeTab === "all"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("unread")}
              className={cn(
                "pb-2 px-2 font-medium border-b-2 transition-colors flex items-center gap-1.5",
                activeTab === "unread"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Unread
              {unreadCount > 0 && (
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </button>
          </div>

          {/* Content Area */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-border/20 custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-xs">Loading notifications...</span>
              </div>
            ) : error ? (
              <div className="p-6 text-center space-y-2">
                <p className="text-xs text-destructive">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchNotifications}
                  className="h-7 text-xs gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </Button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <CheckCheck className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-foreground">You are all caught up!</p>
                <p className="text-[11px] text-muted-foreground max-w-[200px]">
                  Learning milestones, roadmap progress, and skill benchmarks will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif._id}
                  onClick={() => void handleNotificationClick(notif)}
                  className={cn(
                    "w-full text-left p-3.5 transition-colors flex items-start gap-3 group hover:bg-muted/30 focus:outline-none focus:bg-muted/40",
                    !notif.isRead
                      ? "bg-primary/5 hover:bg-primary/10"
                      : "opacity-80 hover:opacity-100"
                  )}
                >
                  {/* Type Icon */}
                  <div
                    className={cn(
                      "mt-0.5 p-2 rounded-xl shrink-0 border transition-all",
                      !notif.isRead
                        ? "bg-background border-primary/30 shadow-neo-raised-sm"
                        : "bg-muted/40 border-border/30"
                    )}
                  >
                    {getNotificationIcon(notif.type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "text-xs truncate",
                          !notif.isRead
                            ? "font-bold text-foreground"
                            : "font-medium text-foreground/80"
                        )}
                      >
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatTimestamp(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-1.5 pt-0.5">
                      {!notif.isRead && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          New
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors flex items-center ml-auto">
                        View <ChevronRight className="h-3 w-3 ml-0.5" />
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

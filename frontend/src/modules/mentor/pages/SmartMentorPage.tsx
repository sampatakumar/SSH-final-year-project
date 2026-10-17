import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Activity } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SmartMentorApi } from "../services/smartMentor.api";
import { MentorChat } from "../components/MentorChat";
import { MentorContextPanel } from "../components/MentorContextPanel";

export const SmartMentorPage: React.FC = () => {
  const queryClient = useQueryClient();
  // Live Profile Signals drawer is strictly CLOSED BY DEFAULT on initial page load
  const [isSignalsOpen, setIsSignalsOpen] = useState(false);

  // Query live mentor unified context
  const {
    data: context,
    isLoading: isContextLoading,
    isRefetching,
  } = useQuery({
    queryKey: ["mentor", "context"],
    queryFn: () => SmartMentorApi.getContext(),
    staleTime: 1000 * 60 * 5, // 5 mins
  });

  const handleRefreshContext = async () => {
    try {
      toast.info("Recalculating profile & GitHub intelligence signals...");
      await SmartMentorApi.refreshContext();
      await queryClient.invalidateQueries({ queryKey: ["mentor", "context"] });
      toast.success("Profile signals refreshed successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to refresh context.");
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col min-w-0 space-y-4 pb-4 animate-in fade-in-50 duration-150 relative">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/30 pb-3.5 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-primary/10 text-primary border border-primary/30 flex items-center justify-center shadow-neo-raised shrink-0">
            <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-foreground truncate">
                Smart Mentor
              </h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-primary text-primary-foreground shadow-xs shrink-0">
                AI Career Guide
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium truncate sm:whitespace-normal">
              Grounded developer mentor analyzing your GitHub, skills, resume & learning roadmap
            </p>
          </div>
        </div>

        {/* Profile Signals Toggle Button */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <Button
            variant={isSignalsOpen ? "default" : "outline"}
            size="sm"
            onClick={() => setIsSignalsOpen((prev) => !prev)}
            aria-expanded={isSignalsOpen}
            aria-controls="live-profile-signals-drawer"
            className={cn(
              "h-9 px-3.5 rounded-xl font-bold text-xs gap-2 transition-all shadow-neo-raised-sm group",
              isSignalsOpen
                ? "bg-primary text-primary-foreground border-primary shadow-neo-pressed"
                : "border-border/60 hover:border-primary/40 text-foreground bg-surface/80 hover:bg-surface"
            )}
            title={isSignalsOpen ? "Close Profile Signals" : "View Live Profile Signals"}
          >
            <Activity className="h-4 w-4 text-primary group-hover:text-primary-foreground" />
            <span>Profile Signals</span>
          </Button>
        </div>
      </div>

      {/* Main Conversation Workspace - expands to fill entire available width */}
      <div className="w-full flex-1 flex flex-col min-w-0 min-h-0">
        <MentorChat
          context={context || null}
          onOpenSignals={() => setIsSignalsOpen(true)}
          isSignalsOpen={isSignalsOpen}
        />
      </div>

      {/* Live Profile Signals Right-Side Drawer (Closed by default, 0 workspace space consumed when closed) */}
      <MentorContextPanel
        context={context || null}
        isLoading={isContextLoading || isRefetching}
        onRefresh={handleRefreshContext}
        isOpen={isSignalsOpen}
        onClose={() => setIsSignalsOpen(false)}
      />
    </div>
  );
};

export default SmartMentorPage;

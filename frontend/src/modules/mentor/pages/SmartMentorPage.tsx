import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Sparkles, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { SmartMentorApi } from "../services/smartMentor.api";
import { MentorChat } from "../components/MentorChat";
import { MentorContextPanel } from "../components/MentorContextPanel";

export const SmartMentorPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Query live mentor unified context
  const {
    data: context,
    isLoading: isContextLoading,
    isRefetching,
    refetch,
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
    <div className="space-y-6 pb-12 animate-in fade-in-50 duration-150">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/30 pb-5">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary border border-primary/30 flex items-center justify-center shadow-neo-raised shrink-0">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-foreground">
                Smart Mentor
              </h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-primary text-primary-foreground">
                AI Career Guide
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              Grounded developer mentor analyzing your GitHub, skills, resume & learning roadmap
            </p>
          </div>
        </div>
      </div>

      {/* Main Layout: Left Chat + Right Live Signal Panel */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        <MentorChat context={context || null} />
        <MentorContextPanel
          context={context || null}
          isLoading={isContextLoading || isRefetching}
          onRefresh={handleRefreshContext}
        />
      </div>
    </div>
  );
};

export default SmartMentorPage;

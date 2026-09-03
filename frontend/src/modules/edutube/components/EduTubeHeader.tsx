import React from "react";
import { GraduationCap, Sparkles } from "lucide-react";
import { EduTubeSearch } from "./EduTubeSearch";

export interface EduTubeHeaderProps {
  searchQuery: string;
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export const EduTubeHeader: React.FC<EduTubeHeaderProps> = ({
  searchQuery,
  onSearch,
  isLoading = false,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-border/30 pb-5">
      {/* EduTube Logo Branding */}
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary border border-primary/30 flex items-center justify-center shadow-neo-raised shrink-0">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-foreground">
              EduTube
            </h1>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-primary text-primary-foreground">
              Learning Layer
            </span>
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            Curated engineering courses, tutorials & project walkthroughs
          </p>
        </div>
      </div>

      {/* Global EduTube Search Input */}
      <div className="w-full md:w-auto flex-1 max-w-xl flex justify-end">
        <EduTubeSearch
          initialQuery={searchQuery}
          onSearch={onSearch}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

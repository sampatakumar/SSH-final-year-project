import React from "react";
import { User, CheckCircle2, RefreshCw, Globe, Mail, Phone, Linkedin, Github } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ResumeData } from "../templates/types";

export interface PersonalSectionEditorProps {
  data: ResumeData;
  onUpdate: (patch: Partial<ResumeData>) => void;
  onOpenSyncDialog: () => void;
  hasMasterProfile: boolean;
}

export const PersonalSectionEditor: React.FC<PersonalSectionEditorProps> = ({
  data,
  onUpdate,
  onOpenSyncDialog,
  hasMasterProfile,
}) => {
  return (
    <div className="space-y-4">
      {/* Master Profile Sync Banner */}
      {hasMasterProfile && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs">
          <div className="flex items-center gap-2 text-primary font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>Master Profile Active</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onOpenSyncDialog}
            className="h-7 text-xs font-semibold text-primary hover:bg-primary/20 gap-1.5"
          >
            <RefreshCw className="h-3 w-3" /> Sync from Master Profile
          </Button>
        </div>
      )}

      {/* Inputs */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={data.name || ""}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="e.g. Jane Doe"
            className="text-xs h-9 bg-background"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1">
              <Mail className="h-3 w-3 text-primary" /> Email Address
            </label>
            <Input
              value={data.email || ""}
              onChange={(e) => onUpdate({ email: e.target.value })}
              placeholder="jane@example.com"
              className="text-xs h-9 bg-background"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1">
              <Phone className="h-3 w-3 text-primary" /> Phone Number
            </label>
            <Input
              value={data.phone || ""}
              onChange={(e) => onUpdate({ phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              className="text-xs h-9 bg-background"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1">
            <Linkedin className="h-3 w-3 text-primary" /> LinkedIn Profile
          </label>
          <Input
            value={data.linkedin || ""}
            onChange={(e) => onUpdate({ linkedin: e.target.value })}
            placeholder="https://linkedin.com/in/username"
            className="text-xs h-9 bg-background"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1">
            <Github className="h-3 w-3 text-primary" /> GitHub Profile
          </label>
          <Input
            value={data.github || ""}
            onChange={(e) => onUpdate({ github: e.target.value })}
            placeholder="https://github.com/username"
            className="text-xs h-9 bg-background"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1">
            <Globe className="h-3 w-3 text-primary" /> Portfolio / Website
          </label>
          <Input
            value={data.website || ""}
            onChange={(e) => onUpdate({ website: e.target.value })}
            placeholder="https://janedoe.dev"
            className="text-xs h-9 bg-background"
          />
        </div>
      </div>
    </div>
  );
};

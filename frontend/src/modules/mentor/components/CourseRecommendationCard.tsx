import React from "react";
import {
  Play,
  ExternalLink,
  Clock,
  Layers,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Award,
  Video,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { CourseRecommendationItem } from "../types/smartMentor.types";

interface CourseRecommendationCardProps {
  course: CourseRecommendationItem;
  isStartingPick?: boolean;
}

export const CourseRecommendationCard: React.FC<CourseRecommendationCardProps> = ({
  course,
  isStartingPick = false,
}) => {
  const isPlaylist = course.isPlaylist || course.courseType === "complete_playlist";

  // Safe external URL enforcement
  const isValidYouTubeUrl =
    typeof course.youtubeUrl === "string" &&
    (course.youtubeUrl.includes("youtube.com") || course.youtubeUrl.includes("youtu.be"));

  return (
    <div
      className={`rounded-2xl p-4 transition-all duration-200 border text-left space-y-3 ${
        isStartingPick
          ? "bg-primary/5 border-primary/30 shadow-neo-raised ring-1 ring-primary/20"
          : "bg-surface/80 border-border/40 hover:border-border/70 shadow-neo-raised-sm"
      }`}
    >
      {/* Top Banner & Badges */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isStartingPick && (
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary text-primary-foreground flex items-center gap-1 shadow-xs">
              <Award className="h-3 w-3" />
              Recommended Starting Course
            </span>
          )}

          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border/40 flex items-center gap-1">
            {isPlaylist ? <Layers className="h-3 w-3 text-primary" /> : <Video className="h-3 w-3 text-primary" />}
            {course.courseType.replace("_", " ")}
          </span>

          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/30 capitalize">
            {course.level.replace("_", " ")}
          </span>
        </div>

        {course.duration?.formatted && (
          <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1 bg-background/60 px-2 py-0.5 rounded-md border border-border/30">
            <Clock className="h-3 w-3 text-primary" />
            {course.duration.formatted}
          </span>
        )}
      </div>

      {/* Title & Instructor */}
      <div>
        <h4 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
          {course.title}
        </h4>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground font-medium">
          <span>Instructor / Channel:</span>
          <span className="font-semibold text-foreground flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-400 inline" />
            {course.channelTitle}
          </span>
        </div>
      </div>

      {/* Why Recommended Callout */}
      {course.whyMatches && (
        <div className="p-2.5 rounded-xl bg-background/70 border border-border/30 text-xs text-foreground/90 space-y-1">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-primary tracking-wider">
            <Sparkles className="h-3 w-3" />
            Why This Course Matches
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground font-medium">
            {course.whyMatches}
          </p>
        </div>
      )}

      {/* Topics Covered */}
      {course.topicsCovered && course.topicsCovered.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
            Curriculum Highlights
          </span>
          <div className="flex flex-wrap gap-1">
            {course.topicsCovered.slice(0, 5).map((topic, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded-md bg-muted/60 text-foreground font-medium border border-border/30"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Identified Limitations / Missing Topics */}
      {course.limitations && course.limitations.length > 0 && (
        <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 leading-tight">
          <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span>
            <strong className="font-semibold text-amber-300">Identified Limitations: </strong>
            {course.limitations.join(" • ")}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          className="h-8 text-xs font-bold gap-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
          asChild
        >
          <Link to={course.edutubeUrl || `/dashboard/edutube/watch/${course.id}`}>
            <Play className="h-3.5 w-3.5 fill-current" />
            Watch on EduTube
          </Link>
        </Button>

        {isValidYouTubeUrl && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs font-semibold gap-1.5 rounded-xl border-border/40 hover:bg-muted/50 text-foreground"
            asChild
          >
            <a
              href={course.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open video on YouTube in a safe new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open on YouTube
            </a>
          </Button>
        )}
      </div>

      {/* Rating & Engagement Transparency Note */}
      <div className="text-[10px] text-muted-foreground/80 pt-1 border-t border-border/20 flex items-center justify-between">
        <span>Source: {course.engagement?.source || "YouTube Data API v3"}</span>
        <span className="italic">
          {course.engagement?.publicStarRating || "No public star ratings provided by YouTube"}
        </span>
      </div>
    </div>
  );
};

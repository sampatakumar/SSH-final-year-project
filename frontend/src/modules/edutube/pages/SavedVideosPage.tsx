import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, Search, Play, Trash2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EduTubeApi } from "../services/edutube.api";
import { EduTubeHeader } from "../components/EduTubeHeader";
import { EduTubeSidebar } from "../components/EduTubeSidebar";
import { useAuth } from "@/core/auth";
import { VideoCard } from "../components/VideoCard";
import type { EduTubeVideoItem } from "../types/edutube.types";

export const SavedVideosPage: React.FC = () => {
  const { authInitialized, firebaseUser } = useAuth();
  const [filterText, setFilterText] = useState("");
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["edutube", "saved"],
    queryFn: () => EduTubeApi.getSavedVideos({ limit: 100 }),
    enabled: authInitialized && Boolean(firebaseUser),
  });

  const savedList = data?.items || [];

  const filteredVideos = savedList.filter(
    (v) =>
      v.title.toLowerCase().includes(filterText.toLowerCase()) ||
      v.channelTitle.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleWatch = (video: EduTubeVideoItem) => {
    navigate(`/dashboard/edutube/watch/${video.videoId}`);
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in-50 duration-150">
      <EduTubeHeader
        searchQuery=""
        onSearch={(q) => navigate(`/dashboard/edutube?q=${encodeURIComponent(q)}`)}
      />

      <div className="flex flex-col lg:flex-row items-start gap-6">
        <EduTubeSidebar />

        <main className="flex-1 w-full space-y-6 min-w-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/30 pb-4">
            <div className="flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-black text-foreground">Saved Videos & Bookmarks</h2>
              <span className="text-xs font-bold text-muted-foreground">({savedList.length})</span>
            </div>

            {savedList.length > 0 && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Filter saved lessons..."
                  className="h-8 pl-8 text-xs bg-surface"
                />
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="py-16 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Loading saved videos...</span>
            </div>
          ) : savedList.length === 0 ? (
            <div className="py-16 text-center border border-border/40 bg-surface/60 rounded-3xl p-8 space-y-3 max-w-md mx-auto shadow-neo-raised">
              <Bookmark className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold text-foreground">No Saved Videos Yet</h3>
              <p className="text-xs text-muted-foreground">
                Bookmark tutorials, complete courses, and hands-on projects to build your personal learning queue.
              </p>
              <Button
                size="sm"
                onClick={() => navigate("/dashboard/edutube")}
                className="text-xs font-bold"
              >
                Explore Courses
              </Button>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No saved videos matching "{filterText}".
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredVideos.map((item) => (
                <VideoCard
                  key={item.videoId}
                  video={{
                    videoId: item.videoId,
                    title: item.title,
                    description: "",
                    thumbnail: { default: item.thumbnail, high: item.thumbnail },
                    channelId: "",
                    channelTitle: item.channelTitle,
                    publishedAt: item.savedAt,
                    embedUrl: `https://www.youtube.com/embed/${item.videoId}`,
                    youtubeUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
                  }}
                  initialIsSaved={true}
                  onWatch={handleWatch}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SavedVideosPage;

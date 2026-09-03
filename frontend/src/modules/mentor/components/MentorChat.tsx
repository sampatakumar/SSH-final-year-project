import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Trash2,
  AlertCircle,
  Lightbulb,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MentorMessage } from "./MentorMessage";
import { MentorInput } from "./MentorInput";
import { MentorSuggestions } from "./MentorSuggestions";
import { MentorTypingIndicator } from "./MentorTypingIndicator";
import { MentorStatusBadge } from "./MentorStatusBadge";
import { SmartMentorApi } from "../services/smartMentor.api";
import type {
  MentorMessageItem,
  MentorContextData,
} from "../types/smartMentor.types";

interface MentorChatProps {
  context: MentorContextData | null;
}

export const MentorChat: React.FC<MentorChatProps> = ({ context }) => {
  const [messages, setMessages] = useState<MentorMessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [activeSource, setActiveSource] = useState<"groq" | "local_nlp" | "deterministic">("groq");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load chat history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const history = await SmartMentorApi.getHistory();
      if (history && history.length > 0) {
        setMessages(history);
      }
    } catch (err: any) {
      console.warn("Failed to load mentor history:", err);
    }
  };

  const scrollToBottom = () => {
    if (typeof chatEndRef.current?.scrollIntoView === "function") {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, isLoading]);

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    const userMsg: MentorMessageItem = {
      role: "user",
      content: userText.trim(),
      source: "user",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingContent("");
    setActiveSource("groq");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedText = "";
    let finalSource: "groq" | "local_nlp" | "deterministic" = "groq";
    let finalActions: any[] = [];
    let finalReferences: any[] = [];

    try {
      await SmartMentorApi.streamChatMessage(
        userText,
        {
          onThinking: () => {
            // Thinking state
          },
          onStart: (src) => {
            setActiveSource(src as any);
            finalSource = src as any;
          },
          onChunk: (chunk) => {
            accumulatedText += chunk;
            setStreamingContent(accumulatedText);
          },
          onFallback: (src) => {
            setActiveSource(src as any);
            finalSource = src as any;
          },
          onDone: (data) => {
            finalSource = (data.source as any) || finalSource;
            finalActions = data.actions || [];
            finalReferences = data.references || [];
          },
          onError: async (err) => {
            console.warn("Streaming error, falling back to JSON request:", err.message);
            // Fallback to regular JSON endpoint
            try {
              const res = await SmartMentorApi.sendChatMessage(userText);
              accumulatedText = res.message;
              finalSource = res.source;
              finalActions = res.actions || [];
              finalReferences = res.references || [];
            } catch (fallbackErr: any) {
              accumulatedText =
                "I encountered an issue generating your career guidance. Please try again in a moment.";
              toast.error(fallbackErr.message || "Failed to reach mentor.");
            }
          },
        },
        controller.signal
      );
    } catch (err: any) {
      console.error("Mentor chat error:", err);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);

      if (accumulatedText.trim()) {
        const assistantMsg: MentorMessageItem = {
          role: "assistant",
          content: accumulatedText.trim(),
          source: finalSource,
          actions: finalActions,
          references: finalReferences,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
      setStreamingContent("");
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setIsStreaming(false);
    if (streamingContent.trim()) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: streamingContent.trim(),
          source: activeSource,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    setStreamingContent("");
  };

  const handleClearHistory = async () => {
    try {
      await SmartMentorApi.clearHistory();
      setMessages([]);
      toast.success("Conversation history cleared.");
    } catch (err: any) {
      toast.error("Failed to clear history.");
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-12rem)] min-h-[550px] bg-surface/60 border border-border/50 rounded-2xl shadow-neo-raised overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 bg-surface/90 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary border border-primary/25 flex items-center justify-center shadow-neo-raised-sm shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-foreground flex items-center gap-2">
              Smart Mentor
            </h2>
            <p className="text-[11px] text-muted-foreground font-medium">
              Career, GitHub & Skill Intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <MentorStatusBadge source={activeSource} isStreaming={isStreaming} />

          {messages.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearHistory}
              className="h-8 px-2.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Clear Conversation"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline ml-1.5">Clear</span>
            </Button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {/* Proactive Grounded Insights Banner */}
        {context && context.insights && context.insights.length > 0 && (
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2 shadow-neo-raised-sm animate-in fade-in-50 duration-200">
            <div className="flex items-center gap-2 text-xs font-black text-primary uppercase tracking-wider">
              <Lightbulb className="h-3.5 w-3.5" />
              <span>Smart Mentor Live Observations</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-foreground/90">
              {context.insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-surface/80 border border-border/40 font-medium"
                >
                  {insight}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Initial Welcome Message if empty history */}
        {messages.length === 0 && !isStreaming && (
          <div className="text-center py-10 space-y-3 max-w-md mx-auto">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary border border-primary/30 flex items-center justify-center mx-auto shadow-neo-raised">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-foreground">
              Hello {context?.career?.name || "Developer"}! How can I guide you today?
            </h3>
            <p className="text-xs text-muted-foreground">
              I can analyze your **GitHub repositories**, **skill gaps for {context?.career?.targetRole || "your target role"}**, **EduTube video progress**, or build you a **30-day placement plan**.
            </p>
          </div>
        )}

        {/* Conversation History */}
        {messages.map((msg, idx) => (
          <MentorMessage key={idx} message={msg} />
        ))}

        {/* Live Streaming Assistant Output */}
        {isStreaming && streamingContent && (
          <MentorMessage
            message={{
              role: "assistant",
              content: streamingContent,
              source: activeSource,
            }}
          />
        )}

        {/* Thinking Indicator */}
        {isLoading && !streamingContent && <MentorTypingIndicator />}

        <div ref={chatEndRef} />
      </div>

      {/* Footer Area: Suggestions & Input Box */}
      <div className="p-4 bg-surface/90 border-t border-border/40 space-y-3 shrink-0">
        <MentorSuggestions onSelect={handleSendMessage} disabled={isLoading} />
        <MentorInput
          onSend={handleSendMessage}
          onStop={handleStop}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

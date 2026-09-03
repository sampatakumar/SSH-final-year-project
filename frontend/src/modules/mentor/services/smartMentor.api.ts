import { apiRequest, getApiBaseUrl } from "@/lib/api";
import { firebaseAuth } from "@/lib/firebase";
import type {
  MentorContextData,
  MentorChatResponse,
  MentorMessageItem,
} from "../types/smartMentor.types";

export const SmartMentorApi = {
  /**
   * Fetch compact, unified user context and proactive insights.
   */
  getContext: async (): Promise<MentorContextData> => {
    const res = await apiRequest<{ context: MentorContextData }>("/mentor/context");
    return res.data.context;
  },

  /**
   * Force refresh and recalculate context signals.
   */
  refreshContext: async (): Promise<MentorContextData> => {
    const res = await apiRequest<{ context: MentorContextData }>("/mentor/refresh-context", {
      method: "POST",
    });
    return res.data.context;
  },

  /**
   * Standard JSON chat interaction.
   */
  sendChatMessage: async (message: string): Promise<MentorChatResponse> => {
    const res = await apiRequest<MentorChatResponse>("/mentor/chat", {
      method: "POST",
      body: { message },
    });
    return res.data;
  },

  /**
   * Stream chat interaction using Server-Sent Events (SSE).
   */
  streamChatMessage: async (
    message: string,
    callbacks: {
      onThinking?: () => void;
      onStart?: (source: string) => void;
      onChunk?: (chunk: string) => void;
      onFallback?: (source: string) => void;
      onDone?: (data: {
        source: string;
        summary: string;
        actions: any[];
        references: any[];
      }) => void;
      onError?: (err: Error) => void;
    },
    signal?: AbortSignal
  ): Promise<void> => {
    try {
      const token = await firebaseAuth.currentUser?.getIdToken() || null;
      const response = await fetch(`${getApiBaseUrl()}/mentor/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`Stream request failed with status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("ReadableStream not supported");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const eventBlock of events) {
          if (!eventBlock.trim()) continue;

          const lines = eventBlock.split("\n");
          let eventType = "message";
          let dataStr = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              dataStr = line.slice(6).trim();
            }
          }

          if (dataStr) {
            try {
              const data = JSON.parse(dataStr);
              if (eventType === "thinking") {
                callbacks.onThinking?.();
              } else if (eventType === "start") {
                callbacks.onStart?.(data.source || "groq");
              } else if (eventType === "chunk") {
                callbacks.onChunk?.(data.chunk || "");
              } else if (eventType === "fallback") {
                callbacks.onFallback?.(data.source || "local_nlp");
              } else if (eventType === "done") {
                callbacks.onDone?.(data);
              } else if (eventType === "error") {
                callbacks.onError?.(new Error(data.error || "Streaming error"));
              }
            } catch (parseErr) {
              console.warn("SSE JSON parse warning:", parseErr);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      callbacks.onError?.(err);
    }
  },

  /**
   * Get past conversation history.
   */
  getHistory: async (): Promise<MentorMessageItem[]> => {
    const res = await apiRequest<{ conversation: { messages: MentorMessageItem[] } }>(
      "/mentor/history"
    );
    return res.data.conversation?.messages || [];
  },

  /**
   * Clear user conversation history.
   */
  clearHistory: async (): Promise<{ cleared: boolean }> => {
    const res = await apiRequest<{ cleared: boolean }>("/mentor/history", {
      method: "DELETE",
    });
    return res.data;
  },
};

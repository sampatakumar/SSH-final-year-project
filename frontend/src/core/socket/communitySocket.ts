import { io, Socket } from "socket.io-client";
import { getBackendOrigin } from "../api/apiClient";
import { getAuthToken } from "../auth/firebase";
import { CommunityMessage } from "../api/communityClient";

let socket: Socket | null = null;
let currentGroupId: string | null = null;

export const connectCommunitySocket = async (): Promise<Socket | null> => {
  if (socket && socket.connected) {
    return socket;
  }

  try {
    const origin = getBackendOrigin();
    const token = await getAuthToken().catch(() => null);

    socket = io(origin, {
      path: "/socket.io/",
      auth: { token: token ? `Bearer ${token}` : "" },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
    });

    socket.on("connect", () => {
      if (currentGroupId) {
        socket?.emit("join_group", { groupId: currentGroupId });
      }
    });

    socket.on("connect_error", (err) => {
      console.warn("[CommunitySocket] Connection warning:", err.message);
    });

    return socket;
  } catch (err: any) {
    console.warn("[CommunitySocket] Failed to initialize socket client:", err.message);
    return null;
  }
};

export const getCommunitySocket = (): Socket | null => socket;

export const joinGroupRoom = (groupId: string) => {
  currentGroupId = groupId;
  if (socket && socket.connected) {
    socket.emit("join_group", { groupId });
  }
};

export const leaveGroupRoom = (groupId: string) => {
  if (currentGroupId === groupId) {
    currentGroupId = null;
  }
  if (socket && socket.connected) {
    socket.emit("leave_group", { groupId });
  }
};

export const sendSocketTypingStart = (groupId: string) => {
  if (socket && socket.connected) {
    socket.emit("typing_start", { groupId });
  }
};

export const sendSocketTypingStop = (groupId: string) => {
  if (socket && socket.connected) {
    socket.emit("typing_stop", { groupId });
  }
};

export const subscribeToCommunityEvents = (handlers: {
  onNewMessage?: (message: CommunityMessage) => void;
  onMessageDeleted?: (data: { messageId: string; groupId: string }) => void;
  onUserTyping?: (data: { groupId: string; userId: string; displayName: string }) => void;
  onUserStoppedTyping?: (data: { groupId: string; userId: string }) => void;
  onPresenceUpdate?: (data: { onlineCount: number; onlineUserIds: string[] }) => void;
}) => {
  if (!socket) return () => {};

  if (handlers.onNewMessage) socket.on("new_message", handlers.onNewMessage);
  if (handlers.onMessageDeleted) socket.on("message_deleted", handlers.onMessageDeleted);
  if (handlers.onUserTyping) socket.on("user_typing", handlers.onUserTyping);
  if (handlers.onUserStoppedTyping) socket.on("user_stopped_typing", handlers.onUserStoppedTyping);
  if (handlers.onPresenceUpdate) socket.on("presence_update", handlers.onPresenceUpdate);

  return () => {
    if (!socket) return;
    if (handlers.onNewMessage) socket.off("new_message", handlers.onNewMessage);
    if (handlers.onMessageDeleted) socket.off("message_deleted", handlers.onMessageDeleted);
    if (handlers.onUserTyping) socket.off("user_typing", handlers.onUserTyping);
    if (handlers.onUserStoppedTyping) socket.off("user_stopped_typing", handlers.onUserStoppedTyping);
    if (handlers.onPresenceUpdate) socket.off("presence_update", handlers.onPresenceUpdate);
  };
};

export const disconnectCommunitySocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentGroupId = null;
  }
};

import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import jwksRsa from "jwks-rsa";
import { env } from "../../../config/env.js";
import { User } from "../../../core/database/models/user.models.js";
import { CommunityGroup } from "../models/communityGroup.models.js";
import { CommunityMembership } from "../models/communityMembership.models.js";
import { communityMessageService } from "../services/communityMessage.service.js";

const jwksClient = jwksRsa({
  jwksUri:
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

const getGooglePublicKey = (header, callback) => {
  jwksClient.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
};

/**
 * Tracks connected users for online presence: userId -> Set<socketId>
 */
const onlineUsers = new Map();

let io = null;

/**
 * Initializes the real-time Community Socket.IO server.
 * @param {import("http").Server} httpServer 
 * @returns {Server} Socket.IO server instance
 */
export const initCommunitySocket = (httpServer) => {
  if (io) return io;

  io = new Server(httpServer, {
    path: "/socket.io/",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  global.__communitySocketIO = io;

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const authHeader =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization ||
        "";

      const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : authHeader.trim();

      if (!token) {
        // Allow anonymous connection for public read, but flag user as null
        socket.user = null;
        return next();
      }

      // Verify token
      let uid = null;
      if (process.env.NODE_ENV === "test" || token.startsWith("mock-")) {
        // Test token format
        uid = token.replace(/^mock-/, "");
      } else {
        const decoded = await new Promise((resolve, reject) => {
          jwt.verify(
            token,
            getGooglePublicKey,
            {
              algorithms: ["RS256"],
              audience: env.FIREBASE_PROJECT_ID,
              issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
            },
            (err, decodedToken) => {
              if (err) return reject(err);
              resolve(decodedToken);
            }
          );
        });
        uid = decoded?.sub || decoded?.uid;
      }

      if (uid) {
        let user = await User.findOne({ firebaseUid: uid }).lean();
        if (!user && mongoose.Types.ObjectId.isValid(uid)) {
          user = await User.findById(uid).lean();
        }
        socket.user = user || null;
      }

      next();
    } catch (err) {
      // In non-blocking mode, allow socket connection as guest
      socket.user = null;
      next();
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user?._id?.toString();

    // Track online presence if user is authenticated
    if (userId) {
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId).add(socket.id);

      io.emit("presence_update", {
        onlineCount: onlineUsers.size,
        onlineUserIds: Array.from(onlineUsers.keys()),
      });
    }

    // Join Group Room with server-side authorization check
    socket.on("join_group", async ({ groupId }, callback) => {
      try {
        if (!groupId) {
          if (callback) callback({ success: false, message: "groupId is required" });
          return;
        }

        const group = await CommunityGroup.findById(groupId).lean();
        if (!group) {
          if (callback) callback({ success: false, message: "Group not found" });
          return;
        }

        // Server-side permission check: Private groups require authenticated active membership
        if (group.visibility === "private") {
          if (!socket.user) {
            socket.emit("error", {
              code: "UNAUTHORIZED",
              message: "Authentication required to join private group room.",
            });
            if (callback) callback({ success: false, message: "Unauthorized" });
            return;
          }

          const membership = await CommunityMembership.findOne({
            group: group._id,
            user: socket.user._id,
            status: "active",
          });

          if (!membership && socket.user.role !== "admin") {
            socket.emit("error", {
              code: "FORBIDDEN",
              message: "Access denied: You are not an active member of this private group.",
            });
            if (callback) callback({ success: false, message: "Forbidden" });
            return;
          }
        }

        const roomName = `group:${group._id.toString()}`;
        socket.join(roomName);

        socket.emit("group_joined", {
          groupId: group._id.toString(),
          name: group.name,
        });

        if (callback) callback({ success: true, groupId: group._id.toString() });
      } catch (err) {
        socket.emit("error", { code: "SERVER_ERROR", message: err.message });
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Leave Group Room
    socket.on("leave_group", ({ groupId }) => {
      if (groupId) {
        socket.leave(`group:${groupId}`);
      }
    });

    // Real-time Send Message via Socket
    socket.on("send_message", async ({ groupId, content, replyTo, attachments }, callback) => {
      try {
        if (!socket.user) {
          socket.emit("error", {
            code: "UNAUTHORIZED",
            message: "Authentication required to post messages.",
          });
          if (callback) callback({ success: false, message: "Unauthorized" });
          return;
        }

        const savedMessage = await communityMessageService.sendMessage(
          groupId,
          socket.user,
          { content, replyTo, attachments }
        );

        if (callback) callback({ success: true, message: savedMessage });
      } catch (err) {
        socket.emit("error", {
          code: err.statusCode ? `HTTP_${err.statusCode}` : "MESSAGE_ERROR",
          message: err.message,
        });
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Real-time Typing Indicators
    socket.on("typing_start", ({ groupId }) => {
      if (groupId && socket.user) {
        socket.to(`group:${groupId}`).emit("user_typing", {
          groupId,
          userId: socket.user._id,
          displayName: socket.user.displayName || "Student",
        });
      }
    });

    socket.on("typing_stop", ({ groupId }) => {
      if (groupId && socket.user) {
        socket.to(`group:${groupId}`).emit("user_stopped_typing", {
          groupId,
          userId: socket.user._id,
        });
      }
    });

    // Disconnect cleanup
    socket.on("disconnect", () => {
      if (userId && onlineUsers.has(userId)) {
        const userSockets = onlineUsers.get(userId);
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
        }

        io.emit("presence_update", {
          onlineCount: onlineUsers.size,
          onlineUserIds: Array.from(onlineUsers.keys()),
        });
      }
    });
  });

  return io;
};

/**
 * Returns active Socket.IO instance or null.
 */
export const getCommunitySocketIO = () => io;

/**
 * Closes Socket.IO server cleanly.
 */
export const closeCommunitySocket = async () => {
  if (io) {
    onlineUsers.clear();
    await new Promise((resolve) => io.close(resolve));
    io = null;
    global.__communitySocketIO = null;
  }
};

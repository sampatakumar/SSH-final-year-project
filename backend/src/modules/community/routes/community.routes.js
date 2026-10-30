import { Router } from "express";
import { verifyFirebaseToken } from "../../../core/auth/auth.middleware.js";
import {
  getGlobalCommunity,
  createGroup,
  listGroups,
  getGroupDetails,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  listMembers,
  manageMember,
  getMessages,
  sendMessage,
  deleteMessage,
  reportMessage,
  blockUser,
  unblockUser,
  getBlockedUsers,
  getStudentDirectory,
  getStudentPublicProfile,
  getPublicProjects,
  updateProjectCollaboration,
} from "../controllers/community.controller.js";

const router = Router();

// All community routes require authenticated student identity
router.use(verifyFirebaseToken);

// 1. Global & Groups
router.get("/global", getGlobalCommunity);
router.post("/groups", createGroup);
router.get("/groups", listGroups);
router.get("/groups/:groupId", getGroupDetails);
router.patch("/groups/:groupId", updateGroup);
router.delete("/groups/:groupId", deleteGroup);
router.post("/groups/:groupId/join", joinGroup);
router.post("/groups/:groupId/leave", leaveGroup);

// 2. Group Members
router.get("/groups/:groupId/members", listMembers);
router.patch("/groups/:groupId/members/:targetUserId", manageMember);

// 3. Messages & Moderation
router.get("/groups/:groupId/messages", getMessages);
router.post("/groups/:groupId/messages", sendMessage);
router.delete("/messages/:messageId", deleteMessage);
router.post("/messages/:messageId/report", reportMessage);

// 4. Blocks & Safety
router.get("/blocks", getBlockedUsers);
router.post("/blocks/:targetUserId", blockUser);
router.delete("/blocks/:targetUserId", unblockUser);

// 5. Student Discovery Directory
router.get("/students", getStudentDirectory);
router.get("/students/:studentId", getStudentPublicProfile);

// 6. Project Collaboration Discovery
router.get("/projects", getPublicProjects);
router.patch("/projects/:projectId/collaboration", updateProjectCollaboration);

export default router;

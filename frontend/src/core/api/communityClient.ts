import { apiRequest } from "./apiClient";

export interface CommunityGroup {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  visibility: "public" | "private";
  isGlobal: boolean;
  isPasswordProtected: boolean;
  memberCount: number;
  rules: string[];
  image?: string;
  owner?: {
    _id: string;
    displayName: string;
    photoURL?: string;
    academic?: {
      branchName?: string;
      institution?: string;
    };
  };
  moderators?: Array<{
    _id: string;
    displayName: string;
  }>;
  membership?: {
    isMember: boolean;
    role?: "owner" | "moderator" | "member" | null;
  };
  lastActivityAt: string;
  createdAt: string;
}

export interface CommunityMessage {
  _id: string;
  group: string;
  sender: {
    _id: string;
    displayName: string;
    photoURL?: string;
    headline?: string;
    academic?: {
      branchName?: string;
      institution?: string;
    };
  };
  content: string;
  messageType: "text" | "image" | "link" | "attachment" | "system";
  attachments: Array<{
    url: string;
    name: string;
    size: number;
    mimeType: string;
  }>;
  replyTo?: {
    _id: string;
    content: string;
    sender: {
      displayName: string;
    };
    isDeleted?: boolean;
    createdAt: string;
  } | null;
  isDeleted?: boolean;
  isEdited?: boolean;
  createdAt: string;
}

export interface CommunityMemberItem {
  membershipId: string;
  user: {
    _id: string;
    displayName: string;
    photoURL?: string | null;
    headline: string;
    branchName: string;
    institution: string;
  };
  role: "owner" | "moderator" | "member";
  joinedAt: string;
}

export interface StudentDirectoryItem {
  _id: string;
  displayName: string;
  photoURL?: string | null;
  headline: string;
  about: string;
  targetRole: string;
  careerInterests: string[];
  academic: {
    degreeName: string;
    branchName: string;
    branchSlug: string;
    institution: string;
    currentSemester: number;
    graduationYear?: number | null;
  };
  topSkills: string[];
  publicProjectCount: number;
  earnedBadgeCount: number;
}

export interface PublicProjectItem {
  _id: string;
  title: string;
  description: string;
  branchSlug: string;
  roleSlug: string;
  status: string;
  openForCollaboration: boolean;
  neededRoles: string[];
  neededSkills: string[];
  collaborationDescription: string;
  deliverables: Array<{
    key: string;
    label: string;
    type: string;
    fileUrl: string;
    fileName: string;
  }>;
  owner?: {
    _id: string;
    displayName: string;
    photoURL?: string | null;
    headline: string;
    branchName: string;
    institution: string;
  } | null;
  isOwner?: boolean;
  updatedAt: string;
}

export const communityClient = {
  // 1. Global & Group Management
  async getGlobalCommunity() {
    const res = await apiRequest<{ group: CommunityGroup }>("/community/global");
    return res.data.group;
  },

  async listGroups(params: {
    tab?: "all" | "my" | "discover";
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const query = new URLSearchParams();
    if (params.tab) query.append("tab", params.tab);
    if (params.category && params.category !== "All") query.append("category", params.category);
    if (params.search) query.append("search", params.search);
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));

    const path = `/community/groups${query.toString() ? `?${query.toString()}` : ""}`;
    const res = await apiRequest<{
      groups: CommunityGroup[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(path);
    return res.data;
  },

  async getGroupDetails(groupId: string) {
    const res = await apiRequest<{ group: CommunityGroup }>(`/community/groups/${groupId}`);
    return res.data.group;
  },

  async createGroup(data: {
    name: string;
    description?: string;
    category: string;
    visibility: "public" | "private";
    password?: string;
    rules?: string[];
  }) {
    const res = await apiRequest<{ group: CommunityGroup }>("/community/groups", {
      method: "POST",
      body: data,
    });
    return res.data.group;
  },

  async updateGroup(groupId: string, data: Partial<CommunityGroup> & { password?: string }) {
    const res = await apiRequest<{ group: CommunityGroup }>(`/community/groups/${groupId}`, {
      method: "PATCH",
      body: data,
    });
    return res.data.group;
  },

  async deleteGroup(groupId: string) {
    const res = await apiRequest<{ success: boolean; message: string }>(
      `/community/groups/${groupId}`,
      { method: "DELETE" }
    );
    return res.data;
  },

  async joinGroup(groupId: string, password?: string) {
    const res = await apiRequest<{
      alreadyMember: boolean;
      message: string;
      membership: { role: string };
    }>(`/community/groups/${groupId}/join`, {
      method: "POST",
      body: { password: password || null },
    });
    return res.data;
  },

  async leaveGroup(groupId: string) {
    const res = await apiRequest<{ success: boolean; message: string }>(
      `/community/groups/${groupId}/leave`,
      { method: "POST" }
    );
    return res.data;
  },

  async listMembers(groupId: string, page = 1, limit = 50) {
    const res = await apiRequest<{
      members: CommunityMemberItem[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/community/groups/${groupId}/members?page=${page}&limit=${limit}`);
    return res.data;
  },

  async manageMember(
    groupId: string,
    targetUserId: string,
    action: "assign_moderator" | "remove_moderator" | "revoke_membership" | "transfer_ownership"
  ) {
    const res = await apiRequest<{ success: boolean; message: string }>(
      `/community/groups/${groupId}/members/${targetUserId}`,
      {
        method: "PATCH",
        body: { action },
      }
    );
    return res.data;
  },

  // 2. Messaging & Moderation
  async getMessages(groupId: string, page = 1, limit = 50, before?: string) {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (before) query.append("before", before);

    const res = await apiRequest<{
      messages: CommunityMessage[];
      pagination: { page: number; limit: number; total: number; hasMore: boolean };
    }>(`/community/groups/${groupId}/messages?${query.toString()}`);
    return res.data;
  },

  async sendMessage(
    groupId: string,
    data: {
      content: string;
      replyTo?: string | null;
      messageType?: string;
      attachments?: Array<{ url: string; name: string; size?: number; mimeType?: string }>;
    }
  ) {
    const res = await apiRequest<{ message: CommunityMessage }>(
      `/community/groups/${groupId}/messages`,
      {
        method: "POST",
        body: data,
      }
    );
    return res.data.message;
  },

  async deleteMessage(messageId: string) {
    const res = await apiRequest<{ success: boolean; message: string }>(
      `/community/messages/${messageId}`,
      { method: "DELETE" }
    );
    return res.data;
  },

  async reportMessage(messageId: string, data: { reason: string; details?: string }) {
    const res = await apiRequest<{ success: boolean; message: string }>(
      `/community/messages/${messageId}/report`,
      {
        method: "POST",
        body: data,
      }
    );
    return res.data;
  },

  async blockUser(targetUserId: string, reason?: string) {
    const res = await apiRequest<{ success: boolean; message: string }>(
      `/community/blocks/${targetUserId}`,
      {
        method: "POST",
        body: { reason: reason || "" },
      }
    );
    return res.data;
  },

  async unblockUser(targetUserId: string) {
    const res = await apiRequest<{ success: boolean; message: string }>(
      `/community/blocks/${targetUserId}`,
      { method: "DELETE" }
    );
    return res.data;
  },

  // 3. Student Discovery Directory
  async getStudentDirectory(params: {
    branch?: string;
    college?: string;
    semester?: string;
    skill?: string;
    careerInterest?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const query = new URLSearchParams();
    if (params.branch && params.branch !== "All") query.append("branch", params.branch);
    if (params.college && params.college !== "All") query.append("college", params.college);
    if (params.semester && params.semester !== "All") query.append("semester", params.semester);
    if (params.skill) query.append("skill", params.skill);
    if (params.careerInterest && params.careerInterest !== "All") query.append("careerInterest", params.careerInterest);
    if (params.search) query.append("search", params.search);
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));

    const path = `/community/students${query.toString() ? `?${query.toString()}` : ""}`;
    const res = await apiRequest<{
      students: StudentDirectoryItem[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(path);
    return res.data;
  },

  async getStudentPublicProfile(studentId: string) {
    const res = await apiRequest<{ profile: any }>(`/community/students/${studentId}`);
    return res.data.profile;
  },

  // 4. Project Collaboration Discovery
  async getPublicProjects(params: {
    openForCollaboration?: boolean;
    branchSlug?: string;
    skill?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const query = new URLSearchParams();
    if (params.openForCollaboration) query.append("openForCollaboration", "true");
    if (params.branchSlug && params.branchSlug !== "All") query.append("branchSlug", params.branchSlug);
    if (params.skill) query.append("skill", params.skill);
    if (params.search) query.append("search", params.search);
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));

    const path = `/community/projects${query.toString() ? `?${query.toString()}` : ""}`;
    const res = await apiRequest<{
      projects: PublicProjectItem[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(path);
    return res.data;
  },

  async updateProjectCollaboration(
    projectId: string,
    data: {
      isPublic?: boolean;
      openForCollaboration?: boolean;
      neededRoles?: string[];
      neededSkills?: string[];
      collaborationDescription?: string;
    }
  ) {
    const res = await apiRequest<{ message: string }>(
      `/community/projects/${projectId}/collaboration`,
      {
        method: "PATCH",
        body: data,
      }
    );
    return res.data;
  },
};

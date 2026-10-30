import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Users,
  Compass,
  FolderGit2,
  Lock,
  Globe,
  Plus,
  Send,
  Search,
  Shield,
  Smile,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Tag,
  GraduationCap,
  Award,
  Filter,
  UserCheck,
  X,
  ArrowLeft,
  Info,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/core/auth";
import {
  communityClient,
  CommunityGroup,
  CommunityMessage,
  StudentDirectoryItem,
  PublicProjectItem,
  CommunityMemberItem,
} from "@/core/api/communityClient";
import {
  connectCommunitySocket,
  joinGroupRoom,
  leaveGroupRoom,
  sendSocketTypingStart,
  sendSocketTypingStop,
  subscribeToCommunityEvents,
} from "@/core/socket/communitySocket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const CATEGORIES = [
  "All",
  "Programming",
  "Web Development",
  "AI and Machine Learning",
  "Competitive Programming",
  "Engineering",
  "Academics",
  "Business and Finance",
  "Project Collaboration",
  "Placement Preparation",
  "General Discussion",
];

const BRANCH_OPTIONS = [
  "All",
  "Computer Science",
  "Mechanical Engineering",
  "Electronics and Communication",
  "Electrical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Biotechnology",
  "Business Administration",
  "Commerce and Finance",
];

const CommunityPage: React.FC = () => {
  const { backendUser } = useAuth();

  // Active top navigation tab
  const [activeTab, setActiveTab] = useState<
    "chat" | "discover" | "students" | "projects"
  >("chat");

  // Groups and active selection
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<CommunityGroup | null>(null);
  const [mobileView, setMobileView] = useState<"groups" | "chat">("chat");
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [groupCategoryFilter, setGroupCategoryFilter] = useState("All");
  const [groupSearch, setGroupSearch] = useState("");

  // Messages in active group
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [replyingTo, setReplyingTo] = useState<CommunityMessage | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Group members and right sidebar
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [members, setMembers] = useState<CommunityMemberItem[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Create Group Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupCat, setNewGroupCat] = useState("Programming");
  const [newGroupVisibility, setNewGroupVisibility] = useState<"public" | "private">("public");
  const [newGroupPass, setNewGroupPass] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Password Prompt Modal for Private Groups
  const [passwordModalGroup, setPasswordModalGroup] = useState<CommunityGroup | null>(null);
  const [joinPassword, setJoinPassword] = useState("");
  const [joiningGroup, setJoiningGroup] = useState(false);

  // Discover Groups Tab
  const [discoverGroups, setDiscoverGroups] = useState<CommunityGroup[]>([]);
  const [loadingDiscover, setLoadingDiscover] = useState(false);

  // Students Directory Tab
  const [students, setStudents] = useState<StudentDirectoryItem[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentBranch, setStudentBranch] = useState("All");
  const [studentSkill, setStudentSkill] = useState("");

  // Project Collaboration Tab
  const [projects, setProjects] = useState<PublicProjectItem[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectBranch, setProjectBranch] = useState("All");
  const [collabOnly, setCollabOnly] = useState(true);

  // Online presence count
  const [onlineCount, setOnlineCount] = useState<number>(1);

  // 1. Initial Load: Connect Socket and Fetch Groups
  useEffect(() => {
    let isMounted = true;
    let unsubscribeEvents: (() => void) | undefined;

    const init = async () => {
      try {
        await connectCommunitySocket();

        if (!isMounted) return;

        unsubscribeEvents = subscribeToCommunityEvents({
          onNewMessage: (msg) => {
            if (activeGroup && msg.group === activeGroup._id) {
              setMessages((prev) => {
                if (prev.some((m) => m._id === msg._id)) return prev;
                return [...prev, msg];
              });
              scrollToBottom();
            }
          },
          onMessageDeleted: ({ messageId, groupId }) => {
            if (activeGroup && groupId === activeGroup._id) {
              setMessages((prev) =>
                prev.map((m) =>
                  m._id === messageId
                    ? { ...m, isDeleted: true, content: "[Message deleted by sender or moderator]" }
                    : m
                )
              );
            }
          },
          onUserTyping: ({ groupId, displayName }) => {
            if (activeGroup && groupId === activeGroup._id) {
              setTypingUsers((prev) =>
                prev.includes(displayName) ? prev : [...prev, displayName]
              );
            }
          },
          onUserStoppedTyping: ({ groupId }) => {
            if (activeGroup && groupId === activeGroup._id) {
              setTypingUsers([]);
            }
          },
          onPresenceUpdate: ({ onlineCount }) => {
            if (isMounted) setOnlineCount(onlineCount || 1);
          },
        });

        // Fetch user groups
        const data = await communityClient.listGroups({ tab: "all" });
        if (!isMounted) return;
        setGroups(data.groups || []);

        // Auto-select Global Community if available, else first group
        const globalGroup = (data.groups || []).find((g) => g.isGlobal) || (data.groups || [])[0];
        if (globalGroup && isMounted) {
          setActiveGroup(globalGroup);
        }
      } catch (err: any) {
        console.warn("Community init note:", err.message);
      } finally {
        if (isMounted) setLoadingGroups(false);
      }
    };

    init();

    return () => {
      isMounted = false;
      if (unsubscribeEvents) unsubscribeEvents();
    };
  }, []);

  // 2. Room switching when activeGroup changes
  useEffect(() => {
    if (!activeGroup) return;

    let isMounted = true;
    joinGroupRoom(activeGroup._id);

    const loadMsgs = async () => {
      setLoadingMessages(true);
      try {
        const data = await communityClient.getMessages(activeGroup._id, 1, 50);
        if (isMounted) {
          setMessages(data.messages || []);
          scrollToBottom();
        }
      } catch (err: any) {
        if (isMounted) toast.error(err.message || "Failed to load messages");
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    };

    loadMsgs();

    return () => {
      isMounted = false;
      leaveGroupRoom(activeGroup._id);
    };
  }, [activeGroup?._id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (typeof messagesEndRef.current?.scrollIntoView === "function") {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // 3. Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeGroup) return;

    setSendingMessage(true);
    sendSocketTypingStop(activeGroup._id);

    try {
      const msg = await communityClient.sendMessage(activeGroup._id, {
        content: messageInput.trim(),
        replyTo: replyingTo ? replyingTo._id : null,
      });

      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      setMessageInput("");
      setReplyingTo(null);
      scrollToBottom();
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  // 4. Create Group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    setCreatingGroup(true);
    try {
      const created = await communityClient.createGroup({
        name: newGroupName.trim(),
        description: newGroupDesc.trim(),
        category: newGroupCat,
        visibility: newGroupVisibility,
        password: newGroupVisibility === "private" ? newGroupPass : undefined,
      });

      toast.success(`Group '${created.name}' created successfully!`);
      setGroups((prev) => [created, ...prev]);
      setActiveGroup(created);
      setShowCreateModal(false);
      setNewGroupName("");
      setNewGroupDesc("");
      setNewGroupPass("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create group");
    } finally {
      setCreatingGroup(false);
    }
  };

  // 5. Join Group
  const handleJoinGroup = async (group: CommunityGroup) => {
    if (group.isPasswordProtected) {
      setPasswordModalGroup(group);
      setJoinPassword("");
      return;
    }

    setJoiningGroup(true);
    try {
      const res = await communityClient.joinGroup(group._id);
      toast.success(res.message);
      // Refresh groups list
      const updated = await communityClient.listGroups({ tab: "all" });
      setGroups(updated.groups);
      setActiveGroup(group);
      setActiveTab("chat");
    } catch (err: any) {
      toast.error(err.message || "Failed to join group");
    } finally {
      setJoiningGroup(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalGroup) return;

    setJoiningGroup(true);
    try {
      const res = await communityClient.joinGroup(passwordModalGroup._id, joinPassword);
      toast.success(res.message);
      const updated = await communityClient.listGroups({ tab: "all" });
      setGroups(updated.groups);
      setActiveGroup(passwordModalGroup);
      setPasswordModalGroup(null);
      setActiveTab("chat");
    } catch (err: any) {
      toast.error(err.message || "Failed to verify password");
    } finally {
      setJoiningGroup(false);
    }
  };

  // 6. Load Discover Groups
  useEffect(() => {
    if (activeTab === "discover") {
      setLoadingDiscover(true);
      communityClient
        .listGroups({ tab: "discover", category: groupCategoryFilter })
        .then((data) => setDiscoverGroups(data.groups))
        .catch(() => {})
        .finally(() => setLoadingDiscover(false));
    }
  }, [activeTab, groupCategoryFilter]);

  // 7. Load Students Directory
  useEffect(() => {
    if (activeTab === "students") {
      setLoadingStudents(true);
      communityClient
        .getStudentDirectory({
          search: studentSearch,
          branch: studentBranch,
          skill: studentSkill,
        })
        .then((data) => setStudents(data.students))
        .catch(() => {})
        .finally(() => setLoadingStudents(false));
    }
  }, [activeTab, studentBranch, studentSearch, studentSkill]);

  // 8. Load Public Projects
  useEffect(() => {
    if (activeTab === "projects") {
      setLoadingProjects(true);
      communityClient
        .getPublicProjects({
          openForCollaboration: collabOnly,
          branchSlug: projectBranch,
          search: projectSearch,
        })
        .then((data) => setProjects(data.projects))
        .catch(() => {})
        .finally(() => setLoadingProjects(false));
    }
  }, [activeTab, collabOnly, projectBranch, projectSearch]);

  // Load Members when right sidebar opens
  const toggleRightSidebar = async () => {
    if (!showRightSidebar && activeGroup) {
      setLoadingMembers(true);
      setShowRightSidebar(true);
      try {
        const data = await communityClient.listMembers(activeGroup._id);
        setMembers(data.members || []);
      } catch (err: any) {
        toast.error("Could not load member list");
      } finally {
        setLoadingMembers(false);
      }
    } else {
      setShowRightSidebar(false);
    }
  };

  // Delete message handler
  const handleDeleteMessage = async (messageId: string) => {
    try {
      await communityClient.deleteMessage(messageId);
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, isDeleted: true, content: "[This message was deleted by sender or moderator]" }
            : m
        )
      );
      toast.success("Message deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete message");
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-background">
      {/* Top Navigation Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between px-4 lg:px-6 py-2.5 border-b border-border/40 bg-card/60 backdrop-blur-md shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-neo-raised-sm">
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2 truncate">
              Student Community & Collaboration
              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shrink-0">
                {onlineCount} Online
              </Badge>
            </h1>
            <p className="text-xs text-muted-foreground truncate hidden sm:block">
              Peer-to-peer technical chat, private study circles, student directory & projects
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/40 overflow-x-auto no-scrollbar shrink-0 max-w-full">
          <button
            onClick={() => setActiveTab("chat")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer",
              activeTab === "chat"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Chat & Groups
          </button>
          <button
            onClick={() => setActiveTab("discover")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer",
              activeTab === "discover"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Compass className="h-3.5 w-3.5" />
            Discover Groups
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer",
              activeTab === "students"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UserCheck className="h-3.5 w-3.5" />
            Student Directory
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer",
              activeTab === "projects"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FolderGit2 className="h-3.5 w-3.5" />
            Project Collaboration
          </button>
        </div>
      </header>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-hidden">
        {/* ================================================================= */}
        {/* TAB 1: CHAT & GROUPS                                              */}
        {/* ================================================================= */}
        {activeTab === "chat" && (
          <div className="flex h-full w-full overflow-hidden">
            {/* Left Column: Group Sidebar */}
            <aside
              className={cn(
                "w-full md:w-72 lg:w-80 border-r border-border/40 flex flex-col bg-card/25 shrink-0 h-full",
                mobileView === "chat" ? "hidden md:flex" : "flex"
              )}
            >
              <div className="p-3 border-b border-border/40 flex items-center justify-between gap-2 shrink-0">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search groups..."
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                    className="pl-8 h-8 text-xs bg-background/50 border-border/40"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowCreateModal(true)}
                  className="h-8 px-2 text-xs gap-1 shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New
                </Button>
              </div>

              {/* Groups List */}
              <div className="flex-1 overflow-y-auto divide-y divide-border/20 p-2 space-y-1">
                {loadingGroups ? (
                  <div className="p-4 text-center text-xs text-muted-foreground animate-pulse">
                    Loading communities...
                  </div>
                ) : groups.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    No groups found. Create one or explore Discover.
                  </div>
                ) : (
                  groups
                    .filter((g) =>
                      g.name.toLowerCase().includes(groupSearch.toLowerCase())
                    )
                    .map((group) => {
                      const isSelected = activeGroup?._id === group._id;
                      return (
                        <button
                          key={group._id}
                          onClick={() => {
                            setActiveGroup(group);
                            setMobileView("chat");
                          }}
                          className={cn(
                            "w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-3 cursor-pointer",
                            isSelected
                              ? "bg-primary/10 border border-primary/30 shadow-xs"
                              : "hover:bg-muted/40 border border-transparent"
                          )}
                        >
                          <div className="h-9 w-9 rounded-xl bg-muted/60 border border-border/40 flex items-center justify-center text-foreground font-semibold shrink-0">
                            {group.isGlobal ? (
                              <Globe className="h-4 w-4 text-primary" />
                            ) : group.visibility === "private" ? (
                              <Lock className="h-4 w-4 text-amber-400" />
                            ) : (
                              <Users className="h-4 w-4 text-blue-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-semibold text-xs text-foreground truncate">
                                {group.name}
                              </span>
                              {group.isGlobal && (
                                <Badge className="text-[9px] px-1 py-0 h-4 bg-primary/20 text-primary border-primary/30">
                                  Global
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {group.category} • {group.memberCount} members
                            </p>
                          </div>
                        </button>
                      );
                    })
                )}
              </div>
            </aside>

            {/* Center Column: Chat Messages Timeline */}
            <main
              className={cn(
                "flex-1 min-w-0 flex flex-col h-full bg-background overflow-hidden relative",
                mobileView === "groups" ? "hidden md:flex" : "flex"
              )}
            >
              {activeGroup ? (
                <>
                  {/* Chat Group Header */}
                  <div className="h-14 px-4 lg:px-6 border-b border-border/40 flex items-center justify-between bg-card/40 backdrop-blur-sm shrink-0">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      {/* Mobile back button to show groups */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMobileView("groups")}
                        className="md:hidden h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                        aria-label="Back to groups"
                        title="Back to groups"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>

                      <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        {activeGroup.isGlobal ? (
                          <Globe className="h-4 w-4" />
                        ) : activeGroup.visibility === "private" ? (
                          <Lock className="h-4 w-4 text-amber-400" />
                        ) : (
                          <Users className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h2 className="font-bold text-sm text-foreground truncate">
                          {activeGroup.name}
                        </h2>
                        <span className="text-[11px] text-muted-foreground truncate block">
                          {activeGroup.category} • {activeGroup.memberCount} members
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant={showRightSidebar ? "secondary" : "ghost"}
                        size="sm"
                        onClick={toggleRightSidebar}
                        className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                      >
                        <Users className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Details & Members</span>
                      </Button>
                    </div>
                  </div>

                  {/* Messages Scroll Area */}
                  <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 space-y-3.5">
                    {loadingMessages ? (
                      <div className="text-center p-8 text-xs text-muted-foreground animate-pulse">
                        Loading message history...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <div className="h-12 w-12 rounded-2xl bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground mb-3 shadow-neo-raised-sm">
                          <MessageSquare className="h-6 w-6" />
                        </div>
                        <h3 className="font-semibold text-sm text-foreground">
                          Welcome to {activeGroup.name}!
                        </h3>
                        <p className="text-xs text-muted-foreground max-w-sm mt-1">
                          No messages yet. Break the ice and start collaborating with peers across campuses.
                        </p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isSelf = backendUser?._id && msg.sender?._id === backendUser._id;
                        return (
                          <div
                            key={msg._id}
                            className={`flex gap-3 group items-start ${
                              isSelf ? "flex-row-reverse" : "flex-row"
                            }`}
                          >
                            {/* Avatar */}
                            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary/30 to-blue-500/30 border border-primary/20 flex items-center justify-center font-bold text-xs text-foreground shrink-0 overflow-hidden shadow-xs">
                              {msg.sender?.photoURL ? (
                                <img
                                  src={msg.sender.photoURL}
                                  alt={msg.sender.displayName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                (msg.sender?.displayName || "S").charAt(0).toUpperCase()
                              )}
                            </div>

                            {/* Message Bubble Container */}
                            <div
                              className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] flex flex-col ${
                                isSelf ? "items-end" : "items-start"
                              }`}
                            >
                              {/* Sender Name and Time */}
                              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1 px-1">
                                <span className="font-medium text-foreground">
                                  {isSelf ? "You" : msg.sender?.displayName || "Student"}
                                </span>
                                {msg.sender?.academic?.branchName && (
                                  <span className="text-[10px] opacity-75">
                                    • {msg.sender.academic.branchName}
                                  </span>
                                )}
                                <span className="text-[9px] opacity-50">
                                  {new Date(msg.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>

                              {/* Bubble */}
                              <div
                                className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                                  msg.isDeleted
                                    ? "bg-muted/40 text-muted-foreground italic border border-border/30"
                                    : isSelf
                                    ? "bg-primary text-primary-foreground rounded-tr-xs shadow-sm"
                                    : "bg-card text-foreground rounded-tl-xs border border-border/50 shadow-sm"
                                }`}
                              >
                                {msg.replyTo && (
                                  <div className="mb-1.5 pl-2 border-l-2 border-primary/40 text-[10px] opacity-75 line-clamp-1">
                                    Replying to: {msg.replyTo.content}
                                  </div>
                                )}
                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              </div>

                              {/* Hover Actions: Reply & Delete */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 mt-1 px-1 text-[10px] text-muted-foreground">
                                <button
                                  onClick={() => setReplyingTo(msg)}
                                  className="hover:text-primary transition-colors cursor-pointer"
                                >
                                  Reply
                                </button>
                                {isSelf && !msg.isDeleted && (
                                  <button
                                    onClick={() => handleDeleteMessage(msg._id)}
                                    className="hover:text-destructive transition-colors cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Typing Indicator */}
                  {typingUsers.length > 0 && (
                    <div className="px-5 py-1 text-[11px] text-muted-foreground italic animate-pulse">
                      {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
                    </div>
                  )}

                  {/* Message Input Composer */}
                  <div className="p-3 lg:p-4 border-t border-border/40 bg-card/30 backdrop-blur-xs shrink-0">
                    {replyingTo && (
                      <div className="mb-2 p-2 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between text-xs">
                        <span className="truncate text-muted-foreground">
                          Replying to <b className="text-foreground">{replyingTo.sender?.displayName}</b>: "{replyingTo.content}"
                        </span>
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="text-muted-foreground hover:text-foreground ml-2 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                      <Input
                        placeholder={`Message #${activeGroup.name}...`}
                        value={messageInput}
                        onChange={(e) => {
                          setMessageInput(e.target.value);
                          if (activeGroup) sendSocketTypingStart(activeGroup._id);
                        }}
                        onBlur={() => {
                          if (activeGroup) sendSocketTypingStop(activeGroup._id);
                        }}
                        className="flex-1 bg-background text-xs h-10 border-border/40 rounded-xl focus-visible:ring-1"
                      />
                      <Button
                        type="submit"
                        disabled={!messageInput.trim() || sendingMessage}
                        className="h-10 px-4 rounded-xl text-xs gap-1.5 cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Send
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-muted-foreground">
                  <div className="h-12 w-12 rounded-2xl bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground mb-3 shadow-neo-raised-sm">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">No group selected</h3>
                  <p className="max-w-xs text-muted-foreground">
                    Select a community from the list or explore new groups in the Discover tab.
                  </p>
                </div>
              )}
            </main>

            {/* Right Column: Group Details & Members Sidebar */}
            {showRightSidebar && activeGroup && (
              <aside
                className={cn(
                  "border-l border-border/40 bg-card/30 flex flex-col h-full shrink-0 z-20",
                  "fixed inset-y-0 right-0 w-80 shadow-2xl xl:static xl:w-72 2xl:w-80 xl:shadow-none"
                )}
              >
                <div className="p-4 border-b border-border/40 flex items-center justify-between shrink-0">
                  <h3 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-primary" />
                    Group Details
                  </h3>
                  <button
                    onClick={() => setShowRightSidebar(false)}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer"
                    aria-label="Close group details"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      About
                    </span>
                    <p className="mt-1 text-muted-foreground leading-relaxed">
                      {activeGroup.description || "Campus technical discussion group."}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Category
                    </span>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Badge variant="outline" className="text-[11px]">
                        {activeGroup.category}
                      </Badge>
                      {activeGroup.visibility === "private" ? (
                        <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">
                          <Lock className="h-3 w-3 mr-1" />
                          Private Circle
                        </Badge>
                      ) : (
                        <Badge className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20">
                          <Globe className="h-3 w-3 mr-1" />
                          Public Community
                        </Badge>
                      )}
                    </div>
                  </div>

                  {activeGroup.rules && activeGroup.rules.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Community Rules
                      </span>
                      <ul className="mt-1.5 space-y-1 text-muted-foreground list-disc pl-3">
                        {activeGroup.rules.map((rule, idx) => (
                          <li key={idx} className="text-[11px] leading-snug">
                            {rule}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-2 border-t border-border/30">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                      Members ({members.length})
                    </span>

                    {loadingMembers ? (
                      <span className="text-muted-foreground text-[11px]">Loading...</span>
                    ) : (
                      <div className="space-y-2">
                        {members.map((m) => (
                          <div key={m.membershipId} className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
                              {m.user?.displayName?.charAt(0) || "S"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="font-medium text-foreground text-[11px] truncate block">
                                {m.user?.displayName}
                              </span>
                              <span className="text-[9px] text-muted-foreground block truncate">
                                {m.role === "owner" ? "Owner" : m.role === "moderator" ? "Moderator" : "Member"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </aside>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: DISCOVER GROUPS                                            */}
        {/* ================================================================= */}
        {activeTab === "discover" && (
          <div className="w-full h-full p-4 lg:p-6 overflow-y-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Discover Technical Communities</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Join student-run engineering squads, competitive coding circles, and interdisciplinary hubs.
                </p>
              </div>
              <Button onClick={() => setShowCreateModal(true)} className="text-xs gap-1.5 cursor-pointer">
                <Plus className="h-4 w-4" />
                Create Group
              </Button>
            </div>

            {/* Category Filter Badges */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setGroupCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
                    groupCategoryFilter === cat
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/40 text-muted-foreground hover:text-foreground border border-border/30"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Group Cards Grid */}
            {loadingDiscover ? (
              <div className="text-center p-12 text-xs text-muted-foreground animate-pulse">
                Discovering technical groups across campuses...
              </div>
            ) : discoverGroups.length === 0 ? (
              <div className="text-center p-12 bg-card/20 rounded-2xl border border-border/40">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <h3 className="font-semibold text-sm text-foreground">No groups found in this category</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Be the first to create a community for this topic!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {discoverGroups.map((group) => (
                  <div
                    key={group._id}
                    className="p-5 rounded-2xl bg-card/40 border border-border/40 hover:border-primary/40 transition-all flex flex-col justify-between shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px] bg-muted/30">
                          {group.category}
                        </Badge>
                        {group.visibility === "private" ? (
                          <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">
                            <Lock className="h-3 w-3 mr-1" />
                            Private
                          </Badge>
                        ) : (
                          <Badge className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20">
                            Public
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-foreground mb-1">{group.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {group.description || "Active student discussion group."}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        {group.memberCount} members
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleJoinGroup(group)}
                        disabled={joiningGroup}
                        className="h-8 px-3 text-xs cursor-pointer"
                      >
                        Join Group
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: STUDENT DIRECTORY                                          */}
        {/* ================================================================= */}
        {activeTab === "students" && (
          <div className="w-full h-full p-4 lg:p-6 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">Student Directory & Peer Discovery</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Connect with verified peers across academic disciplines, explore public competencies, and find collaborators.
              </p>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row items-center gap-3 p-3 bg-card/40 rounded-2xl border border-border/40">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students by name, headline, target role..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-9 h-9 text-xs bg-background border-border/40"
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={studentBranch}
                  onChange={(e) => setStudentBranch(e.target.value)}
                  className="h-9 px-3 text-xs rounded-xl bg-background border border-border/40 text-foreground"
                >
                  {BRANCH_OPTIONS.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Filter by skill (e.g. Python, ROS2)..."
                  value={studentSkill}
                  onChange={(e) => setStudentSkill(e.target.value)}
                  className="h-9 w-48 text-xs bg-background border-border/40"
                />
              </div>
            </div>

            {/* Students Grid */}
            {loadingStudents ? (
              <div className="text-center p-12 text-xs text-muted-foreground animate-pulse">
                Loading peer directory...
              </div>
            ) : students.length === 0 ? (
              <div className="text-center p-12 bg-card/20 rounded-2xl border border-border/40">
                <UserCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <h3 className="font-semibold text-sm text-foreground">No students found</h3>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or search term.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {students.map((student) => (
                  <div
                    key={student._id}
                    className="p-5 rounded-2xl bg-card/40 border border-border/40 hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary/30 to-blue-500/30 border border-primary/20 flex items-center justify-center font-bold text-sm text-foreground shrink-0 overflow-hidden">
                          {student.photoURL ? (
                            <img src={student.photoURL} alt={student.displayName} className="h-full w-full object-cover" />
                          ) : (
                            student.displayName.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-foreground truncate">{student.displayName}</h3>
                          <span className="text-[11px] text-muted-foreground truncate block">
                            {student.academic?.branchName} • {student.academic?.institution} • Sem {student.academic?.currentSemester}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-foreground/80 font-medium mb-1 line-clamp-1">
                        {student.headline || student.targetRole}
                      </p>

                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                        {student.about || "Dedicated engineering student actively building projects."}
                      </p>

                      {student.topSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {student.topSkills.slice(0, 5).map((sk) => (
                            <Badge key={sk} variant="secondary" className="text-[10px] px-1.5 py-0">
                              {sk}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{student.publicProjectCount} Public Projects</span>
                      <span className="flex items-center gap-1 text-primary">
                        <Award className="h-3 w-3" />
                        {student.earnedBadgeCount} Badges
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: PROJECT COLLABORATION                                      */}
        {/* ================================================================= */}
        {activeTab === "projects" && (
          <div className="w-full h-full p-4 lg:p-6 overflow-y-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">Project Collaboration Hub</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Discover peer capstones, technical prototypes, and team up with fellow students.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCollabOnly(!collabOnly)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    collabOnly
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-muted/40 text-muted-foreground border-border/30"
                  }`}
                >
                  {collabOnly ? "✓ Open for Teammates" : "All Public Projects"}
                </button>
              </div>
            </div>

            {/* Project Cards Grid */}
            {loadingProjects ? (
              <div className="text-center p-12 text-xs text-muted-foreground animate-pulse">
                Loading collaborative projects...
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center p-12 bg-card/20 rounded-2xl border border-border/40">
                <FolderGit2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <h3 className="font-semibold text-sm text-foreground">No projects currently seeking teammates</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Check back soon or open your own Project Studio capstone for collaboration!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                {projects.map((proj) => (
                  <div
                    key={proj._id}
                    className="p-5 rounded-2xl bg-card/40 border border-border/40 hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {proj.branchSlug}
                        </Badge>
                        {proj.openForCollaboration && (
                          <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                            Teammates Wanted
                          </Badge>
                        )}
                      </div>

                      <h3 className="font-bold text-base text-foreground mb-1">{proj.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-3">
                        {proj.description || "Capstone engineering project."}
                      </p>

                      {proj.neededRoles.length > 0 && (
                        <div className="mb-2">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                            Needed Roles:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {proj.neededRoles.map((role) => (
                              <Badge key={role} className="text-[10px] bg-primary/10 text-primary border-primary/20">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {proj.neededSkills.length > 0 && (
                        <div className="mb-3">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                            Technologies:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {proj.neededSkills.map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-[10px] px-1.5 py-0">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-border/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
                          {proj.owner?.displayName?.charAt(0) || "P"}
                        </div>
                        <span className="text-xs font-medium text-foreground">
                          {proj.owner?.displayName || "Student Creator"}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => {
                          toast.success(`Collaboration request noted for ${proj.title}! Message the owner in chat.`);
                          setActiveTab("chat");
                        }}
                        className="h-8 px-3 text-xs"
                      >
                        Collaborate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* MODAL: CREATE GROUP                                                 */}
      {/* =================================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border/40 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Create New Community Group
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Group Name *
                </label>
                <Input
                  placeholder="e.g. Competitive Coding Squad"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Category *
                </label>
                <select
                  value={newGroupCat}
                  onChange={(e) => setNewGroupCat(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-xl bg-background border border-border/40 text-foreground"
                >
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Description
                </label>
                <Textarea
                  placeholder="Purpose of the group, study goals, or project focus..."
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="text-xs resize-none h-20"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Visibility
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewGroupVisibility("public")}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                      newGroupVisibility === "public"
                        ? "bg-primary/10 border-primary text-primary"
                        : "border-border/40 text-muted-foreground hover:bg-muted/30"
                    }`}
                  >
                    Public (Open Join)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewGroupVisibility("private")}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                      newGroupVisibility === "private"
                        ? "bg-amber-500/10 border-amber-500 text-amber-400"
                        : "border-border/40 text-muted-foreground hover:bg-muted/30"
                    }`}
                  >
                    Private (Password)
                  </button>
                </div>
              </div>

              {newGroupVisibility === "private" && (
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <label className="text-xs font-medium text-amber-300 block mb-1">
                    Group Password (Min 4 chars) *
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter group passcode"
                    value={newGroupPass}
                    onChange={(e) => setNewGroupPass(e.target.value)}
                    className="text-xs bg-background"
                    required
                  />
                  <p className="text-[10px] text-amber-400/80 mt-1">
                    Only students with this passcode can join your private circle.
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs h-9"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creatingGroup} className="text-xs h-9">
                  {creatingGroup ? "Creating..." : "Create Group"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: PASSWORD PROMPT FOR PRIVATE GROUP                            */}
      {/* =================================================================== */}
      {passwordModalGroup && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border/40 rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-400" />
                Join Private Group
              </h3>
              <button
                onClick={() => setPasswordModalGroup(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Enter the passcode set by the owner of <b>{passwordModalGroup.name}</b>:
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="Passcode..."
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                className="text-xs"
                autoFocus
                required
              />

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPasswordModalGroup(null)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={joiningGroup || !joinPassword} className="text-xs h-8">
                  {joiningGroup ? "Verifying..." : "Join"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPage;

import mongoose from "mongoose";
import { StudentProject } from "../../academic/models/studentProject.models.js";
import { ApiError } from "../../../core/errors/ApiError.js";

class PublicProjectDiscoveryService {
  /**
   * Retrieves public and collaboration-ready projects across all academic branches.
   * @param {object} callerUser 
   * @param {object} filters - { openForCollaboration, branchSlug, skill, search, page, limit }
   * @returns {Promise<object>} Paginated public projects
   */
  async getPublicProjects(callerUser, filters = {}) {
    const {
      openForCollaboration,
      branchSlug,
      skill,
      search,
      page = 1,
      limit = 20,
    } = filters;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Must be explicitly marked public or enabled for collaboration
    const query = {
      $or: [
        { isPublic: true },
        { portfolioVisibility: true },
        { openForCollaboration: true },
      ],
      status: { $ne: "archived" },
    };

    if (openForCollaboration === "true" || openForCollaboration === true) {
      query.openForCollaboration = true;
    }

    if (branchSlug && branchSlug !== "All") {
      query.branchSlug = branchSlug.toLowerCase().trim();
    }

    if (skill && skill.trim()) {
      const skillRegex = { $regex: skill.trim(), $options: "i" };
      query.$or = [
        { neededSkills: skillRegex },
        { roleSlug: skillRegex },
        { title: skillRegex },
        { description: skillRegex },
      ];
    }

    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { neededRoles: searchRegex },
        { collaborationDescription: searchRegex },
      ];
    }

    const [projects, total] = await Promise.all([
      StudentProject.find(query)
        .populate("owner", "displayName photoURL headline academic.branchName academic.institution")
        .sort({ openForCollaboration: -1, updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      StudentProject.countDocuments(query),
    ]);

    const sanitizedProjects = projects.map((p) => {
      const isOwner = callerUser && p.owner?._id?.toString() === callerUser._id?.toString();

      // Filter deliverables to public-safe items (only images, reports, links, completed files)
      const publicDeliverables = (p.deliverables || [])
        .filter((d) => Boolean(d.fileUrl || d.externalUrl || d.content))
        .map((d) => ({
          key: d.key,
          label: d.label,
          type: d.type,
          fileUrl: d.fileUrl || d.externalUrl || "",
          fileName: d.fileName || "",
        }));

      return {
        _id: p._id,
        title: p.title,
        description: p.description || "",
        branchSlug: p.branchSlug,
        roleSlug: p.roleSlug || "",
        status: p.status,
        openForCollaboration: Boolean(p.openForCollaboration),
        neededRoles: p.neededRoles || [],
        neededSkills: p.neededSkills || [],
        collaborationDescription: p.collaborationDescription || "",
        deliverables: publicDeliverables,
        owner: p.owner
          ? {
              _id: p.owner._id,
              displayName: p.owner.displayName || "Student",
              photoURL: p.owner.photoURL || null,
              headline: p.owner.headline || "",
              branchName: p.owner.academic?.branchName || "Engineering",
              institution: p.owner.academic?.institution || "Smart Skill Hub Campus",
            }
          : null,
        isOwner: Boolean(isOwner),
        updatedAt: p.updatedAt,
      };
    });

    return {
      projects: sanitizedProjects,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Updates project collaboration & public visibility status (owner only).
   * @param {string} projectId 
   * @param {object} user - Authenticated project owner
   * @param {object} updateData - { isPublic, openForCollaboration, neededRoles, neededSkills, collaborationDescription }
   * @returns {Promise<object>} Updated project
   */
  async updateProjectCollaboration(projectId, user, updateData) {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new ApiError(400, "Invalid project ID.");
    }

    const project = await StudentProject.findById(projectId);
    if (!project) {
      throw new ApiError(404, "Student project not found.");
    }

    if (project.owner.toString() !== user._id.toString() && user.role !== "admin") {
      throw new ApiError(403, "Only the project owner can update collaboration settings.");
    }

    const {
      isPublic,
      openForCollaboration,
      neededRoles,
      neededSkills,
      collaborationDescription,
    } = updateData;

    if (isPublic !== undefined) {
      project.isPublic = Boolean(isPublic);
    }

    if (openForCollaboration !== undefined) {
      project.openForCollaboration = Boolean(openForCollaboration);
      if (project.openForCollaboration) {
        project.isPublic = true; // Collaboration projects are made public
      }
    }

    if (Array.isArray(neededRoles)) {
      project.neededRoles = neededRoles.map((r) => String(r).trim()).filter(Boolean);
    }

    if (Array.isArray(neededSkills)) {
      project.neededSkills = neededSkills.map((s) => String(s).trim()).filter(Boolean);
    }

    if (collaborationDescription !== undefined) {
      project.collaborationDescription = String(collaborationDescription || "")
        .trim()
        .slice(0, 1000);
    }

    await project.save();

    return {
      _id: project._id,
      title: project.title,
      isPublic: project.isPublic,
      openForCollaboration: project.openForCollaboration,
      neededRoles: project.neededRoles,
      neededSkills: project.neededSkills,
      collaborationDescription: project.collaborationDescription,
      message: "Project collaboration settings updated successfully.",
    };
  }
}

export const publicProjectDiscoveryService = new PublicProjectDiscoveryService();

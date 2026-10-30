import mongoose from "mongoose";
import { User } from "../../../core/database/models/user.models.js";
import { UserSettings } from "../../settings/models/userSettings.models.js";
import { StudentProject } from "../../academic/models/studentProject.models.js";
import { CompetencyBadge } from "../../skills/models/competencyBadge.models.js";
import { ApiError } from "../../../core/errors/ApiError.js";

class StudentDirectoryService {
  /**
   * Retrieves paginated public student directory with strict privacy controls.
   * @param {object} callerUser - Requesting user
   * @param {object} filters - { branch, college, semester, skill, careerInterest, search, page, limit }
   * @returns {Promise<object>} Paginated student list
   */
  async getStudentDirectory(callerUser, filters = {}) {
    const {
      branch,
      college,
      semester,
      skill,
      careerInterest,
      search,
      page = 1,
      limit = 20,
    } = filters;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // 1. Identify users who have opted out of public directory / profile context
    const privateSettings = await UserSettings.find({
      $or: [
        { "privacyPreferences.allowProfileContext": false },
        { "privacyPreferences.isProfilePublic": false },
      ],
    }).select("owner").lean();

    const excludedUserIds = privateSettings.map((s) => s.owner);

    // 2. Build public student query
    const query = {
      _id: { $nin: excludedUserIds },
      role: "student",
    };

    if (branch && branch !== "All") {
      query.$or = [
        { "academic.branchName": { $regex: branch.trim(), $options: "i" } },
        { "academic.branchSlug": { $regex: branch.trim(), $options: "i" } },
      ];
    }

    if (college && college !== "All") {
      query["academic.institution"] = { $regex: college.trim(), $options: "i" };
    }

    if (semester && semester !== "All") {
      const semNum = parseInt(semester, 10);
      if (!isNaN(semNum)) {
        query["academic.currentSemester"] = semNum;
      }
    }

    if (skill && skill.trim()) {
      const skillRegex = { $regex: skill.trim(), $options: "i" };
      query.$or = [
        { skillLanguages: skillRegex },
        { skillFrameworks: skillRegex },
        { skillTools: skillRegex },
        { skillLibraries: skillRegex },
      ];
    }

    if (careerInterest && careerInterest !== "All") {
      query.$or = [
        { careerInterests: { $regex: careerInterest.trim(), $options: "i" } },
        { targetRole: { $regex: careerInterest.trim(), $options: "i" } },
      ];
    }

    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      query.$or = [
        { displayName: searchRegex },
        { headline: searchRegex },
        { "academic.branchName": searchRegex },
        { "academic.institution": searchRegex },
        { targetRole: searchRegex },
      ];
    }

    // 3. Execute bounded projection strictly excluding sensitive authentication & contact fields
    const [students, total] = await Promise.all([
      User.find(query)
        .select(
          "_id displayName photoURL headline about targetRole careerInterests academic skillLanguages skillFrameworks skillTools achievements createdAt"
        )
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
    ]);

    // 4. Attach public project & badge counts for public credibility
    const studentIds = students.map((s) => s._id);

    const [projectCounts, badgeCounts] = await Promise.all([
      StudentProject.aggregate([
        {
          $match: {
            owner: { $in: studentIds },
            $or: [{ isPublic: true }, { portfolioVisibility: true }],
          },
        },
        { $group: { _id: "$owner", count: { $sum: 1 } } },
      ]),
      CompetencyBadge.aggregate([
        { $match: { owner: { $in: studentIds }, isRevoked: { $ne: true } } },
        { $group: { _id: "$owner", count: { $sum: 1 } } },
      ]),
    ]);

    const projectCountMap = new Map(
      projectCounts.map((p) => [p._id.toString(), p.count])
    );
    const badgeCountMap = new Map(
      badgeCounts.map((b) => [b._id.toString(), b.count])
    );

    const sanitizedDirectory = students.map((student) => {
      const sid = student._id.toString();
      const allSkills = Array.from(
        new Set([
          ...(student.skillLanguages || []),
          ...(student.skillFrameworks || []),
          ...(student.skillTools || []),
        ])
      ).slice(0, 8);

      return {
        _id: student._id,
        displayName: student.displayName || "Student",
        photoURL: student.photoURL || null,
        headline: student.headline || "Engineering Student",
        about: student.about || "",
        targetRole: student.targetRole || "Full Stack Developer",
        careerInterests: student.careerInterests || [],
        academic: {
          degreeName: student.academic?.degreeName || "Bachelor of Technology",
          branchName: student.academic?.branchName || "Computer Science",
          branchSlug: student.academic?.branchSlug || "cse",
          institution: student.academic?.institution || "Smart Skill Hub Campus",
          currentSemester: student.academic?.currentSemester || 6,
          graduationYear: student.academic?.graduationYear || null,
        },
        topSkills: allSkills,
        publicProjectCount: projectCountMap.get(sid) || 0,
        earnedBadgeCount: badgeCountMap.get(sid) || 0,
      };
    });

    return {
      students: sanitizedDirectory,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Retrieves full public profile for a single student.
   * @param {string} studentId 
   * @param {object} callerUser 
   * @returns {Promise<object>} Safe public student profile
   */
  async getStudentPublicProfile(studentId, callerUser) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new ApiError(400, "Invalid student ID format.");
    }

    const [student, settings] = await Promise.all([
      User.findById(studentId)
        .select(
          "_id displayName photoURL headline about targetRole careerInterests academic skillLanguages skillFrameworks skillTools skillLibraries achievements linkedInUrl githubUrl"
        )
        .lean(),
      UserSettings.findOne({ owner: studentId }).lean(),
    ]);

    if (!student) {
      throw new ApiError(404, "Student profile not found.");
    }

    // Check privacy settings
    if (
      settings?.privacyPreferences?.allowProfileContext === false ||
      settings?.privacyPreferences?.isProfilePublic === false
    ) {
      throw new ApiError(
        403,
        "This student has designated their profile as private."
      );
    }

    // Retrieve public projects
    const publicProjects = await StudentProject.find({
      owner: student._id,
      $or: [{ isPublic: true }, { portfolioVisibility: true }],
    })
      .select("title description branchSlug roleSlug status deliverables openForCollaboration neededRoles neededSkills updatedAt")
      .sort({ updatedAt: -1 })
      .limit(6)
      .lean();

    // Retrieve public verified badges
    const publicBadges = await CompetencyBadge.find({
      owner: student._id,
      isRevoked: { $ne: true },
    })
      .select("badgeId skillName category level issuedAt verificationHash")
      .sort({ issuedAt: -1 })
      .limit(10)
      .lean();

    return {
      _id: student._id,
      displayName: student.displayName || "Student",
      photoURL: student.photoURL || null,
      headline: student.headline || "",
      about: student.about || "",
      targetRole: student.targetRole || "Full Stack Developer",
      careerInterests: student.careerInterests || [],
      linkedInUrl: student.linkedInUrl || "",
      githubUrl: student.githubUrl || "",
      academic: {
        degreeName: student.academic?.degreeName || "Engineering",
        branchName: student.academic?.branchName || "Computer Science",
        branchSlug: student.academic?.branchSlug || "cse",
        institution: student.academic?.institution || "Smart Skill Hub",
        currentSemester: student.academic?.currentSemester || null,
        graduationYear: student.academic?.graduationYear || null,
      },
      skills: {
        languages: student.skillLanguages || [],
        frameworks: student.skillFrameworks || [],
        tools: student.skillTools || [],
        libraries: student.skillLibraries || [],
      },
      achievements: student.achievements || [],
      publicProjects: publicProjects.map((p) => ({
        _id: p._id,
        title: p.title,
        description: p.description,
        branchSlug: p.branchSlug,
        roleSlug: p.roleSlug,
        status: p.status,
        openForCollaboration: Boolean(p.openForCollaboration),
        neededRoles: p.neededRoles || [],
        neededSkills: p.neededSkills || [],
        updatedAt: p.updatedAt,
      })),
      verifiedBadges: publicBadges,
    };
  }
}

export const studentDirectoryService = new StudentDirectoryService();

import { z } from "zod";
import path from "path";
import { env } from "../../../config/env.js";
import { Resume } from "../models/resume.models.js";
import {
  deleteResumeFromSupabaseStorage,
  downloadResumeFromSupabaseStorage,
  getSupabaseResumeSignedReadUrl,
  resolveSupabaseResumeStorageLocation,
  uploadResumeToSupabaseStorage,
} from "../../../utils/supabase-storage.js";
import { ApiResponse } from "../../../core/errors/ApiResponse.js";
import { ApiError, ResumeError } from "../../../core/errors/ApiError.js";
import { asyncHandler } from "../../../core/errors/asyncHandler.js";
import {
  extractRawTextFromUploadedResume,
  extractResumeLinksFromUploadedResume,
  extractResumeRawText,
  validateResumeFileSignature,
  calculateExtractionConfidence,
  pickProfileLinksFromExtractedLinks
} from "../services/resume-extraction.service.js";
import { parseResumeWithLLM } from "../services/groq.service.js";
import { User } from "../../../core/database/models/user.models.js";
import { Project } from "../models/project.models.js";

const createResumeSchema = z.object({
  title: z.string().min(2, "title must be at least 2 characters"),
  format: z.enum(["PDF", "DOCX", "TXT", "TEX", "IMAGE"]).optional(),
  sections: z.number().int().min(1).max(30).optional(),
  content: z.string().optional(),
  builderConfig: z.union([z.record(z.any()), z.string()]).optional(),
});

const makeTraceId = () => `resume-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const inferMimeTypeFromResume = (resume) => {
  const extension = path
    .extname(
      String(
        resume.originalFileName ||
          resume.storedFileName ||
          resume.supabaseStoragePath ||
          resume.filePath ||
          ""
      )
    )
    .toLowerCase();

  if (resume.mimeType) {
    return resume.mimeType;
  }

  if (extension === ".pdf") return "application/pdf";
  if (extension === ".docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (extension === ".doc") return "application/msword";
  if (extension === ".txt") return "text/plain; charset=utf-8";
  if (extension === ".tex") return "application/x-tex";
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".webp") return "image/webp";

  return "application/octet-stream";
};

const buildInlineContentDisposition = (fileName) => {
  const fallbackName =
    String(fileName || "resume")
      .replace(/[^\x20-\x7E]/g, "")
      .replace(/["\\]/g, "")
      .trim() || "resume";
  const encodedName = encodeURIComponent(String(fileName || fallbackName));

  return `inline; filename="${fallbackName}"; filename*=UTF-8''${encodedName}`;
};

const buildSignedResumeFileMeta = async (resume, traceId) => {
  const supabaseLocation = resolveSupabaseResumeStorageLocation(resume);

  if (!supabaseLocation.storagePath) {
    return {
      filePath: "",
      signedUrlExpiresAt: ""
    };
  }

  try {
    const signedFile = await getSupabaseResumeSignedReadUrl({
      bucketName: supabaseLocation.bucketName,
      storagePath: supabaseLocation.storagePath
    });

    console.info(`[resume-debug][${traceId}] signedUrl:generated`, {
      resumeId: String(resume._id || ""),
      supabaseStoragePath: supabaseLocation.storagePath,
      supabaseStorageBucket: supabaseLocation.bucketName,
      expiresAt: signedFile.expiresAt
    });

    return {
      filePath: signedFile.url,
      signedUrlExpiresAt: new Date(signedFile.expiresAt).toISOString()
    };
  } catch (error) {
    console.warn(`[resume-debug][${traceId}] buildSignedResumeFileMeta:signedUrl-unavailable`, {
      resumeId: String(resume._id || ""),
      supabaseStoragePath: supabaseLocation.storagePath,
      error: error instanceof Error ? error.message : String(error)
    });

    const fallbackPath =
      resume.filePath && !resume.filePath.startsWith("supabase://")
        ? resume.filePath
        : `/api/v1/resumes/${resume._id}/file`;

    return {
      filePath: fallbackPath,
      signedUrlExpiresAt: ""
    };
  }
};

const resolveResumeFileResponse = async (resume, traceId) => {
  const supabaseLocation = resolveSupabaseResumeStorageLocation(resume);

  if (!supabaseLocation.storagePath) {
    throw new ApiError(404, "Resume file is not available in Supabase Storage");
  }

  try {
    const supabaseFile = await downloadResumeFromSupabaseStorage(supabaseLocation);

    console.info(`[resume-debug][${traceId}] getResumeFile:source-supabase`, {
      resumeId: String(resume._id || ""),
      supabaseStoragePath: supabaseLocation.storagePath,
      supabaseStorageBucket: supabaseLocation.bucketName,
      bytes: supabaseFile.buffer.length
    });

    return {
      buffer: supabaseFile.buffer,
      contentType: supabaseFile.contentType || inferMimeTypeFromResume(resume),
      fileName: resume.originalFileName || resume.storedFileName || "resume"
    };
  } catch (error) {
    console.warn(`[resume-debug][${traceId}] getResumeFile:source-supabase:failed`, {
      resumeId: String(resume._id || ""),
      supabaseStoragePath: supabaseLocation.storagePath,
      error: error instanceof Error ? error.message : String(error)
    });

    throw new ApiError(502, "Failed to read resume file from Supabase Storage");
  }
};

const resolveFileMeta = (file, supabaseUpload = null) => {
  if (!file) {
    return {};
  }

  if (!supabaseUpload?.storagePath || !supabaseUpload?.bucketName) {
    throw new ApiError(502, "Supabase Storage upload failed for the resume file");
  }

  return {
    originalFileName: file.originalname,
    storedFileName: supabaseUpload.fileName,
    filePath: supabaseUpload.filePath,
    mimeType: file.mimetype,
    fileSize: file.size || file.buffer?.length || 0,
    storageProvider: "supabase",
    supabaseStoragePath: supabaseUpload.storagePath,
    supabaseStorageBucket: supabaseUpload.bucketName
  };
};

export const listResumes = asyncHandler(async (req, res) => {
  const traceId = makeTraceId();
  const user = req.user;

  console.info(`[resume-debug][${traceId}] listResumes:start`, {
    firebaseUid: req.auth.uid,
    userId: String(user?._id || "")
  });

  const resumes = await Resume.find({ owner: user._id }).sort({ updatedAt: -1 });

  console.info(`[resume-debug][${traceId}] listResumes:fetched`, {
    count: resumes.length
  });

  const normalizedResumes = await Promise.all(
    resumes.map(async (resume) => {
      const plainResume = resume.toObject();
      const supabaseLocation = resolveSupabaseResumeStorageLocation(plainResume);

      if (supabaseLocation.storagePath) {
        const signedFileMeta = await buildSignedResumeFileMeta(plainResume, traceId);
        plainResume.filePath = signedFileMeta.filePath;
        plainResume.signedUrlExpiresAt = signedFileMeta.signedUrlExpiresAt;
        plainResume.storageProvider = plainResume.storageProvider || "supabase";

        console.info(`[resume-debug][${traceId}] listResumes:item-supabase`, {
          resumeId: String(plainResume._id || ""),
          title: plainResume.title,
          supabaseStoragePath: supabaseLocation.storagePath,
          supabaseStorageBucket: supabaseLocation.bucketName,
          filePath: plainResume.filePath
        });

        return plainResume;
      }

      if (plainResume.filePath && plainResume.filePath.startsWith("supabase://")) {
        plainResume.filePath = `/api/v1/resumes/${plainResume._id}/file`;
      } else {
        plainResume.filePath = plainResume.filePath || "";
      }

      plainResume.storageProvider = plainResume.storageProvider || "unavailable";

      console.warn(`[resume-debug][${traceId}] listResumes:item-unavailable`, {
        resumeId: String(plainResume._id || ""),
        title: plainResume.title,
        storageProvider: plainResume.storageProvider
      });

      return plainResume;
    })
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { resumes: normalizedResumes }, "Resumes fetched successfully"));
});

export const createResume = asyncHandler(async (req, res) => {
  const traceId = makeTraceId();
  const hasUpload = Boolean(req.file);
  const body = {
    ...req.body,
    sections: req.body.sections ? Number(req.body.sections) : undefined
  };

  console.info(`[resume-debug][${traceId}] createResume:start`, {
    firebaseUid: req.auth.uid,
    hasUpload,
    frontendTraceId: typeof req.body?.debugTraceId === "string" ? req.body.debugTraceId : "",
    body: {
      title: body.title,
      sections: body.sections,
      format: body.format,
      contentLength: typeof body.content === "string" ? body.content.length : 0
    },
    file: req.file
      ? {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size || req.file.buffer?.length || 0,
          hasBuffer: Boolean(req.file.buffer?.length)
        }
      : null
  });

  const parsed = createResumeSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiError(400, "Invalid resume payload", parsed.error.issues);
  }

  const user = req.user;
  let supabaseUpload = null;

  if (req.file) {
    console.info(`[resume-debug][${traceId}] createResume:supabase-upload:start`, {
      originalFileName: req.file.originalname,
      mimeType: req.file.mimetype,
      bytes: req.file.size || req.file.buffer?.length || 0
    });

    try {
      supabaseUpload = await uploadResumeToSupabaseStorage({
        buffer: req.file.buffer,
        originalFileName: req.file.originalname,
        mimeType: req.file.mimetype,
        ownerKey: req.auth.uid
      });

      console.info(`[resume-debug][${traceId}] createResume:supabase-upload:response`, {
        bucketName: supabaseUpload.bucketName,
        storagePath: supabaseUpload.storagePath,
        fileName: supabaseUpload.fileName,
        filePath: supabaseUpload.filePath,
        size: supabaseUpload.size
      });
    } catch (uploadError) {
      const errorMessage = uploadError instanceof Error ? uploadError.message : String(uploadError);
      console.error(`[resume-debug][${traceId}] createResume:supabase-upload:error`, {
        error: errorMessage
      });
      throw new ApiError(502, `Resume upload failed: ${errorMessage}`);
    }
  }

  const detectedFormat = req.file
    ? req.file.originalname.toLowerCase().endsWith(".docx")
      ? "DOCX"
      : req.file.originalname.toLowerCase().endsWith(".txt")
      ? "TXT"
      : req.file.originalname.toLowerCase().endsWith(".tex")
      ? "TEX"
      : new Set([".png", ".jpg", ".jpeg", ".webp"]).has(path.extname(req.file.originalname).toLowerCase())
      ? "IMAGE"
      : "PDF"
    : parsed.data.format || "PDF";

  const resolvedFileMeta = resolveFileMeta(req.file, supabaseUpload);

  console.info(`[resume-debug][${traceId}] createResume:resolved-file-meta`, {
    filePath: resolvedFileMeta.filePath,
    storageProvider: resolvedFileMeta.storageProvider,
    supabaseStoragePath: resolvedFileMeta.supabaseStoragePath,
    supabaseStorageBucket: resolvedFileMeta.supabaseStorageBucket
  });

  let parsedBuilderConfig = {};
  if (typeof parsed.data.builderConfig === "string") {
    try { parsedBuilderConfig = JSON.parse(parsed.data.builderConfig); } catch {}
  } else if (parsed.data.builderConfig) {
    parsedBuilderConfig = parsed.data.builderConfig;
  }

  const resume = await Resume.create({
    owner: user._id,
    ...parsed.data,
    builderConfig: parsedBuilderConfig,
    ...resolvedFileMeta,
    format: detectedFormat,
    title: req.file ? parsed.data.title || req.file.originalname.replace(/\.[^.]+$/, "") : parsed.data.title,
    content: hasUpload ? parsed.data.content || "Uploaded resume" : parsed.data.content || ""
  });

  console.info(`[resume-debug][${traceId}] createResume:db-saved`, {
    resumeId: String(resume._id || ""),
    title: resume.title,
    format: resume.format,
    filePath: resume.filePath,
    storageProvider: resume.storageProvider,
    supabaseStoragePath: resume.supabaseStoragePath
  });

  const responseResume = resume.toObject();
  if (resolveSupabaseResumeStorageLocation(responseResume).storagePath) {
    const signedFileMeta = await buildSignedResumeFileMeta(responseResume, traceId);
    responseResume.filePath = signedFileMeta.filePath;
    responseResume.signedUrlExpiresAt = signedFileMeta.signedUrlExpiresAt;
  }

  return res
    .status(201)
    .json(new ApiResponse(201, { resume: responseResume }, "Resume created successfully"));
});

export const getResumeFile = asyncHandler(async (req, res) => {
  const traceId = makeTraceId();
  const user = req.user;
  const { resumeId } = req.params;

  const resume = await Resume.findOne({ _id: resumeId, owner: user._id });

  if (!resume) {
    throw new ApiError(404, "Resume not found");
  }

  console.info(`[resume-debug][${traceId}] getResumeFile:start`, {
    resumeId,
    title: resume.title,
    storedFileName: resume.storedFileName,
    storageProvider: resume.storageProvider,
    supabaseStoragePath: resume.supabaseStoragePath
  });

  const fileResponse = await resolveResumeFileResponse(resume, traceId);

  res.setHeader("Content-Type", fileResponse.contentType || "application/octet-stream");
  res.setHeader("Content-Disposition", buildInlineContentDisposition(fileResponse.fileName));
  res.setHeader("Cache-Control", "private, max-age=300");

  return res.status(200).send(fileResponse.buffer);
});

export const deleteResume = asyncHandler(async (req, res) => {
  const user = req.user;
  const { resumeId } = req.params;

  const deleted = await Resume.findOneAndDelete({ _id: resumeId, owner: user._id });

  if (!deleted) {
    throw new ApiError(404, "Resume not found");
  }

  const supabaseLocation = resolveSupabaseResumeStorageLocation(deleted);
  if (supabaseLocation.storagePath) {
    try {
      await deleteResumeFromSupabaseStorage(supabaseLocation);
    } catch {
      // ignore remote deletion failure to avoid blocking DB cleanup
    }
  }

  return res.status(200).json(new ApiResponse(200, { resumeId }, "Resume deleted successfully"));
});

const applyProfileSchema = z.object({
  profile: z.object({
    displayName: z.string().optional(),
    headline: z.string().optional(),
    phone: z.string().optional(),
    about: z.string().optional(),
    customDomain: z.string().optional(),
  }).optional(),
  preferences: z.object({
    linkedInUrl: z.string().optional(),
    githubUrl: z.string().optional(),
    leetCodeId: z.string().optional(),
    geeksForGeeksId: z.string().optional(),
  }).optional(),
  educationEntries: z.array(z.object({
    degree: z.string().optional().default(""),
    specialization: z.string().optional().default(""),
    college: z.string().optional().default(""),
    location: z.string().optional().default(""),
    endDate: z.string().optional().default(""),
    grade: z.string().optional().default("")
  })).optional(),
  skillSections: z.array(z.object({
    title: z.string().optional().default(""),
    skills: z.array(z.string()).optional().default([])
  })).optional(),
  experience: z.array(z.object({
    role: z.string().optional().default(""),
    company: z.string().optional().default(""),
    location: z.string().optional().default(""),
    date: z.string().optional().default(""),
    bullets: z.union([z.array(z.string()), z.string()]).optional().default([])
  })).optional(),
  projects: z.array(z.object({
    title: z.string().optional().default(""),
    description: z.string().optional().default(""),
    stack: z.union([z.array(z.string()), z.string()]).optional().default(""),
    date: z.string().optional().default(""),
    githubUrl: z.string().optional().default(""),
    demoUrl: z.string().optional().default("")
  })).optional(),
  achievements: z.array(z.object({
    title: z.string().optional().default(""),
    date: z.string().optional().default(""),
    bullets: z.union([z.array(z.string()), z.string()]).optional().default([])
  })).optional(),
});

export const uploadAndExtractResume = asyncHandler(async (req, res) => {
  const traceId = makeTraceId();
  const user = req.user;

  if (!req.file) {
    throw new ApiError(400, "Resume file is required");
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const sigValidation = validateResumeFileSignature(req.file.buffer, ext);
  if (!sigValidation.valid) {
    throw new ApiError(400, sigValidation.reason || "Invalid or malformed resume file.");
  }

  let extractedText = "";
  try {
    extractedText = await extractRawTextFromUploadedResume(req.file);
  } catch (err) {
    console.warn(`[resume-debug][${traceId}] extractText:error`, err?.message || err);
  }

  if (!extractedText || !extractedText.trim()) {
    throw new ApiError(400, "We couldn't find readable text in this file. Try uploading a clearer document.");
  }

  let extractedLinks = [];
  try {
    extractedLinks = await extractResumeLinksFromUploadedResume(req.file, extractedText);
  } catch {}

  const linkMeta = pickProfileLinksFromExtractedLinks(extractedLinks);

  let structuredParsed = {
    profile: { displayName: "", headline: "", phone: "", about: "" },
    preferences: { linkedInUrl: "", githubUrl: "" },
    contact: { email: "" },
    educationEntries: [],
    skillSections: [],
    experience: [],
    projects: [],
    achievements: []
  };

  try {
    const rawLlm = await parseResumeWithLLM({ rawText: extractedText, linkMeta });
    const parsedJson = typeof rawLlm === "string" ? JSON.parse(rawLlm) : rawLlm;
    if (parsedJson && typeof parsedJson === "object") {
      structuredParsed = {
        ...structuredParsed,
        ...parsedJson,
        profile: { ...structuredParsed.profile, ...(parsedJson.profile || {}) },
        preferences: { ...structuredParsed.preferences, ...(parsedJson.preferences || {}) },
        contact: { ...structuredParsed.contact, ...(parsedJson.contact || {}) }
      };
    }
  } catch (llmErr) {
    console.warn(`[resume-debug][${traceId}] parseLLM:fallback`, llmErr?.message || llmErr);
  }

  // Contact fallbacks from regex
  const emailMatch = extractedText.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0];
  const phoneMatch = extractedText.match(/(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,5}[\s-]?\d{3,5}/)?.[0];

  if (!structuredParsed.contact?.email && emailMatch) {
    structuredParsed.contact = { ...(structuredParsed.contact || {}), email: emailMatch };
  }
  if (!structuredParsed.profile?.phone && phoneMatch) {
    structuredParsed.profile = { ...(structuredParsed.profile || {}), phone: phoneMatch };
  }
  if (!structuredParsed.preferences?.linkedInUrl && linkMeta.linkedInUrl) {
    structuredParsed.preferences = { ...(structuredParsed.preferences || {}), linkedInUrl: linkMeta.linkedInUrl };
  }
  if (!structuredParsed.preferences?.githubUrl && linkMeta.githubUrl) {
    structuredParsed.preferences = { ...(structuredParsed.preferences || {}), githubUrl: linkMeta.githubUrl };
  }

  const confidence = calculateExtractionConfidence(structuredParsed, extractedText);

  // Upload to Supabase Storage if configured
  let supabaseUpload = null;
  try {
    supabaseUpload = await uploadResumeToSupabaseStorage({
      buffer: req.file.buffer,
      originalFileName: req.file.originalname,
      mimeType: req.file.mimetype,
      ownerKey: req.auth.uid
    });
  } catch (uploadErr) {
    console.warn(`[resume-debug][${traceId}] storage upload skipped:`, uploadErr?.message);
  }

  const detectedFormat = req.file.originalname.toLowerCase().endsWith(".docx")
    ? "DOCX"
    : req.file.originalname.toLowerCase().endsWith(".txt")
    ? "TXT"
    : req.file.originalname.toLowerCase().endsWith(".rtf")
    ? "TXT"
    : new Set([".png", ".jpg", ".jpeg", ".webp"]).has(ext)
    ? "IMAGE"
    : "PDF";

  const resolvedFileMeta = supabaseUpload
    ? resolveFileMeta(req.file, supabaseUpload)
    : {
        originalFileName: req.file.originalname,
        storedFileName: req.file.originalname,
        filePath: "",
        mimeType: req.file.mimetype,
        fileSize: req.file.size || req.file.buffer?.length || 0,
        storageProvider: "local"
      };

  const resume = await Resume.create({
    owner: user._id,
    title: req.body.title || req.file.originalname.replace(/\.[^.]+$/, ""),
    format: detectedFormat,
    content: extractedText,
    ...resolvedFileMeta,
    builderConfig: {
      extractedProfile: structuredParsed,
      confidence
    }
  });

  const responseResume = resume.toObject();
  if (resolveSupabaseResumeStorageLocation(responseResume).storagePath) {
    const signedFileMeta = await buildSignedResumeFileMeta(responseResume, traceId);
    responseResume.filePath = signedFileMeta.filePath;
    responseResume.signedUrlExpiresAt = signedFileMeta.signedUrlExpiresAt;
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        resume: responseResume,
        extractedProfile: structuredParsed,
        confidence,
        extractionMeta: {
          originalFileName: req.file.originalname,
          fileSize: req.file.size || req.file.buffer?.length || 0,
          mimeType: req.file.mimetype,
          textLength: extractedText.length,
          extractedLinksCount: extractedLinks.length,
          status: "READY"
        }
      },
      "Resume analyzed successfully"
    )
  );
});

export const extractResumeById = asyncHandler(async (req, res) => {
  const { resumeId } = req.params;
  const user = req.user;

  const resume = await Resume.findOne({ _id: resumeId, owner: user._id });
  if (!resume) {
    throw new ApiError(404, "Resume not found");
  }

  const rawText = await extractResumeRawText(resume);
  if (!rawText || !rawText.trim()) {
    throw new ApiError(400, "Unable to extract readable text from this resume");
  }

  let structuredParsed = {
    profile: { displayName: "", headline: "", phone: "", about: "" },
    preferences: { linkedInUrl: "", githubUrl: "" },
    contact: { email: "" },
    educationEntries: [],
    skillSections: [],
    experience: [],
    projects: [],
    achievements: []
  };

  try {
    const rawLlm = await parseResumeWithLLM({ rawText, linkMeta: {} });
    const parsedJson = typeof rawLlm === "string" ? JSON.parse(rawLlm) : rawLlm;
    if (parsedJson && typeof parsedJson === "object") {
      structuredParsed = {
        ...structuredParsed,
        ...parsedJson,
        profile: { ...structuredParsed.profile, ...(parsedJson.profile || {}) },
        preferences: { ...structuredParsed.preferences, ...(parsedJson.preferences || {}) },
        contact: { ...structuredParsed.contact, ...(parsedJson.contact || {}) }
      };
    }
  } catch (err) {
    // fallback to empty structure
  }

  const confidence = calculateExtractionConfidence(structuredParsed, rawText);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        resumeId,
        extractedProfile: structuredParsed,
        confidence,
        rawTextLength: rawText.length
      },
      "Resume extracted successfully"
    )
  );
});

export const applyExtractedProfileToUser = asyncHandler(async (req, res) => {
  const parsed = applyProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid profile payload", parsed.error.issues);
  }

  const user = req.user;
  const data = parsed.data;

  // Merge profile fields without erasing existing data if incoming is empty
  if (data.profile) {
    if (data.profile.displayName) user.displayName = data.profile.displayName;
    if (data.profile.headline) user.headline = data.profile.headline;
    if (data.profile.phone) user.phone = data.profile.phone;
    if (data.profile.about) user.about = data.profile.about;
    if (data.profile.customDomain) user.customDomain = data.profile.customDomain;
  }

  if (data.preferences) {
    if (data.preferences.linkedInUrl) user.linkedInUrl = data.preferences.linkedInUrl;
    if (data.preferences.githubUrl) user.githubUrl = data.preferences.githubUrl;
    if (data.preferences.leetCodeId) user.leetCodeId = data.preferences.leetCodeId;
    if (data.preferences.geeksForGeeksId) user.geeksForGeeksId = data.preferences.geeksForGeeksId;
  }

  if (Array.isArray(data.educationEntries) && data.educationEntries.length > 0) {
    user.educationEntries = data.educationEntries;
  }

  if (Array.isArray(data.skillSections) && data.skillSections.length > 0) {
    user.skillSections = data.skillSections.map((s) => ({
      title: s.title || "Skills",
      skills: Array.isArray(s.skills) ? s.skills.filter(Boolean) : []
    }));
  }

  if (Array.isArray(data.experience) && data.experience.length > 0) {
    user.experience = data.experience.map((e) => ({
      role: e.role || "",
      company: e.company || "",
      location: e.location || "",
      date: e.date || "",
      bullets: Array.isArray(e.bullets)
        ? e.bullets
        : (typeof e.bullets === "string" ? e.bullets.split("\n").filter(Boolean) : [])
    }));
  }

  if (Array.isArray(data.achievements) && data.achievements.length > 0) {
    user.achievements = data.achievements.map((a) => ({
      title: a.title || "",
      date: a.date || "",
      bullets: Array.isArray(a.bullets)
        ? a.bullets
        : (typeof a.bullets === "string" ? a.bullets.split("\n").filter(Boolean) : [])
    }));
  }

  await user.save();

  // If projects were extracted, seed user's projects in MongoDB
  if (Array.isArray(data.projects) && data.projects.length > 0) {
    for (const proj of data.projects) {
      if (proj.title && proj.title.trim()) {
        const stackArr = Array.isArray(proj.stack)
          ? proj.stack
          : (typeof proj.stack === "string" ? proj.stack.split(/[,/|]/).map((s) => s.trim()).filter(Boolean) : []);

        const existingProj = await Project.findOne({ owner: user._id, title: proj.title.trim() });
        if (!existingProj) {
          await Project.create({
            owner: user._id,
            title: proj.title.trim(),
            description: proj.description || "",
            stack: stackArr,
            date: proj.date || "",
            githubUrl: proj.githubUrl || "",
            demoUrl: proj.demoUrl || ""
          });
        }
      }
    }
  }

  return res.status(200).json(
    new ApiResponse(200, { user: user.toObject() }, "Profile updated from resume successfully")
  );
});

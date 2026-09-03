import fs from "fs/promises";
import path from "path";
import { createRequire } from "module";
import mammoth from "mammoth";
import { createWorker } from "tesseract.js";
import pLimit from "p-limit";
import {
  downloadResumeFromSupabaseStorage,
  resolveSupabaseResumeStorageLocation,
} from "../../../utils/supabase-storage.js";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

const extractionLimit = pLimit(1);

const urlRegex = /https?:\/\/[^\s)]+/gi;
const headingRegex = /^(?:#+\s*)?(skills?|technical skills?|projects?|achievements?(?:\s*&\s*profiles?)?|profiles?|experience|work experience|professional experience|education|academic(?:\s+background)?|professional summary|summary)\s*:?$/i;

const mask = {
  email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  phone: /(?:(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4})/g,
  linkedIn: /https?:\/\/(?:www\.)?linkedin\.com\/[A-Za-z0-9\-_/?.=&%#]+/gi,
  github: /https?:\/\/(?:www\.)?github\.com\/[A-Za-z0-9\-_/?.=&%#]+/gi
};

const readTextFile = async (filePath) => fs.readFile(filePath, "utf8");
const readTextBuffer = async (buffer) => buffer.toString("utf8");

const readPdfBuffer = async (buffer) => extractionLimit(async () => {
  const parser = new PDFParse({ data: buffer });

  try {
    const parsed = await parser.getText();
    return parsed.text || "";
  } finally {
    await parser.destroy();
  }
});

const readPdfText = async (filePath) => extractionLimit(async () => {
  const buffer = await fs.readFile(filePath);
  const parser = new PDFParse({ data: buffer });
  try {
    const parsed = await parser.getText();
    return parsed.text || "";
  } finally {
    await parser.destroy();
  }
});

const readDocxBuffer = async (buffer) => extractionLimit(async () => {
  const result = await mammoth.extractRawText({ buffer });
  return result.value || "";
});

const readDocxText = async (filePath) => extractionLimit(async () => {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value || "";
});

const readImageBuffer = async (buffer) => extractionLimit(async () => {
  const worker = await createWorker("eng");
  try {
    const result = await worker.recognize(buffer);
    return result.data?.text || "";
  } finally {
    await worker.terminate();
  }
});

const readPdfAnnotationUrlsBuffer = async (buffer) => extractionLimit(async () => {
  try {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      isEvalSupported: false
    });

    const document = await loadingTask.promise;
    const links = new Set();

    for (let pageIndex = 1; pageIndex <= document.numPages; pageIndex += 1) {
      const page = await document.getPage(pageIndex);
      const annotations = await page.getAnnotations();

      for (const annotation of annotations) {
        const candidates = [
          annotation?.url,
          annotation?.unsafeUrl,
          annotation?.action
        ]
          .map((item) => String(item || "").trim())
          .filter(Boolean);

        for (const candidate of candidates) {
          if (/^(?:https?:\/\/|mailto:)/i.test(candidate)) {
            links.add(candidate);
          }
        }
      }
    }

    await loadingTask.destroy();
    return Array.from(links);
  } catch {
    return [];
  }
});

const readImageText = async (filePath) => extractionLimit(async () => {
  const worker = await createWorker("eng");
  try {
    const result = await worker.recognize(filePath);
    return result.data?.text || "";
  } finally {
    await worker.terminate();
  }
});

const readRtfBuffer = async (buffer) => {
  const rtf = buffer.toString("utf8");
  // Remove font tables, color tables, stylesheets, info blocks, pict/object blocks
  let text = rtf.replace(/\{\\(?:fonttbl|colortbl|stylesheet|info|pict|object)[\s\S]*?\}/gi, "");
  // Replace unicode escape sequences \'xx with their corresponding char
  text = text.replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  // Replace \uN? unicode characters
  text = text.replace(/\\u([0-9]{2,5})\??/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
  // Replace line breaks \par, \line with newlines
  text = text.replace(/\\(par|line)\b/gi, "\n");
  // Replace tabs \tab with space
  text = text.replace(/\\tab\b/gi, " ");
  // Remove remaining control words like \b, \i, \fs24, \ul, etc.
  text = text.replace(/\\[a-zA-Z]+-?\d* ?/g, "");
  // Remove braces { and }
  text = text.replace(/[{}]/g, "");
  // Normalize extra spaces and lines
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).join("\n");
};

const readRtfText = async (filePath) => {
  const buffer = await fs.readFile(filePath);
  return readRtfBuffer(buffer);
};

export const validateResumeFileSignature = (buffer, extension) => {
  if (!buffer || buffer.length === 0) {
    return { valid: false, reason: "Empty file buffer" };
  }

  const ext = (extension || "").toLowerCase();

  if (ext === ".pdf") {
    const isPdf = buffer.length >= 4 && buffer.slice(0, 5).toString("ascii").startsWith("%PDF");
    if (!isPdf) return { valid: false, reason: "Malformed PDF: missing %PDF signature" };
  }

  if (ext === ".docx") {
    const isZip = buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
    if (!isZip) return { valid: false, reason: "Malformed DOCX: missing PK signature" };
  }

  if (ext === ".rtf") {
    const isRtf = buffer.length >= 5 && buffer.slice(0, 5).toString("ascii").startsWith("{\\rtf");
    if (!isRtf) return { valid: false, reason: "Malformed RTF: missing {\\rtf signature" };
  }

  if (ext === ".png") {
    const isPng = buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    if (!isPng) return { valid: false, reason: "Malformed PNG image" };
  }

  if (ext === ".jpg" || ext === ".jpeg") {
    const isJpg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (!isJpg) return { valid: false, reason: "Malformed JPEG image" };
  }

  return { valid: true };
};

export const calculateExtractionConfidence = (parsedData, rawText = "") => {
  const lowerText = (rawText || "").toLowerCase();

  const getFieldConfidence = (val, minLen = 2) => {
    if (!val || (typeof val === "string" && !val.trim())) return "LOW";
    const str = String(val).toLowerCase().trim();
    if (str.length >= minLen && lowerText.includes(str)) return "HIGH";
    return "MEDIUM";
  };

  const nameConfidence = getFieldConfidence(parsedData.profile?.displayName, 3);
  const emailConfidence = parsedData.contact?.email && lowerText.includes(parsedData.contact.email.toLowerCase()) ? "HIGH" : (parsedData.contact?.email ? "MEDIUM" : "LOW");
  const phoneConfidence = parsedData.profile?.phone ? "HIGH" : "LOW";
  const aboutConfidence = parsedData.profile?.about ? "HIGH" : "LOW";

  const educationConfidence = (parsedData.educationEntries || []).length > 0 ? "HIGH" : "LOW";
  const skillsConfidence = (parsedData.skillSections || []).some((s) => s.skills?.length > 0) ? "HIGH" : "LOW";
  const experienceConfidence = (parsedData.experience || []).length > 0 ? "HIGH" : "LOW";
  const projectsConfidence = (parsedData.projects || []).length > 0 ? "HIGH" : "LOW";
  const achievementsConfidence = (parsedData.achievements || []).length > 0 ? "HIGH" : "LOW";
  const linksConfidence = (parsedData.preferences?.githubUrl || parsedData.preferences?.linkedInUrl) ? "HIGH" : "LOW";

  const scores = [nameConfidence, emailConfidence, phoneConfidence, educationConfidence, skillsConfidence, experienceConfidence, projectsConfidence];
  const highCount = scores.filter((s) => s === "HIGH").length;
  const overall = highCount >= 5 ? "HIGH" : highCount >= 3 ? "MEDIUM" : "LOW";

  return {
    overall,
    fields: {
      displayName: { value: parsedData.profile?.displayName || "", confidence: nameConfidence },
      email: { value: parsedData.contact?.email || "", confidence: emailConfidence },
      phone: { value: parsedData.profile?.phone || "", confidence: phoneConfidence },
      about: { value: parsedData.profile?.about || "", confidence: aboutConfidence },
      linkedInUrl: { value: parsedData.preferences?.linkedInUrl || "", confidence: parsedData.preferences?.linkedInUrl ? "HIGH" : "LOW" },
      githubUrl: { value: parsedData.preferences?.githubUrl || "", confidence: parsedData.preferences?.githubUrl ? "HIGH" : "LOW" },
      education: { count: (parsedData.educationEntries || []).length, confidence: educationConfidence },
      skills: { count: (parsedData.skillSections || []).reduce((acc, s) => acc + (s.skills?.length || 0), 0), confidence: skillsConfidence },
      experience: { count: (parsedData.experience || []).length, confidence: experienceConfidence },
      projects: { count: (parsedData.projects || []).length, confidence: projectsConfidence },
      achievements: { count: (parsedData.achievements || []).length, confidence: achievementsConfidence }
    }
  };
};

const readTextFromBufferByExtension = async (buffer, extension) => {
  if (extension === ".txt" || extension === ".tex") {
    return readTextBuffer(buffer);
  }

  if (extension === ".rtf") {
    return readRtfBuffer(buffer);
  }

  if (extension === ".pdf") {
    return readPdfBuffer(buffer);
  }

  if (extension === ".docx") {
    return readDocxBuffer(buffer);
  }

  if (new Set([".png", ".jpg", ".jpeg", ".webp"]).has(extension)) {
    return readImageBuffer(buffer);
  }

  return "";
};

const inferExtensionFromUpload = ({ originalName = "", mimeType = "" }) => {
  const fromName = path.extname(String(originalName || "")).toLowerCase();
  if (fromName) {
    return fromName;
  }

  const normalizedMime = String(mimeType || "").toLowerCase();
  if (normalizedMime.includes("pdf")) return ".pdf";
  if (normalizedMime.includes("wordprocessingml")) return ".docx";
  if (normalizedMime.includes("msword")) return ".doc";
  if (normalizedMime.includes("rtf")) return ".rtf";
  if (normalizedMime.includes("plain")) return ".txt";
  if (normalizedMime.includes("x-tex")) return ".tex";
  if (normalizedMime.includes("png")) return ".png";
  if (normalizedMime.includes("jpeg") || normalizedMime.includes("jpg")) return ".jpg";
  if (normalizedMime.includes("webp")) return ".webp";

  return "";
};

export const extractRawTextFromUploadedResume = async (file) => {
  if (!file?.buffer) {
    return "";
  }

  const extension = inferExtensionFromUpload({
    originalName: file.originalname,
    mimeType: file.mimetype
  });

  if (extension === ".doc") {
    return "";
  }

  return readTextFromBufferByExtension(file.buffer, extension);
};

export const extractResumeLinksFromUploadedResume = async (file, extractedText = "") => {
  if (!file?.buffer) {
    return [];
  }

  const extension = inferExtensionFromUpload({
    originalName: file.originalname,
    mimeType: file.mimetype
  });

  const linkSet = new Set(extractUrls(extractedText || ""));

  if (extension === ".pdf") {
    const annotationLinks = await readPdfAnnotationUrlsBuffer(file.buffer);
    for (const link of annotationLinks) {
      linkSet.add(link);
    }
  }

  return Array.from(linkSet).map((item) => item.trim()).filter(Boolean);
};

export const extractResumeRawText = async (resume) => {
  const existing = resume.content?.trim();
  if (existing && existing !== "Uploaded resume") {
    return existing;
  }

  const filePath = String(resume.filePath || "").trim();
  const supabaseLocation = resolveSupabaseResumeStorageLocation(resume);
  const inferredExtension = path
    .extname(String(resume.originalFileName || resume.storedFileName || supabaseLocation.storagePath || filePath))
    .toLowerCase();

  if (!supabaseLocation.storagePath && !filePath) {
    return "";
  }

  if (supabaseLocation.storagePath) {
    try {
      const supabaseFile = await downloadResumeFromSupabaseStorage(supabaseLocation);
      return await readTextFromBufferByExtension(supabaseFile.buffer, inferredExtension);
    } catch {
      return "";
    }
  }

  if (/^https?:\/\//i.test(filePath)) {
    return "";
  }

  const absoluteFilePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath.replace(/^\//, ""));
  const extension = path.extname(absoluteFilePath).toLowerCase();

  if (extension === ".txt" || extension === ".tex") {
    return readTextFile(absoluteFilePath);
  }

  if (extension === ".rtf") {
    return readRtfText(absoluteFilePath);
  }

  if (extension === ".pdf") {
    return readPdfText(absoluteFilePath);
  }

  if (extension === ".docx") {
    return readDocxText(absoluteFilePath);
  }

  if (new Set([".png", ".jpg", ".jpeg", ".webp"]).has(extension)) {
    return readImageText(absoluteFilePath);
  }

  return "";
};

export const extractUrls = (text) => Array.from(new Set((text.match(urlRegex) || []).map((item) => item.trim())));

export const redactSensitiveInfo = (text) => {
  const findings = [];
  let redacted = text;

  const replaceAndTrack = (regex, token, label) => {
    const matches = redacted.match(regex);
    if (matches?.length) {
      findings.push(`${label}:${matches.length}`);
      redacted = redacted.replace(regex, token);
    }
  };

  replaceAndTrack(mask.email, "[REDACTED_EMAIL]", "email");
  replaceAndTrack(mask.phone, "[REDACTED_PHONE]", "phone");
  replaceAndTrack(mask.linkedIn, "[REDACTED_LINKEDIN_URL]", "linkedin");
  replaceAndTrack(mask.github, "[REDACTED_GITHUB_URL]", "github");

  return {
    redactedText: redacted,
    findings
  };
};

const normalizeSkill = (value) =>
  value
    .replace(/^[\-•*]+\s*/, "")
    .replace(/`/g, "")
    .trim();

export const extractFocusedResumeSections = (rawText, options = {}) => {
  const includeFallbackExperience = options.includeFallbackExperience !== false;
  const lines = rawText.split(/\r?\n/);
  const sections = {
    summary: [],
    skills: [],
    projects: [],
    achievements: [],
    education: [],
    experience: []
  };

  let current = "";

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const headingMatch = line.match(headingRegex);
    if (headingMatch) {
      const heading = headingMatch[1].toLowerCase();
      if (heading.includes("skill")) {
        current = "skills";
      } else if (heading.includes("project")) {
        current = "projects";
      } else if (heading.includes("achievement")) {
        current = "achievements";
      } else if (heading.includes("profile")) {
        current = "achievements";
      } else if (heading.includes("education") || heading.includes("academic")) {
        current = "education";
      } else if (heading.includes("summary")) {
        current = "summary";
      } else {
        current = "experience";
      }
      continue;
    }

    if (current) {
      sections[current].push(line);
    }
  }

  const fallbackExperience = lines
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 60);

  return {
    summaryText: sections.summary.join("\n"),
    skillsText: sections.skills.join("\n"),
    projectsText: sections.projects.join("\n"),
    achievementsText: sections.achievements.join("\n"),
    educationText: sections.education.join("\n"),
    experienceText: (sections.experience.length ? sections.experience : includeFallbackExperience ? fallbackExperience : []).join("\n")
  };
};

export const extractNormalizedSkills = (skillsText) => {
  const tokens = skillsText
    .split(/\r?\n|,|\||\//)
    .map((item) => normalizeSkill(item))
    .filter(Boolean)
    .filter((item) => item.length <= 60);

  return Array.from(new Set(tokens)).slice(0, 40);
};

export const pickProfileLinksFromExtractedLinks = (links = []) => {
  const normalized = Array.from(
    new Set(
      links
        .map((item) => String(item || "").trim())
        .map((item) => item.replace(/[).,;]+$/, ""))
        .filter(Boolean)
    )
  );
  const httpLinks = normalized.filter((link) => /^https?:\/\//i.test(link));
  const mailtoLink = normalized.find((link) => /^mailto:/i.test(link)) || "";
  const emailFromMailto = String(mailtoLink.replace(/^mailto:/i, "")).trim();

  const linkedInRegex = /https?:\/\/(?:www\.)?linkedin\.com\/[A-Za-z0-9\-_/?.=&%#]+/i;
  const githubRegex = /https?:\/\/(?:www\.)?github\.com\/[A-Za-z0-9\-_/?.=&%#]+/i;

  const isGithubProfileLink = (value) => {
    const norm = String(value || "").toLowerCase().trim();
    const match = norm.match(/^https?:\/\/(?:www\.)?github\.com\/([^/?#]+)(?:[/?#].*)?$/i);
    if (!match?.[1]) return false;
    const remaining = norm.replace(/^https?:\/\/(?:www\.)?github\.com\/[^/?#]+/i, "");
    return !remaining || remaining === "/" || remaining.startsWith("?") || remaining.startsWith("#");
  };

  const linkedInUrl = httpLinks.find((link) => linkedInRegex.test(link)) || "";
  const githubUrl = httpLinks.find((link) => isGithubProfileLink(link)) || "";
  const projectGithubLinks = httpLinks.filter((link) => githubRegex.test(link) && !isGithubProfileLink(link));
  const liveLinks = httpLinks.filter((link) => !linkedInRegex.test(link) && !githubRegex.test(link));

  return {
    linkedInUrl,
    githubUrl,
    emailFromMailto,
    projectGithubLinks,
    liveLinks
  };
};

import multer from "multer";
import path from "path";

const fileFilter = (_req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const allowedMimeTypes = new Set([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/rtf",
    "text/rtf",
    "text/plain",
    "application/x-tex",
    "text/x-tex",
    "image/png",
    "image/jpeg",
    "image/webp",
  ]);
  const allowedExtensions = new Set([
    ".pdf",
    ".docx",
    ".doc",
    ".rtf",
    ".txt",
    ".tex",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
  ]);

  if (!allowedMimeTypes.has(file.mimetype) && !allowedExtensions.has(extension)) {
    callback(new Error("This file type isn't supported. Please upload a PDF, DOCX, TXT, or RTF resume."));
    return;
  }

  callback(null, true);
};

const maxResumeSize = (Number(process.env.MAX_RESUME_SIZE_MB) || 10) * 1024 * 1024;

export const resumeUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: maxResumeSize },
});

const readmeFileFilter = (_req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = new Set([".md", ".markdown", ".txt"]);
  const allowedMimeTypes = new Set([
    "text/markdown",
    "text/plain",
    "application/octet-stream",
  ]);

  if (!allowedExtensions.has(extension) && !allowedMimeTypes.has(file.mimetype)) {
    callback(new Error("Only README markdown or text files are allowed"));
    return;
  }

  callback(null, true);
};

export const projectReadmeUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: readmeFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

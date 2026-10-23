import multer from "multer";
import path from "path";

const allowedExtensions = new Set([
  ".pdf",
  ".docx",
  ".doc",
  ".txt",
  ".md",
  ".markdown",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".csv",
  ".json",
  ".zip",
]);

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "text/markdown",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/csv",
  "application/json",
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
]);

const deliverableFileFilter = (_req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();

  // Block dangerous executable extensions explicitly
  const dangerousExtensions = new Set([
    ".exe",
    ".bat",
    ".cmd",
    ".sh",
    ".js",
    ".py",
    ".php",
    ".vbs",
    ".jar",
    ".html",
    ".htm",
    ".dll",
    ".so",
    ".ps1",
  ]);

  if (dangerousExtensions.has(extension)) {
    callback(new Error("Executable or script files are strictly prohibited for project deliverables."));
    return;
  }

  if (!allowedExtensions.has(extension) && !allowedMimeTypes.has(file.mimetype)) {
    callback(new Error(`File type "${extension}" is not supported. Please upload a PDF, DOCX, TXT, MD, image, CSV, or ZIP archive.`));
    return;
  }

  callback(null, true);
};

const maxFileSize = (Number(process.env.MAX_DELIVERABLE_SIZE_MB) || 10) * 1024 * 1024;

export const projectDeliverableUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: deliverableFileFilter,
  limits: { fileSize: maxFileSize },
});

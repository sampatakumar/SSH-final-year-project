import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Search for tasks in standard workspace locations
function resolveTasksRoot() {
  const candidatePaths = [
    path.resolve(__dirname, "../../../../tasks"),
    path.resolve(process.cwd(), "tasks"),
    path.resolve(process.cwd(), "backend/tasks"),
    path.resolve(__dirname, "../tasks"),
    path.resolve(__dirname, "../../../tasks"),
  ];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return path.resolve(__dirname, "../../../../tasks");
}

const TASKS_ROOT = resolveTasksRoot();

/**
 * List all available tasks for a given language.
 */
export function getAllTasks(language = "javascript") {
  const languageDir = path.join(TASKS_ROOT, language);

  if (!fs.existsSync(languageDir)) {
    return [];
  }

  const files = fs.readdirSync(languageDir).filter((file) => file.endsWith(".json"));

  return files.map((file) => {
    const filePath = path.join(languageDir, file);
    const content = JSON.parse(fs.readFileSync(filePath, "utf8"));

    return {
      id: content.id,
      title: content.title,
      language: content.language,
      difficulty: content.difficulty || "Easy",
      category: content.category || "General",
      points: content.points || 10,
      testCount: Array.isArray(content.tests) ? content.tests.length : 0,
      descriptionSummary: content.description ? content.description.slice(0, 120) + "..." : "",
      skills: content.skills || [content.category || "Problem Solving"],
    };
  });
}

/**
 * Get raw task definition (including all hidden tests).
 */
export function getRawTask(taskId, language = "javascript") {
  const taskPath = path.join(TASKS_ROOT, language, `${taskId}.json`);

  if (!fs.existsSync(taskPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(taskPath, "utf8"));
}

/**
 * Get public task detail (hides hidden tests from client).
 */
export function getPublicTask(taskId, language = "javascript") {
  const task = getRawTask(taskId, language);

  if (!task) {
    return null;
  }

  // Only expose sample tests to frontend client
  const sampleTests = (task.tests || []).filter((t) => t.isSample === true);

  return {
    id: task.id,
    language: task.language,
    title: task.title,
    functionName: task.functionName,
    difficulty: task.difficulty,
    category: task.category,
    description: task.description,
    examples: task.examples || [],
    starterCode: task.starterCode,
    points: task.points,
    sampleTests,
    totalTestsCount: (task.tests || []).length,
    skills: task.skills || [task.category || "Problem Solving"],
  };
}

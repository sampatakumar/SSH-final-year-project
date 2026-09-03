/**
 * Docker Sandbox Configuration & Resource Limits for Smart Skill Hub
 */

export const SANDBOX_IMAGE_NAME = "ssh-javascript-sandbox";

export const EXECUTION_LIMITS = {
  memory: 128 * 1024 * 1024, // 128 MB RAM
  memorySwap: 128 * 1024 * 1024, // No swap beyond RAM
  nanoCpus: 500_000_000, // 0.5 CPU cores
  pidsLimit: 32, // Max 32 concurrent processes/threads
  timeoutMs: 5000, // 5s execution timeout
  maxCodeLengthBytes: 64 * 1024, // 64 KB source code max
  maxStdoutBytes: 1024 * 1024, // 1 MB stdout limit
  maxStderrBytes: 1024 * 1024, // 1 MB stderr limit
  maxConcurrentContainers: 4, // Max 4 concurrent container instances
};

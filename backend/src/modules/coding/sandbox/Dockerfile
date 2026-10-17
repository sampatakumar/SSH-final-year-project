# Smart Skill Hub — Isolated JavaScript Coding Sandbox Image
FROM node:20-alpine

# Establish secure non-root working environment
WORKDIR /sandbox

# Install isolated test runner script
COPY test-runner.js /sandbox/test-runner.js

# Enforce least-privilege non-root ownership and read-only permissions
RUN chown -R node:node /sandbox && chmod 0555 /sandbox/test-runner.js

# Default to unprivileged user
USER node

CMD ["node", "test-runner.js"]

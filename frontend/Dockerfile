# Smart Skill Hub — Frontend Production Build & Static Nginx Container
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build-time API URL configuration
ARG VITE_API_URL=http://localhost:8000/api/v1
ENV VITE_API_URL=$VITE_API_URL

# Run production build
RUN npm run build

# Production static file serving stage
FROM nginx:1.27-alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built frontend assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config for SPA routing (fallback to index.html) and API reverse proxy
RUN cat <<'EOF' > /etc/nginx/conf.d/default.conf
server {
    listen 8080;
    server_name localhost;
    server_tokens off;
    root /usr/share/nginx/html;
    index index.html;
    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]

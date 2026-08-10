# Lumen Create runs FFmpeg (native binary) and writes job files to disk, so it
# needs a real Node container — not an edge/isolate runtime.
FROM node:24-bookworm-slim

WORKDIR /app

# Install deps first so the layer caches when only source changes.
# ffmpeg-static / ffprobe-static download their Linux binaries during install,
# so this must run inside the target (Linux) image, not be copied from the host.
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# Job files live here at runtime. Attach a persistent volume at /app/.data on
# the host platform (e.g. Railway Volumes), or projects are lost on restart.
RUN mkdir -p .data/jobs

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

CMD ["npm", "run", "start"]

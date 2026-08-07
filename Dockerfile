# CampusCart API — single-stage Bun image.
#
# The workspace is a Bun monorepo, so the build context is the repo root: the
# API imports @campuscart/shared by workspace link and cannot be built from
# apps/api alone.
FROM oven/bun:1.3-alpine

WORKDIR /app

# Manifests first so `bun install` is cached independently of source edits.
# Every workspace manifest is needed even though only the API is built here:
# bun resolves the whole workspace graph, and a missing member makes the
# lockfile look changed, which --frozen-lockfile then rejects.
COPY package.json bun.lock bunfig.toml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/mobile/package.json apps/mobile/
COPY apps/admin/package.json apps/admin/

RUN bun install --frozen-lockfile

COPY packages/shared packages/shared
COPY apps/api apps/api

ENV NODE_ENV=production
EXPOSE 3000

# Migrate then serve. Drizzle's migrator is idempotent, so re-running on every
# boot is safe and means a platform that only gives you a start command (Railway,
# Render, Fly) needs no separate release step. devDependencies are intentionally
# installed above — drizzle-kit lives there.
CMD ["sh", "-c", "bun run --filter @campuscart/api db:migrate && bun run apps/api/src/index.ts"]

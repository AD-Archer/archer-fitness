# Justfile for Archer Fitness
# Run commands with `just <recipe-name>`

# Default: show available recipes
default:
    just --list

# Development server
dev:
    infisical run pnpm dev

# Build the application
build:
    infisical run pnpm run build

# Start production server
start:
    infisical run pnpm start

# Lint the codebase
lint:
    pnpm run lint

# TypeScript type checking
typecheck:
    pnpm run typecheck

# Seed the database
seed:
    infisical run pnpm run seed

# Generate Prisma client
prisma-generate:
    infisical run npx prisma generate

# Run Prisma migrations
prisma-migrate:
    infisical run npx prisma migrate dev

# Open Prisma Studio
prisma-studio:
    infisical run npx prisma studio

# Run exercise scraper
scrape:
    infisical run pnpm run scrape

prebuild:
    infisical run pnpm run lint
    infisical run pnpm run typecheck
# Update Docker containers
update-docker:
    pnpm run update:docker

# Full development setup (generate client, migrate, seed, dev)
setup:
    infisical run npx prisma generate
    infisical run npx prisma migrate dev
    infisical run pnpm run seed
    infisical run pnpm dev

# Clean and rebuild
clean-build:
    rm -rf .next node_modules/.cache
    infisical run pnpm run build

# Lint the codebase
lint:
    pnpm run lint

# TypeScript type checking
typecheck:
    pnpm run typecheck

# Seed the database
seed:
    infisical run pnpm run seed

# Generate Prisma client
prisma-generate:
    infisical run npx prisma generate

# Run Prisma migrations
prisma-migrate:
    infisical run npx prisma migrate dev

# Open Prisma Studio
prisma-studio:
    infisical run npx prisma studio

# Run exercise scraper
scrape:
    infisical run pnpm run scrape

# Update Docker containers
update-docker:
    pnpm run update:docker

# Full development setup (generate client, migrate, seed, dev)
setup:
    infisical run npx prisma generate
    infisical run npx prisma migrate dev
    infisical run pnpm run seed
    infisical run pnpm dev

# Clean and rebuild
clean-build:
    rm -rf .next node_modules/.cache
    infisical run pnpm run build
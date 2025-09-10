# Archer Fitness (Docker)

A Docker-friendly, production-ready build of Archer Fitness — an AI-powered fitness tracking app (Next.js + PostgreSQL + Prisma).

This README is written for Docker Hub / container users who want to pull and run the prebuilt image or build and run locally with Docker/Compose.

## Image

Official image (example):

  docker pull ad-archer/archer-fitness:latest

Replace `ad-archer/archer-fitness:latest` with the tag you need.

## Quickstart — run with Docker

1. Create an `.env` file (see Environment variables below).
2. Run the container:

```bash
docker run -d \
  --name archer-fitness \
  --env-file .env \
  -p 3000:3000 \
  --restart unless-stopped \
  ad-archer/archer-fitness:latest
```

The web app will be available on http://localhost:3000

Notes:
- The container expects the database to be reachable from inside the container via `DATABASE_URL`.
- For production, use a networked PostgreSQL (or a managed DB) rather than a local socket.

## Quickstart — Docker Compose

Example `docker-compose.yml` snippet (minimal):

```yaml
services:
  db:
    image: postgres:15
    container_name: archer-fitness-db
    environment:
      POSTGRES_DB: archer_fitness
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - db-data:/var/lib/postgresql/data
    networks:
      - archer-net

  web:
    container_name: archer-fitness
    image: ad-archer/archer-fitness:latest
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      # Expose PORT from .env (dotenv). The healthcheck below relies on this value.
      - PORT=${PORT:-3000}
  # Ensure the server binds to all interfaces so the internal healthcheck (and other
  # containers on the same network) can reach it. Next.js standalone/server.js will
  # bind to the provided host if set; use 0.0.0.0 inside containers.
  - HOST=0.0.0.0
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:${PORT:-3000}/ || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
    depends_on:
      - db
    networks:
      - archer-net

volumes:
  db-data: {}

networks:
  archer-net: {}
```

After creating `.env` and the compose file:

```bash
docker compose up -d
```

Notes on ports vs healthchecks:

- The Docker `HEALTHCHECK` runs inside the container and queries `localhost` within the
  container network namespace — it does NOT require publishing/mapping the port to the host.
- `EXPOSE` and publishing (`ports:`) only affect host accessibility; they are not required for
  an internal healthcheck to work.
- If you want to reach the app from your host machine (browser), you still need to publish a port
  with `ports: - "3000:3000"` (or set `-p` with `docker run`).

Example: publish port to host (optional):

```yaml
  web:
    ports:
      - "3000:3000"
```

## Environment variables

At a minimum, set:

- DATABASE_URL — PostgreSQL connection string (e.g. postgresql://user:pass@db:5432/archer_fitness?schema=public)
- NEXTAUTH_SECRET — secret for NextAuth
- NEXTAUTH_URL — public URL (e.g. https://example.com or http://localhost:3000)

Optional / recommended:

- VERCEL_ANALYTICS_ID — analytics id if used
- NODE_ENV — production (default set by image if built for production)

Example `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@db:5432/archer_fitness?schema=public"
NEXTAUTH_SECRET="your-super-secret-key"
NEXTAUTH_URL="http://localhost:3000"
# Optional: PORT is read by Docker Compose when using dotenv. Set if you want a custom port.
PORT=3000
```

## Build locally (optional)

If you want to build the image locally:

```bash
# from repo root
docker build -t archer-fitness:local .
```

Then run with the `arche-fitness:local` tag as above.

## Health and persistence

- Database is external to the web image and should be backed up and persisted via Docker volumes or external DB service.
- Use `--restart unless-stopped` for resilience.

## Ports

- 3000 — Next.js application port (mapped to host in examples)

## Volumes

This image does not require persistent storage for the app itself (stateless). Persist the database with a named volume or external service.

## Security & best practices

- Do not store secrets in images. Use `--env-file` or your orchestration secrets manager.
- Run the app behind a reverse proxy (nginx, Traefik) with TLS in production.
- Use a managed database or ensure your PostgreSQL is secured and backed up.

## Troubleshooting

- 502 / cannot connect: check `DATABASE_URL` and network configuration between the container and the database.
- 500 errors on auth: verify `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are correct.
- Logs:

```bash
docker logs -f archer-fitness
```

## Support

If you need help running the container, open an issue on the repository or contact antonioarcher.dev@gmail.com.
Submit an issue at https://github.com/ad-archer/archer-fitness
---

This file is intended for the Docker Hub description or as a quick reference for running Archer Fitness in containers.

# Archer Fitness (Docker)

A Docker-friendly, production-ready build of Archer Fitness — an AI-powered fitness tracking app (Next.js + PostgreSQL + Prisma).

This README is written for Docker Hub / container users who want to pull and run the prebuilt image or build and run locally with Docker/Compose.

Speical thanks to the https://www.exercisedb.dev/ for their amazing api
## Image

Official image (example):

  docker pull adarcher/archer-fitness:latest

Replace `adarcher/archer-fitness:latest` with the tag you need.

## Quickstart — run with Docker

1. Create an `.env` file (see Environment variables below).
2. Run the container:

```bash
docker run -d \
  --name archer-fitness \
  --env-file .env \
  -p ${PORT:-3000}:${PORT:-3000} \
  --restart unless-stopped \
  adarcher/archer-fitness:latest
```

The web app will be available on http://localhost:${PORT:-3000}

Notes:
- The container expects the database to be reachable from inside the container via `DATABASE_URL`.
- For production, use a networked PostgreSQL (or a managed DB) rather than a local socket.

## Quickstart — Docker Compose

Example `docker-compose.yml` snippet (minimal):

```yaml
services:
  archer-fitness:
    image: adarcher/archer-fitness:latest
    container_name: archer-fitness
    ports:
      - "${PORT:-3000}:${PORT:-3000}"
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - PORT=${PORT:-3000}
      # Uncomment below if using the local db service
      # DATABASE_URL=postgresql://postgres:postgres@db:5432/archer_fitness?schema=public
    restart: unless-stopped
    # depends_on:
    #   - db  # Uncomment if using the local db service
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:${PORT:-3000}/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # --- OPTIONAL: Local PostgreSQL Database ---
  # Uncomment to run a local db for dev/testing
  # db:
  #   image: postgres:15
  #   container_name: archer-fitness-db
  #   restart: unless-stopped
  #   environment:
  #     POSTGRES_DB: archer_fitness
  #     POSTGRES_USER: postgres
  #     POSTGRES_PASSWORD: postgres
  #   ports:
  #     - "5432:5432"
  #   volumes:
  #     - db-data:/var/lib/postgresql/data

volumes:
  db-data: {}
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
  with `ports: - "${PORT:-3000}:${PORT:-3000}"` (or set `-p` with `docker run`).

Example: publish port to host (optional):

```yaml
  web:
    ports:
      - "${PORT:-3000}:${PORT:-3000}"
```

## Environment variables

At a minimum, set:

- DATABASE_URL — PostgreSQL connection string (e.g. postgresql://user:pass@db:5432/archer_fitness?schema=public)
- NEXTAUTH_SECRET — secret for NextAuth
- NEXTAUTH_URL — public URL (e.g. https://example.com or http://localhost:3000)
- NEXT_PUBLIC_VAPID_PUBLIC_KEY — VAPID public key for push notifications
- VAPID_PRIVATE_KEY — VAPID private key for push notifications
- VAPID_EMAIL — contact email for VAPID
- ADMIN_EMAIL — admin email for error and startup notifications (optional)
- GOOGLE_CLIENT_ID — Google OAuth client ID (optional)
- GOOGLE_CLIENT_SECRET — Google OAuth client secret (optional)

### Generate VAPID Keys

Before running the container, generate VAPID keys for push notifications:

Go to [https://vapidkeys.com/] or 

```bash
# Clone the repository to access the script
git clone https://github.com/ad-archer/archer-fitness.git
cd archer-fitness

# Generate VAPID keys
node scripts/generate-vapid-keys.js
```

Copy the generated keys into your `.env` file.

**Note:** Push notifications require valid VAPID keys to work. Without them, the notification feature will not function properly.

Example `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@db:5432/archer_fitness?schema=public"
NEXTAUTH_SECRET="your-super-secret-key"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-generated-public-key"
VAPID_PRIVATE_KEY="your-generated-private-key"
VAPID_EMAIL="admin@yourdomain.com"
ADMIN_EMAIL="admin@yourdomain.com"
# Optional: PORT is read by Docker Compose when using dotenv. Set if you want a custom port.
PORT=3000
```

## Google OAuth Setup (Optional)

If you want to enable Google sign-in for your users:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" in the left sidebar
5. Click "Create Credentials" → "OAuth 2.0 Client IDs"
6. Configure the OAuth consent screen if prompted
7. Set the application type to "Web application"
8. Add authorized redirect URIs:
   - For development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://yourdomain.com/api/auth/callback/google`
9. Copy the Client ID and Client Secret to your `.env` file

**Note:** If Google OAuth is not configured, users will see a warning message on the sign-in and sign-up pages, but can still use email/password authentication.

## Generate VAPID Keys
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

- ${PORT:-3000} — Next.js application port (mapped to host in examples)

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

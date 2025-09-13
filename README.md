# 🏋️ Archer Fitness
https://fitness.archer.software/sitebanner.webp
An AI-powered fitness tracking application built by Antonio Archer, a software developer from Philadelphia. Track workouts, monitor nutrition, and analyze your fitness progress with intelligent insights and personalized recommendations.

![Archer Fitness](https://img.shields.io/badge/Archer-Fitness-blue?style=for-the-badge&logo=fitness&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14.2.16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.15.0-green?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?style=flat-square&logo=postgresql)

## ✨ Features

### 🏃‍♂️ Workout Tracking
- **Custom Workout Templates**: Create and save personalized workout routines
- **Exercise Library**: Access a comprehensive database of exercises with detailed instructions
- **Real-time Tracking**: Log sets, reps, weights, and rest times during workouts
- **Progress Analytics**: Visualize your strength gains and workout patterns
- **Session Management**: Start, pause, and resume workout sessions

### 🥗 Nutrition Monitoring
- **Food Database**: Search and log meals from a vast food database
- **Custom Meals**: Create and save your own meal recipes
- **Macro Tracking**: Monitor calories, protein, carbs, and fats
- **Meal Planning**: Plan and track daily nutrition goals
- **Nutrition Analytics**: View trends in your dietary habits

### 📊 Progress Dashboard
- **Visual Analytics**: Interactive charts showing workout and nutrition trends
- **Goal Setting**: Set and track fitness objectives
- **Performance Metrics**: Monitor strength gains, endurance improvements
- **Weekly Reports**: Automated progress summaries and insights

### 🤖 AI-Powered Features
- **Smart Recommendations**: AI-driven workout and nutrition suggestions
- **Progress Predictions**: Estimate future performance based on current trends
- **Personalized Insights**: Intelligent analysis of your fitness data

### 🔐 Authentication & Security
- **NextAuth Integration**: Secure authentication with multiple providers
- **User Profiles**: Personalized user accounts with fitness preferences
- **Data Privacy**: Secure storage and handling of personal fitness data

## 🚀 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component library
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Recharts** - Data visualization

### Backend
- **Next.js API Routes** - Server-side API endpoints
- **Prisma ORM** - Database toolkit
- **PostgreSQL** - Primary database
- **NextAuth.js** - Authentication framework
- **bcryptjs** - Password hashing

### DevOps & Tools
- **Docker** - Containerization
- **GitHub Actions** - CI/CD pipelines
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **pnpm** - Package management

## � CI/CD Pipeline

The repository includes automated CI/CD pipelines for building, testing, and deploying the application:

### 1. CI/CD Pipeline (`.github/workflows/ci-cd.yml`)

**Triggers:**
- ✅ Push to `main` or `develop` branches
- ✅ Pull requests to `main` or `develop`
- ✅ Release publications

**Jobs:**
- **Lint and Type Check**: Runs ESLint and TypeScript validation
- **Build and Test**: Builds the Next.js application
- **Docker Build and Push**: Builds and pushes Docker image to DockerHub

**Note:** Automatic deployments are disabled. Use the deployment script manually when ready.

### 2. Security Scan (`.github/workflows/security.yml`)

**Triggers:**
- Weekly schedule (Mondays at 2 AM UTC)
- Push to `main`
- Pull requests to `main`

**Jobs:**
- **Dependency Scan**: Runs `pnpm audit` for vulnerable dependencies
- **Docker Security Scan**: Uses Trivy to scan Docker images for vulnerabilities

### 3. Dependency Updates (`.github/workflows/dependency-updates.yml`)

**Triggers:**
- Weekly schedule (Mondays at 6 AM UTC)
- Manual trigger

**Jobs:**
- **Update Dependencies**: Automatically updates dependencies and creates a PR

## �🛠️ Installation & Setup

### Prerequisites
- **Node.js 22+**
- **pnpm** package manager
- **PostgreSQL** database
- **Docker** (optional, for containerized deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/ad-archer/archer-fitness.git
   cd archer-fitness
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Configure the following variables in `.env.local`:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/archer_fitness?schema=public"

   # NextAuth
   NEXTAUTH_SECRET="your-super-secret-key"
   NEXTAUTH_URL="http://localhost:3000"

   # VAPID Keys for Push Notifications (Required)
   NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-vapid-public-key"
   VAPID_PRIVATE_KEY="your-vapid-private-key"
   VAPID_EMAIL="admin@yourdomain.com"

   # Google OAuth (Optional)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id"

   # Optional: Analytics
   VERCEL_ANALYTICS_ID="your-vercel-analytics-id"
   ```

4. **Set up Google OAuth (Optional)**
   
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
   9. Copy the Client ID and Client Secret to your `.env.local` file as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Also set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to the same Client ID value for client-side detection.

5. **Generate VAPID keys for push notifications**
   ```bash
   node scripts/generate-vapid-keys.js
   ```
   This will generate the required `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` values using the web-push library (ensures correct format for both client and server).

   **Output Example:**
   ```
   VAPID Keys Generated Successfully!
   =====================================

   Public Key (NEXT_PUBLIC_VAPID_PUBLIC_KEY):
   BI-bhgEd6FOJsBKELAstGTh...

   Private Key (VAPID_PRIVATE_KEY):
   y53ggQU7...

   Add these to your .env.local file (development) or .env file (production/Docker):
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=BI-bhgEd6FOJsBKELAstGTh...
   VAPID_PRIVATE_KEY=y53ggQU7...
   ```

   **Important Notes:**
   - The script uses the `web-push` library to generate keys in the correct format
   - Public key is safe to expose (used in browser)
   - Private key must be kept secure (never commit to version control)
   - Keys work for both browser Push API and server-side web-push library
   - For Docker/production: Add keys to `.env` file
   - For development: Add keys to `.env.local` file

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma db push

   # Optional: Seed the database
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker Deployment


1. **Run with Docker Compose**

    Create a `.env` file (see below for required variables), then use the following `docker-compose.yml` (copy-pasteable example):

    ```yaml
    services:
       archer-fitness:
          image: ad-archer/archer-fitness:latest
          container_name: archer-fitness
          ports:
             - "3000:3000"
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
             test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
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

    Then start the stack:
    ```bash
    docker compose up -d
    ```
2. **Or run manually**
    ```bash
    docker run -d \
       --name archer-fitness \
       --env-file .env \
       -p 3000:3000 \
       --restart unless-stopped \
       adarcher/archer-fitness:latest
    ```

**Note:**
- The default `docker-compose.yml` is production-ready and supports both external and local databases.
- For local development, uncomment the `db` service and the `depends_on`/`DATABASE_URL` lines in the app service.

### Home Server Deployment

For production deployment to your home server via SSH:

1. **Set up SSH access** (on your server):
   ```bash
   # Generate SSH key pair
   ssh-keygen -t ed25519 -C "github-actions"

   # Copy public key to authorized_keys
   cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys
   ```

2. **Add SSH secrets to GitHub**:
   - `SERVER_HOST`: Your server's IP address or domain
   - `SERVER_SSH_KEY`: Private SSH key (contents of `~/.ssh/id_ed25519`)
   - `SERVER_PORT`: SSH port (default: 22)

3. **Set up project directory** (on your server):
   ```bash
   mkdir -p /home/adarcher/projects/archer-fitness
   cd /home/adarcher/projects/archer-fitness

   # Create docker-compose.yml
   # (copy from repository)

   # Create .env file with your configuration
   ```

4. **Automatic deployment**:
   - Push to `main` branch → automatic production deployment
   - Push to `develop` branch → automatic staging deployment

## 📁 Project Structure

```
archer-fitness/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── exercises/            # Exercise management
│   │   ├── foods/                # Food database
│   │   ├── health/               # Health monitoring
│   │   └── workouts/             # Workout tracking
│   ├── auth/                     # Authentication pages
│   ├── dashboard/                # Main dashboard
│   ├── nutrition/                # Nutrition tracking
│   ├── progress/                 # Progress analytics
│   ├── settings/                 # User settings
│   ├── track/                    # Workout tracking
│   └── workouts/                 # Workout management
├── components/                   # Reusable UI components
│   ├── ui/                       # Base UI components (Radix)
│   ├── dashboard/                # Dashboard components
│   ├── auth/                     # Authentication components
│   └── ...                       # Feature-specific components
├── lib/                          # Utility libraries
│   ├── auth.ts                   # Authentication config
│   ├── prisma.ts                 # Database client
│   └── utils.ts                  # Helper functions
├── prisma/                       # Database schema & migrations
│   ├── schema.prisma             # Prisma schema
│   └── seed.ts                   # Database seeding
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript type definitions
├── styles/                       # Global styles
└── public/                       # Static assets
```

## 🗄️ Database Schema

The application uses PostgreSQL with the following main entities:

- **Users**: User accounts and profiles
- **Exercises**: Exercise library with categories and instructions
- **WorkoutTemplates**: Reusable workout routines
- **WorkoutSessions**: Individual workout sessions
- **Foods**: Nutritional food database
- **Meals**: Meal planning and tracking
- **NutritionLogs**: Daily nutrition tracking
- **UserPreferences**: Personalized settings

## 🔧 Available Scripts

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm typecheck    # Run TypeScript type checking

# Database
npx prisma generate    # Generate Prisma client
npx prisma db push     # Push schema changes
npx prisma studio      # Open Prisma Studio

# Docker
pnpm run update:docker # Update Docker containers
```

## 🚀 Deployment

### Vercel (Recommended for Development/Staging)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on every push

### Docker + Home Server

1. **Pull the image on your server**
   ```bash
   docker pull adarcher/archer-fitness:latest
   ```
2. **Start with Docker Compose**
   ```bash
   docker compose up -d
   ```

### Manual Server
1. Build the application: `pnpm build`
2. Start the server: `pnpm start`
3. Set up reverse proxy (nginx) for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all linting passes

## 📊 Performance & Analytics

- **Vercel Analytics**: Built-in performance monitoring
- **Core Web Vitals**: Optimized for fast loading
- **SEO Optimized**: Meta tags and structured data
- **Progressive Web App**: Installable on mobile devices

## 🔒 Security

- **NextAuth.js**: Secure authentication with JWT tokens
- **Password Hashing**: bcryptjs for secure password storage
- **Input Validation**: Zod schemas for data validation
- **SQL Injection Protection**: Prisma ORM prevents SQL injection
- **HTTPS Only**: Enforced secure connections

## 📱 Progressive Web App

The application is PWA-ready with:
- Service worker for offline functionality
- Installable on mobile devices
- Native app-like experience
- Offline workout tracking capabilities

## 🎯 Roadmap

### Upcoming Features
- [ ] Mobile app (React Native)
- [ ] Social features (workout sharing, challenges)
- [ ] Integration with fitness wearables
- [ ] Advanced AI recommendations
- [ ] Meal planning with grocery lists
- [ ] Workout video demonstrations
- [ ] Community forums

### Technical Improvements
- [ ] GraphQL API
- [ ] Real-time notifications
- [ ] Advanced caching strategies
- [ ] Multi-language support
- [ ] Dark mode enhancements

## 📄 License

This project is private and proprietary. All rights reserved.

## 👨‍💻 Author

**Antonio Archer**
- Website: [antonioarcher.com](https://www.antonioarcher.com)
- GitHub: [@ad-archer](https://github.com/ad-archer)
- LinkedIn: [Antonio Archer](https://www.linkedin.com/in/antonio-archer)
- Twitter: [@ad_archer_](https://twitter.com/ad_archer_)
- Location: Philadelphia, PA

## 🙏 Acknowledgments

- [**Exercise DB**](https://www.exercisedb.dev/) - For their Amazing Database to get all of our exercises, machines, muscles, and bodyparts 


## 📞 Support

For support or questions:
- Create an issue on GitHub
- Contact: antonioarcher.dev@gmail.com
---

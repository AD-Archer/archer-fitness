# 🏋️ Archer Fitness

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

## 🛠️ Installation & Setup

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

   # Optional: Analytics
   VERCEL_ANALYTICS_ID="your-vercel-analytics-id"
   ```

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

1. **Build the Docker image**
   ```bash
   docker build -t archer-fitness .
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Or run manually**
   ```bash
   docker run -d \
     --name archer-fitness \
     -p 3000:3000 \
     -e DATABASE_URL="your-database-url" \
     -e NEXTAUTH_SECRET="your-secret" \
     -e NEXTAUTH_URL="http://localhost:3000" \
     archer-fitness
   ```

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

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on every push

### Docker + Cloud
1. Build and push Docker image to DockerHub
2. Deploy to your preferred cloud platform (AWS, GCP, Azure)
3. Set up database and environment variables

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

- **Next.js Team** for the amazing React framework
- **Prisma Team** for the excellent database toolkit
- **Radix UI** for accessible component primitives
- **Tailwind CSS** for the utility-first CSS framework
- **Vercel** for hosting and deployment platform

## 📞 Support

For support or questions:
- Create an issue on GitHub
- Contact: antonio@archer.software
- Documentation: [docs.archer.software](https://docs.archer.software)

---

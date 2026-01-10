# 🚀 Project Management App - Backend Setup Guide

## ✅ Prerequisites

- Node.js 18+ installed
- PostgreSQL 12+ installed and running
- npm or yarn package manager

## 📋 Installation Steps

### 1. Clone & Install Dependencies

```bash
cd pma-nest-backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/project_management_db"

# Server Configuration
PORT=3000
NODE_ENV=development

# Security - Change these in production!
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
ENCRYPTION_KEY=your-32-character-encryption-key!
```

**⚠️ IMPORTANT:** Generate secure keys for production:
```bash
# Generate random JWT secret (32 chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate random encryption key (32 chars)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### 3. Setup Database

#### Option A: Run Migrations
```bash
npm run db:migrate
```

This will:
- Create database tables from schema.prisma
- Apply all pending migrations
- Generate Prisma Client

#### Option B: Push Schema (Development Only)
```bash
npm run db:push
```

#### Option C: Reset Database (Development Only)
```bash
npm run db:reset
```

**Warning:** This deletes all data!

### 4. (Optional) Seed Database

Create `prisma/seed.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Add your seed data here
  console.log('Database seeded!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Then run:
```bash
npm run db:seed
```

**⚠️ IMPORTANT:** Do not run seed scripts in production unless explicitly intended.

## 🧱 Architecture Overview

- Modular NestJS structure:
  - Each module contains Controllers, Services, and DTOs
  - Prisma ORM for database access
  - Centralized validation with class-validator
  - Centralized exception handling
  - Authentication using JWT + Passport
- Project is scalable: easy to add new modules or microservices
- Frontend interacts via REST API (Swagger documented)

## 🏃 Running the Application

### Development Mode (with hot reload)
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

### Debugging
```bash
npm run start:debug
```

## 📊 Database Management

### View Database in GUI
```bash
npm run prisma:studio
```

Opens: http://localhost:5555

### Check Migration Status
```bash
npx prisma migrate status
```

### Create New Migration
```bash
npx prisma migrate dev --name describe_your_change
```

## 📚 API Documentation

Once the server is running:

- **Swagger UI:** http://localhost:3000/api

## 🔐 Authentication

Passwords are hashed using bcrypt before storage.

### Register User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "role": "developer"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGc...",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "role": "developer"
  }
}
```

### Use Token in Requests
```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## ⚠️ Rate Limiting

Global rate limiting is enabled:
- **Short limit:** 30 requests per minute
- **Long limit:** 300 requests per 15 minutes

If you exceed the limit:
```json
{
  "statusCode": 429,
  "message": "Too many requests. Please try again later.",
  "error": "Too Many Requests"
}
```

## 📦 Available npm Scripts

| Script | Purpose |
|--------|---------|
| `npm run build` | Build for production |
| `npm run start` | Run production build |
| `npm run start:dev` | Development with hot reload |
| `npm run start:debug` | Debug mode |
| `npm run start:prod` | Production mode |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run test:cov` | Test coverage report |
| `npm run db:migrate` | Run database migrations |
| `npm run db:push` | Sync schema to database |
| `npm run db:reset` | Reset database (dev only) |
| `npm run db:seed` | Populate database with seed data |
| `npm run prisma:studio` | Open database GUI |
| `npm run lint` | Run ESLint |

## 🔍 Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:** Ensure PostgreSQL is running
```bash
# macOS
brew services start postgresql

# Windows (if installed via installer)
# Start PostgreSQL from Services

# Linux
sudo systemctl start postgresql
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:** Change `PORT` in `.env` or kill the process:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/macOS
lsof -i :3000
kill -9 <PID>
```

### Prisma Client Generation Error
```
npm run build
npx prisma generate
```

### Migrations Out of Sync
```bash
npm run db:reset
npm run db:migrate
```

## 📖 Module Documentation

### 🔑 Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration (public)
- `GET /auth/profile` - Get current user (protected)
- `POST /auth/change-password` - Change password (protected)

### 📤 User Management
- `POST /users` - Create user (admin only)
- `GET /users` - List users
- `GET /users/:id` - Get user details
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### 📁 Projects
- `POST /projects` - Create project
- `GET /projects` - List projects
- `GET /projects/:id` - Get project details
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### 📂 Categories
- `POST /categories` - Create category
- `GET /categories` - List categories
- `GET /categories/:id` - Get category details
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

### ✅ Tasks
- `POST /tasks` - Create task
- `GET /tasks` - List tasks
- `GET /tasks/:id` - Get task details
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

### 💬 Conversations & Messages
- `POST /conversations` - Create conversation
- `GET /conversations` - List conversations
- `POST /conversations/:id/messages` - Send message (auto-encrypted)
- `GET /conversations/:id/messages` - Get messages (auto-decrypted)

### 👥 Users to Projects (Team Management)
- `POST /users-to-projects` - Add user to project
- `GET /users-to-projects/project/:id` - List project members
- `GET /users-to-projects/user/:id` - List user's projects
- `PUT /users-to-projects/:id` - Update user role
- `DELETE /users-to-projects/:id` - Remove user from project

## 🚀 Deployment Checklist

- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Generate secure `JWT_SECRET` and `ENCRYPTION_KEY`
- [ ] Configure PostgreSQL on remote server
- [ ] Set `DATABASE_URL` for production database
- [ ] Run `npm run build`
- [ ] Run `npm run db:migrate` (on production database)
- [ ] Set up reverse proxy (nginx/Apache)
- [ ] Configure SSL/TLS certificates
- [ ] Set up environment-based logging
- [ ] Configure automated backups
- [ ] Set up monitoring and alerting

## 📞 Support

For issues, check:
1. Database connection string in `.env`
2. PostgreSQL is running and accessible
3. Environment variables are set correctly
4. Node.js version >= 18
5. All dependencies installed: `npm install`

Good luck! 🎉

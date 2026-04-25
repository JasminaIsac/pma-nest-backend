# PMA NestJS Backend - Project Management Application API

## Descriere Proiect
REST API și WebSocket server pentru aplicația de management proiecte, dezvoltat cu NestJS, Prisma și PostgreSQL.

## Stack Tehnologic

### Core
- **NestJS** ^11.0.1
- **TypeScript** ^5.9.3
- **Node.js** (version specificată în .nvmrc dacă există)

### Database
- **Prisma ORM** ^6.19.1
- **PostgreSQL** (bază de date)
- **Prisma Client** ^6.19.1

### Authentication & Security
- **Passport** ^0.7.0
- **Passport-JWT** ^4.0.1
- **@nestjs/jwt** ^11.0.0
- **bcryptjs** ^3.0.3 (hashing parole)
- **Helmet** ^8.1.0 (HTTP headers security)
- **@nestjs/throttler** ^6.5.0 (rate limiting)

### Real-time & Communication
- **@nestjs/websockets** ^11.1.11
- **@nestjs/platform-socket.io** ^11.1.11
- **Socket.IO** (WebSocket communication)

### File Management
- **Cloudinary** ^2.8.0 (cloud storage imagini)
- **Multer** ^2.0.2 (file upload)
- **Streamifier** ^0.1.1

### API Documentation
- **@nestjs/swagger** ^11.2.0
- **Swagger UI Express** ^5.0.1

### Validation & Transformation
- **class-validator** ^0.14.2
- **class-transformer** ^0.5.1

## Structură Proiect
```
pma-nest-backend/
├── src/
│   ├── auth/           # Autentificare JWT
│   ├── users/          # User management
│   ├── projects/       # Project CRUD
│   ├── tasks/          # Task management
│   ├── websockets/     # Real-time events
│   ├── common/         # Guards, interceptors, decorators
│   └── main.ts         # Entry point
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── seed.ts         # Database seeding
├── scripts/            # Migration & utility scripts
└── test/               # E2E tests
```

## Comenzi Principale

### Development
```bash
npm run start:dev      # Dev mode cu watch
npm run start:debug    # Debug mode
npm run build          # Build production
npm run start:prod     # Run production build
```

### Database (Prisma)
```bash
npm run db:push        # Push schema la DB (dev)
npm run db:migrate     # Run migrations
npm run db:reset       # Reset database
npm run db:seed        # Seed database
npm run prisma:studio  # Prisma Studio GUI
```

### Testing & Quality
```bash
npm run test           # Unit tests
npm run test:watch     # Watch mode
npm run test:cov       # Coverage report
npm run test:e2e       # E2E tests
npm run lint           # ESLint check & fix
npm run format         # Prettier format
```

## Configurare Mediu
- Fișier: `.env`
- Exemple: `.env.example`
- Variabile necesare:
  - `DATABASE_URL` - PostgreSQL connection string
  - `JWT_SECRET` - Secret pentru JWT tokens
  - `JWT_EXPIRES_IN` - Expirare token
  - `CLOUDINARY_*` - Credențiale Cloudinary
  - `PORT` - Port server (default: 3000)

## Convenții de Cod

### Arhitectură NestJS
- Module-based architecture
- Controllers pentru HTTP endpoints
- Services pentru business logic
- Guards pentru autorizare/autentificare
- Interceptors pentru transformări
- Pipes pentru validare

### TypeScript
- Strict mode activat
- Interfețe/Types pentru toate DTOs
- Dependency Injection pentru toate serviciile
- Decoratori NestJS (@Injectable, @Controller, etc.)

### DTOs & Validation
- class-validator pentru toate input DTOs
- class-transformer pentru output transformations
- Separare: CreateDto, UpdateDto, ResponseDto
- Validare la nivel de controller cu ValidationPipe

### Database (Prisma)
- Schema în `prisma/schema.prisma`
- Relations definite explicit
- Migrations pentru production
- `db push` doar pentru development
- Seed data pentru testing

### Authentication
- JWT strategy cu Passport
- Guards: `@UseGuards(JwtAuthGuard)`
- Decoratori custom: `@CurrentUser()`
- Refresh token mechanism (dacă implementat)

### Error Handling
- Custom exceptions (BadRequestException, NotFoundException, etc.)
- Global exception filter
- Logging centralizat
- Validation errors cu detalii

## Reguli Importante

### Security Best Practices
- **NEVER** expune stack traces în production
- **NEVER** loga parole sau tokens
- **ALWAYS** hash parole cu bcrypt (min 10 rounds)
- **ALWAYS** validează și sanitizează input
- **ALWAYS** utilizează Helmet pentru headers
- **Rate limiting** pe toate endpoint-urile publice
- **CORS** configurat corespunzător
- **SQL Injection** - Prisma protejează automat

### Database
- Utilizează transactions pentru operații multiple
- Indexuri pentru câmpuri căutate frecvent
- Soft delete unde e necesar (deletedAt)
- Timestamps: createdAt, updatedAt

### Performance
- Eager/lazy loading cu Prisma (include/select)
- Pagination pentru liste mari
- Caching cu Redis (dacă implementat)
- Database connection pooling

### WebSockets
- Namespace-uri pentru diferite features
- Authentication pe WebSocket connections
- Error handling pentru events
- Cleanup pe disconnect

### API Documentation (Swagger)
- `@ApiTags()` pentru grupare endpoints
- `@ApiOperation()` pentru descrieri
- `@ApiResponse()` pentru status codes
- DTOs expuse în Swagger UI

### Testing
- Unit tests pentru services
- E2E tests pentru controllers
- Mock dependencies în tests
- Test database separată

### Git Workflow
- Branch-uri: feature/nume, fix/nume, refactor/nume
- Conventional commits
- Pull requests cu review
- CI/CD integration (dacă există)

## Endpoints Principale (Example Structure)

### Authentication
- `POST /auth/register` - Înregistrare user
- `POST /auth/login` - Login JWT
- `POST /auth/refresh` - Refresh token

### Users
- `GET /users` - Lista users (admin)
- `GET /users/:id` - Detalii user
- `PATCH /users/:id` - Update profil

### Projects
- `GET /projects` - Lista proiecte
- `POST /projects` - Creare proiect
- `GET /projects/:id` - Detalii proiect
- `PATCH /projects/:id` - Update proiect
- `DELETE /projects/:id` - Ștergere proiect

### Tasks
- `GET /projects/:projectId/tasks` - Tasks per proiect
- `POST /projects/:projectId/tasks` - Creare task
- `PATCH /tasks/:id` - Update task
- `DELETE /tasks/:id` - Ștergere task

### WebSocket Events
- `task:created` - Task nou creat
- `task:updated` - Task actualizat
- `project:updated` - Proiect actualizat

## Integrări
- **Frontend**: pma-frontend (React Native/Expo)
- **Database**: PostgreSQL
- **Cloud Storage**: Cloudinary
- **Real-time**: Socket.IO

## API Documentation
- Swagger UI: `http://localhost:3000/api` (în development)
- Auto-generated din decoratori NestJS

## Notes
- Proiect privat
- License: UNLICENSED

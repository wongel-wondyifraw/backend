# CMS Backend API

A Nest.js application with Users, Members, Ministries, JWT authentication, and role-based access control.

## Features

- **Authentication**: JWT-based authentication with email/password login
- **User Management**: CRUD operations with role-based access control
- **Member & Ministry Management**: CRUD with pagination and search
- **Notifications**: In-app notifications with SSE streaming
- **HTTP Logging**: Structured logging with Pino
- **API Documentation**: Swagger/OpenAPI at `/api/docs`
- **Database**: PostgreSQL with TypeORM
- **Validation**: Input validation with class-validator

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file with the following variables:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=your_database_name
DB_SYNCHRONIZE=true

JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=1d

PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

# Optional
ALLOW_PUBLIC_REGISTER=false
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me
```

**Production:** `JWT_SECRET` is required when `NODE_ENV=production`. The app will fail to start without it.

## Database Setup

1. Create a PostgreSQL database
2. Update the `.env` file with your database credentials
3. Set `DB_SYNCHRONIZE=true` in development to auto-create tables on startup

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Documentation

Once the application is running, visit `http://localhost:3001/api/docs` for Swagger UI. Authenticated routes require a Bearer token.

## API Endpoints

All routes are prefixed with `/api/v1`.

### Authentication

- `POST /auth/register` - Register a new user (disabled unless `ALLOW_PUBLIC_REGISTER=true`)
- `POST /auth/login` - Login and receive JWT access token

### Users

- `GET /users` - List all users (`users.read`)
- `GET /users/profile` - Get current user profile (JWT required)
- `PATCH /users/profile` - Update own profile (`settings.update`)
- `PATCH /users/change-password` - Change own password (`settings.update`)
- `POST /users` - Create user (`users.manage`)
- `PATCH /users/:id` - Update user (`users.manage`)
- `DELETE /users/:id` - Delete user (`users.manage`)
- `POST /users/:id/upload-avatar` - Upload avatar (`settings.update`)

### Members

- `GET /members` - List members with pagination (`members.read`)
- `GET /members/:id` - Get member by ID (`members.read`)
- `POST /members` - Create member (`members.create`)
- `PATCH /members/:id` - Update member (`members.update`)
- `DELETE /members/:id` - Delete member (`members.delete`)

### Access (Roles & Permissions)

- `GET /access/roles` - List roles (`roles.read`)
- `POST /access/roles` - Create role (`roles.manage`)
- `GET /access/permissions` - List permissions (`roles.read`)

## User Roles

System roles are seeded on startup:

- `admin` - Full access to all permissions
- `minister` - Manage members and ministries
- `staff` - Read-only access to members and ministries

## Security Features

- Password hashing with bcrypt
- JWT Bearer authentication (header only; query-string tokens are not supported)
- Permission-based access control
- Helmet security headers
- Input validation and sanitization
- CORS restricted to configured frontend URL
- Avatar uploads limited to JPEG/PNG/GIF/WebP (max 5 MB)

## Media storage (Cloudinary)

- `CLOUD_STORAGE=false` (default) — files go under `uploads/` and are processed with Sharp.
- `CLOUD_STORAGE=true` — uploads go to Cloudinary; the `secure_url` is stored in the DB.
  Also set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.

**Render / 512MB hosts:** set `CLOUD_STORAGE=true` and all three `CLOUDINARY_*` vars.
Sharp is optional and only loaded for local storage — leaving `CLOUD_STORAGE=false` on
Render will OOM. Also set `DB_SYNCHRONIZE=false` in production.

## Testing

```bash
npm test
```

## Development

The application includes global exception handling, structured logging, and Swagger documentation for API exploration.

# CMS Backend API

A professional Nest.js application with Users and Members management, JWT authentication, and comprehensive CRUD operations.

## Features

- **Authentication**: JWT-based authentication with email/password login
- **User Management**: CRUD operations for users with role-based access control
- **Member Management**: CRUD operations for members
- **HTTP Logging**: Request/response logging middleware
- **API Documentation**: Swagger/OpenAPI documentation
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

JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=24h

PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

## Database Setup

1. Create a PostgreSQL database
2. Update the `.env` file with your database credentials
3. The application will automatically create tables on startup (in development mode)

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## API Documentation

Once the application is running, visit `http://localhost:3001/api` to view the Swagger documentation.

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get current user profile (JWT required)

### Users

- `GET /users` - Get all users (Admin/Manager only)
- `GET /users/profile` - Get current user profile (JWT required)
- `GET /users/:id` - Get user by ID (Admin/Manager only)
- `POST /users` - Create user (Admin/Manager only)
- `PATCH /users/:id` - Update user (Admin/Manager or own profile)
- `DELETE /users/:id` - Delete user (Admin only)

### Members

- `GET /members` - Get all members (JWT required)
- `GET /members/:id` - Get member by ID (JWT required)
- `POST /members` - Create member (Admin/Manager only)
- `PATCH /members/:id` - Update member (Admin/Manager only)
- `DELETE /members/:id` - Delete member (Admin only)

## User Roles

- `admin` - Full access to all resources
- `manager` - Can manage users and members, but cannot delete users
- `user` - Can only view and update their own profile

## Data Models

### User

```typescript
{
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  password: string; // Hashed
  role: 'admin' | 'user' | 'manager';
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Member

```typescript
{
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  imageUrl?: string;
  phoneNumber?: string;
  address?: string;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  createdAt: Date;
  updatedAt: Date;
}
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- CORS configuration
- HTTP request logging

## Development

The application includes comprehensive error handling, validation, and logging. All endpoints are documented with Swagger annotations for easy API exploration.

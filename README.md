# File Management System - Backend API

A robust, scalable backend API for a multi-tenant file management system with role-based access control, real-time features, and cloud storage integration.

## Features

### Core API Functionality
- **Multi-tenant Architecture**: Organization scoped data isolation
- **Role-Based Access Control**: Hierarchical permissions
- **Secure Authentication**: JWT tokens with OTP verification via email
- **File Management**: Direct Cloudinary integration for file uploads and processing
- **Real-time Communications**: WebSocket support with Socket.io
- **Session Management**: Redis-backed sessions with PostgreSQL fallback
- **API Documentation**: Swagger/OpenAPI documentation

### Advanced Features
- **Email Notifications**: Nodemailer integration for OTP and notifications
- **Security**: Helmet.js security headers, CORS configuration
- **Validation**: Class-validator and express-validator for input validation

## Technology Stack

### Core Technologies
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT + Express Sessions
- **File Storage**: Cloudinary with Multer
- **Real-time**: Socket.io
- **Email**: Nodemailer

### Key Dependencies
- **TypeORM**: Database ORM with entity relationships
- **Class Validator**: DTO validation and transformation
- **Bcrypt**: Password hashing and verification
- **Sharp**: Image processing and optimization
- **PDF-lib**: PDF manipulation and generation
- **Archiver**: File compression and archive creation
- **Puppeteer**: PDF generation from HTML

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL database
- Redis server
- Cloudinary account
- Email service (SMTP) for OTP delivery

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd file-management-backend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

Configure the following variables:
```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
DB_URL=your_db_user

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=7d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration
GMAIL_USER=your_gmail_account
GMAIL_PASSWORD=your_gmail_app_password

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Base URL
BASE_URL=your_backend_url
```

3. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## API Documentation

### Swagger Documentation
Access the interactive API documentation at:
```
http://localhost:5000/api-docs
```
## Authentication & Authorization

### JWT Token Structure
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: 'Admin' | 'OrgAdmin' | 'Archivist' | 'User';
  organizationId?: string;
  departmentId?: string;
  iat: number;
  exp: number;
}
```

### Role Hierarchy
```
Admin (System-wide access)
├── OrgAdmin (Organization-scoped)
│   ├── Archivist (Archivist)
│   │   └── User (Limited access)
```

### Permission System
- **Folder Permissions**: `view`, `edit`, `manage`
- **Scope-based Access**: Organization and department boundaries
- **Inherited Permissions**: Department members inherit organization access
- **Permission Validation**: Middleware-enforced access control
## Security Features

### Security Middleware Stack
- **Helmet.js**: Security headers
- **CORS**: Cross-origin resource sharing configuration
- **Input Validation**: Class-validator and express-validator
- **SQL Injection Protection**: TypeORM parameterized queries
- **XSS Protection**: Input sanitization

### File Security
- **File Type Validation**: Whitelist-based file type checking
- **File Size Limits**: Configurable upload size restrictions
- **Access Control**: Permission-based file access

## Performance & Optimization

### Caching Strategy
- **Database Indexing**: Optimized database indexes
- **Connection Pooling**: PostgreSQL connection pooling
- **Query Optimization**: Efficient TypeORM queries with relations

### File Processing
- **Image Optimization**: Sharp for image processing
- **PDF Processing**: PDF-lib for document manipulation
- **Archive Creation**: Streaming archive creation with Archiver
- **Background Processing**: Async file processing (queue system ready)

## Deployment

### Production Build
```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## Development Commands

```bash
npm run dev          # Start development server with nodemon
npm run build        # Compile TypeScript to dist/
npm start           # Start production server
```

## Monitoring & Logging

### Request Logging
- **Morgan**: HTTP request logging in combined format
- **Error Tracking**: Centralized error handling and logging
- **Performance Metrics**: Request timing and response size tracking

### Health Checks
```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected',
    redis: 'connected'
  });
});
```

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation at `/api-docs`

---

Built with ⚡ using Express.js, TypeORM, and modern Node.js technologies.

echo "# Clothing Store Billing System API

A complete Node.js/Express REST API for managing a clothing store billing system with authentication, products, sales, and reporting features.

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### 1. Clone/Download the Project
```bash
# Copy the project folder to your new system
cd your-project-directory
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set up Database
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (creates SQLite database)
npx prisma db push

# Seed initial data (creates admin user)
npx prisma db seed
# or
node prisma/seed.js
```

### 4. Start the Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```
# Postgresql database watch for (see live database)
npx prisma studio  
```
### 5. Verify Server is Running
- Health Check: http://localhost:3000/health
- API Base URL: http://localhost:3000/api
- Welcome Page: http://localhost:3000/

## 🔐 Default Credentials

**Admin User (Owner Role):**
- Username: admin
- Password: admin123
- Role: OWNER

## 📋 API Endpoints

### Authentication
- POST /api/auth/login - Login (public)
- POST /api/auth/register - Register new user (requires auth + OWNER role)

### Products
- GET /api/products - List products (requires auth)
- POST /api/products - Create product (requires auth + OWNER role)
- GET /api/products/:id - Get product by ID (requires auth)
- PUT /api/products/:id - Update product (requires auth + OWNER role)
- DELETE /api/products/:id - Delete product (requires auth + OWNER role)

### Sales
- GET /api/sales - List sales (requires auth)
- POST /api/sales - Create sale (requires auth)
- GET /api/sales/:id - Get sale by ID (requires auth)

### Reports (OWNER role required)
- GET /api/reports/dashboard - Dashboard statistics
- GET /api/reports/sales - Sales reports with filtering
- GET /api/reports/top-products - Top selling products
- GET /api/reports/low-stock - Low stock products

## 🧪 Testing with Postman

1. Import the Clothing_Store_API.postman_collection.json file into Postman
2. Set up environment variables:
   - base_url: http://localhost:3000
   - jwt_token: (obtained from login response)
3. Login first to get JWT token
4. Use the token in Authorization header for protected endpoints

## 🗄️ Database

- Type: SQLite (file-based, no server required)
- File: prisma/dev.db
- ORM: Prisma
- Reset Database: npx prisma db push --force-reset

## 🔧 Environment Variables

Create a .env file in the root directory:

PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-here
FRONTEND_URL=http://localhost:3000

## 📊 Features

✅ Authentication & Authorization
✅ Product Management
✅ Sales Management
✅ Reporting & Analytics
✅ Security & Performance

## 🚨 Common Issues & Solutions

### 1. Database Connection Error
Solution: Ensure SQLite database is created:
npx prisma db push

### 2. Prisma Client Not Found
Solution: Regenerate Prisma client:
npx prisma generate

### 3. Permission Errors on Windows
Solution: Run as administrator or delete node_modules and reinstall:
rm -rf node_modules
npm install

### 4. Port Already in Use
Solution: Change port in .env file or kill existing process

## 📝 Development Commands

npm install              # Install dependencies
npm run dev              # Start development server
npm start                # Start production server
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema to database
npx prisma db seed       # Seed database with initial data
npx prisma studio        # Open Prisma Studio GUI

Happy coding! 🚀 Your clothing store billing system is ready to use!" > README.md
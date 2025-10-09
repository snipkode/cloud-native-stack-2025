# SaaS PaaS Platform API

REST API untuk platform deployment management dengan fitur real-time menggunakan Socket.IO dan Dokku CLI integration.

## Fitur Utama

- Authentication dengan JWT
- Deployment management dengan Dokku CLI
- Real-time logs menggunakan Socket.IO
- Billing system dengan Midtrans integration
- Fine-grained access control
- API Documentation dengan Swagger/OpenAPI 3.0
- **NEW**: Mock mode for fast frontend development

## Tech Stack

- Node.js (ES6 Modules)
- Express.js
- Sequelize ORM
- PostgreSQL / SQLite
- Socket.IO
- JWT Authentication
- Swagger UI

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
```

Edit `.env` dan sesuaikan dengan konfigurasi Anda.

### 3. Database Setup

Development (SQLite):
```bash
npm run migrate
npm run seed
```

Production (PostgreSQL):
```bash
NODE_ENV=production npm run migrate
```

### 4. Run Server

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

## Mock vs Real Mode

The platform supports two operational modes:

### Mock Mode (Fast Frontend Development)
Set `MOCK_MODE=true` for instant responses without actual deployments:
```bash
MOCK_MODE=true npm run dev
```

Perfect for:
- Frontend development and testing
- UI functionality verification
- API contract validation
- Fast iteration cycles

### Real Mode (Production)
Default mode with real platform integration:
```bash
NODE_ENV=production npm start
```

Supports multiple platform providers:
- Dokku (default)
- Heroku
- Vercel
- Kubernetes

Configure with environment variables:
- `PLATFORM_PROVIDER`: `dokku`, `heroku`, `vercel`, or `kubernetes`
- `MOCK_MODE`: `true` or `false`
- `PLATFORM_DOMAIN`: Your platform domain

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user baru
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/logout` - Logout user

### Deployments
- `POST /api/deployments` - Create deployment
- `GET /api/deployments` - List deployments
- `GET /api/deployments/:id` - Get deployment detail
- `POST /api/deployments/:id/restart` - Restart deployment
- `POST /api/deployments/:id/stop` - Stop deployment
- `DELETE /api/deployments/:id` - Delete deployment
- `GET /api/deployments/:id/logs` - Get deployment logs

### Test Deployments
- `POST /api/test-deployments` - Create test deployment
- `GET /api/test-deployments` - List test deployments
- `GET /api/test-deployments/:id` - Get test deployment detail
- `POST /api/test-deployments/:id/restart` - Restart test deployment
- `POST /api/test-deployments/:id/stop` - Stop test deployment
- `DELETE /api/test-deployments/:id` - Delete test deployment
- `GET /api/test-deployments/:id/logs` - Get test deployment logs

### Access Control (RBAC)
- `POST /api/access/grant` - Grant access to a resource
- `DELETE /api/access/:id` - Revoke access
- `GET /api/access` - List access grants
- `GET /api/access/check` - Check access permission

### Billing
- `POST /api/billing/topup` - Create topup transaction
- `GET /api/billing/transactions` - List transactions
- `GET /api/billing/transactions/:id` - Get transaction detail
- `POST /api/billing/webhook` - Payment webhook

### Access Control (RBAC)
- `POST /api/access/grant` - Grant access to a resource
- `DELETE /api/access/:id` - Revoke access
- `GET /api/access` - List access grants
- `GET /api/access/check` - Check access permission

#### RBAC Implementation
The platform implements Role-Based Access Control (RBAC) to manage fine-grained permissions. Each deployment endpoint checks if the authenticated user:
1. Is the owner of the deployment (automatic access)
2. Has been granted specific access to the deployment
3. Has general deployment access permissions

Available permissions include 'read', 'update', 'delete', and 'admin'. Access grants can be time-limited with expiration dates.

## Socket.IO Events

### Client to Server
- `deployment:subscribe` - Subscribe ke deployment logs
- `deployment:unsubscribe` - Unsubscribe dari deployment logs

### Server to Client
- `deployment:log` - Real-time deployment log
- `deployment:status` - Deployment status update
- `user:online` - User online notification
- `user:offline` - User offline notification

## API Documentation

Setelah server berjalan, akses dokumentasi interaktif di:
```
http://localhost:3000/api-docs
```

## Default Credentials (Seeder)

```
Email: admin@example.com
Password: password123

Email: user@example.com
Password: password123
```

## Project Structure

```
src/
├── config/
│   ├── database.js
│   ├── socket.js
│   └── swagger.js
├── controllers/
│   ├── authController.js
│   ├── deploymentController.js
│   ├── billingController.js
│   └── accessController.js
├── middleware/
│   ├── auth.js
│   ├── errorHandler.js
│   └── validateRequest.js
├── models/
│   ├── User.js
│   ├── Deployment.js
│   ├── Transaction.js
│   ├── DeploymentLog.js
│   ├── AccessGrant.js
│   └── index.js
├── routes/
│   ├── authRoutes.js
│   ├── deploymentRoutes.js
│   ├── billingRoutes.js
│   └── accessRoutes.js
├── services/
│   └── deploymentService.js
├── database/
│   ├── migrate.js
│   └── seed.js
└── server.js
```

## License

ISC
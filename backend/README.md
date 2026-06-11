# HRMS Backend

Express + Mongoose API for the HRMS Portal.

## Stack

- Node.js
- Express
- MongoDB
- Mongoose
- JWT authentication
- bcrypt password hashing
- Zod validation
- Helmet, CORS, rate limit
- Audit log middleware for important mutations

## Local Setup

Copy env:

```powershell
Copy-Item .env.example .env
```

Start MongoDB:

```powershell
docker compose up -d mongo
```

Install dependencies:

```powershell
npm.cmd install
```

Seed data:

```powershell
npm.cmd run seed
```

Run API:

```powershell
npm.cmd run dev
```

Health check:

```text
GET http://127.0.0.1:4000/api/health
```

## Demo Admin

```text
admin@hrms.local
Password123!
```

## API Surface

Auth:

```text
POST /api/auth/login
GET  /api/auth/me
```

Employees:

```text
GET    /api/employees
POST   /api/employees
GET    /api/employees/:id
PATCH  /api/employees/:id
DELETE /api/employees/:id
```

Leave:

```text
GET  /api/leave/requests
POST /api/leave/requests
POST /api/leave/requests/:id/approve
POST /api/leave/requests/:id/reject
GET  /api/leave/balances/:employeeId
```

## Permissions

The seeded admin has:

```text
employee.read
employee.create
employee.update
employee.delete
leave.read
leave.request.create
leave.approve
payroll.read
payroll.process
performance.read
performance.review
```

## Implementation Notes

- Employee delete is a soft state change to `resigned`.
- Leave approval/rejection only works while a request is `pending`.
- The frontend tries demo login automatically and falls back to mock data if the API is offline.
- `.env` is ignored by git. Do not commit real secrets.

# HRMS Portal Prototype

Static enterprise HRMS prototype based on the supplied architecture and UI references.

## Run

Open `index.html` directly in a browser, or run the local server:

```powershell
node dev-server.js
```

Then open:

```text
http://127.0.0.1:4173
```

## Backend

The backend lives in `backend/` and uses Express + Mongoose.

1. Copy env:

```powershell
Copy-Item backend\.env.example backend\.env
```

2. Start MongoDB with Docker:

```powershell
docker compose up -d mongo
```

3. Install and seed:

```powershell
cd backend
npm.cmd install
npm.cmd run seed
npm.cmd run dev
```

Backend URL:

```text
http://127.0.0.1:4000/api/health
```

Default seeded admin:

```text
admin@hrms.local
Password123!
```

## Included Screens

- Dashboard overview
- Employee registry
- Leave management desktop view
- Leave request mobile view
- Payroll management
- Performance evaluation desktop view
- Performance result mobile view
- Settings foundation for RBAC, audit, and integrations

## Next Engineering Step

Convert this prototype into a production app:

1. Move UI into React + TypeScript components.
2. Add NestJS API with PostgreSQL schema.
3. Implement Auth/RBAC, audit logs, and file uploads.
4. Replace mock arrays in `app.js` with API calls.
5. Add automated tests for permission, leave approval, payroll lock, and performance scoring.

## Full-Cycle HR Plan

Read the detailed HRMS layer and implementation roadmap:

```text
HRMS_FULL_CYCLE_PLAN.md
```

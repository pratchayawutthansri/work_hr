# HRMS Portal Architecture Plan

## Delivery Strategy

Start as a modular monolith with clear module boundaries, then extract services when traffic, team ownership, or scaling pressure requires it.

## Core Modules

- Auth and RBAC
- Employee Management
- Leave Management
- Payroll Management
- Performance Management
- Notifications
- Reports and Export
- File Storage
- Audit Logs
- Integrations

## Recommended Production Stack

- Web: React, TypeScript, Tailwind CSS, TanStack Query, React Hook Form, Zod
- Mobile: React Native with Expo, TypeScript, React Navigation
- API: NestJS, PostgreSQL, Prisma, Redis, BullMQ
- Storage: S3 or MinIO
- Observability: OpenTelemetry, Sentry, Prometheus, Grafana
- CI/CD: GitHub Actions or GitLab CI with staging approval gate

## Security Baseline

- MFA for admin and payroll roles
- Permission-based RBAC, not only role names
- Signed URLs for protected files
- Audit log for payroll, exports, leave approval, and permission changes
- Sensitive field encryption for bank account and national ID data
- PII masking in application logs

## MVP Phases

1. Foundation: auth, RBAC, layout, audit, file upload
2. Employee and Leave: employee profile, leave request, approval, balance
3. Payroll: salary records, payroll period, adjustments, payslip, export
4. Performance: KPI, competency scoring, manager review, result view
5. Reports and Hardening: exports, regression tests, security pass, staging deploy

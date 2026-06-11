# HRMS Full-Cycle Implementation Plan

## Objective

Build HRMS as an end-to-end HR operation platform covering employee master data, leave, payroll, performance, governance, reporting, and future integrations.

## Layer 1: Presentation

Current:
- Web portal with dashboard, employee, leave, payroll, performance, settings.
- Responsive direction aligned between PC and mobile.
- Login/logout, modal reports, form reveal/close, search/filter, employee photo upload.

Next:
- Dedicated employee detail page.
- Mobile employee self-service pages.
- Approval detail modals with approve/reject/comment.
- Export-ready report screens.

## Layer 2: API

Current:
- Express API.
- JWT auth.
- Employee CRUD.
- Leave request create/list/approve/reject foundation.
- Health check.

Next:
- Payroll period APIs.
- Performance review APIs.
- Report export APIs.
- File/document upload APIs.
- Notification APIs.

## Layer 3: Domain Modules

### Employee

Current:
- Employee code, name, email, phone, department, position, start date, status, photo.

Required next HR details:
- Personal profile.
- Emergency contact.
- Employment contract.
- Probation tracking.
- Document vault.
- Resignation/offboarding workflow.
- Org chart and manager assignment.

### Leave

Current:
- Request creation, type, date range, reason, status.

Required next HR details:
- Leave policy by employee type.
- Leave balance calculation.
- Holiday calendar.
- Attachment verification.
- Approval comments.
- Approval SLA and escalation.
- Manager approval and HR override.

### Payroll

Current:
- Payroll table UI and department filter.

Required next HR/Finance details:
- Payroll period.
- Salary profile.
- OT/bonus/deductions.
- Tax and social security calculation.
- Payslip generation.
- Approval gate.
- Payment lock.
- Bank export.
- Audit trail for every change.

### Performance

Current:
- KPI cards, score selection, feedback UI.

Required next HR details:
- Review cycle setup.
- KPI library.
- Weighted score calculation.
- Competency model.
- Manager review.
- HR calibration.
- Employee acknowledgement.
- Final score lock.

### Settings / Governance

Current:
- RBAC, audit, integration placeholders.

Required next admin details:
- Role editor.
- Permission matrix.
- Department/position management.
- Leave policy management.
- Notification templates.
- Integration credentials.
- Data retention policy.

## Layer 4: Data

Current MongoDB collections:
- users
- employees
- leave_requests
- leave_balances
- audit_logs

Required next collections:
- payroll_periods
- payroll_items
- salary_profiles
- performance_cycles
- performance_reviews
- employee_documents
- notifications
- integration_logs
- system_settings

## Layer 5: Security

Current:
- JWT auth.
- bcrypt passwords.
- permission middleware.
- basic audit middleware.

Required next:
- Refresh token rotation.
- MFA for admin/payroll.
- Field-level masking for salary and sensitive ID.
- Signed file URLs.
- Export logging.
- Login attempt throttling by account.
- Session management page.

## Layer 6: Reporting

Current:
- Modal report detail by module.

Required next:
- Employee report.
- Leave report.
- Payroll report.
- Performance report.
- Audit report.
- CSV/XLSX/PDF export.
- Scheduled monthly reports.

## Layer 7: Integration

Future integrations:
- ERP/SAP finance sync.
- e-Tax / Revenue.
- Social Security.
- Banking API.
- Email/LINE/Slack notification.
- SSO with Google Workspace or Azure AD.

## Senior QA Checklist

Before production:
- Login/logout works.
- Employee create/search/photo works.
- Leave create/search/filter works.
- Payroll filter works.
- All buttons either perform action or show feedback.
- Mobile portrait and landscape are usable.
- Backend health returns db connected.
- API rejects invalid input.
- Permission checks block unauthorized access.
- Audit logs are generated for important mutations.

## Recommended Delivery Phases

### Phase 1: Complete Current MVP

- Employee detail modal/page.
- Leave approval modal.
- Real leave balance update.
- Basic audit log viewer.

### Phase 2: Payroll Foundation

- Payroll models and APIs.
- Period process/approve/lock.
- Payslip view.

### Phase 3: Performance Foundation

- Performance cycle APIs.
- KPI CRUD.
- Score calculation.
- Submit/finalize review.

### Phase 4: Documents and Reports

- Employee document upload.
- Report export.
- Audit report.

### Phase 5: Enterprise Hardening

- MFA.
- SSO.
- Backup/restore.
- Observability.
- CI/CD.

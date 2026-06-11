const employees = [
  { name: "สมชาย ใจดี", role: "IT & Engineering", code: "EMP-001", initials: "สม", status: "ส่งประเมิน" },
  { name: "มานี มีตา", role: "Sales & Marketing", code: "EMP-042", initials: "M", status: "รอประเมิน" },
  { name: "พิมพรรณ ชัยยั่ง", role: "Sales & Marketing", code: "EMP-088", initials: "พพ", status: "เสร็จสิ้น" },
  { name: "วิชาญ เก่งกาจ", role: "IT & Engineering", code: "EMP-105", initials: "วช", status: "พร้อมจ่าย" }
];

const leaveRequests = [
  { employee: "สมชาย ใจดี", dept: "IT & Engineering", type: "ลาพักร้อน", date: "15 - 18 ต.ค. 2566", days: "4 วัน", reason: "พักผ่อนกับครอบครัวที่เชียงใหม่", status: "รออนุมัติ" },
  { employee: "มานี มีตา", dept: "Sales & Marketing", type: "ลาป่วย", date: "12 ต.ค. 2566", days: "1 วัน", reason: "ไข้หวัดใหญ่ มีใบรับรองแพทย์", status: "รออนุมัติ" }
];

const API_BASE_URL = "http://127.0.0.1:4000/api";
const DEMO_LOGIN = { email: "admin@hrms.local", password: "Password123!" };
let currentView = "leave";
let currentUser = null;
let loadedLeaveRequests = [];
let cachedEmployeesMapped = null;
let cachedLeaveRequestsMapped = null;
const uiState = {
  globalSearch: "",
  employeeSearch: "",
  leaveSearch: "",
  leaveDepartment: "all",
  leaveType: "all",
  payrollDepartment: "all",
  leaveMode: "list"
};

const leaveTypeMap = {
  vacation: "ลาพักร้อน",
  sick: "ลาป่วย",
  personal: "ลากิจ",
  maternity: "ลาคลอด",
  emergency: "ลากิจฉุกเฉิน"
};

const leaveStatusMap = {
  pending: "รออนุมัติ",
  approved: "อนุมัติแล้ว",
  rejected: "ไม่อนุมัติ"
};

const payrollRows = [
  { employee: "สมชาย ใจดี", code: "EMP-001", dept: "IT & Engineering", base: "85,000.00", ot: "+5,200.00", deduct: "-3,500.00", net: "86,700.00", status: "พร้อมจ่าย" },
  { employee: "สมใจ รักงาน", code: "EMP-042", dept: "HR & Admin", base: "45,000.00", ot: "0.00", deduct: "-1,500.00", net: "43,500.00", status: "พร้อมจ่าย" },
  { employee: "พิมพรรณ ชัยยั่ง", code: "EMP-088", dept: "Sales & Marketing", base: "35,000.00", ot: "+12,500.00", deduct: "-2,100.00", net: "45,400.00", status: "รออนุมัติ OT" },
  { employee: "วิชาญ เก่งกาจ", code: "EMP-105", dept: "IT & Engineering", base: "120,000.00", ot: "0.00", deduct: "-5,000.00", net: "115,000.00", status: "พร้อมจ่าย" }
];

const routes = {
  dashboard: "แดชบอร์ด",
  employees: "พนักงาน",
  leave: "Leave Management",
  payroll: "Payroll Management",
  performance: "Performance Management",
  "performance-mobile": "การประเมินผลงาน",
  settings: "การตั้งค่า"
};

const root = document.querySelector("#viewRoot");
const crumb = document.querySelector("#viewCrumb");

async function ensureApiToken() {
  const existing = localStorage.getItem("hrmsApiToken");
  if (existing) return existing;
  throw new Error("Authentication required");
}

async function apiGet(path) {
  const token = await ensureApiToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (response.status === 401) {
    localStorage.removeItem("hrmsApiToken");
    return apiGet(path);
  }
  if (!response.ok) throw new Error(`API error ${response.status}`);
  return response.json();
}

async function apiSend(path, method, body) {
  const token = await ensureApiToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  if (response.status === 401) {
    localStorage.removeItem("hrmsApiToken");
    return apiSend(path, method, body);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `API error ${response.status}`);
  return data;
}

async function loginWithCredentials(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Login failed");
  localStorage.setItem("hrmsApiToken", data.token);
  currentUser = data.user;
  return data.user;
}

function renderLogin(message = "") {
  document.body.classList.add("auth-mode");
  crumb.textContent = "Login";
  root.innerHTML = `
    <section class="login-shell">
      <form id="loginForm" class="login-card">
        <div>
          <span class="badge review">HRMS Portal</span>
          <h2>เข้าสู่ระบบ</h2>
          <p>ใช้บัญชีผู้ดูแลระบบเพื่อจัดการพนักงาน การลา และรายงาน</p>
        </div>
        <label class="form-group">
          <span>Email</span>
          <input class="input" name="email" type="email" value="${DEMO_LOGIN.email}" required />
        </label>
        <label class="form-group">
          <span>Password</span>
          <input class="input" name="password" type="password" value="${DEMO_LOGIN.password}" required />
        </label>
        <div class="entry-message" data-tone="${message ? "error" : "info"}">${message}</div>
        <button class="btn primary" type="submit">เข้าสู่ระบบ</button>
      </form>
    </section>
  `;
}

function openActionModal(title, body) {
  document.querySelector(".action-modal")?.remove();
  const modal = document.createElement("div");
  modal.className = "action-modal";
  modal.innerHTML = `
    <div class="action-dialog" role="dialog" aria-modal="true" aria-label="${title}">
      <div class="panel-head">
        <h3>${title}</h3>
        <button class="icon-button" data-action="close-modal" type="button" aria-label="ปิด">×</button>
      </div>
      <div class="action-dialog-body">${body}</div>
      <div class="entry-actions">
        <button class="btn primary" data-action="close-modal" type="button">ตกลง</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function reportContent(source, now) {
  const reports = {
    Dashboard: `
      <p><strong>Purpose:</strong> Executive HR overview for daily operation control.</p>
      <ul>
        <li>Total headcount, active employees, pending leave, payroll status, performance completion.</li>
        <li>HR action queue: approvals, payroll review, performance cycle follow-up.</li>
        <li>Next layer: drill-down cards linked to Employee, Leave, Payroll, Performance.</li>
      </ul>
      <p><strong>Owner:</strong> HR Manager / Senior Manager</p>
    `,
    Employees: `
      <p><strong>Purpose:</strong> Employee master data and employment lifecycle.</p>
      <ul>
        <li>Profile, code, department, position, contact, start date, status, and photo.</li>
        <li>Added: search, employee creation, photo upload, MongoDB persistence.</li>
        <li>Next layer: document vault, contract, emergency contact, probation, resignation workflow.</li>
      </ul>
      <p><strong>Owner:</strong> HR Admin</p>
    `,
    "Leave Management": `
      <p><strong>Purpose:</strong> Leave request, balance tracking, and approval workflow.</p>
      <ul>
        <li>Request creation, leave type, date range, reason, pending status, manager review.</li>
        <li>Added: search, department filter, leave-type filter, list/calendar feedback.</li>
        <li>Next layer: leave policy rules, holiday calendar, attachment verification, approval SLA.</li>
      </ul>
      <p><strong>Owner:</strong> HR Officer / Manager</p>
    `,
    "Leave Request": `
      <p><strong>Purpose:</strong> Review one leave request before approval/rejection.</p>
      <ul>
        <li>Employee, department, leave type, date range, total days, reason, current status.</li>
        <li>Next layer: approve/reject actions in modal, comments, attachment preview, audit trail.</li>
      </ul>
      <p><strong>Owner:</strong> Manager</p>
    `,
    Payroll: `
      <p><strong>Purpose:</strong> Payroll preparation, review, approval, and payment readiness.</p>
      <ul>
        <li>Base salary, OT/bonus, deductions, net pay, payment status.</li>
        <li>Added: department filter and processing feedback.</li>
        <li>Next layer: payroll period lock, payslip PDF, bank export, tax/social security export.</li>
      </ul>
      <p><strong>Owner:</strong> Payroll Officer / Finance</p>
    `,
    "Payroll Processing": `
      <p><strong>Purpose:</strong> Controlled payroll processing step.</p>
      <ul>
        <li>Validate employee count, salary changes, OT, deductions, and approval status.</li>
        <li>Next layer: process job queue, approval gate, final lock, bank transfer batch.</li>
      </ul>
      <p><strong>Owner:</strong> Payroll Officer</p>
    `,
    Performance: `
      <p><strong>Purpose:</strong> Performance cycle, KPI, competency, scoring, and feedback.</p>
      <ul>
        <li>Department completion, selected employee review, KPI progress, rating controls, feedback note.</li>
        <li>Next layer: review cycle setup, calibration, employee acknowledgement, final score lock.</li>
      </ul>
      <p><strong>Owner:</strong> Manager / HR Business Partner</p>
    `,
    "KPI Detail": `
      <p><strong>Purpose:</strong> KPI creation and score governance.</p>
      <ul>
        <li>Goal name, description, weight, progress, rating scale.</li>
        <li>Next layer: add/edit KPI modal, weighted score calculation, reviewer comments, approval lock.</li>
      </ul>
      <p><strong>Owner:</strong> Manager</p>
    `,
    Settings: `
      <p><strong>Purpose:</strong> Governance, permissions, audit, and integrations.</p>
      <ul>
        <li>RBAC, audit log, integration readiness for ERP/SAP, e-Tax, Social Security, Banking API.</li>
        <li>Next layer: role editor, permission matrix, notification templates, policy configuration.</li>
      </ul>
      <p><strong>Owner:</strong> System Admin / HR Admin</p>
    `,
    "Leave History": `
      <p><strong>Purpose:</strong> Employee leave history and traceability.</p>
      <ul>
        <li>Past requests, statuses, reasons, approval owner, and audit trail.</li>
        <li>Next layer: export CSV/PDF, monthly summary, employee self-service history.</li>
      </ul>
      <p><strong>Owner:</strong> HR Officer</p>
    `
  };

  return `
    <p><strong>ชื่อรายงาน:</strong> ${source}</p>
    <p><strong>ประเภท:</strong> รายงานระบบ</p>
    <p><strong>วันที่ออกรายงาน:</strong> ${now}</p>
    ${reports[source] || `<p>ข้อมูลรายงานนี้พร้อมต่อยอดดึงจาก MongoDB หลังบ้านในหัวข้อถัดไป เช่น การส่งออกไฟล์ PDF/Excel, ระบบ Drill-down, หรือ Audit log การอนุมัติ</p>`}
  `;
}

function openReportDetail(source = "รายงาน") {
  const now = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date());
  openActionModal("รายละเอียดรายงาน (Report Detail)", reportContent(source, now));
}

async function loadEmployees(forceRefresh = false) {
  if (cachedEmployeesMapped && !forceRefresh) {
    return cachedEmployeesMapped;
  }
  try {
    const response = await apiGet("/employees");
    cachedEmployeesMapped = response.data.map((employee) => ({
      id: employee._id,
      name: employee.fullName || `${employee.firstName} ${employee.lastName}`,
      role: employee.department,
      code: employee.employeeCode,
      initials: `${employee.firstName?.[0] || ""}${employee.lastName?.[0] || ""}` || "HR",
      photoDataUrl: employee.photoDataUrl,
      position: employee.position,
      status: employee.status
    }));
    return cachedEmployeesMapped;
  } catch {
    cachedEmployeesMapped = employees;
    return employees;
  }
}

async function loadLeaveRequests(forceRefresh = false) {
  if (cachedLeaveRequestsMapped && !forceRefresh) {
    return cachedLeaveRequestsMapped;
  }
  try {
    const response = await apiGet("/leave/requests");
    loadedLeaveRequests = response.data;
    cachedLeaveRequestsMapped = response.data.map((request) => {
      const employee = request.employeeId || {};
      return {
        id: request._id,
        employee: employee.fullName || `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || "ไม่ระบุชื่อ",
        dept: employee.department || "-",
        type: leaveTypeMap[request.leaveType] || request.leaveType,
        date: formatDateRange(request.startDate, request.endDate),
        days: `${request.days || request.totalDays || 0} วัน`,
        reason: request.reason,
        status: leaveStatusMap[request.status] || request.status
      };
    });
    return cachedLeaveRequestsMapped;
  } catch {
    loadedLeaveRequests = [];
    cachedLeaveRequestsMapped = leaveRequests;
    return leaveRequests;
  }
}

function formatDateRange(startDate, endDate) {
  const formatter = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" });
  return `${formatter.format(new Date(startDate))} - ${formatter.format(new Date(endDate))}`;
}

function formValues(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function setFormMessage(form, message, tone = "info") {
  const messageBox = form.querySelector(".entry-message");
  if (!messageBox) return;
  messageBox.textContent = message;
  messageBox.dataset.tone = tone;
}

function includesText(value, query) {
  return String(value || "").toLowerCase().includes(String(query || "").toLowerCase().trim());
}

function filterRows(rows, query, keys) {
  if (!query.trim()) return rows;
  return rows.filter((row) => keys.some((key) => includesText(row[key], query)));
}

function statCard(label, value, note = "", tone = "") {
  return `
    <article class="stat-card ${tone}">
      <span>${label}</span>
      <strong>${value}</strong>
      ${note ? `<p>${note}</p>` : ""}
    </article>
  `;
}

function avatar(initials, extra = "") {
  return `<div class="avatar small ${extra}" aria-hidden="true">${initials}</div>`;
}

function employeeAvatar(person) {
  if (person.photoDataUrl) {
    return `<img class="avatar small image-avatar" src="${person.photoDataUrl}" alt="" />`;
  }
  return avatar(person.initials || person.name?.[0] || "HR");
}

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      reject(new Error("กรุณาเลือกไฟล์รูปภาพเท่านั้น"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("รูปต้นฉบับต้องมีขนาดไม่เกิน 5MB"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxSize = 900;
        const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * ratio));
        canvas.height = Math.max(1, Math.round(image.height * ratio));
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.onerror = () => reject(new Error("ไฟล์รูปไม่ถูกต้อง"));
      image.src = reader.result;
    };
    reader.onerror = () => reject(new Error("อ่านไฟล์รูปไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });
}

function pageHead(title, subtitle, actions = "") {
  return `
    <section class="page-head">
      <div class="page-title">
        <h2>${title}</h2>
        <p>${subtitle}</p>
      </div>
      <div class="actions">${actions}</div>
    </section>
  `;
}

async function renderLeave() {
  const employeeRows = await loadEmployees();
  let requestRows = await loadLeaveRequests();
  requestRows = filterRows(requestRows, uiState.globalSearch || uiState.leaveSearch, ["employee", "dept", "type", "reason", "status"]);
  if (uiState.leaveDepartment !== "all") {
    requestRows = requestRows.filter((row) => row.dept === uiState.leaveDepartment);
  }
  if (uiState.leaveType !== "all") {
    requestRows = requestRows.filter((row) => row.type === uiState.leaveType);
  }
  const pendingCount = requestRows.filter((row) => row.status === "รออนุมัติ").length;
  root.innerHTML = `
    ${pageHead(
      "จัดการการลา (Leave Management)",
      "ภาพรวมและคำขอลาพักผ่อนของพนักงาน",
      `<button class="btn ghost" data-report="Leave Management" type="button">ส่งออก</button><button class="btn primary" data-action="toggle-leave-form" type="button">สร้างคำขอลา</button>`
    )}
    <section class="stats-grid desktop-only">
      ${statCard("รอการอนุมัติ (Pending)", String(pendingCount || 12), "<span class='money-negative'>+3 จากเมื่อวาน</span>", "danger")}
      ${statCard("ลาวันนี้ (Today)", "8", "พนักงาน 8 คนไม่อยู่ในออฟฟิศ")}
      ${statCard("อนุมัติเดือนนี้ (Approved)", "45", "เพิ่มขึ้น 12% จากเดือนที่แล้ว", "success")}
    </section>
    <section class="panel entry-panel is-collapsed" id="leaveEntryPanel">
      <div class="panel-head">
        <h3>สร้างคำขอลาใหม่</h3>
        <div class="panel-head-actions">
          <span class="badge review">บันทึกลง MongoDB</span>
          <button class="icon-button close-panel-button" data-action="close-leave-form" type="button" aria-label="ปิดฟอร์ม">×</button>
        </div>
      </div>
      <form id="leaveCreateForm" class="entry-form">
        <label class="form-group">
          <span>พนักงาน <span class="required">*</span></span>
          <select class="select" name="employeeId" required>
            <option value="">เลือกพนักงาน</option>
            ${employeeRows.map((person) => `<option value="${person.id}">${person.code} - ${person.name}</option>`).join("")}
          </select>
        </label>
        <label class="form-group">
          <span>ประเภทการลา <span class="required">*</span></span>
          <select class="select" name="leaveType" required>
            <option value="vacation">ลาพักร้อน</option>
            <option value="sick">ลาป่วย</option>
            <option value="personal">ลากิจ</option>
            <option value="maternity">ลาคลอด</option>
            <option value="emergency">ลากิจฉุกเฉิน</option>
          </select>
        </label>
        <label class="form-group">
          <span>วันที่เริ่มลา <span class="required">*</span></span>
          <input class="input" name="startDate" type="date" required />
        </label>
        <label class="form-group">
          <span>วันที่สิ้นสุด <span class="required">*</span></span>
          <input class="input" name="endDate" type="date" required />
        </label>
        <label class="form-group wide">
          <span>เหตุผลการลา <span class="required">*</span></span>
          <textarea class="textarea" name="reason" placeholder="ระบุเหตุผลการลา" required></textarea>
        </label>
        <div class="entry-message" id="leaveCreateMessage" aria-live="polite"></div>
        <div class="entry-actions">
          <button class="btn" type="reset">ล้างข้อมูล</button>
          <button class="btn primary" type="submit">บันทึกคำขอลา</button>
        </div>
      </form>
    </section>
    <section class="mobile-form">
      <div class="mobile-card-grid stats-grid">
        ${statCard("ลาพักร้อน", "8 / 12 วัน")}
        ${statCard("ลาป่วย", "25 / 30 วัน", "", "danger")}
        ${statCard("ลากิจ", "4 / 6 วัน")}
      </div>
      <div class="card">
        <h3>รายละเอียดการลา</h3>
        <form class="form-grid">
          <div class="form-group">
            <label for="leaveType">ประเภทการลา <span class="required">*</span></label>
            <select class="select" id="leaveType" required>
              <option>เลือกประเภทการลา</option>
              <option>ลาพักร้อน</option>
              <option>ลาป่วย</option>
              <option>ลากิจ</option>
            </select>
          </div>
          <div class="form-group">
            <label for="startDate">วันที่เริ่มลา <span class="required">*</span></label>
            <input class="input" id="startDate" type="date" required />
          </div>
          <div class="form-group">
            <label for="endDate">ถึงวันที่ <span class="required">*</span></label>
            <input class="input" id="endDate" type="date" required />
          </div>
          <div class="form-group">
            <label>ช่วงเวลา <span class="required">*</span></label>
            <div class="radio-row">
              <label><input name="period" type="radio" checked /> เต็มวัน</label>
              <label><input name="period" type="radio" /> ครึ่งเช้า</label>
              <label><input name="period" type="radio" /> ครึ่งบ่าย</label>
            </div>
          </div>
          <div class="form-group">
            <label for="reason">เหตุผลการลา <span class="required">*</span></label>
            <textarea class="textarea" id="reason" placeholder="ระบุเหตุผลการลาโดยสังเขป" required></textarea>
          </div>
          <div class="form-group">
            <label>เอกสารแนบ (ถ้ามี ใบรับรองแพทย์)</label>
            <div class="dropzone" role="button" tabindex="0">
              <div>
                <strong>แตะเพื่ออัปโหลด หรือลากไฟล์มาวางที่นี่</strong>
                <small>รองรับ PDF, JPG, PNG ขนาดไม่เกิน 5MB</small>
              </div>
            </div>
          </div>
          <div class="actions">
            <button class="btn" type="reset">ยกเลิก</button>
            <button class="btn primary" type="submit">ส่งคำร้อง</button>
          </div>
        </form>
      </div>
      <div class="card">
        <div class="panel-head">
          <h3>ประวัติการลาล่าสุด</h3>
          <button class="link-button" data-report="Leave History" type="button">ดูทั้งหมด</button>
        </div>
        <div class="history-list">
          <div class="history-item">${avatar("ล")}<div><strong>ลาพักร้อน</strong><span>15 ต.ค. - 16 ต.ค. 2566 (2 วัน)</span></div><span class="badge review">รออนุมัติ</span></div>
          <div class="history-item">${avatar("ป")}<div><strong>ลาป่วย</strong><span>2 ก.ย. 2566 (1 วัน)</span></div><span class="badge approved">อนุมัติแล้ว</span></div>
          <div class="history-item">${avatar("ก")}<div><strong>ลากิจ</strong><span>10 ส.ค. 2566 (ครึ่งเช้า)</span></div><span class="badge pending">ไม่อนุมัติ</span></div>
        </div>
      </div>
    </section>
    <section class="toolbar desktop-only" aria-label="Leave filters">
      <label class="field-inline"><span class="search-icon" aria-hidden="true"></span><input data-filter="leave-search" type="search" placeholder="ค้นหาชื่อพนักงาน..." value="${uiState.leaveSearch}" /></label>
      <label class="field-inline"><select data-filter="leave-department"><option value="all">แผนกทั้งหมด (All Dept)</option><option ${uiState.leaveDepartment === "IT & Engineering" ? "selected" : ""}>IT & Engineering</option><option ${uiState.leaveDepartment === "Sales & Marketing" ? "selected" : ""}>Sales & Marketing</option></select></label>
      <label class="field-inline"><select data-filter="leave-type"><option value="all">ประเภทการลาทั้งหมด</option><option ${uiState.leaveType === "ลาพักร้อน" ? "selected" : ""}>ลาพักร้อน</option><option ${uiState.leaveType === "ลาป่วย" ? "selected" : ""}>ลาป่วย</option><option ${uiState.leaveType === "ลากิจ" ? "selected" : ""}>ลากิจ</option></select></label>
      <div class="view-toggle"><button class="${uiState.leaveMode === "list" ? "is-active" : ""}" data-action="leave-list-mode" type="button">รายการ</button><button class="${uiState.leaveMode === "calendar" ? "is-active" : ""}" data-action="leave-calendar-mode" type="button">ปฏิทิน</button></div>
    </section>
    <section class="panel desktop-only">
      <div class="panel-head">
        <h3>รอการอนุมัติ (Pending Requests)</h3>
        <span class="badge pending">12 รายการ</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>พนักงาน</th><th>ประเภทการลา</th><th>วันที่ลา</th><th>จำนวนวัน</th><th>เหตุผล</th><th>การจัดการ</th></tr></thead>
          <tbody id="leaveRequestsTableBody">
            ${requestRows.length ? requestRows.map((row) => `
              <tr>
                <td><div class="employee-cell">${avatar(row.employee[0])}<div><strong>${row.employee}</strong><span>${row.dept}</span></div></div></td>
                <td><span class="badge review">${row.type}</span></td>
                <td>${row.date}</td>
                <td>${row.days}</td>
                <td>${row.reason}</td>
                <td><button class="link-button" data-action="inspect-leave" data-id="${row.id || ''}" type="button">ตรวจสอบ</button></td>
              </tr>`).join("") : `<tr><td colspan="6"><div class="empty-state">ไม่พบรายการที่ค้นหา</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderPayroll() {
  const filteredPayrollRows = uiState.payrollDepartment === "all"
    ? payrollRows
    : payrollRows.filter((row) => row.dept === uiState.payrollDepartment);
  root.innerHTML = `
    ${pageHead(
      "การจัดการเงินเดือน",
      "รอบการจ่าย: ตุลาคม 2566 (01/10/2023 - 31/10/2023)",
      `<button class="btn ghost" data-report="Payroll" type="button">ส่งออกรายงาน</button><button class="btn primary" data-report="Payroll Processing" type="button">ประมวลผลเงินเดือน</button>`
    )}
    <section class="stats-grid four">
      ${statCard("งบประมาณรวม (บาท)", "4,250,000", "<span class='trend'>+2.4% จากเดือนก่อน</span>")}
      ${statCard("สถานะรอบปัจจุบัน", "กำลังตรวจสอบ", "กำหนดจ่าย: 28 ต.ค. 2566")}
      ${statCard("พนักงานทั้งหมด (คน)", "142 / 145", "<div class='progress-line'><span style='width: 98%'></span></div>")}
      ${statCard("รายการหักรวม (บาท)", "320,500", "ประกันสังคม & ภาษี")}
    </section>
    <section class="panel">
      <div class="panel-head">
        <h3>รายการเงินเดือนพนักงาน</h3>
        <label class="field-inline"><select data-filter="payroll-department"><option value="all">ทุกแผนก</option><option ${uiState.payrollDepartment === "IT & Engineering" ? "selected" : ""}>IT & Engineering</option><option ${uiState.payrollDepartment === "HR & Admin" ? "selected" : ""}>HR & Admin</option><option ${uiState.payrollDepartment === "Sales & Marketing" ? "selected" : ""}>Sales & Marketing</option></select></label>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>พนักงาน</th><th>แผนก</th><th>เงินเดือนพื้นฐาน</th><th>OT / โบนัส</th><th>รายการหัก</th><th>ยอดสุทธิ</th><th>สถานะ</th></tr></thead>
          <tbody>
            ${filteredPayrollRows.length ? filteredPayrollRows.map((row) => `
              <tr>
                <td><div class="employee-cell">${avatar(row.employee.slice(0, 2))}<div><strong>${row.employee}</strong><span>${row.code}</span></div></div></td>
                <td>${row.dept}</td>
                <td>${row.base}</td>
                <td class="money-positive">${row.ot}</td>
                <td class="money-negative">${row.deduct}</td>
                <td><strong>${row.net}</strong></td>
                <td><span class="badge ${row.status.includes("รอ") ? "pending" : "review"}">${row.status}</span></td>
              </tr>`).join("") : `<tr><td colspan="7"><div class="empty-state">ไม่พบรายการเงินเดือนของแผนกนี้</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderPerformance() {
  root.innerHTML = `
    ${pageHead("ประเมินผลการปฏิบัติงาน", "รอบการประเมิน: ไตรมาส 3 / 2023 (1 ก.ค. - 30 ก.ย.)", `<button class="btn ghost" data-report="Performance" type="button">ส่งออกรายงาน</button>`)}
    <section class="performance-layout">
      <aside class="stack">
        <div class="card">
          <h3>ภาพรวมแผนก IT</h3>
          <p>ดำเนินการแล้ว <strong class="money-positive">18 / 24 คน</strong></p>
          <div class="progress-line"><span style="width: 75%"></span></div>
          <p>คะแนนเฉลี่ยแผนก <strong>4.2</strong></p>
        </div>
        <div class="card">
          <h3>รายชื่อพนักงาน</h3>
          <div class="employee-list">
            ${employees.map((person, index) => `
              <div class="employee-row ${index === 0 ? "is-active" : ""}">
                ${avatar(person.initials)}
                <div><strong>${person.name}</strong><span>${person.role}</span></div>
                <span class="badge ${person.status === "เสร็จสิ้น" ? "done" : person.status === "รอประเมิน" ? "review" : "approved"}">${person.status}</span>
              </div>`).join("")}
          </div>
        </div>
      </aside>
      <section class="stack">
        <div class="card score-card">
          <div class="photo" aria-hidden="true"></div>
          <div>
            <h3>สมชาย รักดี</h3>
            <p>Senior Frontend Developer | IT Department</p>
          </div>
          <div class="score-box"><span>Current Score</span><strong>3.8</strong>/5</div>
        </div>
        <div class="card">
          <div class="panel-head">
            <h3>เป้าหมายและ KPI (Goal Setting & Monitoring)</h3>
            <button class="link-button" data-report="KPI Detail" type="button">+ เพิ่ม KPI</button>
          </div>
          ${kpi("ส่งมอบระบบ Design System ใหม่", "ความสำเร็จจากจำนวนคอมโพเนนต์ที่นำไปใช้จริงในโปรเจกต์หลัก", 90, 40, 4)}
          ${kpi("ลด Bug ระดับ Critical ในระบบ Core", "จำนวน Bug ต้องน้อยกว่า 2 รายการต่อ Sprint", 60, 30, 3)}
        </div>
        <div class="stats-grid">
          <div class="card"><h3>สมรรถนะหลัก (Competencies)</h3><p>ความเชี่ยวชาญในงาน <strong>4.5/5</strong></p><div class="progress-line"><span style="width:90%"></span></div><p>การทำงานเป็นทีม <strong>4.0/5</strong></p><div class="progress-line"><span style="width:80%"></span></div></div>
          <div class="card"><h3>ความคิดเห็น (Feedback)</h3><textarea class="textarea" placeholder="ระบุจุดแข็งของพนักงาน..."></textarea></div>
          <div class="card"><h3>สถานะรอบประเมิน</h3><span class="badge done">พร้อมส่งผลประเมิน</span><p>ระบบจะบันทึก audit log เมื่อส่งผลประเมิน</p></div>
        </div>
      </section>
    </section>
  `;
}

function kpi(title, desc, progress, weight, selected) {
  return `
    <article class="kpi-card">
      <div class="kpi-title">
        <div><strong>${title}</strong><p>${desc}</p></div>
        <span class="badge review">น้ำหนัก ${weight}%</span>
      </div>
      <div class="progress-line"><span style="width:${progress}%"></span></div>
      <p style="text-align:right"><strong>${progress}%</strong></p>
      <div class="rating" aria-label="คะแนนประเมิน">
        ${[1, 2, 3, 4, 5].map((num) => `<button class="${num === selected ? "selected" : ""}" type="button">${num}</button>`).join("")}
      </div>
    </article>
  `;
}

function renderPerformanceMobile() {
  root.innerHTML = `
    ${pageHead("การประเมินผลงาน", "ผลการประเมินล่าสุด")}
    <section class="mobile-result">
      <div class="card">
        <div class="panel-head">
          <h3>ผลการประเมิน Q3 2023</h3>
          <span class="badge done">เสร็จสิ้น</span>
        </div>
        <p>ประเมินโดย: คุณสมชาย ใจดี (Manager)</p>
        <div class="result-ring"><strong>85</strong></div>
        <h3 style="text-align:center;color:var(--primary)">ดีมาก (Exceeds Expectations)</h3>
        <div class="card" style="background:var(--surface-soft);box-shadow:none">
          <strong>การประเมินรอบถัดไป</strong>
          <p>1 มกราคม 2024 - 15 มกราคม 2024</p>
        </div>
      </div>
      <h2>รายละเอียดคะแนน</h2>
      ${scoreDetail("ผลงานตามเป้าหมาย (KPIs)", 90, "บรรลุเป้ายอดขายเกินกำหนด 15% และปิดโปรเจกต์หลักได้ทันเวลา")}
      ${scoreDetail("การทำงานเป็นทีม (Teamwork)", 80, "ให้ความร่วมมือดี แต่สามารถเพิ่มบทบาทในการนำเสนอไอเดียในทีมได้มากขึ้น")}
      ${scoreDetail("ความเชี่ยวชาญในงาน", 86, "ส่งมอบงานคุณภาพสูงและช่วยยกระดับมาตรฐานทีม")}
    </section>
  `;
}

function scoreDetail(title, score, text) {
  return `
    <article class="card">
      <div class="kpi-title"><strong>${title}</strong><strong class="money-positive">${score}/100</strong></div>
      <div class="progress-line"><span style="width:${score}%"></span></div>
      <p>${text}</p>
    </article>
  `;
}

function renderDashboard() {
  root.innerHTML = `
    ${pageHead("แดชบอร์ด HRMS", "ภาพรวมพนักงาน การลา เงินเดือน และผลงาน", `<button class="btn primary" data-report="Dashboard" type="button">สร้างรายงาน</button>`)}
    <section class="stats-grid four">
      ${statCard("พนักงานทั้งหมด", "145", "Active 142 คน")}
      ${statCard("รออนุมัติการลา", "12", "+3 จากเมื่อวาน", "danger")}
      ${statCard("Payroll รอบนี้", "กำลังตรวจสอบ", "พร้อมจ่าย 28 ต.ค.")}
      ${statCard("ประเมินเสร็จแล้ว", "75%", "18 / 24 คน", "success")}
    </section>
    <section class="panel">
      <div class="panel-head"><h3>งานที่ต้องดำเนินการ</h3><span class="badge warning">ต้องตรวจวันนี้</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>งาน</th><th>โมดูล</th><th>ผู้รับผิดชอบ</th><th>สถานะ</th></tr></thead>
          <tbody>
            <tr><td>ตรวจคำขอลาพักร้อน 12 รายการ</td><td>Leave</td><td>Manager</td><td><span class="badge pending">รออนุมัติ</span></td></tr>
            <tr><td>ตรวจรายการ OT ก่อนปิดรอบ</td><td>Payroll</td><td>Payroll Officer</td><td><span class="badge review">กำลังตรวจสอบ</span></td></tr>
            <tr><td>ส่งแบบประเมิน Q3</td><td>Performance</td><td>HR Admin</td><td><span class="badge warning">เหลือ 6 คน</span></td></tr>
          </tbody>
        </table>
      </div>
    </section>
  `;
}

async function renderEmployees() {
  let employeeRows = await loadEmployees();
  employeeRows = filterRows(employeeRows, uiState.globalSearch || uiState.employeeSearch, ["name", "role", "code", "position", "status"]);
  root.innerHTML = `
    ${pageHead("พนักงาน", "จัดการข้อมูลพนักงาน แผนก ตำแหน่ง และเอกสาร", `<button class="btn ghost" data-report="Employees" type="button">รายงานรายละเอียด</button><button class="btn primary" data-action="toggle-employee-form" type="button">เพิ่มพนักงาน</button>`)}
    <section class="panel entry-panel is-collapsed" id="employeeEntryPanel">
      <div class="panel-head">
        <h3>เพิ่มพนักงานใหม่</h3>
        <div class="panel-head-actions">
          <span class="badge review">บันทึกลง MongoDB</span>
          <button class="icon-button close-panel-button" data-action="close-employee-form" type="button" aria-label="ปิดฟอร์ม">×</button>
        </div>
      </div>
      <form id="employeeCreateForm" class="entry-form">
        <label class="form-group photo-field">
          <span>รูปพนักงาน</span>
          <input class="input" name="photo" type="file" accept="image/*" />
          <img id="employeePhotoPreview" class="photo-preview" alt="" hidden />
          <small>รองรับ JPG, PNG, WebP ขนาดต้นฉบับไม่เกิน 5MB ระบบจะบีบอัดให้อัตโนมัติ</small>
        </label>
        <label class="form-group">
          <span>รหัสพนักงาน <span class="required">*</span></span>
          <input class="input" name="employeeCode" placeholder="EMP-106" required />
        </label>
        <label class="form-group">
          <span>ชื่อ <span class="required">*</span></span>
          <input class="input" name="firstName" placeholder="สมชาย" required />
        </label>
        <label class="form-group">
          <span>นามสกุล <span class="required">*</span></span>
          <input class="input" name="lastName" placeholder="ใจดี" required />
        </label>
        <label class="form-group">
          <span>Email <span class="required">*</span></span>
          <input class="input" name="email" type="email" placeholder="employee@hrms.local" required />
        </label>
        <label class="form-group">
          <span>เบอร์โทร</span>
          <input class="input" name="phone" placeholder="081-000-0000" />
        </label>
        <label class="form-group">
          <span>แผนก <span class="required">*</span></span>
          <select class="select" name="department" required>
            <option value="">เลือกแผนก</option>
            <option>IT & Engineering</option>
            <option>HR & Admin</option>
            <option>Sales & Marketing</option>
            <option>Finance</option>
            <option>Operations</option>
          </select>
        </label>
        <label class="form-group">
          <span>ตำแหน่ง <span class="required">*</span></span>
          <input class="input" name="position" placeholder="Backend Developer" required />
        </label>
        <label class="form-group">
          <span>วันที่เริ่มงาน <span class="required">*</span></span>
          <input class="input" name="startDate" type="date" required />
        </label>
        <div class="entry-message" id="employeeCreateMessage" aria-live="polite"></div>
        <div class="entry-actions">
          <button class="btn" type="reset">ล้างข้อมูล</button>
          <button class="btn primary" type="submit">บันทึกพนักงาน</button>
        </div>
      </form>
    </section>
    <section class="panel">
      <div class="panel-head"><h3>ทะเบียนพนักงาน</h3><label class="field-inline"><input data-filter="employee-search" type="search" placeholder="ค้นหาพนักงาน..." value="${uiState.employeeSearch}" /></label></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>พนักงาน</th><th>รหัส</th><th>แผนก</th><th>ตำแหน่ง</th><th>สถานะ</th></tr></thead>
          <tbody id="employeeTableBody">
            ${employeeRows.length ? employeeRows.map((person) => `
              <tr>
                <td><div class="employee-cell">${employeeAvatar(person)}<div><strong>${person.name}</strong><span>${person.role}</span></div></div></td>
                <td>${person.code}</td><td>${person.role}</td><td>${person.position || (person.role.includes("IT") ? "Developer" : "Officer")}</td><td><span class="badge done">${person.status || "Active"}</span></td>
              </tr>`).join("") : `<tr><td colspan="5"><div class="empty-state">ไม่พบพนักงานที่ค้นหา</div></td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderSettings() {
  root.innerHTML = `
    ${pageHead("การตั้งค่า", "กำหนดสิทธิ์ ระบบแจ้งเตือน และนโยบายองค์กร", `<button class="btn primary" data-report="Settings" type="button">ดูรายงานรายละเอียด</button>`)}
    <section class="stats-grid">
      <div class="card"><h3>RBAC</h3><p>Role-based access control พร้อม permission ราย action</p><span class="badge done">เปิดใช้งาน</span></div>
      <div class="card"><h3>Audit Log</h3><p>บันทึกการเข้าถึง payroll, leave approval และ export</p><span class="badge done">เปิดใช้งาน</span></div>
      <div class="card"><h3>Integration</h3><p>เตรียม endpoint สำหรับ ERP/SAP, e-Tax, Social Security และ Banking API</p><span class="badge review">พร้อมต่อยอด</span></div>
    </section>
  `;
}

const renderers = {
  dashboard: renderDashboard,
  employees: renderEmployees,
  leave: renderLeave,
  payroll: renderPayroll,
  performance: renderPerformance,
  "performance-mobile": renderPerformanceMobile,
  settings: renderSettings
};

async function setActive(view) {
  currentView = view;
  document.body.classList.remove("auth-mode");
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === view);
  });
  crumb.textContent = routes[view] ?? "";
  root.innerHTML = `<div class="empty-state"><p>กำลังโหลดข้อมูล...</p></div>`;
  
  // Clear caches to fetch fresh data on view switch
  cachedEmployeesMapped = null;
  cachedLeaveRequestsMapped = null;

  await renderers[view]();
  root.focus({ preventScroll: true });
}

async function bootstrap() {
  if (!localStorage.getItem("hrmsApiToken")) {
    renderLogin();
    return;
  }

  try {
    const me = await apiGet("/auth/me");
    currentUser = me.user;
    await setActive(currentView);
  } catch (error) {
    localStorage.removeItem("hrmsApiToken");
    renderLogin("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
  }
}

document.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-action]");
  if (actionButton) {
    const action = actionButton.dataset.action;
    if (action === "toggle-leave-form") {
      document.querySelector("#leaveEntryPanel")?.classList.toggle("is-collapsed");
      document.querySelector("#leaveEntryPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (action === "close-leave-form") {
      document.querySelector("#leaveEntryPanel")?.classList.add("is-collapsed");
      return;
    }
    if (action === "toggle-employee-form") {
      document.querySelector("#employeeEntryPanel")?.classList.toggle("is-collapsed");
      document.querySelector("#employeeEntryPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (action === "close-employee-form") {
      document.querySelector("#employeeEntryPanel")?.classList.add("is-collapsed");
      return;
    }
    if (action === "logout") {
      localStorage.removeItem("hrmsApiToken");
      currentUser = null;
      renderLogin();
      return;
    }
    if (action === "close-modal") {
      document.querySelector(".action-modal")?.remove();
      return;
    }
    if (action === "notifications") {
      openActionModal("การแจ้งเตือน", "<p>มีคำขอลารออนุมัติและรายการเงินเดือนที่ต้องตรวจสอบ สามารถต่อยอดเชื่อม notification collection ได้</p>");
      return;
    }
    if (action === "help") {
      openActionModal("ความช่วยเหลือ", "<p>ใช้เมนูซ้ายเพื่อสลับโมดูล กดปุ่มสร้าง/เพิ่มเพื่อเปิดฟอร์ม กดรายงานเพื่อดูรายละเอียด และใช้ช่องค้นหาเพื่อกรองข้อมูลในหน้าปัจจุบัน</p>");
      return;
    }
    if (action === "leave-list-mode") {
      uiState.leaveMode = "list";
      setActive("leave").catch(() => {});
      return;
    }
    if (action === "leave-calendar-mode") {
      uiState.leaveMode = "calendar";
      openActionModal("ปฏิทินการลา", "<p>โหมดปฏิทินพร้อมต่อยอดเป็น calendar view เต็มรูปแบบ ตอนนี้ข้อมูลรายการลาถูกกรองและอัปเดตจาก backend แล้ว</p>");
      setActive("leave").catch(() => {});
      return;
    }
    if (action === "inspect-leave") {
      const id = actionButton.dataset.id;
      if (!id) {
        openReportDetail("Leave Request");
        return;
      }
      const req = loadedLeaveRequests.find((r) => r._id === id);
      if (!req) {
        openActionModal("ข้อผิดพลาด", "<p>ไม่พบข้อมูลคำขอนี้ในระบบ</p>");
        return;
      }
      const emp = req.employeeId || {};
      const empName = emp.fullName || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "ไม่ระบุชื่อ";
      const dept = emp.department || "-";
      const dateRange = formatDateRange(req.startDate, req.endDate);
      const days = req.days || req.totalDays || 0;
      const statusText = leaveStatusMap[req.status] || req.status;
      const statusClass = req.status === "pending" ? "review" : req.status === "approved" ? "approved" : "danger";
      
      const modalBody = `
        <div class="inspect-leave-details">
          <div class="detail-row"><span>ชื่อพนักงาน:</span> <strong>${empName}</strong></div>
          <div class="detail-row"><span>แผนก:</span> <strong>${dept}</strong></div>
          <div class="detail-row"><span>ประเภทการลา:</span> <span class="badge review">${leaveTypeMap[req.leaveType] || req.leaveType}</span></div>
          <div class="detail-row"><span>วันที่ลา:</span> <strong>${dateRange}</strong></div>
          <div class="detail-row"><span>จำนวนวันลา:</span> <strong>${days} วัน</strong></div>
          <div class="detail-row"><span>เหตุผล:</span> <p>${req.reason || "-"}</p></div>
          <div class="detail-row"><span>สถานะปัจจุบัน:</span> <span class="badge ${statusClass}">${statusText}</span></div>
          
          ${req.status === 'pending' ? `
            <hr class="modal-divider" />
            <label class="form-group">
              <span>ระบุเหตุผลการปฏิเสธ (กรณีไม่อนุมัติ)</span>
              <input class="input" id="rejectReasonInput" placeholder="ระบุเหตุผลในการไม่อนุมัติคำขอ..." />
            </label>
            <div class="entry-actions" style="margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 0.75rem; padding: 0;">
              <button class="btn ghost" data-action="close-modal" type="button">ยกเลิก</button>
              <button class="btn danger" data-action="reject-request" data-id="${id}" type="button">ปฏิเสธคำขอ</button>
              <button class="btn primary" data-action="approve-request" data-id="${id}" type="button">อนุมัติคำขอ</button>
            </div>
          ` : `
            ${req.status === 'rejected' && req.rejectedReason ? `
              <div class="detail-row"><span>เหตุผลการปฏิเสธ:</span> <p style="color: var(--danger);">${req.rejectedReason}</p></div>
            ` : ''}
            <div class="entry-actions" style="margin-top: 1.5rem; display: flex; justify-content: flex-end; padding: 0;">
              <button class="btn primary" data-action="close-modal" type="button">ตกลง</button>
            </div>
          `}
        </div>
      `;
      openActionModal("ตรวจสอบรายละเอียดการลา", modalBody);
      return;
    }

    if (action === "approve-request") {
      const id = actionButton.dataset.id;
      const originalText = actionButton.textContent;
      actionButton.disabled = true;
      actionButton.textContent = "กำลังอนุมัติ...";
      
      apiSend(`/leave/requests/${id}/approve`, "POST", {})
        .then(() => {
          document.querySelector(".action-modal")?.remove();
          alert("อนุมัติคำขอลาพักผ่อนเสร็จสิ้นและปรับลดยอดวันลาสะสมใน MongoDB เรียบร้อยแล้ว");
          cachedLeaveRequestsMapped = null; // Clear cache
          return renderLeave();
        })
        .catch((err) => {
          alert(`ไม่สามารถอนุมัติได้: ${err.message}`);
          actionButton.disabled = false;
          actionButton.textContent = originalText;
        });
      return;
    }

    if (action === "reject-request") {
      const id = actionButton.dataset.id;
      const reasonInput = document.querySelector("#rejectReasonInput");
      const rejectedReason = reasonInput?.value?.trim() || "";
      
      const originalText = actionButton.textContent;
      actionButton.disabled = true;
      actionButton.textContent = "กำลังดำเนินการ...";
      
      apiSend(`/leave/requests/${id}/reject`, "POST", { rejectedReason })
        .then(() => {
          document.querySelector(".action-modal")?.remove();
          alert("ปฏิเสธคำขอลาเสร็จสิ้น");
          cachedLeaveRequestsMapped = null; // Clear cache
          return renderLeave();
        })
        .catch((err) => {
          alert(`ไม่สามารถดำเนินการได้: ${err.message}`);
          actionButton.disabled = false;
          actionButton.textContent = originalText;
        });
      return;
    }
  }

  const ratingButton = event.target.closest(".rating button");
  if (ratingButton) {
    ratingButton.parentElement.querySelectorAll("button").forEach((button) => button.classList.remove("selected"));
    ratingButton.classList.add("selected");
    openActionModal("บันทึกคะแนนชั่วคราว", `<p>เลือกคะแนน ${ratingButton.textContent}/5 แล้ว ขั้นถัดไปสามารถต่อ API performance review เพื่อบันทึกลง MongoDB ได้</p>`);
    return;
  }

  const reportButton = event.target.closest("[data-report]");
  if (reportButton) {
    openReportDetail(reportButton.dataset.report);
    return;
  }

  const button = event.target.closest("[data-view]");
  if (!button) return;
  setActive(button.dataset.view).catch(() => {});
});

async function updateFilteredEmployeesTable() {
  const tbody = document.querySelector("#employeeTableBody");
  if (!tbody) return;

  const allEmployees = await loadEmployees();
  const filtered = filterRows(allEmployees, uiState.globalSearch || uiState.employeeSearch, ["name", "role", "code", "position", "status"]);
  tbody.innerHTML = filtered.length ? filtered.map((person) => `
    <tr>
      <td><div class="employee-cell">${employeeAvatar(person)}<div><strong>${person.name}</strong><span>${person.role}</span></div></div></td>
      <td>${person.code}</td><td>${person.role}</td><td>${person.position || (person.role.includes("IT") ? "Developer" : "Officer")}</td><td><span class="badge done">${person.status || "Active"}</span></td>
    </tr>`).join("") : `<tr><td colspan="5"><div class="empty-state">ไม่พบพนักงานที่ค้นหา</div></td></tr>`;
}

async function updateFilteredLeaveTable() {
  const tbody = document.querySelector("#leaveRequestsTableBody");
  const badge = document.querySelector(".panel.desktop-only .panel-head .badge.pending");
  if (!tbody) return;

  const allRequests = await loadLeaveRequests();
  let requestRows = filterRows(allRequests, uiState.globalSearch || uiState.leaveSearch, ["employee", "dept", "type", "reason", "status"]);
  if (uiState.leaveDepartment !== "all") {
    requestRows = requestRows.filter((row) => row.dept === uiState.leaveDepartment);
  }
  if (uiState.leaveType !== "all") {
    requestRows = requestRows.filter((row) => row.type === uiState.leaveType);
  }
  const pendingCount = requestRows.filter((row) => row.status === "รออนุมัติ").length;
  if (badge) {
    badge.textContent = `${requestRows.length} รายการ`;
  }

  tbody.innerHTML = requestRows.length ? requestRows.map((row) => `
    <tr>
      <td><div class="employee-cell">${avatar(row.employee[0])}<div><strong>${row.employee}</strong><span>${row.dept}</span></div></div></td>
      <td><span class="badge review">${row.type}</span></td>
      <td>${row.date}</td>
      <td>${row.days}</td>
      <td>${row.reason}</td>
      <td><button class="link-button" data-action="inspect-leave" data-id="${row.id || ''}" type="button">ตรวจสอบ</button></td>
    </tr>`).join("") : `<tr><td colspan="6"><div class="empty-state">ไม่พบรายการที่ค้นหา</div></td></tr>`;
}

document.addEventListener("input", (event) => {
  const filterInput = event.target.closest("[data-filter='employee-search'], [data-filter='leave-search']");
  if (!filterInput) return;
  if (filterInput.dataset.filter === "employee-search") {
    uiState.employeeSearch = filterInput.value;
    updateFilteredEmployeesTable();
  }
  if (filterInput.dataset.filter === "leave-search") {
    uiState.leaveSearch = filterInput.value;
    updateFilteredLeaveTable();
  }
});

document.addEventListener("change", (event) => {
  const filter = event.target.closest("[data-filter]");
  if (!filter) return;
  if (filter.dataset.filter === "leave-department") {
    uiState.leaveDepartment = filter.value;
    updateFilteredLeaveTable();
  }
  if (filter.dataset.filter === "leave-type") {
    uiState.leaveType = filter.value;
    updateFilteredLeaveTable();
  }
  if (filter.dataset.filter === "payroll-department") {
    uiState.payrollDepartment = filter.value;
    renderPayroll();
  }
});

document.addEventListener("change", async (event) => {
  const input = event.target.closest("input[name='photo']");
  if (!input) return;
  const preview = document.querySelector("#employeePhotoPreview");
  try {
    const dataUrl = await readImageAsDataUrl(input.files?.[0]);
    if (preview && dataUrl) {
      preview.src = dataUrl;
      preview.hidden = false;
    }
  } catch (error) {
    input.value = "";
    if (preview) {
      preview.hidden = true;
      preview.removeAttribute("src");
    }
    openActionModal("เลือกรูปไม่ได้", `<p>${error.message}</p>`);
  }
});

document.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  const button = form.querySelector("button[type='submit']");
  if (!button) return;

  const original = button.textContent;
  button.disabled = true;

  try {
    if (form.id === "loginForm") {
      button.textContent = "กำลังเข้าสู่ระบบ...";
      const values = formValues(form);
      await loginWithCredentials(values.email.trim(), values.password);
      document.body.classList.remove("auth-mode");
      await setActive(currentView);
      return;
    }

    if (form.id === "employeeCreateForm") {
      button.textContent = "กำลังบันทึก...";
      const values = formValues(form);
      const photoDataUrl = await readImageAsDataUrl(form.elements.photo?.files?.[0]);
      await apiSend("/employees", "POST", {
        employeeCode: values.employeeCode.trim(),
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || undefined,
        photoDataUrl: photoDataUrl || undefined,
        department: values.department,
        position: values.position.trim(),
        startDate: values.startDate
      });
      cachedEmployeesMapped = null; // Clear cache
      await renderEmployees();
      openActionModal("บันทึกสำเร็จ", "<p>เพิ่มข้อมูลพนักงานใหม่และสร้างบัญชีผู้ใช้งานระบบลง MongoDB เรียบร้อยแล้ว</p>");
      return;
    }

    if (form.id === "leaveCreateForm") {
      button.textContent = "กำลังบันทึก...";
      const values = formValues(form);
      await apiSend("/leave/requests", "POST", {
        employeeId: values.employeeId,
        leaveType: values.leaveType,
        startDate: values.startDate,
        endDate: values.endDate,
        reason: values.reason.trim()
      });
      cachedLeaveRequestsMapped = null; // Clear cache
      await renderLeave();
      openActionModal("ส่งคำขอลาสำเร็จ", "<p>สร้างคำร้องขอลาใหม่ และบันทึกข้อมูลลงฐานข้อมูล MongoDB เรียบร้อยแล้ว</p>");
      return;
    }

    button.textContent = "ส่งคำร้องแล้ว";
  } catch (error) {
    setFormMessage(form, error.message || "บันทึกไม่สำเร็จ", "error");
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
});

bootstrap().catch(() => renderLogin("ไม่สามารถเชื่อมต่อระบบได้"));

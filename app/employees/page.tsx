"use client";

import { useEffect, useState } from "react";
import LayoutWrapper from "@/components/LayoutWrapper";
import Modal from "@/components/Modal";

interface Employee {
  id: string;
  _id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  photoDataUrl?: string;
  department: string;
  position: string;
  employmentType: string;
  startDate: string;
  status: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [employeeCode, setEmployeeCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [employmentType, setEmploymentType] = useState("full_time");
  const [startDate, setStartDate] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Modal alerts
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalBody, setModalBody] = useState("");

  const loadEmployees = async () => {
    const token = localStorage.getItem("hrmsApiToken");
    if (!token) return;
    try {
      const res = await fetch("/api/employees", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setEmployees(data.data || []);
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setModalTitle("เลือกรูปไม่ได้");
        setModalBody("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
        setModalOpen(true);
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetForm = () => {
    setEmployeeCode("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setDepartment("");
    setPosition("");
    setEmploymentType("full_time");
    setStartDate("");
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("hrmsApiToken");
    if (submitting || !token) return;

    setSubmitting(true);
    try {
      const payload: any = {
        employeeCode,
        firstName,
        lastName,
        email,
        phone: phone || undefined,
        department,
        position,
        employmentType,
        startDate,
        status: "active"
      };

      if (photoPreview) {
        payload.photoDataUrl = photoPreview;
      }

      const res = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "ไม่สามารถบันทึกข้อมูลพนักงานได้");
      }

      setModalTitle("บันทึกสำเร็จ");
      setModalBody("เพิ่มข้อมูลพนักงานใหม่และสร้างบัญชีผู้ใช้งานระบบลงฐานข้อมูลเรียบร้อยแล้ว");
      setModalOpen(true);
      handleResetForm();
      setIsFormOpen(false);
      loadEmployees();
    } catch (err: any) {
      setModalTitle("เกิดข้อผิดพลาด");
      setModalBody(err.message || "ไม่สามารถบันทึกข้อมูลได้");
      setModalOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Search filter
  const filteredEmployees = employees.filter((emp) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      emp.employeeCode.toLowerCase().includes(q) ||
      emp.firstName.toLowerCase().includes(q) ||
      emp.lastName.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.department.toLowerCase().includes(q) ||
      emp.position.toLowerCase().includes(q)
    );
  });

  return (
    <LayoutWrapper>
      <div className="page-head">
        <div className="page-title">
          <h2>พนักงาน</h2>
          <p>จัดการข้อมูลพนักงาน แผนก ตำแหน่ง และเอกสาร</p>
        </div>
        <div className="actions">
          <button className="btn ghost" type="button">รายงานรายละเอียด</button>
          <button
            className="btn primary"
            onClick={() => setIsFormOpen(!isFormOpen)}
            type="button"
          >
            {isFormOpen ? "ปิดฟอร์ม" : "เพิ่มพนักงาน"}
          </button>
        </div>
      </div>

      {/* Add Employee Form (entry-panel) */}
      <section className={`panel entry-panel ${isFormOpen ? "" : "is-collapsed"}`} id="employeeEntryPanel">
        <div className="panel-head">
          <h3>เพิ่มพนักงานใหม่</h3>
          <div className="panel-head-actions">
            <span className="badge review">บันทึกลง PostgreSQL</span>
            <button
              className="icon-button close-panel-button"
              onClick={() => setIsFormOpen(false)}
              type="button"
              aria-label="ปิดฟอร์ม"
            >
              ×
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="entry-form" id="employeeCreateForm">
          <div className="form-group photo-field">
            <span>รูปพนักงาน</span>
            <input className="input" type="file" accept="image/*" onChange={handlePhotoChange} />
            {photoPreview && (
              <img src={photoPreview} id="employeePhotoPreview" className="photo-preview" alt="Preview" style={{ marginTop: "10px" }} />
            )}
            <small style={{ display: "block", marginTop: "4px" }}>รองรับ JPG, PNG, WebP ขนาดต้นฉบับไม่เกิน 2MB</small>
          </div>

          <label className="form-group">
            <span>รหัสพนักงาน <span className="required">*</span></span>
            <input
              className="input"
              placeholder="EMP-106"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              required
            />
          </label>

          <label className="form-group">
            <span>ชื่อ <span className="required">*</span></span>
            <input
              className="input"
              placeholder="สมชาย"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </label>

          <label className="form-group">
            <span>นามสกุล <span className="required">*</span></span>
            <input
              className="input"
              placeholder="ใจดี"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </label>

          <label className="form-group">
            <span>Email <span className="required">*</span></span>
            <input
              className="input"
              type="email"
              placeholder="employee@hrms.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="form-group">
            <span>เบอร์โทร</span>
            <input
              className="input"
              placeholder="081-000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>

          <label className="form-group">
            <span>แผนก <span className="required">*</span></span>
            <select
              className="select"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
            >
              <option value="">เลือกแผนก</option>
              <option value="IT & Engineering">IT & Engineering</option>
              <option value="Sales & Marketing">Sales & Marketing</option>
              <option value="Finance & Accounting">Finance & Accounting</option>
              <option value="Human Resources">Human Resources</option>
            </select>
          </label>

          <label className="form-group">
            <span>ตำแหน่ง <span className="required">*</span></span>
            <input
              className="input"
              placeholder="Backend Developer"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              required
            />
          </label>

          <label className="form-group">
            <span>วันที่เริ่มงาน <span className="required">*</span></span>
            <input
              className="input"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </label>

          <div className="entry-actions" style={{ gridColumn: "span 4" }}>
            <button className="btn" type="button" onClick={handleResetForm}>ล้างข้อมูล</button>
            <button className="btn primary" type="submit" disabled={submitting}>
              {submitting ? "กำลังบันทึก..." : "บันทึกพนักงาน"}
            </button>
          </div>
        </form>
      </section>

      {/* Employees Table */}
      <section className="panel">
        <div className="panel-head">
          <h3>ทะเบียนพนักงาน</h3>
          <label className="field-inline" style={{ minWidth: "300px" }}>
            <input
              type="search"
              placeholder="ค้นหาพนักงาน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>พนักงาน</th>
                <th>รหัส</th>
                <th>แผนก</th>
                <th>ตำแหน่ง</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody id="employeeTableBody">
              {loading ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">กำลังโหลดข้อมูล...</div>
                  </td>
                </tr>
              ) : filteredEmployees.length ? (
                filteredEmployees.map((emp) => {
                  const initials = `${emp.firstName?.[0] || ""}${emp.lastName?.[0] || ""}`.toUpperCase() || "HR";
                  return (
                    <tr key={emp.id}>
                      <td>
                        <div className="employee-cell">
                          {emp.photoDataUrl ? (
                            <img className="avatar small image-avatar" src={emp.photoDataUrl} alt={emp.fullName} />
                          ) : (
                            <div className="avatar small" aria-hidden="true">{initials}</div>
                          )}
                          <div>
                            <strong>{emp.fullName}</strong>
                            <span>{emp.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>{emp.employeeCode}</td>
                      <td>{emp.department}</td>
                      <td>{emp.position}</td>
                      <td>
                        <span className={`badge ${emp.status === "active" ? "done" : "warning"}`}>
                          {emp.status || "active"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">ไม่พบพนักงานที่ค้นหา</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        isOpen={modalOpen}
        title={modalTitle}
        onClose={() => setModalOpen(false)}
        actions={
          <button className="btn primary" onClick={() => setModalOpen(false)}>
            ตกลง
          </button>
        }
      >
        <p>{modalBody}</p>
      </Modal>
    </LayoutWrapper>
  );
}

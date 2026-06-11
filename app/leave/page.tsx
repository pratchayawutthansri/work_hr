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
  department: string;
  position: string;
}

interface LeaveRequest {
  id: string;
  _id: string;
  employeeId: {
    id: string;
    _id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    fullName: string;
    department: string;
    position: string;
  };
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  days: number;
  reason: string;
  attachmentUrl?: string;
  status: string;
  approvedBy?: string;
  approverId?: string;
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
}

const leaveTypeMap: { [key: string]: string } = {
  vacation: "ลาพักร้อน",
  annual: "ลาพักร้อน",
  sick: "ลาป่วย",
  personal: "ลากิจ",
  maternity: "ลาคลอด",
  emergency: "ลากิจฉุกเฉิน"
};

const leaveStatusMap: { [key: string]: string } = {
  pending: "รออนุมัติ",
  approved: "อนุมัติแล้ว",
  rejected: "ไม่อนุมัติ"
};

export default function LeavePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterType, setFilterType] = useState("all");

  // Form states
  const [employeeId, setEmployeeId] = useState("");
  const [leaveType, setLeaveType] = useState("vacation");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Inspect Modal states
  const [inspectedRequest, setInspectedRequest] = useState<LeaveRequest | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [isInspectOpen, setIsInspectOpen] = useState(false);

  // Success/Alert Modal
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertBody, setAlertBody] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("hrmsApiToken") : null;

  const loadData = async () => {
    if (!token) return;
    try {
      const reqRes = await fetch("/api/leave/requests", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const reqData = await reqRes.json();
      if (reqRes.ok) {
        setRequests(reqData.data || []);
      }

      const empRes = await fetch("/api/employees", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const empData = await empRes.json();
      if (empRes.ok) {
        setEmployees(empData.data || []);
      }
    } catch (err) {
      console.error("Failed to load leave requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !token) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/leave/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId,
          leaveType,
          startDate,
          endDate,
          reason,
          attachmentUrl: attachmentUrl || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "ไม่สามารถยื่นใบลาได้");
      }

      setAlertTitle("ยื่นใบลาสำเร็จ");
      setAlertBody("ส่งคำขอลาสำเร็จเรียบร้อยแล้ว รอผู้จัดการเข้าตรวจสอบและอนุมัติ");
      setAlertOpen(true);
      setIsFormOpen(false);
      setEmployeeId("");
      setLeaveType("vacation");
      setStartDate("");
      setEndDate("");
      setReason("");
      setAttachmentUrl("");
      loadData();
    } catch (err: any) {
      setAlertTitle("เกิดข้อผิดพลาด");
      setAlertBody(err.message || "ไม่สามารถทำรายการได้");
      setAlertOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/leave/requests/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "การอนุมัติล้มเหลว");
      }
      setAlertTitle("อนุมัติสำเร็จ");
      setAlertBody("อนุมัติใบลาพนักงานและปรับลดยอดวันลาสะสมเรียบร้อยแล้ว");
      setAlertOpen(true);
      setIsInspectOpen(false);
      setInspectedRequest(null);
      loadData();
    } catch (err: any) {
      setAlertTitle("เกิดข้อผิดพลาด");
      setAlertBody(err.message || "ไม่สามารถทำรายการได้");
      setAlertOpen(true);
    }
  };

  const handleReject = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/leave/requests/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rejectedReason: rejectReasonInput })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "ปฏิเสธล้มเหลว");
      }
      setAlertTitle("ปฏิเสธสำเร็จ");
      setAlertBody("ปฏิเสธคำขอการลาเรียบร้อยแล้ว");
      setAlertOpen(true);
      setIsInspectOpen(false);
      setInspectedRequest(null);
      setRejectReasonInput("");
      loadData();
    } catch (err: any) {
      setAlertTitle("เกิดข้อผิดพลาด");
      setAlertBody(err.message || "ไม่สามารถทำรายการได้");
      setAlertOpen(true);
    }
  };

  const formatDateRange = (startStr: string, endStr: string) => {
    const formatter = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" });
    return `${formatter.format(new Date(startStr))} - ${formatter.format(new Date(endStr))}`;
  };

  // Filter logic
  const filteredRequests = requests.filter((req) => {
    // 1. Text filter (employee name)
    const q = searchTerm.toLowerCase().trim();
    const empName = req.employeeId?.fullName || `${req.employeeId?.firstName || ""} ${req.employeeId?.lastName || ""}`.trim();
    const matchesText = !q || empName.toLowerCase().includes(q) || req.reason?.toLowerCase().includes(q);

    // 2. Department filter
    const matchesDept = filterDept === "all" || req.employeeId?.department === filterDept;

    // 3. Leave Type filter
    const mappedSearchType = filterType === "all" ? "all" : filterType;
    const matchesType = mappedSearchType === "all" || req.leaveType === mappedSearchType;

    return matchesText && matchesDept && matchesType;
  });

  const pendingCount = requests.filter((r) => r.status === "pending" || r.status === "รออนุมัติ").length;

  return (
    <LayoutWrapper>
      <div className="page-head">
        <div className="page-title">
          <h2>จัดการการลา (Leave Management)</h2>
          <p>ภาพรวมและคำขอลาพักผ่อนของพนักงาน</p>
        </div>
        <div className="actions">
          <button className="btn ghost" type="button">ส่งออก</button>
          <button
            className="btn primary"
            onClick={() => setIsFormOpen(!isFormOpen)}
            type="button"
          >
            {isFormOpen ? "ปิดฟอร์ม" : "สร้างคำขอลา"}
          </button>
        </div>
      </div>

      <section className="stats-grid desktop-only">
        <article className="stat-card danger">
          <span>รอการอนุมัติ (Pending)</span>
          <strong>{pendingCount}</strong>
          <p>ต้องได้รับตรวจสอบวันนี้</p>
        </article>
        <article className="stat-card">
          <span>ลาวันนี้ (Today)</span>
          <strong>8</strong>
          <p>พนักงาน 8 คนไม่อยู่ในออฟฟิศ</p>
        </article>
        <article className="stat-card success">
          <span>อนุมัติเดือนนี้ (Approved)</span>
          <strong>45</strong>
          <p>เพิ่มขึ้น 12% จากเดือนที่แล้ว</p>
        </article>
      </section>

      {/* Add Leave Request Form */}
      <section className={`panel entry-panel ${isFormOpen ? "" : "is-collapsed"}`} id="leaveEntryPanel">
        <div className="panel-head">
          <h3>สร้างคำขอลาใหม่</h3>
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
        <form onSubmit={handleCreateRequest} className="entry-form" id="leaveCreateForm">
          <label className="form-group">
            <span>พนักงาน <span className="required">*</span></span>
            <select
              className="select"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
            >
              <option value="">เลือกพนักงาน</option>
              {employees.map((person) => {
                const name = person.fullName || `${person.firstName} ${person.lastName}`;
                return (
                  <option key={person.id} value={person.id}>
                    {person.employeeCode} - {name}
                  </option>
                );
              })}
            </select>
          </label>

          <label className="form-group">
            <span>ประเภทการลา <span className="required">*</span></span>
            <select
              className="select"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              required
            >
              <option value="vacation">ลาพักร้อน</option>
              <option value="sick">ลาป่วย</option>
              <option value="personal">ลากิจ</option>
              <option value="maternity">ลาคลอด</option>
              <option value="emergency">ลากิจฉุกเฉิน</option>
            </select>
          </label>

          <label className="form-group">
            <span>วันที่เริ่มต้น <span className="required">*</span></span>
            <input
              className="input"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </label>

          <label className="form-group">
            <span>วันที่สิ้นสุด <span className="required">*</span></span>
            <input
              className="input"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </label>

          <label className="form-group wide">
            <span>เหตุผลการลา <span className="required">*</span></span>
            <input
              className="input"
              placeholder="พักผ่อนส่วนตัว / ป่วยไข้หวัด"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </label>

          <label className="form-group wide">
            <span>ลิงก์เอกสารแนบ (ถ้ามี)</span>
            <input
              className="input"
              type="url"
              placeholder="https://drive.google.com/..."
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
            />
          </label>

          <div className="entry-actions" style={{ gridColumn: "span 4" }}>
            <button className="btn" type="button" onClick={() => { setEmployeeId(""); setReason(""); setStartDate(""); setEndDate(""); }}>ล้างข้อมูล</button>
            <button className="btn primary" type="submit" disabled={submitting}>
              {submitting ? "กำลังบันทึก..." : "ส่งใบลา"}
            </button>
          </div>
        </form>
      </section>

      {/* Toolbar Filters */}
      <section className="toolbar">
        <label className="field-inline">
          <input
            type="search"
            placeholder="ค้นหาชื่อพนักงาน..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </label>

        <label className="field-inline">
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
            <option value="all">แผนกทั้งหมด</option>
            <option value="IT & Engineering">IT & Engineering</option>
            <option value="Sales & Marketing">Sales & Marketing</option>
            <option value="Finance & Accounting">Finance & Accounting</option>
            <option value="Human Resources">Human Resources</option>
          </select>
        </label>

        <label className="field-inline">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">ประเภทการลาทั้งหมด</option>
            <option value="annual">ลาพักร้อน</option>
            <option value="sick">ลาป่วย</option>
            <option value="personal">ลากิจ</option>
            <option value="maternity">ลาคลอด</option>
            <option value="emergency">ลากิจฉุกเฉิน</option>
          </select>
        </label>

        <div className="view-toggle">
          <button className="is-active" type="button">ตาราง</button>
          <button type="button" onClick={() => {
            setAlertTitle("ปฏิทินการลา");
            setAlertBody("โหมดปฏิทินจำลอง กำลังดึงรายการกรองล่วงหน้าเพื่อเตรียมต่อยอดการแสดงผลในเฟสถัดไป");
            setAlertOpen(true);
          }}>ปฏิทิน</button>
        </div>
      </section>

      {/* Leave Requests Table */}
      <section className="panel">
        <div className="panel-head">
          <h3>รายการคำร้องขอการลา</h3>
          <span className="badge pending">{pendingCount} รายการรอตรวจ</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>พนักงาน</th>
                <th>ประเภทการลา</th>
                <th>ช่วงวันหยุด</th>
                <th>จำนวนวัน</th>
                <th>เหตุผล</th>
                <th>ดำเนินการ</th>
              </tr>
            </thead>
            <tbody id="leaveRequestsTableBody">
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">กำลังโหลดข้อมูล...</div>
                  </td>
                </tr>
              ) : filteredRequests.length ? (
                filteredRequests.map((row) => {
                  const emp = row.employeeId || {};
                  const empName = emp.fullName || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "ไม่ระบุชื่อ";
                  const dept = emp.department || "-";
                  const initials = `${emp.firstName?.[0] || ""}${emp.lastName?.[0] || ""}`.toUpperCase() || "HR";
                  
                  return (
                    <tr key={row.id}>
                      <td>
                        <div className="employee-cell">
                          <div className="avatar small">{initials}</div>
                          <div>
                            <strong>{empName}</strong>
                            <span>{dept}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge review">
                          {leaveTypeMap[row.leaveType] || row.leaveType}
                        </span>
                      </td>
                      <td>{formatDateRange(row.startDate, row.endDate)}</td>
                      <td>{row.days || row.totalDays || 0} วัน</td>
                      <td>{row.reason}</td>
                      <td>
                        <button
                          className="link-button"
                          onClick={() => {
                            setInspectedRequest(row);
                            setIsInspectOpen(true);
                          }}
                          type="button"
                        >
                          ตรวจสอบ
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">ไม่พบรายการที่ค้นหา</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Inspection Modal */}
      <Modal
        isOpen={isInspectOpen}
        title="ตรวจสอบรายละเอียดการลา"
        onClose={() => {
          setIsInspectOpen(false);
          setInspectedRequest(null);
          setRejectReasonInput("");
        }}
      >
        {inspectedRequest && (
          <div className="inspect-leave-details" style={{ display: "grid", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>ชื่อพนักงาน:</span>
              <strong>
                {inspectedRequest.employeeId?.fullName ||
                  `${inspectedRequest.employeeId?.firstName || ""} ${inspectedRequest.employeeId?.lastName || ""}`.trim()}
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>แผนก:</span>
              <strong>{inspectedRequest.employeeId?.department || "-"}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>ประเภทการลา:</span>
              <span className="badge review">{leaveTypeMap[inspectedRequest.leaveType] || inspectedRequest.leaveType}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>วันที่ลา:</span>
              <strong>{formatDateRange(inspectedRequest.startDate, inspectedRequest.endDate)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>จำนวนวันลา:</span>
              <strong>{inspectedRequest.days || inspectedRequest.totalDays || 0} วัน</strong>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span>เหตุผล:</span>
              <p style={{ margin: 0, padding: "8px", background: "var(--bg)", borderRadius: "6px" }}>
                {inspectedRequest.reason || "-"}
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>สถานะปัจจุบัน:</span>
              <span className={`badge ${
                inspectedRequest.status === "pending" || inspectedRequest.status === "รออนุมัติ"
                  ? "review"
                  : inspectedRequest.status === "approved" || inspectedRequest.status === "อนุมัติแล้ว"
                  ? "approved"
                  : "pending"
              }`}>
                {leaveStatusMap[inspectedRequest.status] || inspectedRequest.status}
              </span>
            </div>

            {(inspectedRequest.status === "pending" || inspectedRequest.status === "รออนุมัติ") ? (
              <>
                <hr style={{ margin: "16px 0", border: "0", borderTop: "1px solid var(--line)" }} />
                <label className="form-group">
                  <span>ระบุเหตุผลการปฏิเสธ (กรณีไม่อนุมัติ)</span>
                  <input
                    className="input"
                    placeholder="ระบุเหตุผลในการไม่อนุมัติคำขอ..."
                    value={rejectReasonInput}
                    onChange={(e) => setRejectReasonInput(e.target.value)}
                  />
                </label>
                <div className="entry-actions" style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end", gap: "10px", padding: 0 }}>
                  <button className="btn ghost" onClick={() => setIsInspectOpen(false)} type="button">ยกเลิก</button>
                  <button className="btn primary" style={{ background: "var(--danger)", borderColor: "var(--danger)" }} onClick={() => handleReject(inspectedRequest.id || inspectedRequest._id)} type="button">ปฏิเสธคำขอ</button>
                  <button className="btn primary" onClick={() => handleApprove(inspectedRequest.id || inspectedRequest._id)} type="button">อนุมัติคำขอ</button>
                </div>
              </>
            ) : (
              <>
                {inspectedRequest.rejectedReason && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span>เหตุผลการปฏิเสธ:</span>
                    <p style={{ margin: 0, padding: "8px", background: "var(--danger-soft)", color: "var(--danger)", borderRadius: "6px" }}>
                      {inspectedRequest.rejectedReason}
                    </p>
                  </div>
                )}
                <div className="entry-actions" style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end", padding: 0 }}>
                  <button className="btn primary" onClick={() => setIsInspectOpen(false)} type="button">ตกลง</button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Success/Error Alert Dialog */}
      <Modal
        isOpen={alertOpen}
        title={alertTitle}
        onClose={() => setAlertOpen(false)}
        actions={
          <button className="btn primary" onClick={() => setAlertOpen(false)}>
            ตกลง
          </button>
        }
      >
        <p>{alertBody}</p>
      </Modal>
    </LayoutWrapper>
  );
}

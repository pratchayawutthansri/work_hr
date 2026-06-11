"use client";

import { useState } from "react";
import LayoutWrapper from "@/components/LayoutWrapper";
import Modal from "@/components/Modal";

const payrollRows = [
  { employee: "สมชาย ใจดี", code: "EMP-001", dept: "IT & Engineering", base: "85,000.00", ot: "+5,200.00", deduct: "-3,500.00", net: "86,700.00", status: "พร้อมจ่าย" },
  { employee: "สมใจ รักงาน", code: "EMP-042", dept: "HR & Admin", base: "45,000.00", ot: "0.00", deduct: "-1,500.00", net: "43,500.00", status: "พร้อมจ่าย" },
  { employee: "พิมพรรณ ชัยยั่ง", code: "EMP-088", dept: "Sales & Marketing", base: "35,000.00", ot: "+12,500.00", deduct: "-2,100.00", net: "45,400.00", status: "รออนุมัติ OT" },
  { employee: "วิชาญ เก่งกาจ", code: "EMP-105", dept: "IT & Engineering", base: "120,000.00", ot: "0.00", deduct: "-5,000.00", net: "115,000.00", status: "พร้อมจ่าย" }
];

export default function PayrollPage() {
  const [payrollDept, setPayrollDept] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalBody, setModalBody] = useState("");

  const filteredPayrollRows = payrollDept === "all"
    ? payrollRows
    : payrollRows.filter((row) => row.dept === payrollDept);

  const handleProcessPayroll = () => {
    setModalTitle("ประมวลผลสำเร็จ");
    setModalBody("ระบบได้ส่งข้อมูลการทำจ่ายและหักบัญชีภาษีของรอบเดือน ตุลาคม 2566 เข้าสู่การตรวจสอบโดยผู้ควบคุมระบบเรียบร้อยแล้ว");
    setModalOpen(true);
  };

  return (
    <LayoutWrapper>
      <div className="page-head">
        <div className="page-title">
          <h2>การจัดการเงินเดือน</h2>
          <p>รอบการจ่าย: ตุลาคม 2566 (01/10/2023 - 31/10/2023)</p>
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={() => {
            setModalTitle("รายงานเงินเดือน");
            setModalBody("ทำการสร้างและดาวน์โหลดรายงานการจ่ายเงินเดือนสำเร็จ");
            setModalOpen(true);
          }} type="button">ส่งออกรายงาน</button>
          <button className="btn primary" onClick={handleProcessPayroll} type="button">ประมวลผลเงินเดือน</button>
        </div>
      </div>

      <section className="stats-grid four">
        <article className="stat-card">
          <span>งบประมาณรวม (บาท)</span>
          <strong>4,250,000</strong>
          <p><span className="trend">+2.4% จากเดือนก่อน</span></p>
        </article>

        <article className="stat-card">
          <span>สถานะรอบปัจจุบัน</span>
          <strong>กำลังตรวจสอบ</strong>
          <p>กำหนดจ่าย: 28 ต.ค. 2566</p>
        </article>

        <article className="stat-card">
          <span>พนักงานทั้งหมด (คน)</span>
          <strong>142 / 145</strong>
          <div className="progress-line" style={{ marginTop: "12px" }}>
            <span style={{ width: "98%" }}></span>
          </div>
        </article>

        <article className="stat-card">
          <span>รายการหักรวม (บาท)</span>
          <strong>320,500</strong>
          <p>ประกันสังคม &amp; ภาษี</p>
        </article>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>รายการเงินเดือนพนักงาน</h3>
          <label className="field-inline">
            <select value={payrollDept} onChange={(e) => setPayrollDept(e.target.value)}>
              <option value="all">ทุกแผนก</option>
              <option value="IT & Engineering">IT & Engineering</option>
              <option value="HR & Admin">HR & Admin</option>
              <option value="Sales & Marketing">Sales & Marketing</option>
            </select>
          </label>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>พนักงาน</th>
                <th>แผนก</th>
                <th>เงินเดือนพื้นฐาน</th>
                <th>OT / โบนัส</th>
                <th>รายการหัก</th>
                <th>ยอดสุทธิ</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayrollRows.length ? (
                filteredPayrollRows.map((row, index) => {
                  const initials = row.employee.slice(0, 2).toUpperCase();
                  return (
                    <tr key={index}>
                      <td>
                        <div className="employee-cell">
                          <div className="avatar small">{initials}</div>
                          <div>
                            <strong>{row.employee}</strong>
                            <span>{row.code}</span>
                          </div>
                        </div>
                      </td>
                      <td>{row.dept}</td>
                      <td>{row.base}</td>
                      <td className="money-positive">{row.ot}</td>
                      <td className="money-negative">{row.deduct}</td>
                      <td><strong>{row.net}</strong></td>
                      <td>
                        <span className={`badge ${row.status.includes("รอ") ? "pending" : "review"}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">ไม่พบรายการเงินเดือนของแผนกนี้</div>
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

"use client";

import { useEffect, useState } from "react";
import LayoutWrapper from "@/components/LayoutWrapper";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    employeesCount: 0,
    pendingLeaves: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem("hrmsApiToken");
    if (!token) return;

    async function loadDashboardData() {
      try {
        const empRes = await fetch("/api/employees", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const empData = await empRes.json();
        
        const leaveRes = await fetch("/api/leave/requests", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const leaveData = await leaveRes.json();

        const employeesCount = empData.data ? empData.data.length : 0;
        const pendingLeaves = leaveData.data ? leaveData.data.filter((r: any) => r.status === "รออนุมัติ" || r.status === "pending").length : 0;

        setStats({
          employeesCount,
          pendingLeaves,
        });
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <LayoutWrapper>
      <div className="page-head">
        <div className="page-title">
          <h2>แดชบอร์ด HRMS</h2>
          <p>ภาพรวมพนักงาน การลา เงินเดือน และผลงาน</p>
        </div>
        <div className="actions">
          <button className="btn primary" type="button">สร้างรายงาน</button>
        </div>
      </div>

      <section className="stats-grid four">
        <article className="stat-card">
          <span>พนักงานทั้งหมด</span>
          <strong>{stats.employeesCount || 4}</strong>
          <p>Active {stats.employeesCount || 4} คน</p>
        </article>

        <article className="stat-card danger">
          <span>รออนุมัติการลา</span>
          <strong>{stats.pendingLeaves}</strong>
          <p>ต้องตรวจพิจารณา</p>
        </article>

        <article className="stat-card">
          <span>Payroll รอบนี้</span>
          <strong>กำลังตรวจสอบ</strong>
          <p>พร้อมจ่ายสิ้นเดือน</p>
        </article>

        <article className="stat-card success">
          <span>ประเมินเสร็จแล้ว</span>
          <strong>75%</strong>
          <p>18 / 24 คน</p>
        </article>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>งานที่ต้องดำเนินการ</h3>
          <span className="badge warning">ต้องตรวจวันนี้</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>งาน</th>
                <th>โมดูล</th>
                <th>ผู้รับผิดชอบ</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>ตรวจคำขอลาพักร้อน {stats.pendingLeaves} รายการ</td>
                <td>Leave</td>
                <td>Manager</td>
                <td>
                  <span className={`badge ${stats.pendingLeaves > 0 ? "pending" : "done"}`}>
                    {stats.pendingLeaves > 0 ? "รออนุมัติ" : "เสร็จสิ้น"}
                  </span>
                </td>
              </tr>
              <tr>
                <td>ตรวจรายการ OT ก่อนปิดรอบ</td>
                <td>Payroll</td>
                <td>Payroll Officer</td>
                <td><span className="badge review">กำลังตรวจสอบ</span></td>
              </tr>
              <tr>
                <td>ส่งแบบประเมิน Q3</td>
                <td>Performance</td>
                <td>HR Admin</td>
                <td><span className="badge warning">เหลือ 6 คน</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </LayoutWrapper>
  );
}

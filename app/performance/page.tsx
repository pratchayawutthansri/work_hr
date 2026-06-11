"use client";

import { useState } from "react";
import LayoutWrapper from "@/components/LayoutWrapper";
import Modal from "@/components/Modal";

interface KPI {
  id: string;
  title: string;
  desc: string;
  progress: number;
  weight: number;
  rating: number;
}

interface EmployeePerformance {
  id: string;
  name: string;
  role: string;
  code: string;
  initials: string;
  status: string;
  score: number;
  kpis: KPI[];
  competencyWork: number;
  competencyTeam: number;
  feedback: string;
}

const initialEmployees: EmployeePerformance[] = [
  {
    id: "EMP-001",
    name: "สมชาย ใจดี",
    role: "Senior Frontend Developer | IT Department",
    code: "EMP-001",
    initials: "สม",
    status: "ส่งประเมิน",
    score: 3.8,
    kpis: [
      { id: "1", title: "ส่งมอบระบบ Design System ใหม่", desc: "ความสำเร็จจากจำนวนคอมโพเนนต์ที่นำไปใช้จริงในโปรเจกต์หลัก", progress: 90, weight: 40, rating: 4 },
      { id: "2", title: "ลด Bug ระดับ Critical ในระบบ Core", desc: "จำนวน Bug ต้องน้อยกว่า 2 รายการต่อ Sprint", progress: 60, weight: 30, rating: 3 }
    ],
    competencyWork: 90,
    competencyTeam: 80,
    feedback: "ทำงานได้ดีเยี่ยม มีภาวะผู้นำในการพัฒนาเทคโนโลยีใหม่ๆ ขององค์กร"
  },
  {
    id: "EMP-042",
    name: "มานี มีตา",
    role: "Sales & Marketing",
    code: "EMP-042",
    initials: "M",
    status: "รอประเมิน",
    score: 3.0,
    kpis: [
      { id: "1", title: "เพิ่มยอดขายไตรมาส 3", desc: "ขยายฐานลูกค้าในกลุ่มธุรกิจ SME", progress: 75, weight: 50, rating: 3 },
      { id: "2", title: "ประสานงานพาร์ทเนอร์ใหม่", desc: "สร้างการเป็นพันธมิตรอย่างน้อย 3 ราย", progress: 80, weight: 50, rating: 3 }
    ],
    competencyWork: 75,
    competencyTeam: 85,
    feedback: "มีความมุ่งมั่นในการขาย แต่อยากให้เน้นด้านเอกสารเพิ่มเติม"
  },
  {
    id: "EMP-088",
    name: "พิมพรรณ ชัยยั่ง",
    role: "Sales & Marketing",
    code: "EMP-088",
    initials: "พพ",
    status: "เสร็จสิ้น",
    score: 4.5,
    kpis: [
      { id: "1", title: "จัดแคมเปญการตลาดหลัก", desc: "แคมเปญส่งเสริมการขายประจำปี", progress: 95, weight: 60, rating: 5 },
      { id: "2", title: "ควบคุมงบประมาณแคมเปญ", desc: "ใช้งบประมาณต่ำกว่าเกณฑ์ 10%", progress: 90, weight: 40, rating: 4 }
    ],
    competencyWork: 95,
    competencyTeam: 90,
    feedback: "บริหารแคมเปญได้อย่างมีประสิทธิภาพสูงสุด บรรลุเป้าหมายองค์กรอย่างโดดเด่น"
  },
  {
    id: "EMP-105",
    name: "วิชาญ เก่งกาจ",
    role: "IT & Engineering",
    code: "EMP-105",
    initials: "วช",
    status: "พร้อมจ่าย", // Legacy status map
    score: 4.0,
    kpis: [
      { id: "1", title: "ปรับปรุงฐานข้อมูลให้เสถียร", desc: "ลดความหน่วงของการคิวรีลง 20%", progress: 85, weight: 50, rating: 4 },
      { id: "2", title: "พัฒนาระบบความปลอดภัย", desc: "ติดตั้งระบบสแกนสิทธิ์และ RBAC", progress: 90, weight: 50, rating: 4 }
    ],
    competencyWork: 85,
    competencyTeam: 80,
    feedback: "ทำงานเป็นระบบ มีทักษะด้านโครงสร้างพื้นฐานฐานข้อมูลที่ดีเยี่ยม"
  }
];

export default function PerformancePage() {
  const [employees, setEmployees] = useState<EmployeePerformance[]>(initialEmployees);
  const [selectedEmpId, setSelectedEmpId] = useState<string>("EMP-001");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalBody, setModalBody] = useState("");

  // Add KPI Modal state
  const [addKpiOpen, setAddKpiOpen] = useState(false);
  const [newKpiTitle, setNewKpiTitle] = useState("");
  const [newKpiDesc, setNewKpiDesc] = useState("");
  const [newKpiWeight, setNewKpiWeight] = useState<number>(30);
  const [newKpiProgress, setNewKpiProgress] = useState<number>(70);

  const selectedEmployee = employees.find((emp) => emp.id === selectedEmpId) || employees[0];

  const updateRating = (kpiId: string, rating: number) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id !== selectedEmpId) return emp;
        const updatedKpis = emp.kpis.map((kpi) => {
          if (kpi.id === kpiId) {
            return { ...kpi, rating };
          }
          return kpi;
        });

        // Recalculate average score
        const totalWeight = updatedKpis.reduce((acc, k) => acc + k.weight, 0);
        let newScore = 0;
        if (totalWeight > 0) {
          const weightedSum = updatedKpis.reduce((acc, k) => acc + k.rating * k.weight, 0);
          newScore = parseFloat((weightedSum / totalWeight).toFixed(1));
        } else {
          newScore = parseFloat((updatedKpis.reduce((acc, k) => acc + k.rating, 0) / updatedKpis.length).toFixed(1));
        }

        return { ...emp, kpis: updatedKpis, score: newScore };
      })
    );
  };

  const updateFeedback = (text: string) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === selectedEmpId ? { ...emp, feedback: text } : emp))
    );
  };

  const submitPerformance = () => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === selectedEmpId ? { ...emp, status: "เสร็จสิ้น" } : emp))
    );
    setModalTitle("ส่งผลประเมินสำเร็จ");
    setModalBody(`บันทึกผลการประเมินของ ${selectedEmployee.name} สำเร็จและสร้าง Audit Log เรียบร้อยแล้ว`);
    setModalOpen(true);
  };

  const handleAddKpi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKpiTitle.trim()) return;

    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id !== selectedEmpId) return emp;
        const newKpi: KPI = {
          id: Date.now().toString(),
          title: newKpiTitle,
          desc: newKpiDesc,
          progress: newKpiProgress,
          weight: newKpiWeight,
          rating: 3 // default middle rating
        };
        const updatedKpis = [...emp.kpis, newKpi];

        // Recalculate average score
        const totalWeight = updatedKpis.reduce((acc, k) => acc + k.weight, 0);
        const weightedSum = updatedKpis.reduce((acc, k) => acc + k.rating * k.weight, 0);
        const newScore = parseFloat((weightedSum / totalWeight).toFixed(1));

        return { ...emp, kpis: updatedKpis, score: newScore };
      })
    );

    // Reset fields & close
    setNewKpiTitle("");
    setNewKpiDesc("");
    setNewKpiWeight(30);
    setNewKpiProgress(70);
    setAddKpiOpen(false);

    setModalTitle("เพิ่มเป้าหมายสำเร็จ");
    setModalBody(`เพิ่มเป้าหมาย KPI ใหม่ให้กับ ${selectedEmployee.name} เรียบร้อยแล้ว`);
    setModalOpen(true);
  };

  return (
    <LayoutWrapper>
      <div className="page-head">
        <div className="page-title">
          <h2>ประเมินผลการปฏิบัติงาน</h2>
          <p>รอบการประเมิน: ไตรมาส 3 / 2023 (1 ก.ค. - 30 ก.ย.)</p>
        </div>
        <div className="actions">
          <button
            className="btn ghost"
            onClick={() => {
              setModalTitle("ส่งออกรายงานการประเมินผล");
              setModalBody(`ทำการรวบรวมและสร้างไฟล์รายงานผลประเมินของ ${selectedEmployee.name} เรียบร้อยแล้ว`);
              setModalOpen(true);
            }}
            type="button"
          >
            ส่งออกรายงาน
          </button>
        </div>
      </div>

      <section className="performance-layout">
        {/* Sidebar */}
        <aside className="stack">
          <div className="card">
            <h3>ภาพรวมแผนก IT</h3>
            <p>ดำเนินการแล้ว <strong className="money-positive">18 / 24 คน</strong></p>
            <div className="progress-line">
              <span style={{ width: "75%" }}></span>
            </div>
            <p style={{ marginTop: "12px" }}>คะแนนเฉลี่ยแผนก <strong>4.2</strong></p>
          </div>

          <div className="card">
            <h3>รายชื่อพนักงาน</h3>
            <div className="employee-list" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {employees.map((person) => (
                <div
                  key={person.id}
                  onClick={() => setSelectedEmpId(person.id)}
                  style={{ cursor: "pointer" }}
                  className={`employee-row ${person.id === selectedEmpId ? "is-active" : ""}`}
                >
                  <div className="avatar small">{person.initials}</div>
                  <div>
                    <strong>{person.name}</strong>
                    <span>{person.code}</span>
                  </div>
                  <span
                    className={`badge ${
                      person.status === "เสร็จสิ้น"
                        ? "done"
                        : person.status === "รอประเมิน"
                        ? "review"
                        : "approved"
                    }`}
                  >
                    {person.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Content Details */}
        <section className="stack">
          {/* Employee Header Info */}
          <div className="card score-card">
            <div className="photo" aria-hidden="true"></div>
            <div>
              <h3>{selectedEmployee.name}</h3>
              <p>{selectedEmployee.role}</p>
            </div>
            <div className="score-box">
              <span>Current Score</span>
              <strong>{selectedEmployee.score}</strong>/5
            </div>
          </div>

          {/* Goals & KPIs */}
          <div className="card">
            <div className="panel-head">
              <h3>เป้าหมายและ KPI (Goal Setting & Monitoring)</h3>
              <button
                className="link-button"
                onClick={() => setAddKpiOpen(true)}
                type="button"
                style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: "bold", cursor: "pointer" }}
              >
                + เพิ่ม KPI
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "18px" }}>
              {selectedEmployee.kpis.map((k) => (
                <article key={k.id} className="kpi-card" style={{ border: "1px solid var(--line)", padding: "16px", borderRadius: "var(--radius)" }}>
                  <div className="kpi-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <strong style={{ fontSize: "16px" }}>{k.title}</strong>
                      <p style={{ margin: "4px 0 12px", color: "var(--muted)", fontSize: "14px" }}>{k.desc}</p>
                    </div>
                    <span className="badge review">น้ำหนัก {k.weight}%</span>
                  </div>
                  <div className="progress-line">
                    <span style={{ width: `${k.progress}%` }}></span>
                  </div>
                  <p style={{ textAlign: "right", margin: "6px 0 12px" }}>
                    <strong>{k.progress}%</strong>
                  </p>
                  <div className="rating" aria-label="คะแนนประเมิน">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        className={num === k.rating ? "selected" : ""}
                        onClick={() => updateRating(k.id, num)}
                        type="button"
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Lower Stats Grid */}
          <div className="stats-grid">
            {/* Competencies */}
            <div className="card">
              <h3>สมรรถนะหลัก (Competencies)</h3>
              <p style={{ margin: "0 0 8px" }}>ความเชี่ยวชาญในงาน <strong>{selectedEmployee.competencyWork / 20}/5</strong></p>
              <div className="progress-line" style={{ marginBottom: "16px" }}>
                <span style={{ width: `${selectedEmployee.competencyWork}%` }}></span>
              </div>
              <p style={{ margin: "0 0 8px" }}>การทำงานเป็นทีม <strong>{selectedEmployee.competencyTeam / 20}/5</strong></p>
              <div className="progress-line">
                <span style={{ width: `${selectedEmployee.competencyTeam}%` }}></span>
              </div>
            </div>

            {/* Feedback */}
            <div className="card" style={{ display: "flex", flexDirection: "column" }}>
              <h3>ความคิดเห็น (Feedback)</h3>
              <textarea
                className="textarea"
                value={selectedEmployee.feedback}
                onChange={(e) => updateFeedback(e.target.value)}
                placeholder="ระบุจุดแข็งของพนักงาน..."
                style={{ flex: 1, minHeight: "100px", padding: "12px", borderRadius: "var(--radius)", border: "1px solid var(--line)", background: "var(--surface-soft)", color: "inherit" }}
              ></textarea>
            </div>

            {/* Assessment Status */}
            <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <h3>สถานะรอบประเมิน</h3>
                <span className={`badge ${selectedEmployee.status === "เสร็จสิ้น" ? "done" : "pending"}`}>
                  {selectedEmployee.status === "เสร็จสิ้น" ? "ประเมินเสร็จสิ้นแล้ว" : "พร้อมส่งผลประเมิน"}
                </span>
                <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "12px" }}>
                  ระบบจะบันทึก audit log เมื่อส่งผลประเมินเรียบร้อยแล้ว
                </p>
              </div>
              {selectedEmployee.status !== "เสร็จสิ้น" && (
                <button className="btn primary" onClick={submitPerformance} type="button" style={{ marginTop: "16px", width: "100%" }}>
                  ส่งผลประเมิน
                </button>
              )}
            </div>
          </div>
        </section>
      </section>

      {/* Main Info Modal */}
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

      {/* Add KPI Modal */}
      <Modal
        isOpen={addKpiOpen}
        title="เพิ่มเป้าหมาย KPI ใหม่"
        onClose={() => setAddKpiOpen(false)}
        actions={
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button className="btn ghost" onClick={() => setAddKpiOpen(false)} type="button">
              ยกเลิก
            </button>
            <button className="btn primary" onClick={handleAddKpi} type="submit">
              บันทึกเป้าหมาย
            </button>
          </div>
        }
      >
        <form onSubmit={handleAddKpi} className="entry-form" style={{ display: "grid", gap: "16px", gridTemplateColumns: "1fr" }}>
          <label className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontWeight: "bold" }}>หัวข้อเป้าหมาย <span className="required" style={{ color: "var(--primary)" }}>*</span></span>
            <input
              className="input"
              value={newKpiTitle}
              onChange={(e) => setNewKpiTitle(e.target.value)}
              placeholder="เช่น ส่งมอบแอปพลิเคชันเวอร์ชันเบต้า"
              required
              style={{ padding: "10px", borderRadius: "var(--radius)", border: "1px solid var(--line)" }}
            />
          </label>

          <label className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontWeight: "bold" }}>รายละเอียดเชิงอธิบาย</span>
            <input
              className="input"
              value={newKpiDesc}
              onChange={(e) => setNewKpiDesc(e.target.value)}
              placeholder="เช่น การทดสอบเสร็จสมบูรณ์ 100% ไม่มีข้อผิดพลาดที่สำคัญ"
              style={{ padding: "10px", borderRadius: "var(--radius)", border: "1px solid var(--line)" }}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <label className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontWeight: "bold" }}>ค่าน้ำหนัก (%)</span>
              <input
                className="input"
                type="number"
                min="1"
                max="100"
                value={newKpiWeight}
                onChange={(e) => setNewKpiWeight(parseInt(e.target.value) || 0)}
                required
                style={{ padding: "10px", borderRadius: "var(--radius)", border: "1px solid var(--line)" }}
              />
            </label>

            <label className="form-group" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontWeight: "bold" }}>ความคืบหน้า (%)</span>
              <input
                className="input"
                type="number"
                min="0"
                max="100"
                value={newKpiProgress}
                onChange={(e) => setNewKpiProgress(parseInt(e.target.value) || 0)}
                required
                style={{ padding: "10px", borderRadius: "var(--radius)", border: "1px solid var(--line)" }}
              />
            </label>
          </div>
        </form>
      </Modal>
    </LayoutWrapper>
  );
}

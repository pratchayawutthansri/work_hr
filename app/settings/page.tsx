"use client";

import { useState } from "react";
import LayoutWrapper from "@/components/LayoutWrapper";
import Modal from "@/components/Modal";

export default function SettingsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalBody, setModalBody] = useState("");

  const handleCardClick = (title: string, desc: string, statusText: string) => {
    setModalTitle(title);
    setModalBody(
      `รายละเอียดค่าคุณสมบัติ: ${desc}\nสถานะปัจจุบัน: ${statusText}\nระบบได้รับการปกป้องและควบคุมการทำงานภายใต้นโยบายความปลอดภัยและเกณฑ์มาตรฐานขององค์กรอย่างสมบูรณ์`
    );
    setModalOpen(true);
  };

  return (
    <LayoutWrapper>
      <div className="page-head">
        <div className="page-title">
          <h2>การตั้งค่า</h2>
          <p>กำหนดสิทธิ์ ระบบแจ้งเตือน และนโยบายองค์กร</p>
        </div>
        <div className="actions">
          <button
            className="btn primary"
            onClick={() => {
              setModalTitle("รายงานรายละเอียดการตั้งค่าระบบ");
              setModalBody(
                "สรุปการตั้งค่าระบบความปลอดภัยในปัจจุบัน:\n\n1. ระบบควบคุมการเข้าถึง (RBAC): เปิดใช้งานแบบ 256-bit encryption\n2. ประวัติการตรวจสอบ (Audit Log): ทำการบันทึกทุกคำขอลงฐานข้อมูล SQL\n3. โครงสร้างเชื่อมต่อ (Integration): พร้อมใช้งาน 4 endpoints รองรับ ERP และ Payroll Outsource"
              );
              setModalOpen(true);
            }}
            type="button"
          >
            ดูรายงานรายละเอียด
          </button>
        </div>
      </div>

      <section className="stats-grid">
        <div
          className="card"
          onClick={() =>
            handleCardClick(
              "ระบบควบคุมสิทธิ์ตามหน้าที่ (RBAC)",
              "Role-based access control พร้อมระบบสแกนสิทธิ์ในแต่ละส่วนของการลา การอนุมัติ และฝ่ายบุคคล",
              "เปิดใช้งาน"
            )
          }
          style={{ cursor: "pointer" }}
        >
          <h3>RBAC</h3>
          <p>Role-based access control พร้อม permission ราย action</p>
          <span className="badge done">เปิดใช้งาน</span>
        </div>

        <div
          className="card"
          onClick={() =>
            handleCardClick(
              "ระบบประวัติประเมินผลและการตรวจสอบ (Audit Log)",
              "บันทึกข้อมูลและคำขอการเข้าถึง ประมวลผลเงินเดือน ใบอนุมัติการลาพักร้อนและระบบส่งออกรายงาน เพื่อตรวจสอบย้อนหลัง",
              "เปิดใช้งาน"
            )
          }
          style={{ cursor: "pointer" }}
        >
          <h3>Audit Log</h3>
          <p>บันทึกการเข้าถึง payroll, leave approval และ export</p>
          <span className="badge done">เปิดใช้งาน</span>
        </div>

        <div
          className="card"
          onClick={() =>
            handleCardClick(
              "การเชื่อมต่อระบบภายนอก (Integration API)",
              "จัดเตรียม Webhooks และ API endpoints สำหรับระบบ SAP/ERP, e-Tax กรมสรรพากร, ประกันสังคม และ API ธนาคารเพื่อการทำจ่ายเงินเดือนแบบอัตโนมัติ",
              "พร้อมต่อยอด"
            )
          }
          style={{ cursor: "pointer" }}
        >
          <h3>Integration</h3>
          <p>เตรียม endpoint สำหรับ ERP/SAP, e-Tax, Social Security และ Banking API</p>
          <span className="badge review">พร้อมต่อยอด</span>
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
        <p style={{ whiteSpace: "pre-line" }}>{modalBody}</p>
      </Modal>
    </LayoutWrapper>
  );
}

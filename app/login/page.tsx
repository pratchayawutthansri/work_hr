"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // If already logged in, redirect to dashboard
    const token = localStorage.getItem("hrmsApiToken");
    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "การเข้าสู่ระบบล้มเหลว");
      }

      localStorage.setItem("hrmsApiToken", data.token);
      router.replace("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
      setModalOpen(true);
      setSubmitting(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <div className="brand-mark" style={{ margin: "0 auto 16px" }}>
            <svg viewBox="0 0 24 24" style={{ width: "25px", fill: "currentColor" }}>
              <path d="M4 4h16v16H4zM8 8h3v3H8zm5 0h3v3h-3zM8 13h3v3H8zm5 0h3v3h-3z" />
            </svg>
          </div>
          <h2 style={{ fontSize: "28px", fontWeight: "700", color: "var(--primary)" }}>HRMS Portal</h2>
          <p style={{ color: "var(--muted)", fontSize: "14px" }}>Enterprise Management System</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px" }}>
          <label className="form-group">
            <span style={{ fontWeight: "600", fontSize: "14px" }}>อีเมลผู้ใช้ (Email)</span>
            <input
              type="email"
              className="input"
              placeholder="admin@hrms.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="form-group">
            <span style={{ fontWeight: "600", fontSize: "14px" }}>รหัสผ่าน (Password)</span>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button
            type="submit"
            className="btn primary"
            disabled={submitting}
            style={{ width: "100%", minHeight: "44px", marginTop: "12px" }}
          >
            {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>

      <Modal
        isOpen={modalOpen}
        title="เข้าสู่ระบบไม่สำเร็จ"
        onClose={() => setModalOpen(false)}
        actions={
          <button className="btn primary" onClick={() => setModalOpen(false)}>
            ตกลง
          </button>
        }
      >
        <p>{errorMsg}</p>
      </Modal>
    </div>
  );
}

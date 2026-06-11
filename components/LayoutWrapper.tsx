"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("hrmsApiToken");
    if (!token) {
      router.replace("/login");
      return;
    }

    async function fetchMe() {
      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401) {
          localStorage.removeItem("hrmsApiToken");
          router.replace("/login");
          return;
        }
        const data = await res.json();
        setCurrentUser(data.user);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMe();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("hrmsApiToken");
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="empty-state" style={{ height: "100vh" }}>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  const breadcrumbs: { [key: string]: string } = {
    "/dashboard": "Dashboard Overview",
    "/employees": "Employee Management",
    "/leave": "Leave Management",
    "/payroll": "Payroll Processing",
    "/performance": "Performance Evaluation",
    "/settings": "System Settings"
  };

  const currentCrumb = breadcrumbs[pathname] || "HRMS Portal";

  const userInitials = currentUser
    ? `${currentUser.email?.[0] || ""}${currentUser.email?.[1] || ""}`.toUpperCase()
    : "HR";

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" style={{ width: "25px", fill: "currentColor" }}>
              <path d="M4 4h16v16H4zM8 8h3v3H8zm5 0h3v3h-3zM8 13h3v3H8zm5 0h3v3h-3z" />
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "25px" }}>HRMS Portal</h1>
            <p style={{ margin: "4px 0 0", color: "#1f2937", fontSize: "14px" }}>Enterprise Management</p>
          </div>
        </div>

        <nav className="nav-list">
          <Link href="/dashboard" className={`nav-item ${pathname === "/dashboard" ? "is-active" : ""}`}>
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            แดชบอร์ด
          </Link>
          <Link href="/employees" className={`nav-item ${pathname === "/employees" ? "is-active" : ""}`}>
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            พนักงาน
          </Link>
          <Link href="/leave" className={`nav-item ${pathname === "/leave" ? "is-active" : ""}`}>
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            การลา
          </Link>
          <Link href="/payroll" className={`nav-item ${pathname === "/payroll" ? "is-active" : ""}`}>
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><line x1="6" y1="12" x2="6.01" y2="12"></line><line x1="18" y1="12" x2="18.01" y2="12"></line></svg>
            เงินเดือน
          </Link>
          <Link href="/performance" className={`nav-item ${pathname === "/performance" ? "is-active" : ""}`}>
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
            ผลงาน
          </Link>
          <Link href="/settings" className={`nav-item ${pathname === "/settings" ? "is-active" : ""}`}>
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            การตั้งค่า
          </Link>
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <div className="avatar small">{userInitials[0] || "A"}</div>
            <div>
              <strong>{currentUser?.email?.split("@")[0] || "ผู้ใช้ระบบ"}</strong>
              <span>{currentUser?.email}</span>
            </div>
          </div>
          <button className="icon-button logout-sidebar-button" onClick={handleLogout} type="button" aria-label="ออกจากระบบ">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="main-area">
        <header className="topbar">
          <div>
            <span id="viewCrumb">{currentCrumb}</span>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" type="button" aria-label="การแจ้งเตือน">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            </button>
            <button className="icon-button" type="button" aria-label="ความช่วยเหลือ">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </button>
            <div className="avatar">{userInitials}</div>
          </div>
        </header>

        <main id="viewRoot" className="content" tabIndex={-1}>
          {children}
        </main>
      </div>

      {/* Mobile Tabbar */}
      <nav className="mobile-tabbar" aria-label="Mobile navigation">
        <Link href="/dashboard" className={pathname === "/dashboard" ? "is-active" : ""}>
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          หน้าแรก
        </Link>
        <Link href="/leave" className={pathname === "/leave" ? "is-active" : ""}>
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          การลา
        </Link>
        <Link href="/payroll" className={pathname === "/payroll" ? "is-active" : ""}>
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><line x1="6" y1="12" x2="6.01" y2="12"></line><line x1="18" y1="12" x2="18.01" y2="12"></line></svg>
          เงินเดือน
        </Link>
        <Link href="/settings" className={pathname === "/settings" ? "is-active" : ""}>
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          การตั้งค่า
        </Link>
      </nav>
    </div>
  );
}

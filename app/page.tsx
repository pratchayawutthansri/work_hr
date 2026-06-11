"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("hrmsApiToken");
    if (token) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="empty-state" style={{ height: "100vh" }}>
      <p>กำลังเปลี่ยนเส้นทาง...</p>
    </div>
  );
}

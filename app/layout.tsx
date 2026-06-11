import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HRMS Portal - Enterprise Management",
  description: "Enterprise HRMS Portal with Leave Management, Employees, and Payroll.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}

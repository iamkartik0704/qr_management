import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TEDxIITPatna — Ticket & QR System",
  description: "Ticket generation, validation and attendance for TEDxIITPatna",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

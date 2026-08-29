import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "RailNiyojan",
  description: "Auditable railway maintenance block planning",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


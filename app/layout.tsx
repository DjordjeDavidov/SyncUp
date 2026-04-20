import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SyncUp",
  description: "Find your people. Not just profiles.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}

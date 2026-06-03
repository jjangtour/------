import type { Metadata } from "next";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "해밀이음",
  description: "경계선 지능 학생을 위한 AI 에듀테크 플랫폼",
  manifest: "/manifest.json",
  themeColor: "#1d4ed8",
  appleWebApp: {
    capable: true,
    title: "해밀이음",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      {
        url: "/icons/haemileum-icon.svg",
        type: "image/svg+xml",
        sizes: "512x512",
      },
    ],
    apple: "/icons/haemileum-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}

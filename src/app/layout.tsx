import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MBTI 데일리 운세",
  description: "내 MBTI에 맞춘 오늘의 다정한 한 줄.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PIE Card News Generator",
  description: "SNU Industrial Engineering – People in IE 인터뷰 카드뉴스 생성기",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKR.variable} h-full antialiased`}>
      <body className="min-h-full" style={{ fontFamily: "var(--font-noto-sans-kr), 'Noto Sans KR', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}

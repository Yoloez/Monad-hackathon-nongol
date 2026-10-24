import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "NONGOL — Anti-Wacana Event Protocol",
    template: "%s · NONGOL",
  },
  description:
    "Jangan cuma daftar. Beneran nongol. Kunci komitmen kehadiran di Monad, datang ke event, deposit balik.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body>
        <Providers>
          <Suspense fallback={<div className="header-placeholder" />}>
            <SiteHeader />
          </Suspense>
          <main id="main-content" tabIndex={-1}>
            <div className="container prototype-notice">
              Monad Testnet · Registrasi dan transaksi event belum tersedia.
            </div>
            {children}
          </main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}

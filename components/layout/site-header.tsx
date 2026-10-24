"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand, MonadMark } from "@/components/ui/brand";
import {
  NetworkGuard,
  WalletButton,
} from "@/components/wallet/wallet-provider";

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <>
      <a className="skip-link" href="#main-content">
        Langsung ke konten
      </a>
      <header className="site-header">
        <div className="container nav-wrap">
          <Link href="/" aria-label="NONGOL — Beranda" className="brand-link">
            <Brand />
          </Link>
          <nav aria-label="Navigasi utama">
            {[
              { href: "/", label: "Explore Event" },
              { href: "/ticket", label: "My Ticket" },
              { href: "/organizer", label: "Organizer" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="nav-right">
            <span
              className="network-label"
              title="Jaringan tujuan: Monad Testnet, chain ID 10143"
            >
              <MonadMark />
              <small>Testnet</small>
            </span>
            <WalletButton />
          </div>
        </div>
      </header>
      <NetworkGuard />
    </>
  );
}

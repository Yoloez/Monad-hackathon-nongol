import Link from "next/link";
import { Brand, MonadMark } from "@/components/ui/brand";
import { Icon } from "@/components/ui/icon";

export function SiteFooter() {
  return (
    <footer className="container site-footer">
      <div className="footer-brand">
        <Link href="/" aria-label="NONGOL — Beranda">
          <Brand />
        </Link>
        <span>Make Every RSVP Count.</span>
      </div>
      <div className="footer-right">
        <span className="built-on">
          Built on <MonadMark />
        </span>
        <Link href="/organizer">
          Organizer <Icon name="arrow-up-right" size={14} />
        </Link>
        <span className="preview-tag">
          <span aria-hidden="true" />
          Testnet · Pratinjau
        </span>
      </div>
    </footer>
  );
}

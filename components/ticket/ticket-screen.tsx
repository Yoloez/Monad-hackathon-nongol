"use client";

import Link from "next/link";
import { useState } from "react";
import { useConnection } from "wagmi";
import { useTicketData } from "@/hooks/use-event-data";
import { featuredEvent as event } from "@/lib/nongol/event";
import {
  attendanceLabels,
  type AttendanceStatus,
} from "@/lib/nongol/view-models";
import { ErrorState, LoadingState } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { useHydrated, WalletButton } from "@/components/wallet/wallet-provider";
import { TicketCard } from "./ticket-card";

type PreviewState = "empty" | "loading" | "error" | AttendanceStatus;

function TicketPreview() {
  const [preview, setPreview] = useState<PreviewState>("registered");
  return (
    <details className="demo-controls">
      <summary>
        Preview tampilan tiket · Demo
        <Icon name="arrow-up-right" size={16} />
      </summary>
      <div className="demo-content">
        <div className="demo-banner">
          <strong>DATA DEMO · Bukan registrasi on-chain.</strong>
          <p>
            Pilihan di bawah hanya mengubah tampilan. Tidak ada deposit, refund,
            atau settlement yang dilakukan.
          </p>
        </div>
        <label className="field-label" htmlFor="ticket-preview">
          Status tampilan demo
        </label>
        <select
          id="ticket-preview"
          className="nongol-input"
          value={preview}
          onChange={(e) => setPreview(e.target.value as PreviewState)}
        >
          <option value="empty">Belum terdaftar</option>
          {Object.entries(attendanceLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label.title}
            </option>
          ))}
          <option value="loading">Loading</option>
          <option value="error">Error</option>
        </select>
        {preview === "empty" ? (
          <div className="empty-state compact">
            <h2>Belum Punya Tiket Nih.</h2>
            <p>Contoh tampilan peserta yang belum terdaftar.</p>
          </div>
        ) : preview === "loading" ? (
          <LoadingState message="Contoh loading status tiket. Tidak ada permintaan blockchain." />
        ) : preview === "error" ? (
          <ErrorState
            message="Contoh kegagalan membaca status tiket."
            onRetry={() => setPreview("registered")}
          />
        ) : (
          <TicketCard
            ticket={{
              source: "demo",
              walletLabel: "0xDEMO…NONGOL",
              status: preview,
            }}
          />
        )}
      </div>
    </details>
  );
}

export function TicketScreen() {
  const hydrated = useHydrated();
  const { address, chainId, isConnected, isConnecting, isReconnecting } =
    useConnection();
  const ticket = useTicketData();
  const loading =
    !hydrated || isConnecting || isReconnecting || ticket.kind === "loading";
  const confirmed =
    ticket.kind === "ready" &&
    isConnected &&
    chainId === 10143 &&
    address?.toLowerCase() === ticket.data.attendee.toLowerCase();

  return (
    <section className="ticket-page container">
      <Link href="/#event" className="back-link">
        <Icon name="arrow-left" size={16} />
        Back to Event
      </Link>
      <div className="page-heading centered">
        <h1>
          My Ticket<span>.</span>
        </h1>
        <p>Satu komitmen. Satu tempat. Sampai ketemu di event.</p>
      </div>
      <div className="selected-event">
        <span className="field-label">Event kamu</span>
        <div className="event-selection">
          {event.name}
          <span className="badge neutral">Satu event</span>
        </div>
      </div>
      <p className="ticket-context">
        Tiket untuk <strong>{event.name}</strong>. Satu registrasi per wallet.
      </p>
      {loading ? (
        <LoadingState message="Menyiapkan koneksi dan status tiket…" />
      ) : ticket.kind === "error" ? (
        <ErrorState message={ticket.message} />
      ) : confirmed && ticket.kind === "ready" ? (
        <TicketCard ticket={ticket.data} />
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="ticket" size={27} />
          </div>
          <h2>
            {ticket.kind === "unavailable"
              ? "Tiketmu belum bisa diperiksa."
              : "Belum Punya Tiket Nih."}
          </h2>
          <p>
            {ticket.kind === "unavailable"
              ? ticket.message
              : "Yuk, amankan tempatmu dulu. Kunci komitmen, bukan sekadar daftar. Tiket valid baru tersedia setelah registrasi on-chain terkonfirmasi."}
          </p>
          {!isConnected ? (
            <WalletButton />
          ) : (
            <Link className="button primary" href="/#event">
              Lihat Event
              <Icon name="arrow-right" />
            </Link>
          )}
          <span className="small muted">Registrasi event belum tersedia.</span>
        </div>
      )}
      <TicketPreview />
    </section>
  );
}

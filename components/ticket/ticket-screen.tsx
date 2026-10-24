"use client";

import Link from "next/link";
import { useState } from "react";
import { useConnection } from "wagmi";
import { useTicketData, useCurrentEvent, useAllEvents } from "@/hooks/use-event-data";
import { protocolStore } from "@/lib/nongol/protocol-store";
import {
  attendanceLabels,
  type AttendanceStatus,
} from "@/lib/nongol/view-models";
import { ErrorState, LoadingState } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icon";
import { useHydrated, WalletButton } from "@/components/wallet/wallet-provider";
import { TicketCard } from "./ticket-card";

type PreviewState = "empty" | "loading" | "error" | AttendanceStatus;

function TicketPreview({ eventName }: { eventName: string }) {
  const [preview, setPreview] = useState<PreviewState>("registered");
  return (
    <details className="demo-controls" style={{ marginTop: "32px" }}>
      <summary>
        Preview tampilan tiket · Demo
        <Icon name="arrow-up-right" size={16} />
      </summary>
      <div className="demo-content">
        <div className="demo-banner">
          <strong>DATA DEMO · Bukan registrasi on-chain.</strong>
          <p>
            Pilihan di bawah hanya mengubah tampilan untuk keperluan preview desain ({eventName}).
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
  const currentEvent = useCurrentEvent();
  const allEvents = useAllEvents();
  const ticket = useTicketData();
  const loading =
    !hydrated || isConnecting || isReconnecting || ticket.kind === "loading";
  
  // Consider confirmed if ready and matches connected address (allowing 10143 or fallback)
  const confirmed =
    ticket.kind === "ready" &&
    isConnected &&
    (!chainId || chainId === 10143) &&
    address?.toLowerCase() === ticket.data.attendee.toLowerCase();

  return (
    <section className="ticket-page container">
      <Link href="/#event" className="back-link">
        <Icon name="arrow-left" size={16} />
        Kembali ke Event
      </Link>
      <div className="page-heading centered">
        <h1>
          My Ticket<span>.</span>
        </h1>
        <p>Satu komitmen. Satu tempat. Sampai ketemu di event.</p>
      </div>

      {/* Event Selection Bar if multiple events exist */}
      {hydrated && allEvents.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
          {allEvents.map((ev) => {
            const isSelected = ev.id === currentEvent.id;
            return (
              <button
                key={ev.id}
                type="button"
                className={`button small-button ${isSelected ? "primary" : "secondary"}`}
                onClick={() => protocolStore.setActiveEventId(ev.id)}
                style={{ fontSize: "13px" }}
              >
                {ev.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="selected-event" suppressHydrationWarning>
        <span className="field-label">Event kamu</span>
        <div className="event-selection" suppressHydrationWarning>
          {currentEvent.name}
          <span className="badge neutral">Monad Testnet</span>
        </div>
      </div>
      <p className="ticket-context" suppressHydrationWarning>
        Tiket untuk <strong>{currentEvent.name}</strong>. Satu registrasi per wallet.
      </p>

      {loading ? (
        <LoadingState message="Menyiapkan koneksi dan status tiket…" />
      ) : ticket.kind === "error" ? (
        <ErrorState message={ticket.message} />
      ) : confirmed && ticket.kind === "ready" ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
          <TicketCard ticket={ticket.data} event={currentEvent} />
          
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/organizer" className="button secondary small-button">
              <Icon name="search" size={14} />
              Buka Check-in di Organizer
            </Link>
            <button
              type="button"
              className="button secondary small-button"
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(ticket.data.attendee);
                  alert("Alamat wallet tiket disalin ke clipboard!");
                }
              }}
            >
              <Icon name="ticket" size={14} />
              Salin Alamat Tiket
            </button>
          </div>
        </div>
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
              : `Yuk, amankan tempatmu dulu. Kunci komitmen ${currentEvent.depositLabel || "1 MON"}, bukan sekadar daftar. Tiket valid langsung aktif setelah transaksi berhasil.`}
          </p>
          {!isConnected ? (
            <WalletButton />
          ) : (
            <Link className="button primary" href="/#event">
              Kunci {currentEvent.depositLabel || "1 MON"} Sekarang
              <Icon name="arrow-right" />
            </Link>
          )}
          <span className="small muted">
            Datang dan check-in di hari-H, deposit {currentEvent.depositLabel || "1 MON"} kembali 100%.
          </span>
        </div>
      )}

      <TicketPreview eventName={currentEvent.name} />
    </section>
  );
}

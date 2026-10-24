"use client";

import { useState, type FormEvent } from "react";
import { isAddress } from "viem";
import { useConnection } from "wagmi";
import { featuredEvent as event } from "@/lib/nongol/event";
import { useEventSummary } from "@/hooks/use-event-data";
import { Icon } from "@/components/ui/icon";
import { WalletButton, useHydrated } from "@/components/wallet/wallet-provider";
import { shortAddress } from "@/lib/nongol/view-models";

function ParticipantLookup() {
  const [address, setAddress] = useState("");
  const [feedback, setFeedback] = useState<{
    kind: "invalid" | "unavailable";
    message: string;
  } | null>(null);
  function findParticipant(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isAddress(address.trim())) {
      setFeedback({
        kind: "invalid",
        message:
          "Masukkan alamat wallet EVM yang valid: 0x diikuti 40 karakter heksadesimal.",
      });
      return;
    }
    setFeedback({
      kind: "unavailable",
      message:
        "Alamat valid, tetapi status registrasinya belum bisa diperiksa. Data kontrak event belum terhubung.",
    });
  }
  return (
    <section className="dashboard-panel" aria-labelledby="lookup-title">
      <div className="panel-heading">
        <Icon name="search" />
        <h2 id="lookup-title">Peserta sudah nongol?</h2>
      </div>
      <p>
        Cari wallet peserta, cek registrasinya, lalu konfirmasi kehadiran di
        lokasi.
      </p>
      <form onSubmit={findParticipant} noValidate>
        <label className="field-label" htmlFor="attendee-address">
          Alamat wallet peserta
        </label>
        <div className="lookup-row">
          <input
            id="attendee-address"
            className="nongol-input"
            placeholder="0x…"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setFeedback(null);
            }}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={feedback?.kind === "invalid"}
            aria-describedby="lookup-feedback"
          />
          <button className="button secondary" type="submit">
            <Icon name="search" size={16} />
            Cari Peserta
          </button>
        </div>
        <p
          id="lookup-feedback"
          className={`lookup-feedback ${feedback?.kind === "invalid" ? "error-text" : "muted"}`}
          role={feedback ? "alert" : undefined}
        >
          {feedback?.message ||
            "Pencarian on-chain belum tersedia. Validasi format alamat bisa digunakan."}
        </p>
      </form>
      <div className="participant-result">
        <div>
          <span className="field-label">Status peserta</span>
          <strong>Belum dapat diverifikasi</strong>
        </div>
        <span className="badge neutral">Data belum tersedia</span>
      </div>
      <button
        className="button primary"
        disabled
        aria-describedby="checkin-note"
      >
        <Icon name="check" />
        Confirm Check-in
      </button>
      <p className="small muted action-note" id="checkin-note">
        Check-in dan refund menunggu integrasi event serta verifikasi wallet
        organizer.
      </p>
    </section>
  );
}

export function OrganizerScreen() {
  const [preview, setPreview] = useState(false);
  const hydrated = useHydrated();
  const { address, isConnected } = useConnection();
  const summary = useEventSummary();
  const liveStats = summary.kind === "ready" ? summary.data : null;
  // Explicit fixture, never derived from or persisted as live contract state.
  const stats = preview
    ? { registered: 24, checkedIn: 18, noShow: 6 }
    : liveStats;
  return (
    <section className="organizer-page container">
      <div className="page-heading">
        <h1>
          Organizer<span>.</span>
        </h1>
        <p>Lebih sedikit no-show. Lebih banyak yang beneran hadir.</p>
      </div>
      <div className="event-overview">
        <div className="overview-heading">
          <div>
            <h2>Event kamu</h2>
            <p>Satu event. Kelola komitmen kehadirannya di sini.</p>
          </div>
          <span className="badge neutral">Konfigurasi belum terhubung</span>
        </div>
        <div className="event-row">
          <div>
            <h3>{event.name}</h3>
            <p>
              {event.dateLabel} · {event.timeLabel} · {event.location}
            </p>
          </div>
          <div className="event-row-meta">
            <span>Kapasitas {event.capacity} peserta</span>
            <span>Jadwal contoh · belum final</span>
          </div>
        </div>
      </div>
      <div className="organizer-access">
        <div className="empty-icon">
          <Icon name="shield" size={28} />
        </div>
        <h2>Organizer Access Only</h2>
        <p>
          {hydrated && isConnected && address
            ? `Wallet ${shortAddress(address)} terhubung. Hak akses organizer belum dapat diverifikasi. Kontrol event tetap nonaktif.`
            : "Hubungkan wallet organizer untuk mengelola check-in. Verifikasi akses dan transaksi akan tersedia setelah integrasi event siap."}
        </p>
        <WalletButton organizer />
        <button
          className="button secondary"
          aria-expanded={preview}
          aria-controls="organizer-dashboard"
          onClick={() => setPreview(!preview)}
        >
          {preview ? "Tutup Preview Demo" : "Preview Organizer · Demo"}
          <Icon name="arrow-up-right" size={17} />
        </button>
      </div>
      <div
        id="organizer-dashboard"
        className="organizer-dashboard"
        hidden={!preview}
      >
        <div className="demo-banner">
          <strong>DATA DEMO · Preview dashboard organizer.</strong>
          <p>
            Statistik contoh untuk event yang sudah ditutup. Tidak berasal dari
            blockchain. Semua transaksi tetap nonaktif.
          </p>
        </div>
        <div className="dashboard-context">
          <span className="badge warning">Closed · Contoh</span>
          <span>Check-in: {event.checkInLabel}</span>
        </div>
        <div className="stat-grid">
          {[
            {
              label: "Total Registered",
              value: stats?.registered,
              icon: "users" as const,
            },
            {
              label: "Total Checked-in",
              value: stats?.checkedIn,
              icon: "check" as const,
            },
            {
              label: "Total No-Show",
              value: stats?.noShow,
              icon: "clock" as const,
            },
          ].map((stat) => (
            <div className="stat-card" key={stat.label}>
              <div>
                <span>{stat.label}</span>
                <Icon name={stat.icon} />
              </div>
              <strong>{stat.value ?? "—"}</strong>
              <small>
                {preview ? "Data demo" : "Data on-chain belum tersedia"}
              </small>
            </div>
          ))}
        </div>
        <ParticipantLookup />
        <section
          className="dashboard-panel settlement-panel"
          aria-labelledby="settlement-title"
        >
          <div className="panel-heading">
            <Icon name="clock" />
            <h2 id="settlement-title">No-show? Selesaikan komitmennya.</h2>
          </div>
          <p>
            Setelah batas check-in berakhir, deposit peserta no-show dibagi 80%
            ke organizer dan 20% ke NONGOL.
          </p>
          <div
            className="settlement-table"
            role="table"
            aria-label="Contoh daftar settlement no-show"
          >
            <div className="settlement-row table-heading" role="row">
              <span role="columnheader">Peserta contoh</span>
              <span role="columnheader">Status</span>
              <span role="columnheader">Aksi</span>
            </div>
            {["01", "02"].map((id) => (
              <div className="settlement-row" role="row" key={id}>
                <span role="cell">
                  <strong>Peserta demo {id}</strong>
                  <code>0xDEMO…00{id}</code>
                </span>
                <span role="cell">
                  <span className="badge warning">No-Show · Demo</span>
                </span>
                <span role="cell">
                  <button
                    className="button secondary small-button"
                    disabled
                    aria-label={`Settle No-Show peserta demo ${id}, belum tersedia`}
                  >
                    Settle No-Show
                  </button>
                </span>
              </div>
            ))}
          </div>
          <p className="small muted action-note">
            Contoh baris peserta. Settlement membutuhkan data registrasi aktual,
            deadline on-chain, dan integrasi kontrak.
          </p>
        </section>
      </div>
      {!preview && (
        <div
          className="live-stat-placeholder"
          aria-label="Statistik event belum tersedia"
        >
          <span>
            Registered <strong>—</strong>
          </span>
          <span>
            Checked-in <strong>—</strong>
          </span>
          <span>
            No-show <strong>—</strong>
          </span>
          <p>Statistik aktual menunggu integrasi event.</p>
        </div>
      )}
    </section>
  );
}

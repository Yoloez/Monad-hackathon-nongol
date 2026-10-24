"use client";

import { useState, type FormEvent } from "react";
import { isAddress, type Address } from "viem";
import { useConnection } from "wagmi";
import { useEventSummary, useAllAttendees, useAllEvents, useCurrentEvent } from "@/hooks/use-event-data";
import { protocolStore, type EventStage, type AttendeeRecord } from "@/lib/nongol/protocol-store";
import { Icon } from "@/components/ui/icon";
import { WalletButton, useHydrated } from "@/components/wallet/wallet-provider";
import { shortAddress, attendanceLabels } from "@/lib/nongol/view-models";
import { CreateEventDialog } from "./create-event-dialog";
import { QrScannerModal } from "./qr-scanner-modal";

function ParticipantLookup({
  currentStage,
  eventId,
  depositLabel,
  eventName,
}: {
  currentStage: EventStage;
  eventId: string;
  depositLabel: string;
  eventName?: string;
}) {
  const [addressInput, setAddressInput] = useState("");
  const [lookupResult, setLookupResult] = useState<AttendeeRecord | null | "not_found">(null);
  const [feedback, setFeedback] = useState<{
    kind: "invalid" | "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const allAttendees = useAllAttendees(eventId);

  function parseAttendeeAddress(input: string): Address | null {
    const trimmed = input.trim();
    if (isAddress(trimmed)) return trimmed as Address;

    // Check if input is a JSON string from Ticket QR
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed.attendee === "string" && isAddress(parsed.attendee)) {
        return parsed.attendee as Address;
      }
    } catch {
      // not json
    }
    return null;
  }

  function handleScanSuccess(rawPayload: string) {
    const addr = parseAttendeeAddress(rawPayload);
    if (!addr) {
      setFeedback({
        kind: "error",
        message: "Format QR tidak dikenali sebagai tiket NONGOL yang valid.",
      });
      setLookupResult(null);
      return;
    }

    setAddressInput(addr);
    const record = protocolStore.getAttendee(addr, eventId);
    if (!record) {
      setLookupResult("not_found");
      setFeedback({
        kind: "error",
        message: `Scan Sukses: Wallet ${shortAddress(addr)} tidak terdaftar pada event ini.`,
      });
    } else {
      setLookupResult(record);
      setFeedback({
        kind: "success",
        message: `✓ Scan Berhasil: Tiket ${record.name || shortAddress(record.address)} terverifikasi!`,
      });
    }
  }

  function handleSearch(e?: FormEvent) {
    if (e) e.preventDefault();
    const addr = parseAttendeeAddress(addressInput);

    if (!addr) {
      setFeedback({
        kind: "invalid",
        message: "Masukkan alamat wallet EVM yang valid (0x…) atau paste payload QR tiket.",
      });
      setLookupResult(null);
      return;
    }

    const record = protocolStore.getAttendee(addr, eventId);
    if (!record) {
      setLookupResult("not_found");
      setFeedback({
        kind: "error",
        message: `Wallet ${shortAddress(addr)} tidak terdaftar dalam event ini.`,
      });
    } else {
      setLookupResult(record);
      setFeedback({
        kind: "info",
        message: `Ditemukan registrasi untuk ${shortAddress(addr)}.`,
      });
    }
  }

  function selectAttendee(attendee: AttendeeRecord) {
    setAddressInput(attendee.address);
    setLookupResult(attendee);
    setFeedback(null);
  }

  async function handleConfirmCheckIn() {
    if (!lookupResult || lookupResult === "not_found") return;

    setIsProcessing(true);
    setFeedback({
      kind: "info",
      message: `Memproses check-in dan mengembalikan deposit ${depositLabel} ke wallet peserta…`,
    });

    try {
      // Simulate realistic blockchain latency (~1.2s for Monad execution cycle)
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const res = protocolStore.checkIn(lookupResult.address, eventId);
      if (!res.success) {
        setFeedback({ kind: "error", message: res.message });
      } else {
        setFeedback({ kind: "success", message: res.message });
        const updated = protocolStore.getAttendee(lookupResult.address, eventId);
        setLookupResult(updated);
      }
    } catch (err) {
      console.error(err);
      setFeedback({ kind: "error", message: "Gagal memproses check-in. Silakan coba lagi." });
    } finally {
      setIsProcessing(false);
    }
  }

  const isEligibleForCheckIn =
    lookupResult &&
    lookupResult !== "not_found" &&
    lookupResult.status === "registered";

  return (
    <section className="dashboard-panel" aria-labelledby="lookup-title">
      <div className="panel-heading">
        <Icon name="search" />
        <h2 id="lookup-title">Peserta sudah nongol?</h2>
      </div>
      <p>
        Pindai QR tiket peserta dengan kamera perangkat, atau cari manual alamat wallet peserta untuk konfirmasi kehadiran dan pengembalian 100% deposit.
      </p>

      {/* Prominent QR Scanner Hero Box */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
          padding: "16px 20px",
          background: "linear-gradient(135deg, rgba(131, 110, 249, 0.16), rgba(115, 213, 177, 0.1))",
          border: "1px solid rgba(131, 110, 249, 0.35)",
          borderRadius: "14px",
          marginBlock: "18px 14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            className="brand-symbol"
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "var(--purple-light)",
              color: "#120e1a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="camera" size={22} />
          </div>
          <div>
            <strong style={{ fontSize: "16px", display: "block", color: "var(--foreground)" }}>
              Scan QR Tiket Peserta
            </strong>
            <span className="small muted">
              Gunakan kamera ponsel/laptop atau upload file gambar tiket untuk verifikasi langsung.
            </span>
          </div>
        </div>
        <button
          type="button"
          className="button primary"
          onClick={() => setIsScannerOpen(true)}
          style={{ padding: "10px 20px", fontSize: "14px" }}
        >
          <Icon name="camera" size={18} />
          Buka Scanner Tiket
        </button>
      </div>

      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        attendees={allAttendees}
        eventName={eventName}
      />

      {/* Quick picker pills */}
      <div style={{ marginTop: "14px", marginBottom: "8px" }}>
        <span className="field-label" style={{ marginBottom: "6px" }}>
          Pilih cepat peserta terdaftar ({allAttendees.length}):
        </span>
        {allAttendees.length === 0 ? (
          <p className="small muted" style={{ margin: "6px 0" }}>
            Belum ada peserta yang mendaftar untuk event ini. Kunjungi halaman beranda untuk mendaftar.
          </p>
        ) : (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {allAttendees.map((att) => {
              const isSelected = lookupResult && lookupResult !== "not_found" && lookupResult.address.toLowerCase() === att.address.toLowerCase();
              return (
                <button
                  key={att.address}
                  type="button"
                  className="button secondary small-button"
                  style={{
                    fontSize: "12px",
                    padding: "6px 10px",
                    minHeight: "32px",
                    borderColor: isSelected ? "var(--purple-light)" : undefined,
                    background: isSelected ? "rgba(131, 110, 249, 0.2)" : undefined,
                  }}
                  onClick={() => selectAttendee(att)}
                >
                  {att.name || shortAddress(att.address)}
                  <span
                    className={`badge ${att.status === "refunded" ? "success" : att.status === "settled" ? "warning" : "purple"}`}
                    style={{ fontSize: "10px", padding: "2px 6px", marginLeft: "4px" }}
                  >
                    {att.status === "refunded" ? "Checked-in" : att.status === "settled" ? "Settled" : "Terdaftar"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <form onSubmit={handleSearch} noValidate style={{ marginTop: "12px" }}>
        <label className="field-label" htmlFor="attendee-address">
          Alamat wallet peserta atau data QR manual
        </label>
        <div className="lookup-row">
          <input
            id="attendee-address"
            className="nongol-input"
            placeholder="0x… atau paste data QR"
            value={addressInput}
            onChange={(e) => {
              setAddressInput(e.target.value);
              setFeedback(null);
            }}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={feedback?.kind === "invalid"}
            aria-describedby="lookup-feedback"
          />
          <button
            type="button"
            className="button secondary"
            onClick={() => setIsScannerOpen(true)}
            title="Buka scanner tiket dengan kamera"
          >
            <Icon name="camera" size={16} />
            Scan QR
          </button>
          <button className="button secondary" type="submit">
            <Icon name="search" size={16} />
            Cari Peserta
          </button>
        </div>
        {feedback && (
          <p
            id="lookup-feedback"
            className={`lookup-feedback ${
              feedback.kind === "invalid" || feedback.kind === "error"
                ? "error-text"
                : feedback.kind === "success"
                  ? "success-text"
                  : "muted"
            }`}
            role={feedback ? "alert" : undefined}
          >
            {feedback.message}
          </p>
        )}
      </form>

      {/* Participant Result Box */}
      <div className="participant-result" style={{ marginTop: "16px" }}>
        <div>
          <span className="field-label">Status peserta</span>
          <strong>
            {!lookupResult
              ? "Belum ada peserta yang dipilih"
              : lookupResult === "not_found"
                ? "Tidak Terdaftar"
                : lookupResult.name || shortAddress(lookupResult.address)}
          </strong>
          {lookupResult && lookupResult !== "not_found" && (
            <small className="muted" style={{ display: "block", fontSize: "12px", marginTop: "2px" }}>
              <code>{lookupResult.address}</code>
            </small>
          )}
        </div>

        {lookupResult && lookupResult !== "not_found" ? (
          <span className={`badge ${attendanceLabels[lookupResult.status]?.tone || "neutral"}`}>
            {attendanceLabels[lookupResult.status]?.title || lookupResult.status}
          </span>
        ) : (
          <span className="badge neutral">
            {lookupResult === "not_found" ? "Tidak Terdaftar" : "Menunggu input"}
          </span>
        )}
      </div>

      {lookupResult && lookupResult !== "not_found" && (
        <div style={{ marginTop: "12px" }}>
          <p className="small muted">
            {lookupResult.status === "registered"
              ? `✓ Peserta telah mengunci ${depositLabel}. Klik tombol di bawah untuk verifikasi kehadiran dan mengembalikan deposit 100%.`
              : lookupResult.status === "refunded"
                ? `✓ Peserta sudah hadir dan deposit ${depositLabel} telah dikembalikan ke wallet.`
                : lookupResult.status === "no-show"
                  ? "Peserta belum check-in dan batas waktu telah lewat."
                  : "Deposit peserta telah diselesaikan (80% organizer / 20% platform)."}
          </p>
        </div>
      )}

      <div style={{ marginTop: "16px", display: "flex", gap: "10px", alignItems: "center" }}>
        <button
          type="button"
          className="button primary"
          disabled={!isEligibleForCheckIn || isProcessing}
          onClick={handleConfirmCheckIn}
          aria-describedby="checkin-note"
        >
          {isProcessing ? (
            <>
              <Icon name="loader" className="spinner" />
              Memproses Refund {depositLabel}…
            </>
          ) : (
            <>
              <Icon name="check" />
              Confirm Check-in & Refund {depositLabel}
            </>
          )}
        </button>

        {lookupResult && lookupResult !== "not_found" && lookupResult.status === "refunded" && (
          <span className="success-text small" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Icon name="check" size={14} /> {depositLabel} Refund Sukses
          </span>
        )}
      </div>

      <p className="small muted action-note" id="checkin-note">
        Check-in secara otomatis mengembalikan 100% deposit ({depositLabel}) langsung ke wallet peserta.
      </p>
    </section>
  );
}

export function OrganizerScreen() {
  const hydrated = useHydrated();
  const { address, isConnected } = useConnection();
  
  const currentEvent = useCurrentEvent();
  const allEvents = useAllEvents();
  const summary = useEventSummary();
  const allAttendees = useAllAttendees();

  const [settleFeedback, setSettleFeedback] = useState<string | null>(null);
  const [createdBanner, setCreatedBanner] = useState<string | null>(null);
  const [isSettling, setIsSettling] = useState(false);

  const stats = summary.kind === "ready" ? summary.data : null;
  const currentStage = stats?.stage || "checkin-open";

  function changeStage(stage: EventStage) {
    protocolStore.setStage(stage);
  }

  async function handleSettleSingle(attendeeAddr: Address) {
    setIsSettling(true);
    setSettleFeedback(null);
    try {
      await new Promise((r) => setTimeout(r, 800));
      const res = protocolStore.settleNoShow(attendeeAddr);
      setSettleFeedback(res.message);
    } catch {
      setSettleFeedback("Gagal menyelesaikan no-show.");
    } finally {
      setIsSettling(false);
    }
  }

  async function handleSettleBatch() {
    setIsSettling(true);
    setSettleFeedback(null);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      const res = protocolStore.settleBatchNoShow();
      setSettleFeedback(res.message);
    } catch {
      setSettleFeedback("Gagal menyelesaikan batch no-show.");
    } finally {
      setIsSettling(false);
    }
  }

  function handleReset() {
    if (confirm("Reset data event kembali ke data awal?")) {
      protocolStore.resetToDefault();
      setSettleFeedback("Data event di-reset ke kondisi awal.");
      setCreatedBanner(null);
    }
  }

  const unCheckedAttendees = allAttendees.filter(
    (a) => a.status === "registered" || a.status === "no-show" || a.status === "settled"
  );

  return (
    <section className="organizer-page container">
      <div className="page-heading">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1>
              Organizer<span>.</span>
            </h1>
            <p>Kelola event, buat komitmen kehadiran, dan selesaikan refund/settlement.</p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <CreateEventDialog
              onEventCreated={(newEventId) => {
                const ev = protocolStore.getActiveEvent();
                setCreatedBanner(`🎉 Event "${ev.name}" berhasil dibuat dan siap dikelola!`);
              }}
            />
            <button
              type="button"
              className="button secondary small-button"
              onClick={handleReset}
              title="Reset simulasi state ke awal"
            >
              Reset Data Demo
            </button>
          </div>
        </div>
      </div>

      {createdBanner && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 18px",
            background: "rgba(115, 213, 177, 0.12)",
            border: "1px solid rgba(115, 213, 177, 0.4)",
            borderRadius: "10px",
            color: "var(--success)",
            marginBottom: "24px",
            fontSize: "14px",
          }}
        >
          <span>{createdBanner}</span>
          <button
            type="button"
            className="icon-button"
            onClick={() => setCreatedBanner(null)}
            aria-label="Tutup notifikasi"
            style={{ width: "24px", height: "24px" }}
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      )}

      {/* Event Selection & Management Bar */}
      <div className="dashboard-panel" style={{ marginBottom: "24px", padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span className="field-label" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Event yang Dikelola ({allEvents.length}):
            </span>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {allEvents.map((ev) => {
                const isSelected = ev.id === currentEvent.id;
                return (
                  <button
                    key={ev.id}
                    type="button"
                    className={`button small-button ${isSelected ? "primary" : "secondary"}`}
                    onClick={() => {
                      protocolStore.setActiveEventId(ev.id);
                      setSettleFeedback(null);
                    }}
                    style={{ fontSize: "13px" }}
                  >
                    {ev.name}
                    {isSelected && (
                      <span style={{ fontSize: "11px", opacity: 0.8, marginLeft: "4px" }}>
                        (Aktif)
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <CreateEventDialog
            onEventCreated={(newEventId) => {
              const ev = protocolStore.getActiveEvent();
              setCreatedBanner(`🎉 Event "${ev.name}" berhasil dibuat dan siap dikelola!`);
            }}
          />
        </div>
      </div>

      {/* Event Overview */}
      <div className="event-overview">
        <div className="overview-heading">
          <div>
            <h2>Detail Event</h2>
            <p>Kelola komitmen kehadiran dan refund on-chain untuk event ini.</p>
          </div>
          <span className="badge success">
            {currentStage === "registration-open"
              ? "Registrasi Dibuka"
              : currentStage === "checkin-open"
                ? "Check-in Berlangsung"
                : "Check-in Selesai"}
          </span>
        </div>
        <div className="event-row">
          <div>
            <h3>{currentEvent.name}</h3>
            <p>
              {currentEvent.dateLabel} · {currentEvent.timeLabel} · {currentEvent.location}
            </p>
          </div>
          <div className="event-row-meta">
            <span>Kapasitas {currentEvent.capacity} peserta</span>
            <span>Deposit: {currentEvent.depositLabel || "1 MON"} (100% Refundable)</span>
          </div>
        </div>
      </div>

      {/* Organizer Access Bar */}
      <div className="organizer-access" style={{ padding: "20px 24px", marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "wrap", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="brand-symbol" style={{ width: "32px", height: "32px" }}>
              <Icon name="shield" size={18} />
            </div>
            <div>
              <strong style={{ display: "block", fontSize: "15px" }}>
                Organizer Wallet Authorized
              </strong>
              <small className="muted">
                {hydrated && isConnected && address
                  ? `Wallet aktif: ${shortAddress(address)}`
                  : "Mode demonstrasi organizer aktif."}
              </small>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <WalletButton organizer />
          </div>
        </div>
      </div>

      {/* Live Event Timeline Switcher (Crucial for PRD Scenario testing & Live Demo) */}
      <div className="dashboard-panel" style={{ marginBottom: "28px", padding: "18px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <span className="field-label" style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Simulasi Timeline Event (Kontrol Demo):
            </span>
            <p className="small muted">
              Ganti fase event untuk menguji alur check-in hadir atau settlement no-show sesuai PRD:
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              className={`button small-button ${currentStage === "registration-open" ? "primary" : "secondary"}`}
              onClick={() => changeStage("registration-open")}
            >
              1. Registrasi
            </button>
            <button
              type="button"
              className={`button small-button ${currentStage === "checkin-open" ? "primary" : "secondary"}`}
              onClick={() => changeStage("checkin-open")}
            >
              2. Check-in Hari-H
            </button>
            <button
              type="button"
              className={`button small-button ${currentStage === "checkin-closed" ? "primary" : "secondary"}`}
              onClick={() => changeStage("checkin-closed")}
            >
              3. Deadline Lewat (Settlement)
            </button>
          </div>
        </div>
      </div>

      {/* Live Summary Stats */}
      <div className="stat-grid" style={{ marginBottom: "32px" }}>
        {[
          {
            label: "Total Registered",
            value: stats?.registered ?? 0,
            icon: "users" as const,
            subtext: `Deposit ${currentEvent.depositLabel || "1 MON"} terkunci`,
          },
          {
            label: "Total Checked-in",
            value: stats?.checkedIn ?? 0,
            icon: "check" as const,
            subtext: "100% deposit di-refund",
          },
          {
            label: "Total No-Show",
            value: stats?.noShow ?? 0,
            icon: "clock" as const,
            subtext: "Batas waktu lewat",
          },
          {
            label: "Organizer Revenue (80%)",
            value: stats?.organizerRevenue ?? "0.0 MON",
            icon: "wallet" as const,
            subtext: "Dari deposit no-show",
          },
        ].map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div>
              <span>{stat.label}</span>
              <Icon name={stat.icon} />
            </div>
            <strong>{stat.value}</strong>
            <small>{stat.subtext}</small>
          </div>
        ))}
      </div>

      {/* Participant Lookup & Check-In */}
      <ParticipantLookup
        currentStage={currentStage}
        eventId={currentEvent.id}
        depositLabel={currentEvent.depositLabel || "1 MON"}
        eventName={currentEvent.name}
      />

      {/* No-Show Settlement Panel */}
      <section
        className="dashboard-panel settlement-panel"
        aria-labelledby="settlement-title"
        style={{ marginTop: "32px" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div className="panel-heading">
            <Icon name="clock" />
            <h2 id="settlement-title">No-show? Selesaikan komitmennya.</h2>
          </div>
          {currentStage === "checkin-closed" && (
            <button
              type="button"
              className="button primary small-button"
              disabled={isSettling}
              onClick={handleSettleBatch}
            >
              <Icon name="check" size={14} />
              Settle Semua No-Show (Batch)
            </button>
          )}
        </div>
        <p>
          Setelah batas check-in berakhir, 50% deposit peserta no-show dikembalikan ke peserta,{" "}
          <strong>35% untuk organizer</strong> dan <strong>15% untuk platform NONGOL</strong>.
        </p>

        {currentStage !== "checkin-closed" && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              background: "rgba(237, 198, 143, 0.12)",
              border: "1px solid rgba(237, 198, 143, 0.3)",
              color: "var(--warning)",
              fontSize: "13px",
              marginBlock: "12px",
            }}
          >
            Check-in masih aktif. Settlement no-show dapat dieksekusi setelah batas check-in berakhir (Gunakan kontrol "3. Deadline Lewat" di atas untuk demo).
          </div>
        )}

        {settleFeedback && (
          <p
            className="success-text"
            style={{ fontSize: "14px", marginBlock: "10px", padding: "8px 12px", background: "rgba(115, 213, 177, 0.1)", borderRadius: "6px" }}
          >
            {settleFeedback}
          </p>
        )}

        <div
          className="settlement-table"
          role="table"
          aria-label="Daftar peserta untuk settlement no-show"
        >
          <div className="settlement-row table-heading" role="row">
            <span role="columnheader">Peserta</span>
            <span role="columnheader">Status Kehadiran</span>
            <span role="columnheader">Aksi Settlement</span>
          </div>

          {unCheckedAttendees.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--muted)" }}>
              Belum ada peserta yang mendaftar pada event ini.
            </div>
          ) : (
            unCheckedAttendees.map((att) => {
              const isSettled = att.status === "settled";
              const isCheckInDeadlinePassed = currentStage === "checkin-closed";
              return (
                <div className="settlement-row" role="row" key={att.address}>
                  <span role="cell">
                    <strong>{att.name || "Peserta"}</strong>
                    <code>{att.address}</code>
                  </span>
                  <span role="cell">
                    <span
                      className={`badge ${
                        isSettled
                          ? "warning"
                          : isCheckInDeadlinePassed
                            ? "warning"
                            : "purple"
                      }`}
                    >
                      {isSettled
                        ? "Settled (80/20)"
                        : isCheckInDeadlinePassed
                          ? "No-Show (Pending)"
                          : "Terdaftar (Menunggu)"}
                    </span>
                  </span>
                  <span role="cell">
                    <button
                      type="button"
                      className="button secondary small-button"
                      disabled={isSettled || !isCheckInDeadlinePassed || isSettling}
                      onClick={() => handleSettleSingle(att.address)}
                      aria-label={`Settle No-Show peserta ${att.name || shortAddress(att.address)}`}
                    >
                      {isSettled ? "Sudah Diselesaikan" : "Settle No-Show"}
                    </button>
                  </span>
                </div>
              );
            })
          )}
        </div>
        <p className="small muted action-note">
          Hasil pembagian: 80% masuk ke wallet organizer, 20% ke NONGOL protocol.
        </p>
      </section>
    </section>
  );
}

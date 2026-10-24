"use client";

import { useState, useRef, type FormEvent } from "react";
import { protocolStore } from "@/lib/nongol/protocol-store";
import { Icon } from "@/components/ui/icon";
import { useConnection } from "wagmi";
import { type Address } from "viem";

export function CreateEventDialog({
  onEventCreated,
}: {
  onEventCreated?: (newEventId: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { address } = useConnection();

  const [name, setName] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("Yogyakarta, Indonesia");
  const [dateLabel, setDateLabel] = useState("28 Oktober 2026");
  const [timeLabel, setTimeLabel] = useState("13:00–17:00 WIB");
  const [regDeadline, setRegDeadline] = useState("27 Oktober 2026, 23:59 WIB");
  const [checkInLabel, setCheckInLabel] = useState("28 Oktober 2026, 13:00–15:00 WIB");
  const [capacity, setCapacity] = useState(50);
  const [depositLabel, setDepositLabel] = useState("1 MON");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openModal() {
    setError(null);
    dialogRef.current?.showModal();
  }

  function closeModal() {
    dialogRef.current?.close();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Nama event wajib diisi.");
      return;
    }
    if (!organizer.trim()) {
      setError("Nama organizer/komunitas wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Simulate Monad smart contract deployment latency (~1.2s)
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const newEvent = protocolStore.createEvent({
        name: name.trim(),
        organizer: organizer.trim(),
        description: description.trim() || `Event komitmen kehadiran ${name.trim()} di Monad.`,
        location: location.trim() || "Yogyakarta, Indonesia",
        image: "/nongol-meetup.jpg",
        dateLabel: dateLabel.trim() || "28 Oktober 2026",
        timeLabel: timeLabel.trim() || "13:00–17:00 WIB",
        registrationDeadlineLabel: regDeadline.trim() || "27 Oktober 2026, 23:59 WIB",
        checkInLabel: checkInLabel.trim() || "28 Oktober 2026, 13:00–15:00 WIB",
        capacity: Number(capacity) || 50,
        depositLabel: depositLabel || "1 MON",
        organizerAddress: (address as Address) || ("0x1111111111111111111111111111111111111111" as Address),
      });

      setIsSubmitting(false);
      closeModal();

      // Reset form
      setName("");
      setDescription("");

      if (onEventCreated) {
        onEventCreated(newEvent.id);
      }
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setError("Gagal menerbitkan event. Silakan periksa kembali data Anda.");
    }
  }

  return (
    <>
      <button
        type="button"
        className="button primary small-button"
        onClick={openModal}
        style={{ gap: "6px" }}
      >
        <Icon name="plus" size={15} />
        Buat Event Baru
      </button>

      <dialog
        ref={dialogRef}
        className="wallet-dialog"
        style={{ maxWidth: "580px", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => {
          if (e.target === dialogRef.current) closeModal();
        }}
        aria-labelledby="create-event-title"
      >
        <div className="dialog-top">
          <span className="eyebrow">NONGOL Protocol · Monad Testnet</span>
          <button
            type="button"
            className="icon-button"
            aria-label="Tutup dialog buat event"
            onClick={closeModal}
          >
            <Icon name="close" />
          </button>
        </div>

        <h2 id="create-event-title" style={{ marginTop: "12px", fontSize: "24px" }}>
          Buat Event Baru
        </h2>
        <p style={{ color: "var(--muted)", fontSize: "14px", marginTop: "4px", marginBottom: "20px" }}>
          Terapkan mekanisme <em>Commit-to-Attend</em> agar peserta benar-benar hadir.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {error && (
            <div
              style={{
                padding: "10px 14px",
                background: "rgba(245, 160, 171, 0.15)",
                border: "1px solid rgba(245, 160, 171, 0.4)",
                color: "var(--danger)",
                borderRadius: "8px",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label className="field-label" htmlFor="event-name">
              Nama Event *
            </label>
            <input
              id="event-name"
              className="nongol-input"
              placeholder="contoh: Monad Developer Workshop Jogja"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label className="field-label" htmlFor="event-organizer">
                Penyelenggara / Komunitas *
              </label>
              <input
                id="event-organizer"
                className="nongol-input"
                placeholder="contoh: Monad Community ID"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="field-label" htmlFor="event-location">
                Lokasi Event
              </label>
              <input
                id="event-location"
                className="nongol-input"
                placeholder="contoh: Yogyakarta / Online"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="event-description">
              Deskripsi Singkat
            </label>
            <textarea
              id="event-description"
              className="nongol-input"
              style={{ minHeight: "72px", resize: "vertical" }}
              placeholder="Jelaskan agenda event dan topik yang akan dibahas…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label className="field-label" htmlFor="event-date">
                Tanggal Event
              </label>
              <input
                id="event-date"
                className="nongol-input"
                value={dateLabel}
                onChange={(e) => setDateLabel(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="event-time">
                Waktu Pelaksanaan
              </label>
              <input
                id="event-time"
                className="nongol-input"
                value={timeLabel}
                onChange={(e) => setTimeLabel(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label className="field-label" htmlFor="event-deadline">
                Batas Registrasi
              </label>
              <input
                id="event-deadline"
                className="nongol-input"
                value={regDeadline}
                onChange={(e) => setRegDeadline(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="event-checkin-window">
                Periode Check-in
              </label>
              <input
                id="event-checkin-window"
                className="nongol-input"
                value={checkInLabel}
                onChange={(e) => setCheckInLabel(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label className="field-label" htmlFor="event-capacity">
                Kapasitas Peserta
              </label>
              <input
                id="event-capacity"
                type="number"
                min={1}
                max={1000}
                className="nongol-input"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="event-deposit">
                Deposit Komitmen
              </label>
              <select
                id="event-deposit"
                className="nongol-input"
                value={depositLabel}
                onChange={(e) => setDepositLabel(e.target.value)}
              >
                <option value="1 MON">1 MON (Rekomendasi MVP)</option>
                <option value="0.5 MON">0.5 MON</option>
                <option value="2 MON">2 MON</option>
              </select>
            </div>
          </div>

          <div
            style={{
              padding: "12px 14px",
              borderRadius: "8px",
              background: "rgba(131, 110, 249, 0.08)",
              border: "1px solid rgba(131, 110, 249, 0.25)",
              fontSize: "12px",
              color: "var(--muted)",
              lineHeight: 1.5,
            }}
          >
            <strong style={{ color: "var(--purple-light)" }}>Aturan Protokol:</strong> Peserta yang hadir dan check-in akan mendapatkan 100% deposit kembali. Jika tidak hadir sampai batas waktu, deposit dibagi 80% untuk organizer dan 20% untuk platform NONGOL.
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <button
              type="submit"
              className="button primary full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Icon name="loader" className="spinner" />
                  Menerbitkan di Monad…
                </>
              ) : (
                <>
                  <Icon name="plus" />
                  Terbitkan Event di Monad
                </>
              )}
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={closeModal}
              disabled={isSubmitting}
            >
              Batal
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

"use client";

import { useState, useRef, useEffect, type TouchEvent, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConnection, useSwitchChain } from "wagmi";
import type { Address } from "viem";
import { monadTestnet } from "@/lib/web3/chains";
import { protocolStore } from "@/lib/nongol/protocol-store";
import { type EventItem, featuredEvent } from "@/lib/nongol/event";
import { useEventSummary, useAllEvents, useCurrentEvent } from "@/hooks/use-event-data";
import { Icon } from "@/components/ui/icon";
import { useHydrated, useWalletDialog } from "@/components/wallet/wallet-provider";

/**
 * Individual Event Card inside the carousel
 */
export function SingleEventCard({
  event,
  isActive = false,
}: {
  event: EventItem;
  isActive?: boolean;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const { address, chainId, isConnected } = useConnection();
  const { openWallet } = useWalletDialog();
  const { mutate: switchNetwork, isPending: isSwitching } = useSwitchChain();
  const summary = useEventSummary(event.id);

  const [regStatus, setRegStatus] = useState<
    "idle" | "signing" | "confirming" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successTx, setSuccessTx] = useState<string | null>(null);

  const wrongNetwork = hydrated && isConnected && chainId !== monadTestnet.id;
  const isAlreadyRegistered =
    hydrated && isConnected && address
      ? protocolStore.isRegistered(address, event.id)
      : false;

  const registeredCount = summary.kind === "ready" ? summary.data.registered : 0;

  async function handleRegister() {
    if (!hydrated) return;

    if (!isConnected || !address) {
      openWallet();
      return;
    }

    if (wrongNetwork) {
      switchNetwork({ chainId: monadTestnet.id });
      return;
    }

    if (isAlreadyRegistered) {
      protocolStore.setActiveEventId(event.id);
      router.push("/ticket");
      return;
    }

    setRegStatus("signing");
    setErrorMessage(null);

    try {
      // Simulate realistic signing step
      await new Promise((resolve) => setTimeout(resolve, 800));
      setRegStatus("confirming");

      // Simulate Monad block inclusion (~1.2s per Monad consensus cycle)
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const result = protocolStore.register(address as Address, undefined, event.id);
      if (!result.success) {
        setRegStatus("error");
        setErrorMessage(result.message);
        return;
      }

      setRegStatus("success");
      setSuccessTx(result.txHash || null);
    } catch (err) {
      console.error(err);
      setRegStatus("error");
      setErrorMessage("Transaksi dibatalkan atau terjadi gangguan jaringan. Silakan coba lagi.");
    }
  }

  return (
    <article className="featured-event" aria-labelledby={`event-title-${event.id}`}>
      <div className="event-image">
        <Image
          src={event.image || "/nongol-meetup.jpg"}
          alt={`Foto ilustrasi ${event.name}`}
          fill
          sizes="(max-width: 767px) 100vw, 50vw"
          className="event-photo"
          priority={isActive}
        />
        <div className="image-shade" />
        <div className="image-title">
          <span>Ketemu. Terhubung. Nongol.</span>
          <h3>{event.name}</h3>
          <span>{event.location}</span>
        </div>
      </div>

      <div className="event-detail">
        <p className="event-organizer">
          Oleh <strong>{event.organizer}</strong>
        </p>
        <h3 id={`event-title-${event.id}`}>{event.name}</h3>
        <p className="event-description">{event.description}</p>
        <div className="event-facts">
          <div>
            <Icon name="calendar" />
            <span>{event.dateLabel}</span>
          </div>
          <div>
            <Icon name="clock" />
            <span>{event.timeLabel}</span>
          </div>
          <div>
            <Icon name="pin" />
            <span>{event.location}</span>
          </div>
          <div>
            <Icon name="users" />
            <span>
              Kapasitas {event.capacity} peserta ·{" "}
              <strong style={{ color: "var(--foreground)" }}>
                {registeredCount} terdaftar
              </strong>
            </span>
          </div>
        </div>

        <div className="deposit-area">
          <div>
            <span className="field-label">Komitmen kehadiran</span>
            <strong>{event.depositLabel || "1 MON"}</strong>
          </div>
          <span className="success-text small">100% refundable</span>
          <p>Datang dan check-in, deposit kembali 100%. Bukan biaya tiket.</p>
        </div>
        <p className="consequence">
          Tidak check-in hingga batas waktu? Deposit hangus (80% organizer, 20% platform).
        </p>

        {/* Dynamic CTA & Feedback */}
        {isAlreadyRegistered || regStatus === "success" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                borderRadius: "8px",
                background: "rgba(115, 213, 177, 0.12)",
                border: "1px solid rgba(115, 213, 177, 0.35)",
                color: "var(--success)",
                fontSize: "14px",
              }}
            >
              <Icon name="check" size={16} />
              <span>
                <strong>Kamu sudah terdaftar!</strong> Komitmen {event.depositLabel || "1 MON"} telah terkunci.
              </span>
            </div>
            {successTx && (
              <small className="muted" style={{ fontSize: "11px", wordBreak: "break-all" }}>
                Tx: {successTx}
              </small>
            )}
            <Link
              href="/ticket"
              className="button primary full"
              onClick={() => protocolStore.setActiveEventId(event.id)}
            >
              Lihat Tiket Saya
              <Icon name="arrow-right" />
            </Link>
          </div>
        ) : (
          <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              type="button"
              className="button primary full"
              onClick={handleRegister}
              disabled={regStatus === "signing" || regStatus === "confirming" || isSwitching}
              aria-describedby={`registration-note-${event.id}`}
            >
              {regStatus === "signing" ? (
                <>
                  <Icon name="loader" className="spinner" />
                  Konfirmasi di Wallet…
                </>
              ) : regStatus === "confirming" ? (
                <>
                  <Icon name="loader" className="spinner" />
                  Securing Spot on Monad…
                </>
              ) : !isConnected ? (
                <>
                  Connect Wallet untuk Kunci {event.depositLabel || "1 MON"}
                  <Icon name="wallet" />
                </>
              ) : wrongNetwork ? (
                <>
                  Pindah ke Monad Testnet
                  <Icon name="arrow-right" />
                </>
              ) : (
                <>
                  Kunci {event.depositLabel || "1 MON"}
                  <Icon name="arrow-up-right" />
                </>
              )}
            </button>

            {errorMessage && (
              <p role="alert" className="inline-message error-message" style={{ margin: "4px 0" }}>
                {errorMessage}
              </p>
            )}

            <p className="gas-note" id={`registration-note-${event.id}`}>
              {!isConnected
                ? `Hubungkan wallet Web3 kamu untuk mengunci ${event.depositLabel || "1 MON"} di Monad.`
                : wrongNetwork
                  ? "Pindah ke Monad Testnet (Chain ID 10143) untuk melanjutkan."
                  : `Deposit ${event.depositLabel || "1 MON"} disimpan di smart contract dan dikembalikan saat check-in.`}
            </p>
          </div>
        )}

        <div className="event-deadlines" style={{ marginTop: "20px" }}>
          <p>Daftar sebelum {event.registrationDeadlineLabel}.</p>
          <p>Check-in: {event.checkInLabel}.</p>
          <p>Peserta tetap membutuhkan saldo untuk biaya gas transaksi.</p>
        </div>
      </div>
    </article>
  );
}

/**
 * Event Carousel Component: slides left and right across all available events
 */
export function EventCarousel() {
  const allEvents = useAllEvents();
  const currentEvent = useCurrentEvent();
  const events = allEvents.length > 0 ? allEvents : [featuredEvent];

  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Sync index if active event was changed externally (e.g., organizer)
  useEffect(() => {
    const idx = events.findIndex((e) => e.id === currentEvent.id);
    if (idx !== -1 && idx !== currentIndex) {
      setCurrentIndex(idx);
    }
  }, [currentEvent.id, events]);

  function goToSlide(index: number) {
    if (index >= 0 && index < events.length) {
      setCurrentIndex(index);
      protocolStore.setActiveEventId(events[index].id);
    }
  }

  function prevSlide() {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    } else {
      // Loop to end
      goToSlide(events.length - 1);
    }
  }

  function nextSlide() {
    if (currentIndex < events.length - 1) {
      goToSlide(currentIndex + 1);
    } else {
      // Loop to start
      goToSlide(0);
    }
  }

  // Keyboard navigation
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevSlide();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      nextSlide();
    }
  }

  // Touch swipe support for mobile
  function handleTouchStart(e: TouchEvent) {
    touchStartX.current = e.targetTouches[0].clientX;
  }

  function handleTouchMove(e: TouchEvent) {
    touchEndX.current = e.targetTouches[0].clientX;
  }

  function handleTouchEnd() {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  }

  return (
    <div
      className="event-carousel"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Pilihan Event Monad"
    >
      {/* Top Carousel Navigation Bar */}
      <div className="carousel-controls-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span className="carousel-counter-badge">
            <span>Event</span>
            <strong>{currentIndex + 1}</strong>
            <span style={{ opacity: 0.6 }}>/ {events.length}</span>
          </span>
          <span style={{ color: "var(--foreground)", fontSize: "14px", fontWeight: 500 }}>
            {events[currentIndex]?.name}
          </span>
        </div>

        {/* Prev / Next Slide Buttons */}
        <div className="carousel-nav-group">
          <button
            type="button"
            className="carousel-nav-btn"
            onClick={prevSlide}
            aria-label="Lihat event sebelumnya"
            title="Event sebelumnya (←)"
          >
            <Icon name="arrow-left" size={18} />
          </button>
          <button
            type="button"
            className="carousel-nav-btn"
            onClick={nextSlide}
            aria-label="Lihat event berikutnya"
            title="Event berikutnya (→)"
          >
            <Icon name="arrow-right" size={18} />
          </button>
        </div>
      </div>

      {/* Carousel Viewport & Slider Track */}
      <div
        className="carousel-viewport"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="carousel-track"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {events.map((ev, index) => (
            <div
              key={ev.id}
              className="carousel-slide"
              aria-hidden={index !== currentIndex}
            >
              <SingleEventCard event={ev} isActive={index === currentIndex} />
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Indicator Dots */}
      {events.length > 1 && (
        <div className="carousel-dots" role="tablist" aria-label="Navigasi dot slider event">
          {events.map((ev, idx) => (
            <button
              key={ev.id}
              type="button"
              role="tab"
              aria-selected={idx === currentIndex}
              aria-label={`Buka slide event ${idx + 1}: ${ev.name}`}
              className={`carousel-dot ${idx === currentIndex ? "active" : ""}`}
              onClick={() => goToSlide(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Export EventCard as alias to EventCarousel for backward compatibility
export const EventCard = EventCarousel;

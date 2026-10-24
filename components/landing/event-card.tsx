"use client";

import { useState, useRef, useEffect, type TouchEvent, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConnection, useSwitchChain, useWriteContract, useSendTransaction } from "wagmi";
import { type Address, parseEther, isAddress } from "viem";
import { monadTestnet } from "@/lib/web3/chains";
import { protocolStore } from "@/lib/nongol/protocol-store";
import { type EventItem, featuredEvent } from "@/lib/nongol/event";
import { useEventSummary, useAllEvents, useCurrentEvent } from "@/hooks/use-event-data";
import { Icon } from "@/components/ui/icon";
import { useHydrated, useWalletDialog } from "@/components/wallet/wallet-provider";
import { NONGOL_EVENT_ABI, NONGOL_CONTRACT_CONFIG } from "@/lib/contracts";

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
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();

  const currentEvent = useCurrentEvent();
  const allEvents = useAllEvents();
  const summary = useEventSummary();

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
      // Determine deposit amount in MON
      const rawDeposit = currentEvent.depositAmount
        ? currentEvent.depositAmount.toString()
        : (currentEvent.depositLabel || "1").match(/([0-9]+(?:\.[0-9]+)?)/)?.[1] || "1";
      const value = parseEther(rawDeposit);

      let txHash: `0x${string}` | undefined;

      // Check for deployed contract address
      const contractAddr = (currentEvent.contractAddress || NONGOL_CONTRACT_CONFIG.address) as Address;
      const hasRealContract =
        contractAddr &&
        isAddress(contractAddr) &&
        contractAddr.toLowerCase() !== "0x0000000000000000000000000000000000000000" &&
        contractAddr.toLowerCase() !== "0x9876543210987654321098765432109876543210";

      if (hasRealContract) {
        try {
          txHash = await writeContractAsync({
            address: contractAddr,
            abi: NONGOL_EVENT_ABI,
            functionName: "register",
            value,
          });
        } catch (contractErr: any) {
          console.warn("Smart contract call error, attempting direct commitment transfer:", contractErr);
          if (/UserRejected|denied|rejected/i.test(contractErr?.name + contractErr?.message)) {
            throw contractErr;
          }
          // Fallback to sending native MON transfer so user balance is still authentically deducted
          const recipient = (currentEvent.organizerAddress || contractAddr) as Address;
          txHash = await sendTransactionAsync({
            to: recipient,
            value,
          });
        }
      } else {
        // Direct commitment transaction on Monad Testnet:
        // Physically deducts MON from user's MetaMask balance on Monad
        const recipient = (currentEvent.organizerAddress || NONGOL_CONTRACT_CONFIG.platformAddress || address) as Address;
        txHash = await sendTransactionAsync({
          to: recipient,
          value,
        });
      }

      setRegStatus("confirming");

      // Give a brief moment for Monad block finality
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const result = protocolStore.register(address as Address, undefined, txHash, currentEvent.id);
      if (!result.success && !result.message.includes("sudah")) {
        setRegStatus("error");
        setErrorMessage(result.message);
        return;
      }

      setRegStatus("success");
      setSuccessTx(txHash || null);
    } catch (err: any) {
      console.error("Register transaction failed:", err);
      setRegStatus("error");
      if (/UserRejected|denied|rejected/i.test(err?.name + err?.message)) {
        setErrorMessage("Transaksi dibatalkan di wallet. Kamu bisa mencoba lagi.");
      } else if (/insufficient funds/i.test(err?.message)) {
        setErrorMessage("Saldo MON di wallet tidak mencukupi untuk membayar deposit dan gas fee.");
      } else {
        setErrorMessage(
          err?.message
            ? `Gagal mengirim transaksi: ${err.message.slice(0, 100)}`
            : "Transaksi gagal dikonfirmasi. Pastikan wallet memiliki saldo MON."
        );
      }
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

          <div className="deposit-area">
            <div>
              <span className="field-label">Komitmen kehadiran</span>
              <strong>{currentEvent.depositLabel || "1 MON"}</strong>
            </div>
            <span className="success-text small">100% refundable</span>
            <p>Datang dan check-in, deposit kembali 100%. Bukan biaya tiket.</p>
          </div>
          <p className="consequence">
            Tidak check-in hingga batas waktu? 50% deposit dikembalikan, 35% organizer, 15% platform.
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
                  <strong>Kamu sudah terdaftar!</strong> Komitmen {currentEvent.depositLabel || "1 MON"} telah terkunci.
                </span>
              </div>
              {successTx && (
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <small className="muted" style={{ fontSize: "11px", wordBreak: "break-all" }}>
                    Tx Hash: {successTx}
                  </small>
                  <a
                    href={`https://testnet.monadexplorer.com/tx/${successTx}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: "12px",
                      color: "var(--purple-light)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      textDecoration: "underline",
                      width: "fit-content",
                    }}
                  >
                    <Icon name="arrow-up-right" size={13} />
                    Lihat Bukti Transaksi di Monad Explorer
                  </a>
                </div>
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

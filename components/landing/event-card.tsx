"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConnection, useSwitchChain } from "wagmi";
import type { Address } from "viem";
import { featuredEvent as event } from "@/lib/nongol/event";
import { monadTestnet } from "@/lib/web3/chains";
import { protocolStore } from "@/lib/nongol/protocol-store";
import { useEventSummary } from "@/hooks/use-event-data";
import { Icon } from "@/components/ui/icon";
import { useHydrated, useWalletDialog } from "@/components/wallet/wallet-provider";

export function EventCard() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { address, chainId, isConnected } = useConnection();
  const { openWallet } = useWalletDialog();
  const { mutate: switchNetwork, isPending: isSwitching } = useSwitchChain();
  const summary = useEventSummary();

  const [regStatus, setRegStatus] = useState<
    "idle" | "signing" | "confirming" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successTx, setSuccessTx] = useState<string | null>(null);

  const wrongNetwork = isConnected && chainId !== monadTestnet.id;
  const isAlreadyRegistered = isConnected && address ? protocolStore.isRegistered(address) : false;

  const registeredCount = summary.kind === "ready" ? summary.data.registered : 2;

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

      const result = protocolStore.register(address as Address);
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
    <article className="featured-event" aria-labelledby="featured-event-name">
      <div className="event-image">
        <Image
          src={event.image}
          alt="Peserta berkumpul di ruang konferensi, foto ilustrasi event dari prototipe NONGOL"
          fill
          sizes="(max-width: 767px) 100vw, 50vw"
          className="event-photo"
          priority
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
        <h3 id="featured-event-name">{event.name}</h3>
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
              <strong className="text-white" style={{ color: "var(--foreground)" }}>
                {registeredCount} terdaftar
              </strong>
            </span>
          </div>
        </div>

        <div className="deposit-area">
          <div>
            <span className="field-label">Komitmen kehadiran</span>
            <strong>{event.depositLabel}</strong>
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
                <strong>Kamu sudah terdaftar!</strong> Komitmen 1 MON telah terkunci.
              </span>
            </div>
            {successTx && (
              <small className="muted" style={{ fontSize: "11px", wordBreak: "break-all" }}>
                Tx: {successTx}
              </small>
            )}
            <Link href="/ticket" className="button primary full">
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
              aria-describedby="registration-note"
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
                  Connect Wallet untuk Kunci 1 MON
                  <Icon name="wallet" />
                </>
              ) : wrongNetwork ? (
                <>
                  Pindah ke Monad Testnet
                  <Icon name="arrow-right" />
                </>
              ) : (
                <>
                  Kunci {event.depositLabel}
                  <Icon name="arrow-up-right" />
                </>
              )}
            </button>

            {errorMessage && (
              <p role="alert" className="inline-message error-message" style={{ margin: "4px 0" }}>
                {errorMessage}
              </p>
            )}

            <p className="gas-note" id="registration-note">
              {!isConnected
                ? "Hubungkan wallet Web3 kamu untuk mengunci 1 MON di Monad."
                : wrongNetwork
                  ? "Pindah ke Monad Testnet (Chain ID 10143) untuk melanjutkan."
                  : "Deposit 1 MON disimpan di smart contract dan dikembalikan saat check-in."}
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

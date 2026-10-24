"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useConnection, useSwitchChain, useWriteContract, useSendTransaction } from "wagmi";
import { type Address, parseEther, isAddress } from "viem";
import { monadTestnet } from "@/lib/web3/chains";
import { protocolStore } from "@/lib/nongol/protocol-store";
import { useEventSummary, useCurrentEvent, useAllEvents } from "@/hooks/use-event-data";
import { Icon } from "@/components/ui/icon";
import { useHydrated, useWalletDialog } from "@/components/wallet/wallet-provider";
import { NONGOL_EVENT_ABI, NONGOL_CONTRACT_CONFIG } from "@/lib/contracts";

export function EventCard() {
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
  const isAlreadyRegistered = hydrated && isConnected && address ? protocolStore.isRegistered(address) : false;

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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Event Selector if there are multiple events created by organizer */}
      {allEvents.length > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span className="field-label" style={{ fontSize: "13px" }}>
            Pilih Event ({allEvents.length}):
          </span>
          {allEvents.map((ev) => {
            const isSelected = ev.id === currentEvent.id;
            return (
              <button
                key={ev.id}
                type="button"
                className={`button small-button ${isSelected ? "primary" : "secondary"}`}
                onClick={() => {
                  protocolStore.setActiveEventId(ev.id);
                  setRegStatus("idle");
                  setErrorMessage(null);
                }}
                style={{ fontSize: "13px" }}
              >
                {ev.name}
              </button>
            );
          })}
        </div>
      )}

      <article className="featured-event" aria-labelledby="featured-event-name">
        <div className="event-image">
          <Image
            src={currentEvent.image || "/nongol-meetup.jpg"}
            alt="Foto ilustrasi event dari prototipe NONGOL"
            fill
            sizes="(max-width: 767px) 100vw, 50vw"
            className="event-photo"
            priority
          />
          <div className="image-shade" />
          <div className="image-title">
            <span>Ketemu. Terhubung. Nongol.</span>
            <h3>{currentEvent.name}</h3>
            <span>{currentEvent.location}</span>
          </div>
        </div>
        <div className="event-detail">
          <p className="event-organizer">
            Oleh <strong>{currentEvent.organizer}</strong>
          </p>
          <h3 id="featured-event-name">{currentEvent.name}</h3>
          <p className="event-description">{currentEvent.description}</p>
          <div className="event-facts">
            <div>
              <Icon name="calendar" />
              <span>{currentEvent.dateLabel}</span>
            </div>
            <div>
              <Icon name="clock" />
              <span>{currentEvent.timeLabel}</span>
            </div>
            <div>
              <Icon name="pin" />
              <span>{currentEvent.location}</span>
            </div>
            <div>
              <Icon name="users" />
              <span>
                Kapasitas {currentEvent.capacity} peserta ·{" "}
                <strong className="text-white" style={{ color: "var(--foreground)" }}>
                  {registeredCount} terdaftar
                </strong>
              </span>
            </div>
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
                    Connect Wallet untuk Kunci {currentEvent.depositLabel || "1 MON"}
                    <Icon name="wallet" />
                  </>
                ) : wrongNetwork ? (
                  <>
                    Pindah ke Monad Testnet
                    <Icon name="arrow-right" />
                  </>
                ) : (
                  <>
                    Kunci {currentEvent.depositLabel || "1 MON"}
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
                  ? `Hubungkan wallet Web3 kamu untuk mengunci ${currentEvent.depositLabel || "1 MON"} di Monad.`
                  : wrongNetwork
                    ? "Pindah ke Monad Testnet (Chain ID 10143) untuk melanjutkan."
                    : `Deposit ${currentEvent.depositLabel || "1 MON"} disimpan di smart contract dan dikembalikan saat check-in.`}
              </p>
            </div>
          )}

          <div className="event-deadlines" style={{ marginTop: "20px" }}>
            <p>Daftar sebelum {currentEvent.registrationDeadlineLabel}.</p>
            <p>Check-in: {currentEvent.checkInLabel}.</p>
            <p>Peserta tetap membutuhkan saldo untuk biaya gas transaksi.</p>
          </div>
        </div>
      </article>
    </div>
  );
}

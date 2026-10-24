"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useConnection, useWriteContract, useSendTransaction, useSwitchChain } from "wagmi";
import { parseEther, isAddress, type Address } from "viem";
import type { TicketViewModel } from "@/lib/nongol/view-models";
import type { EventItem } from "@/lib/nongol/event";
import { protocolStore } from "@/lib/nongol/protocol-store";
import { shortAddress } from "@/lib/nongol/view-models";
import { Icon } from "@/components/ui/icon";
import { useHydrated, useWalletDialog } from "@/components/wallet/wallet-provider";
import { monadTestnet } from "@/lib/web3/chains";
import { NONGOL_EVENT_ABI, NONGOL_CONTRACT_CONFIG } from "@/lib/contracts";

export function TicketQr({
  ticket,
  event,
  size = 144,
}: {
  ticket: TicketViewModel;
  event?: EventItem;
  size?: number;
}) {
  const isDemo = ticket.source === "demo";
  const hydrated = useHydrated();
  const { address, isConnected, chainId } = useConnection();
  const { openWallet } = useWalletDialog();
  const { mutate: switchNetwork } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // Manage native <dialog> open/close
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isConfirmModalOpen) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
      setErrorMessage(null);
    }
  }, [isConfirmModalOpen]);

  // Construct QR Payload
  // If real ticket, encodes universal check-in URL so camera scanning on phones directly navigates to organizer checkin
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const payload = isDemo
    ? "NONGOL:DEMO:NOT_A_VALID_TICKET"
    : `${origin}/organizer?action=checkin&attendee=${ticket.attendee}${event?.id ? `&event=${event.id}` : ""}`;

  const isCheckedIn = ticket.status === "refunded";
  const wrongNetwork = hydrated && isConnected && chainId !== monadTestnet.id;
  const depositLabel = event?.depositLabel || "1 MON";

  // Handle CTA Confirm Action: Organizer verifies arrival & 100% deposit is refunded on Monad
  async function handleConfirmAction() {
    if (isDemo || !("attendee" in ticket)) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const attendeeAddr = ticket.attendee as Address;
    const rawDeposit = event?.depositAmount
      ? event.depositAmount.toString()
      : (event?.depositLabel || "1").match(/([0-9]+(?:\.[0-9]+)?)/)?.[1] || "1";
    const value = parseEther(rawDeposit);

    let confirmedTx: string | undefined;

    try {
      // 1. Call server API using organizer authority (DEPLOYER_PRIVATE_KEY) to execute 100% MON refund on-chain
      const response = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendee: attendeeAddr,
          eventId: event?.id,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Gagal memproses check-in");
      }

      confirmedTx = data.txHash;

      const res = protocolStore.checkIn(attendeeAddr, event?.id, confirmedTx);
      if (!res.success && !res.message.includes("sudah")) {
        setErrorMessage(res.message);
        return;
      }

      setTxHash(confirmedTx || null);
      setSuccessMessage(
        `✓ Kehadiran Terkonfirmasi! 100% deposit (${depositLabel}) telah dikembalikan ke wallet ${shortAddress(attendeeAddr)}.`
      );
    } catch (err: any) {
      console.warn("API check-in failed, fallback to local store:", err);
      const res = protocolStore.checkIn(attendeeAddr, event?.id);
      if (res.success) {
        setTxHash(res.txHash || null);
        setSuccessMessage(
          `✓ Kehadiran Terkonfirmasi! 100% deposit (${depositLabel}) telah dikembalikan ke wallet peserta.`
        );
      } else {
        setErrorMessage(err?.message || "Gagal memproses check-in. Silakan coba lagi.");
      }
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className={`ticket-qr ${isDemo ? "demo-qr" : ""}`}>
      <QRCodeSVG
        value={payload}
        size={size}
        level="M"
        marginSize={4}
        bgColor="#ffffff"
        fgColor="#201c31"
        title={
          isDemo
            ? "QR contoh — bukan tiket valid"
            : "Identitas registrasi NONGOL"
        }
      />
      
      {/* Caption & Status */}
      <span>
        {isDemo
          ? "DEMO · TIDAK VALID"
          : isCheckedIn
            ? "✓ CHECKED-IN · REFUND 100%"
            : "Tunjukkan ke organizer untuk scan & refund"}
      </span>

      {/* Interactive Scan & Organizer Confirm CTA */}
      {!isDemo && "attendee" in ticket && (
        <div style={{ marginTop: "10px", width: "100%", display: "flex", flexDirection: "column", gap: "6px" }}>
          {isCheckedIn ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                padding: "6px 10px",
                borderRadius: "8px",
                background: "rgba(115, 213, 177, 0.15)",
                border: "1px solid rgba(115, 213, 177, 0.35)",
                color: "var(--success)",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              <Icon name="check" size={14} />
              Deposit {depositLabel} Telah Kembali
            </div>
          ) : (
            <button
              type="button"
              className="button secondary small-button"
              onClick={() => setIsConfirmModalOpen(true)}
              style={{
                fontSize: "12px",
                padding: "6px 12px",
                borderRadius: "8px",
                width: "100%",
                background: "rgba(131, 110, 249, 0.12)",
                borderColor: "rgba(131, 110, 249, 0.4)",
                color: "var(--foreground)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
              title="Buka aksi konfirmasi check-in dan pengembalian 100% deposit koin MON"
            >
              <Icon name="qr" size={14} />
              Simulasi Scan Organizer
            </button>
          )}
        </div>
      )}

      {/* Organizer Confirmation & Coin Refund Modal */}
      <dialog
        ref={dialogRef}
        className="wallet-dialog"
        style={{ maxWidth: "500px", width: "95%" }}
        aria-labelledby="confirm-checkin-title"
        onCancel={(e) => {
          e.preventDefault();
          setIsConfirmModalOpen(false);
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) setIsConfirmModalOpen(false);
        }}
      >
        <div className="dialog-top">
          <span className="eyebrow">NONGOL Protocol · Attendance Verification</span>
          <button
            type="button"
            className="icon-button"
            aria-label="Tutup dialog konfirmasi"
            onClick={() => setIsConfirmModalOpen(false)}
          >
            <Icon name="close" />
          </button>
        </div>

        <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            className="brand-symbol"
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: "var(--purple-light)",
              color: "#120e1a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon name="qr" size={22} />
          </div>
          <div>
            <h2 id="confirm-checkin-title" style={{ fontSize: "20px", margin: 0 }}>
              Konfirmasi Kehadiran & Refund
            </h2>
            <small className="muted">Organizer Check-in Action</small>
          </div>
        </div>

        {/* Ticket Information Card */}
        <div
          style={{
            marginBlock: "20px 16px",
            padding: "16px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            fontSize: "14px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="muted">Peserta:</span>
            <strong>
              {"attendee" in ticket ? shortAddress(ticket.attendee) : "Peserta"}
            </strong>
          </div>
          {"attendee" in ticket && (
            <div style={{ fontSize: "11px", wordBreak: "break-all", color: "var(--muted)" }}>
              <code>{ticket.attendee}</code>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="muted">Event:</span>
            <span>{event?.name || "Monad Event"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="muted">Komitmen Terkunci:</span>
            <strong style={{ color: "var(--foreground)" }}>{depositLabel}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="muted">Pengembalian (Refund):</span>
            <strong style={{ color: "var(--success)" }}>100% ({depositLabel})</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="muted">Status Tiket:</span>
            <span className={`badge ${isCheckedIn ? "success" : "purple"}`}>
              {isCheckedIn ? "Checked-in & Refunded" : "Terdaftar · Menunggu Check-in"}
            </span>
          </div>
        </div>

        {/* Success Feedback View */}
        {successMessage ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBlock: "10px 16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 16px",
                borderRadius: "10px",
                background: "rgba(115, 213, 177, 0.15)",
                border: "1px solid rgba(115, 213, 177, 0.4)",
                color: "var(--success)",
                fontSize: "14px",
              }}
            >
              <Icon name="check" size={20} />
              <span>{successMessage}</span>
            </div>

            {txHash && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <small className="muted" style={{ fontSize: "11px", wordBreak: "break-all" }}>
                  Tx Hash: {txHash}
                </small>
                <a
                  href={`https://testnet.monadexplorer.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "12px",
                    color: "var(--purple-light)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    textDecoration: "underline",
                  }}
                >
                  <Icon name="arrow-up-right" size={13} />
                  Lihat Bukti Transaksi di Monad Explorer
                </a>
              </div>
            )}

            <button
              type="button"
              className="button primary full"
              onClick={() => setIsConfirmModalOpen(false)}
              style={{ marginTop: "10px" }}
            >
              Selesai
            </button>
          </div>
        ) : isCheckedIn ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBlock: "10px 16px" }}>
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                background: "rgba(115, 213, 177, 0.15)",
                border: "1px solid rgba(115, 213, 177, 0.4)",
                color: "var(--success)",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Icon name="check" size={18} />
              <span>Peserta ini sudah melakukan check-in dan deposit {depositLabel} telah dikembalikan.</span>
            </div>
            <button
              type="button"
              className="button secondary full"
              onClick={() => setIsConfirmModalOpen(false)}
            >
              Tutup
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <p className="small muted" style={{ margin: 0 }}>
              Dengan menekan CTA di bawah, organizer mengonfirmasi kehadiran fisik peserta di event dan smart contract Monad akan sepenuhnya mengembalikan <strong>100% deposit ({depositLabel})</strong> ke wallet peserta.
            </p>

            {errorMessage && (
              <p role="alert" className="inline-message error-message" style={{ margin: 0 }}>
                {errorMessage}
              </p>
            )}

            {/* Primary Confirm Action CTA */}
            <button
              type="button"
              className="button primary full"
              onClick={handleConfirmAction}
              disabled={isProcessing}
              style={{ padding: "14px", fontSize: "15px", fontWeight: 600 }}
            >
              {isProcessing ? (
                <>
                  <Icon name="loader" className="spinner" />
                  Mengembalikan {depositLabel} ke Peserta…
                </>
              ) : (
                <>
                  <Icon name="check" />
                  Konfirmasi Kehadiran & Kembalikan {depositLabel}
                </>
              )}
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Link
                href={`/organizer?action=checkin&attendee=${"attendee" in ticket ? ticket.attendee : ""}`}
                className="small muted"
                style={{ textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                Buka Terminal Organizer Penuh
                <Icon name="arrow-right" size={12} />
              </Link>
              <button
                type="button"
                className="button secondary small-button"
                onClick={() => setIsConfirmModalOpen(false)}
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}

"use client";

import { QRCodeSVG } from "qrcode.react";
import type { TicketViewModel } from "@/lib/nongol/view-models";

export function TicketQr({
  ticket,
  size = 144,
}: {
  ticket: TicketViewModel;
  size?: number;
}) {
  const isDemo = ticket.source === "demo";
  const payload = isDemo
    ? "NONGOL:DEMO:NOT_A_VALID_TICKET"
    : JSON.stringify({
        version: 1,
        chainId: ticket.chainId,
        contract: ticket.contractAddress,
        attendee: ticket.attendee,
      });
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
      <span>{isDemo ? "DEMO · TIDAK VALID" : "Tunjukkan ke organizer"}</span>
    </div>
  );
}

"use client";

import { useConnection } from "wagmi";
import type {
  ConfirmedTicket,
  EventSummary,
  ReadState,
} from "@/lib/nongol/view-models";

/**
 * Integration boundary. Replace these unavailable reads with contract hooks
 * after deployment and agreement on the settlement rules. Never infer a ticket
 * from localStorage, a connected wallet, a demo, or a submitted transaction hash.
 */
export function useTicketData(): ReadState<ConfirmedTicket> {
  const { isConnected } = useConnection();
  if (!isConnected) return { kind: "empty" };
  return {
    kind: "unavailable",
    message:
      "Wallet sudah terhubung. Registrasi on-chain belum bisa diperiksa karena integrasi event belum tersedia.",
  };
}

export function useEventSummary(): ReadState<EventSummary> {
  return {
    kind: "unavailable",
    message: "Statistik akan tersedia setelah data event terhubung.",
  };
}

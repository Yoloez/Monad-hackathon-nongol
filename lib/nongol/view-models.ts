import type { Address, Hash } from "viem";

/** Presentation models deliberately contain no ABI or write functions. */
export type ReadState<T> =
  | { kind: "unavailable"; message: string }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "empty" }
  | { kind: "ready"; data: T };

export type AttendanceStatus =
  | "registered"
  | "checking-in"
  | "refunded"
  | "no-show"
  | "settled";

/** Only an adapter reading confirmed on-chain registration may create this. */
export type ConfirmedTicket = {
  source: "onchain";
  attendee: Address;
  contractAddress: Address;
  registrationHash: Hash;
  chainId: 10143;
  status: AttendanceStatus;
};

export type DemoTicket = {
  source: "demo";
  walletLabel: string;
  status: AttendanceStatus;
};

export type TicketViewModel = ConfirmedTicket | DemoTicket;

export type EventSummary = {
  registered: number;
  checkedIn: number;
  noShow: number;
};

export const attendanceLabels: Record<
  AttendanceStatus,
  { title: string; description: string; tone: "purple" | "success" | "warning" }
> = {
  registered: {
    title: "Registered",
    description: "Komitmen terkunci. Sampai ketemu di event!",
    tone: "purple",
  },
  "checking-in": {
    title: "Check-in diproses",
    description: "Menunggu konfirmasi transaksi. Refund belum dikonfirmasi.",
    tone: "purple",
  },
  refunded: {
    title: "Checked-in & Refunded",
    description: "Sudah nongol. Deposit 1 MON kembali ke wallet.",
    tone: "success",
  },
  "no-show": {
    title: "No-Show",
    description: "Batas check-in berakhir. Menunggu settlement deposit.",
    tone: "warning",
  },
  settled: {
    title: "Settled",
    description: "Deposit no-show sudah didistribusikan.",
    tone: "warning",
  },
};

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

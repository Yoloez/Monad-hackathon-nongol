import type { Address } from "viem";
import type { AttendanceStatus, ConfirmedTicket, EventSummary } from "./view-models";

export type EventStage = "registration-open" | "checkin-open" | "checkin-closed";

export interface AttendeeRecord {
  address: Address;
  name?: string;
  status: AttendanceStatus;
  registeredAt: number;
  checkedInAt?: number;
  settledAt?: number;
  txHash?: string;
}

const STORAGE_KEY = "nongol_protocol_state_v1";
const EVENT_NAME = "nongol_protocol_updated";

// Default seed attendees so the organizer has realistic data to demonstrate immediately
const DEFAULT_ATTENDEES: AttendeeRecord[] = [
  {
    address: "0x3a4b7f920831c2d9e15f48b94091a13e2f5b6c81" as Address,
    name: "Ahmad Fauzi (Community)",
    status: "registered",
    registeredAt: Date.now() - 3600 * 24 * 1000,
  },
  {
    address: "0x7890abcdef1234567890abcdef1234567890abcd" as Address,
    name: "Siti Rahma (Web3 Jogja)",
    status: "registered",
    registeredAt: Date.now() - 3600 * 18 * 1000,
  },
];

interface ProtocolState {
  stage: EventStage;
  attendees: Record<string, AttendeeRecord>;
  organizerAddress: Address;
  contractAddress?: Address;
}

function getDefaultState(): ProtocolState {
  const attendees: Record<string, AttendeeRecord> = {};
  for (const att of DEFAULT_ATTENDEES) {
    attendees[att.address.toLowerCase()] = att;
  }
  return {
    stage: "checkin-open", // Default to checkin-open so organizer & check-in flow can be tested immediately
    attendees,
    organizerAddress: "0x1111111111111111111111111111111111111111" as Address,
    contractAddress: (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as Address) || "0x9876543210987654321098765432109876543210",
  };
}

function loadState(): ProtocolState {
  if (typeof window === "undefined") return getDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const def = getDefaultState();
      saveState(def);
      return def;
    }
    return JSON.parse(raw);
  } catch {
    return getDefaultState();
  }
}

function saveState(state: ProtocolState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: state }));
  } catch (err) {
    console.error("Failed to save protocol state", err);
  }
}

export const protocolStore = {
  getState(): ProtocolState {
    return loadState();
  },

  subscribe(callback: () => void): () => void {
    if (typeof window === "undefined") return () => {};
    const handler = () => callback();
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener("storage", handler);
    };
  },

  setStage(stage: EventStage) {
    const state = loadState();
    state.stage = stage;
    saveState(state);
  },

  setContractAddress(addr: Address) {
    const state = loadState();
    state.contractAddress = addr;
    saveState(state);
  },

  isRegistered(address?: string): boolean {
    if (!address) return false;
    const state = loadState();
    const record = state.attendees[address.toLowerCase()];
    return Boolean(record);
  },

  getAttendee(address?: string): AttendeeRecord | null {
    if (!address) return null;
    const state = loadState();
    const record = state.attendees[address.toLowerCase()];
    if (!record) return null;

    // Dynamically derive no-show status if checkin deadline passed and attendee hasn't checked in
    if (record.status === "registered" && state.stage === "checkin-closed") {
      return {
        ...record,
        status: "no-show",
      };
    }
    return record;
  },

  getAllAttendees(): AttendeeRecord[] {
    const state = loadState();
    return Object.values(state.attendees).map((record) => {
      if (record.status === "registered" && state.stage === "checkin-closed") {
        return { ...record, status: "no-show" };
      }
      return record;
    });
  },

  getSummary(): EventSummary & {
    totalSettled: number;
    stage: EventStage;
    contractBalance: string;
    organizerRevenue: string;
    platformRevenue: string;
  } {
    const state = loadState();
    const all = this.getAllAttendees();
    const registered = all.length;
    const checkedIn = all.filter((a) => a.status === "refunded").length;
    const settled = all.filter((a) => a.status === "settled").length;
    // No-show is participants who didn't check in
    const noShow = all.filter((a) => a.status === "no-show" || a.status === "settled").length;

    // Contract holds 1 MON per attendee still in 'registered' (before check-in or settle)
    const lockedMon = all.filter((a) => a.status === "registered" || a.status === "no-show").length;
    // 80% to organizer, 20% to platform for settled no-shows
    const organizerRev = (settled * 0.8).toFixed(1);
    const platformRev = (settled * 0.2).toFixed(1);

    return {
      registered,
      checkedIn,
      noShow,
      totalSettled: settled,
      stage: state.stage,
      contractBalance: `${lockedMon} MON`,
      organizerRevenue: `${organizerRev} MON`,
      platformRevenue: `${platformRev} MON`,
    };
  },

  register(address: Address, name?: string): { success: boolean; message: string; txHash?: string } {
    const state = loadState();
    const key = address.toLowerCase();

    if (state.attendees[key]) {
      return {
        success: false,
        message: "Wallet ini sudah terdaftar untuk event ini. 1 wallet hanya dapat mendaftar 1 kali.",
      };
    }

    const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

    state.attendees[key] = {
      address,
      name: name || `Peserta (${address.slice(0, 6)}…${address.slice(-4)})`,
      status: "registered",
      registeredAt: Date.now(),
      txHash,
    };

    saveState(state);
    return {
      success: true,
      message: "Berhasil mengunci 1 MON! Tiket event kamu sudah aktif.",
      txHash,
    };
  },

  checkIn(attendeeAddress: Address): { success: boolean; message: string; txHash?: string } {
    const state = loadState();
    const key = attendeeAddress.toLowerCase();
    const attendee = state.attendees[key];

    if (!attendee) {
      return {
        success: false,
        message: "Alamat wallet tidak ditemukan dalam daftar registrasi.",
      };
    }

    if (attendee.status === "refunded") {
      return {
        success: false,
        message: "Peserta ini sudah melakukan check-in sebelumnya. Deposit 1 MON sudah dikembalikan.",
      };
    }

    if (attendee.status === "settled") {
      return {
        success: false,
        message: "Peserta ini sudah diselesaikan sebagai no-show. Tidak dapat melakukan check-in.",
      };
    }

    const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

    state.attendees[key] = {
      ...attendee,
      status: "refunded",
      checkedInAt: Date.now(),
      txHash,
    };

    saveState(state);
    return {
      success: true,
      message: `Check-in berhasil! 100% deposit (1 MON) telah dikembalikan ke wallet ${attendeeAddress.slice(0, 6)}…${attendeeAddress.slice(-4)}.`,
      txHash,
    };
  },

  settleNoShow(attendeeAddress: Address): { success: boolean; message: string; txHash?: string } {
    const state = loadState();
    const key = attendeeAddress.toLowerCase();
    const attendee = state.attendees[key];

    if (!attendee) {
      return {
        success: false,
        message: "Alamat wallet tidak ditemukan.",
      };
    }

    if (attendee.status === "refunded") {
      return {
        success: false,
        message: "Peserta hadir dan sudah di-refund. Tidak dapat dikenakan penalti no-show.",
      };
    }

    if (attendee.status === "settled") {
      return {
        success: false,
        message: "Deposit no-show untuk peserta ini sudah pernah diselesaikan.",
      };
    }

    const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

    state.attendees[key] = {
      ...attendee,
      status: "settled",
      settledAt: Date.now(),
      txHash,
    };

    saveState(state);
    return {
      success: true,
      message: `Settlement no-show berhasil! Deposit 1 MON didistribusikan: 0.8 MON (80%) ke organizer & 0.2 MON (20%) ke NONGOL platform.`,
      txHash,
    };
  },

  settleBatchNoShow(addresses?: Address[]): { success: boolean; count: number; message: string } {
    const state = loadState();
    const targets = addresses
      ? addresses.map((a) => a.toLowerCase())
      : Object.keys(state.attendees).filter(
          (k) => state.attendees[k].status === "registered" || state.attendees[k].status === "no-show"
        );

    let count = 0;
    const now = Date.now();

    for (const key of targets) {
      const att = state.attendees[key];
      if (att && att.status !== "refunded" && att.status !== "settled") {
        state.attendees[key] = {
          ...att,
          status: "settled",
          settledAt: now,
        };
        count++;
      }
    }

    if (count > 0) {
      saveState(state);
    }

    return {
      success: count > 0,
      count,
      message:
        count > 0
          ? `Berhasil menyelesaikan ${count} peserta no-show. Total deposit didistribusikan 80/20.`
          : "Tidak ada peserta no-show yang perlu diselesaikan.",
    };
  },

  resetToDefault() {
    const def = getDefaultState();
    saveState(def);
  },
};

import type { Address } from "viem";
import { featuredEvent, type EventItem } from "./event";
import type { AttendanceStatus, EventSummary } from "./view-models";

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

export interface EventStoreData {
  config: EventItem;
  stage: EventStage;
  attendees: Record<string, AttendeeRecord>;
  organizerAddress: Address;
  contractAddress?: Address;
}

const STORAGE_KEY = "nongol_protocol_state_v2";
const EVENT_NAME = "nongol_protocol_updated";

// Default seed attendees for the initial featured event
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
  events: Record<string, EventStoreData>;
  activeEventId: string;
}

function getDefaultState(): ProtocolState {
  const attendees: Record<string, AttendeeRecord> = {};
  for (const att of DEFAULT_ATTENDEES) {
    attendees[att.address.toLowerCase()] = att;
  }

  const initialEvent: EventStoreData = {
    config: featuredEvent,
    stage: "checkin-open",
    attendees,
    organizerAddress: "0x1111111111111111111111111111111111111111" as Address,
    contractAddress: (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as Address) || "0x9876543210987654321098765432109876543210",
  };

  return {
    events: {
      [featuredEvent.id]: initialEvent,
    },
    activeEventId: featuredEvent.id,
  };
}

function loadState(): ProtocolState {
  if (typeof window === "undefined") return getDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Check if v1 state exists to migrate
      const rawV1 = localStorage.getItem("nongol_protocol_state_v1");
      if (rawV1) {
        try {
          const old = JSON.parse(rawV1);
          const migrated = getDefaultState();
          if (old.attendees) migrated.events[featuredEvent.id].attendees = old.attendees;
          if (old.stage) migrated.events[featuredEvent.id].stage = old.stage;
          if (old.contractAddress) migrated.events[featuredEvent.id].contractAddress = old.contractAddress;
          saveState(migrated);
          return migrated;
        } catch {
          // fallback to default
        }
      }
      const def = getDefaultState();
      saveState(def);
      return def;
    }
    const parsed = JSON.parse(raw);
    if (!parsed.events || !parsed.activeEventId) {
      return getDefaultState();
    }
    return parsed;
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

  getAllEvents(): EventItem[] {
    const state = loadState();
    return Object.values(state.events).map((e) => e.config);
  },

  getActiveEventId(): string {
    const state = loadState();
    return state.activeEventId || featuredEvent.id;
  },

  getActiveEvent(): EventItem {
    const state = loadState();
    const event = state.events[state.activeEventId] || state.events[featuredEvent.id];
    return event ? event.config : featuredEvent;
  },

  setActiveEventId(eventId: string) {
    const state = loadState();
    if (state.events[eventId]) {
      state.activeEventId = eventId;
      saveState(state);
    }
  },

  createEvent(input: Omit<EventItem, "id"> & { id?: string; organizerAddress?: Address }): EventItem {
    const state = loadState();
    const slug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const id = input.id || `${slug || "event"}-${Date.now().toString(36)}`;

    const newConfig: EventItem = {
      ...input,
      id,
      image: input.image || "/nongol-meetup.jpg",
      createdAt: Date.now(),
    };

    const newEventStore: EventStoreData = {
      config: newConfig,
      stage: "registration-open",
      attendees: {},
      organizerAddress: input.organizerAddress || ("0x1111111111111111111111111111111111111111" as Address),
      contractAddress: (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as Address) || "0x9876543210987654321098765432109876543210",
    };

    state.events[id] = newEventStore;
    state.activeEventId = id;
    saveState(state);
    return newConfig;
  },

  deleteEvent(eventId: string): boolean {
    const state = loadState();
    if (Object.keys(state.events).length <= 1) {
      return false; // Don't delete if it's the only event
    }
    delete state.events[eventId];
    if (state.activeEventId === eventId) {
      state.activeEventId = Object.keys(state.events)[0];
    }
    saveState(state);
    return true;
  },

  setStage(stage: EventStage, eventId?: string) {
    const state = loadState();
    const targetId = eventId || state.activeEventId;
    if (state.events[targetId]) {
      state.events[targetId].stage = stage;
      saveState(state);
    }
  },

  setContractAddress(addr: Address, eventId?: string) {
    const state = loadState();
    const targetId = eventId || state.activeEventId;
    if (state.events[targetId]) {
      state.events[targetId].contractAddress = addr;
      saveState(state);
    }
  },

  isRegistered(address?: string, eventId?: string): boolean {
    if (!address) return false;
    const state = loadState();
    const targetId = eventId || state.activeEventId;
    const event = state.events[targetId];
    if (!event) return false;
    return Boolean(event.attendees[address.toLowerCase()]);
  },

  getAttendee(address?: string, eventId?: string): AttendeeRecord | null {
    if (!address) return null;
    const state = loadState();
    const targetId = eventId || state.activeEventId;
    const event = state.events[targetId];
    if (!event) return null;

    const record = event.attendees[address.toLowerCase()];
    if (!record) return null;

    if (record.status === "registered" && event.stage === "checkin-closed") {
      return {
        ...record,
        status: "no-show",
      };
    }
    return record;
  },

  getAllAttendees(eventId?: string): AttendeeRecord[] {
    const state = loadState();
    const targetId = eventId || state.activeEventId;
    const event = state.events[targetId];
    if (!event) return [];

    return Object.values(event.attendees).map((record) => {
      if (record.status === "registered" && event.stage === "checkin-closed") {
        return { ...record, status: "no-show" };
      }
      return record;
    });
  },

  getSummary(eventId?: string): EventSummary & {
    totalSettled: number;
    stage: EventStage;
    contractBalance: string;
    organizerRevenue: string;
    platformRevenue: string;
    eventConfig: EventItem;
  } {
    const state = loadState();
    const targetId = eventId || state.activeEventId;
    const event = state.events[targetId] || state.events[featuredEvent.id];

    if (!event) {
      return {
        registered: 0,
        checkedIn: 0,
        noShow: 0,
        totalSettled: 0,
        stage: "checkin-open",
        contractBalance: "0 MON",
        organizerRevenue: "0.0 MON",
        platformRevenue: "0.0 MON",
        eventConfig: featuredEvent,
      };
    }

    const all = Object.values(event.attendees).map((record) => {
      if (record.status === "registered" && event.stage === "checkin-closed") {
        return { ...record, status: "no-show" };
      }
      return record;
    });

    const registered = all.length;
    const checkedIn = all.filter((a) => a.status === "refunded").length;
    const settled = all.filter((a) => a.status === "settled").length;
    const noShow = all.filter((a) => a.status === "no-show" || a.status === "settled").length;
    const lockedMon = all.filter((a) => a.status === "registered" || a.status === "no-show").length;
    const organizerRev = (settled * 0.8).toFixed(1);
    const platformRev = (settled * 0.2).toFixed(1);

    return {
      registered,
      checkedIn,
      noShow,
      totalSettled: settled,
      stage: event.stage,
      contractBalance: `${lockedMon} MON`,
      organizerRevenue: `${organizerRev} MON`,
      platformRevenue: `${platformRev} MON`,
      eventConfig: event.config,
    };
  },

  register(address: Address, name?: string, eventId?: string): { success: boolean; message: string; txHash?: string } {
    const state = loadState();
    const targetId = eventId || state.activeEventId;
    const event = state.events[targetId];

    if (!event) {
      return { success: false, message: "Event tidak ditemukan." };
    }

    const key = address.toLowerCase();
    if (event.attendees[key]) {
      return {
        success: false,
        message: "Wallet ini sudah terdaftar untuk event ini. 1 wallet hanya dapat mendaftar 1 kali.",
      };
    }

    const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

    event.attendees[key] = {
      address,
      name: name || `Peserta (${address.slice(0, 6)}…${address.slice(-4)})`,
      status: "registered",
      registeredAt: Date.now(),
      txHash,
    };

    saveState(state);
    return {
      success: true,
      message: `Berhasil mengunci ${event.config.depositLabel || "1 MON"}! Tiket event kamu sudah aktif.`,
      txHash,
    };
  },

  checkIn(attendeeAddress: Address, eventId?: string): { success: boolean; message: string; txHash?: string } {
    const state = loadState();
    const targetId = eventId || state.activeEventId;
    const event = state.events[targetId];

    if (!event) {
      return { success: false, message: "Event tidak ditemukan." };
    }

    const key = attendeeAddress.toLowerCase();
    const attendee = event.attendees[key];

    if (!attendee) {
      return {
        success: false,
        message: "Alamat wallet tidak ditemukan dalam daftar registrasi event ini.",
      };
    }

    if (attendee.status === "refunded") {
      return {
        success: false,
        message: "Peserta ini sudah melakukan check-in sebelumnya. Deposit sudah dikembalikan.",
      };
    }

    if (attendee.status === "settled") {
      return {
        success: false,
        message: "Peserta ini sudah diselesaikan sebagai no-show. Tidak dapat melakukan check-in.",
      };
    }

    const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

    event.attendees[key] = {
      ...attendee,
      status: "refunded",
      checkedInAt: Date.now(),
      txHash,
    };

    saveState(state);
    return {
      success: true,
      message: `Check-in berhasil! 100% deposit (${event.config.depositLabel || "1 MON"}) telah dikembalikan ke wallet ${attendeeAddress.slice(0, 6)}…${attendeeAddress.slice(-4)}.`,
      txHash,
    };
  },

  settleNoShow(attendeeAddress: Address, eventId?: string): { success: boolean; message: string; txHash?: string } {
    const state = loadState();
    const targetId = eventId || state.activeEventId;
    const event = state.events[targetId];

    if (!event) {
      return { success: false, message: "Event tidak ditemukan." };
    }

    const key = attendeeAddress.toLowerCase();
    const attendee = event.attendees[key];

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

    event.attendees[key] = {
      ...attendee,
      status: "settled",
      settledAt: Date.now(),
      txHash,
    };

    saveState(state);
    return {
      success: true,
      message: `Settlement no-show berhasil! Deposit didistribusikan: 80% ke organizer & 20% ke NONGOL platform.`,
      txHash,
    };
  },

  settleBatchNoShow(addresses?: Address[], eventId?: string): { success: boolean; count: number; message: string } {
    const state = loadState();
    const targetId = eventId || state.activeEventId;
    const event = state.events[targetId];

    if (!event) {
      return { success: false, count: 0, message: "Event tidak ditemukan." };
    }

    const targets = addresses
      ? addresses.map((a) => a.toLowerCase())
      : Object.keys(event.attendees).filter(
          (k) => event.attendees[k].status === "registered" || event.attendees[k].status === "no-show"
        );

    let count = 0;
    const now = Date.now();

    for (const key of targets) {
      const att = event.attendees[key];
      if (att && att.status !== "refunded" && att.status !== "settled") {
        event.attendees[key] = {
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

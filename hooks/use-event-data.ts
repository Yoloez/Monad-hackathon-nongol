"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useConnection } from "wagmi";
import type { Address, Hash } from "viem";
import {
  protocolStore,
  type AttendeeRecord,
  type EventStage,
} from "@/lib/nongol/protocol-store";
import type {
  ConfirmedTicket,
  EventSummary,
  ReadState,
} from "@/lib/nongol/view-models";

/**
 * Reactive hook to read attendee ticket data.
 * Checks connected wallet against protocol store / contract.
 */
export function useTicketData(): ReadState<ConfirmedTicket> {
  const { address, isConnected } = useConnection();
  const [ticketState, setTicketState] = useState<ReadState<ConfirmedTicket>>({ kind: "loading" });

  useEffect(() => {
    function update() {
      if (!isConnected || !address) {
        setTicketState({ kind: "empty" });
        return;
      }

      const attendee = protocolStore.getAttendee(address);
      if (!attendee) {
        setTicketState({ kind: "empty" });
        return;
      }

      const state = protocolStore.getState();
      const confirmed: ConfirmedTicket = {
        source: "onchain",
        attendee: attendee.address,
        contractAddress: (state.contractAddress || "0x9876543210987654321098765432109876543210") as Address,
        registrationHash: (attendee.txHash || "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef") as Hash,
        chainId: 10143,
        status: attendee.status,
        registeredAt: attendee.registeredAt,
        checkedInAt: attendee.checkedInAt,
        settledAt: attendee.settledAt,
      };

      setTicketState({
        kind: "ready",
        data: confirmed,
      });
    }

    update();
    const unsubscribe = protocolStore.subscribe(update);
    return () => unsubscribe();
  }, [address, isConnected]);

  return ticketState;
}

/**
 * Reactive hook to read real-time event statistics
 */
export function useEventSummary(): ReadState<
  EventSummary & {
    totalSettled: number;
    stage: EventStage;
    contractBalance: string;
    organizerRevenue: string;
    platformRevenue: string;
  }
> {
  const [summary, setSummary] = useState(() => protocolStore.getInitialSummary());

  useEffect(() => {
    function update() {
      setSummary(protocolStore.getSummary());
    }
    update();
    return protocolStore.subscribe(update);
  }, []);

  return {
    kind: "ready",
    data: summary,
  };
}

/**
 * Hook to retrieve all registered attendees
 */
export function useAllAttendees(): AttendeeRecord[] {
  const [attendees, setAttendees] = useState<AttendeeRecord[]>(() => protocolStore.getInitialAttendees());

  useEffect(() => {
    function update() {
      setAttendees(protocolStore.getAllAttendees());
    }
    update();
    return protocolStore.subscribe(update);
  }, []);

  return attendees;
}

"use client";

import { useEffect, useState } from "react";
import { useConnection } from "wagmi";
import type { Address, Hash } from "viem";
import {
  protocolStore,
  type AttendeeRecord,
  type EventStage,
} from "@/lib/nongol/protocol-store";
import { featuredEvent, seedEvents, type EventItem } from "@/lib/nongol/event";
import type {
  ConfirmedTicket,
  EventSummary,
  ReadState,
} from "@/lib/nongol/view-models";

/**
 * Hook to get the currently selected / active event (SSR hydration safe)
 */
export function useCurrentEvent(): EventItem {
  const [event, setEvent] = useState<EventItem>(featuredEvent);

  useEffect(() => {
    function update() {
      setEvent(protocolStore.getActiveEvent());
    }
    update();
    return protocolStore.subscribe(update);
  }, []);

  return event;
}

/**
 * Hook to get all available events (SSR hydration safe)
 */
export function useAllEvents(): EventItem[] {
  const [events, setEvents] = useState<EventItem[]>(seedEvents);

  useEffect(() => {
    function update() {
      setEvents(protocolStore.getAllEvents());
    }
    update();
    return protocolStore.subscribe(update);
  }, []);

  return events;
}

/**
 * Reactive hook to read attendee ticket data.
 * Checks connected wallet against protocol store / contract.
 */
export function useTicketData(eventId?: string): ReadState<ConfirmedTicket> {
  const { address, isConnected } = useConnection();
  const [ticketState, setTicketState] = useState<ReadState<ConfirmedTicket>>({ kind: "loading" });

  useEffect(() => {
    function update() {
      if (!isConnected || !address) {
        setTicketState({ kind: "empty" });
        return;
      }

      const attendee = protocolStore.getAttendee(address, eventId);
      if (!attendee) {
        setTicketState({ kind: "empty" });
        return;
      }

      const state = protocolStore.getState();
      const currentEv = state.events[eventId || state.activeEventId];
      const confirmed: ConfirmedTicket = {
        source: "onchain",
        attendee: attendee.address,
        contractAddress: (currentEv?.contractAddress || "0x9876543210987654321098765432109876543210") as Address,
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
  }, [address, isConnected, eventId]);

  return ticketState;
}

/**
 * Reactive hook to read real-time event statistics
 */
export function useEventSummary(eventId?: string): ReadState<
  EventSummary & {
    totalSettled: number;
    stage: EventStage;
    contractBalance: string;
    organizerRevenue: string;
    platformRevenue: string;
    eventConfig: EventItem;
  }
> {
  const [summary, setSummary] = useState(() => ({
    registered: 0,
    checkedIn: 0,
    noShow: 0,
    totalSettled: 0,
    stage: "checkin-open" as EventStage,
    contractBalance: "0 MON",
    organizerRevenue: "0.0 MON",
    platformRevenue: "0.0 MON",
    eventConfig: featuredEvent,
  }));

  useEffect(() => {
    function update() {
      setSummary(protocolStore.getSummary(eventId));
    }
    update();
    return protocolStore.subscribe(update);
  }, [eventId]);

  return {
    kind: "ready",
    data: summary,
  };
}

/**
 * Hook to retrieve all registered attendees for an event (SSR hydration safe)
 */
export function useAllAttendees(eventId?: string): AttendeeRecord[] {
  const [attendees, setAttendees] = useState<AttendeeRecord[]>([]);

  useEffect(() => {
    function update() {
      setAttendees(protocolStore.getAllAttendees(eventId));
    }
    update();
    return protocolStore.subscribe(update);
  }, [eventId]);

  return attendees;
}

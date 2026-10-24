import type { Metadata } from "next";
import { TicketScreen } from "@/components/ticket/ticket-screen";

export const metadata: Metadata = { title: "My Ticket" };

export default function TicketPage() {
  return <TicketScreen />;
}

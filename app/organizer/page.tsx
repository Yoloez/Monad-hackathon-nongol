import type { Metadata } from "next";
import { OrganizerScreen } from "@/components/organizer/organizer-screen";

export const metadata: Metadata = { title: "Organizer" };

export default function OrganizerPage() {
  return <OrganizerScreen />;
}

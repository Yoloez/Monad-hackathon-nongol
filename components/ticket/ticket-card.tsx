import { Brand } from "@/components/ui/brand";
import { Icon } from "@/components/ui/icon";
import { featuredEvent, type EventItem } from "@/lib/nongol/event";
import {
  attendanceLabels,
  shortAddress,
  type TicketViewModel,
} from "@/lib/nongol/view-models";
import { TicketQr } from "./ticket-qr";

export function TicketCard({
  ticket,
  event = featuredEvent,
}: {
  ticket: TicketViewModel;
  event?: EventItem;
}) {
  const status = attendanceLabels[ticket.status];
  const demo = ticket.source === "demo";
  return (
    <article
      className={`attendance-ticket ${demo ? "demo-ticket" : ""}`}
      aria-label={
        demo
          ? "Contoh tiket, bukan tiket valid"
          : "Tiket registrasi terkonfirmasi"
      }
    >
      <div className="attendance-ticket-top">
        <Brand />
        <span className="ticket-caption">
          {demo ? "DEMO · BUKAN TIKET VALID" : "REGISTRASI TERKONFIRMASI"}
        </span>
        <h2>{event.name}</h2>
        <p>
          <Icon name="calendar" size={15} />
          {event.dateLabel} · {event.timeLabel}
        </p>
        <p>
          <Icon name="pin" size={15} />
          {event.location}
        </p>
      </div>
      <div className="ticket-perforation" />
      <div className="attendance-ticket-body">
        <div className="ticket-details">
          <div>
            <span className="field-label">
              Wallet peserta{demo ? " contoh" : ""}
            </span>
            <strong
              className="wallet-address"
              title={demo ? undefined : ticket.attendee}
            >
              {demo ? ticket.walletLabel : shortAddress(ticket.attendee)}
            </strong>
          </div>
          <div>
            <span className="field-label">Deposit kehadiran</span>
            <strong className="ticket-deposit">{event.depositLabel || "1 MON"}</strong>
          </div>
          <span className={`badge ${status.tone}`}>{status.title}</span>
        </div>
        <TicketQr ticket={ticket} event={event} />
      </div>
      <div className="ticket-status" role="status">
        <span className={`status-dot ${status.tone}`} />
        <p>
          {demo && <strong>Contoh tampilan: </strong>}
          {status.description}
        </p>
      </div>
      <div className="ticket-instructions">
        {demo
          ? "QR ini hanya untuk preview desain dan tidak bisa digunakan untuk check-in."
          : "Tunjukkan QR ini kepada organizer saat tiba. Tiket berlaku untuk satu kali check-in."}
      </div>
    </article>
  );
}

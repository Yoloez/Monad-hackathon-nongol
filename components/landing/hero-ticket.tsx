import { Brand } from "@/components/ui/brand";
import { TicketQr } from "@/components/ticket/ticket-qr";

export function HeroTicket() {
  return (
    <div className="ticket-scene">
      <div
        className="hero-ticket"
        aria-label="Ilustrasi tiket NONGOL, bukan bukti registrasi"
      >
        <div className="ticket-purple">
          <Brand />
          <h2>
            Less wacana.
            <br />
            More <span>nongol.</span>
          </h2>
          <p>Satu komitmen. Banyak koneksi baru.</p>
        </div>
        <div className="ticket-perforation" />
        <div className="pass-stub">
          <div>
            <span className="stub-label">Deposit kehadiran</span>
            <strong>1 MON</strong>
            <span className="stub-footer">Datang. Check-in. Duit balik.</span>
          </div>
          <TicketQr
            ticket={{
              source: "demo",
              walletLabel: "Ilustrasi",
              status: "registered",
            }}
            size={82}
          />
        </div>
      </div>
    </div>
  );
}

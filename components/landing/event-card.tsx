import Image from "next/image";
import { featuredEvent as event } from "@/lib/nongol/event";
import { Icon } from "@/components/ui/icon";

export function EventCard() {
  return (
    <article className="featured-event" aria-labelledby="featured-event-name">
      <div className="event-image">
        <Image
          src={event.image}
          alt="Peserta berkumpul di ruang konferensi, foto ilustrasi event dari prototipe NONGOL"
          fill
          sizes="(max-width: 767px) 100vw, 50vw"
          className="event-photo"
        />
        <div className="image-shade" />
        <div className="image-title">
          <span>Ketemu. Terhubung. Nongol.</span>
          <h3>{event.name}</h3>
          <span>{event.location}</span>
        </div>
      </div>
      <div className="event-detail">
        <p className="event-organizer">
          Oleh <strong>{event.organizer}</strong>
        </p>
        <h3 id="featured-event-name">{event.name}</h3>
        <p className="event-description">{event.description}</p>
        <div className="event-facts">
          <div>
            <Icon name="calendar" />
            <span>{event.dateLabel}</span>
          </div>
          <div>
            <Icon name="clock" />
            <span>{event.timeLabel}</span>
          </div>
          <div>
            <Icon name="pin" />
            <span>{event.location}</span>
          </div>
          <div>
            <Icon name="users" />
            <span>
              Kapasitas {event.capacity} peserta · jumlah terdaftar belum
              tersedia
            </span>
          </div>
        </div>
        <p className="sample-note">
          Detail event contoh dari desain · jadwal final menyusul.
        </p>
        <div className="deposit-area">
          <div>
            <span className="field-label">Komitmen kehadiran</span>
            <strong>{event.depositLabel}</strong>
          </div>
          <span className="success-text small">100% refundable</span>
          <p>Datang dan check-in, deposit kembali. Bukan biaya tiket.</p>
        </div>
        <p className="consequence">
          Tidak check-in hingga batas waktu? Deposit hangus.
        </p>
        <button
          type="button"
          className="button primary full"
          disabled
          aria-describedby="registration-note"
        >
          Kunci {event.depositLabel}
          <Icon name="arrow-up-right" />
        </button>
        <p className="gas-note" id="registration-note">
          Registrasi belum tersedia. Belum ada dana yang dikirim.
        </p>
        <div className="event-deadlines">
          <p>Daftar sebelum {event.registrationDeadlineLabel}.</p>
          <p>Check-in: {event.checkInLabel}.</p>
          <p>Peserta tetap membutuhkan saldo untuk biaya gas.</p>
        </div>
      </div>
    </article>
  );
}

import { EventCard } from "@/components/landing/event-card";
import { HeroTicket } from "@/components/landing/hero-ticket";
import { MonadMark } from "@/components/ui/brand";
import { Icon } from "@/components/ui/icon";

const steps = [
  {
    title: "Kunci 1 MON",
    description: "Daftar event dengan deposit sebagai tanda komitmen.",
  },
  {
    title: "Nongol di Event",
    description: "Datang ke lokasi dan tunjukkan QR tiketmu ke organizer.",
  },
  {
    title: "Deposit Balik!",
    description: "Check-in dikonfirmasi, 1 MON kembali ke wallet kamu.",
  },
];

export default function Home() {
  return (
    <>
      <section className="hero container" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title">
            Jangan cuma
            <br />
            daftar.{" "}
            <span>
              Beneran
              <br />
              nongol.
            </span>
          </h1>
          <p>
            Kunci 1 MON. Datang ke event. Deposit balik.
            <br />
            Karena koneksi yang nyata dimulai dari hadir.
          </p>
          <div className="hero-actions">
            <a href="#event" className="button primary">
              Lihat Event
              <Icon name="arrow-right" />
            </a>
            <span className="built-on">
              Built on <MonadMark />
            </span>
          </div>
        </div>
        <HeroTicket />
      </section>
      <section
        className="event-section container"
        id="event"
        aria-labelledby="event-title"
      >
        <div className="section-heading">
          <div>
            <h2 id="event-title">Yang ini, jangan diwacanain.</h2>
            <p>Ketemu komunitasnya. Bangun koneksinya. Buktiin komitmennya.</p>
          </div>
        </div>
        <EventCard />
      </section>
      <section className="how-section container" aria-labelledby="how-title">
        <div className="section-heading">
          <h2 id="how-title">Tiga langkah. Nol wacana.</h2>
          <p>
            Gak ribet. Gak pakai drama.
            <br />
            Cukup buktiin kalau kamu bakal datang.
          </p>
        </div>
        <ol className="steps">
          {steps.map((step, index) => (
            <li className="step" key={step.title}>
              <span className="step-number">0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
        <p className="distribution-note">
          Komitmen yang transparan. Deposit no-show didistribusikan:{" "}
          <strong>50% kembali ke peserta</strong>,{" "}
          <strong>35% untuk organizer</strong>, dan{" "}
          <strong>15% untuk NONGOL</strong>.
        </p>
      </section>
    </>
  );
}

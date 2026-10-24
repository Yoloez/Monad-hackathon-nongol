export interface EventItem {
  id: string;
  name: string;
  organizer: string;
  description: string;
  location: string;
  image: string;
  dateLabel: string;
  timeLabel: string;
  registrationDeadlineLabel: string;
  checkInLabel: string;
  capacity: number;
  depositLabel: string;
  isSample?: boolean;
  createdAt?: number;
}

/** Initial featured event from the reference design */
export const featuredEvent: EventItem = {
  id: "monad-builder-meetup",
  name: "Monad Builder Meetup Jogja",
  organizer: "Monad Community ID",
  description: "Meetup komunitas builder Monad di Yogyakarta untuk sharing arsitektur async execution dan networking.",
  location: "Yogyakarta, Indonesia",
  image: "/nongol-meetup.jpg",
  dateLabel: "21 Agustus 2027",
  timeLabel: "14:00–17:00 WIB",
  registrationDeadlineLabel: "20 Agustus 2027, 14:00 WIB",
  checkInLabel: "21 Agustus 2027, 14:00–17:00 WIB",
  capacity: 100,
  depositLabel: "1 MON",
  isSample: true,
  createdAt: 1700000000000,
};

export const seedEvents: EventItem[] = [
  featuredEvent,
  {
    id: "monad-hackathon-2026",
    name: "Monad Blitz Hackathon 2026",
    organizer: "Monad Foundation",
    description: "Hackathon offline 48 jam untuk membangun dApps berkecepatan tinggi di atas jaringan Monad EVM.",
    location: "Jakarta, Indonesia",
    image: "/nongol-meetup.jpg",
    dateLabel: "14 November 2026",
    timeLabel: "09:00–21:00 WIB",
    registrationDeadlineLabel: "12 November 2026, 23:59 WIB",
    checkInLabel: "14 November 2026, 08:30–10:30 WIB",
    capacity: 150,
    depositLabel: "1 MON",
    isSample: true,
    createdAt: 1700001000000,
  },
  {
    id: "monad-defi-workshop",
    name: "Monad High-Throughput DeFi Workshop",
    organizer: "Web3 Developer Hub",
    description: "Workshop hands-on implementasi smart contract paralel dan optimasi gas limit di Monad.",
    location: "Bandung, Indonesia",
    image: "/nongol-meetup.jpg",
    dateLabel: "5 Desember 2026",
    timeLabel: "13:00–16:30 WIB",
    registrationDeadlineLabel: "3 Desember 2026, 23:59 WIB",
    checkInLabel: "5 Desember 2026, 12:30–13:30 WIB",
    capacity: 60,
    depositLabel: "1 MON",
    isSample: true,
    createdAt: 1700002000000,
  },
];

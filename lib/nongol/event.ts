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
  depositAmount?: number;
  organizerAddress?: string;
  contractAddress?: string;
  isSample?: boolean;
  createdAt?: number;
}

/** Initial featured event from the reference design */
export const featuredEvent: EventItem = {
  id: "monad-builder-meetup",
  name: "Monad Builder Meetup",
  organizer: "Monad Community",
  description: "Meetup komunitas builder Monad di Yogyakarta.",
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

export enum ReservationStatus {
  Pending = 'Pending',
  Confirmed = 'Confirmed',
  Seated = 'Seated',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export enum TableStatus {
  Available = 'Available',
  Occupied = 'Occupied',
  Reserved = 'Reserved',
}

export type Zone = 'Indoors' | 'Outdoors' | 'Terrace' | 'Private';

export interface Reservation {
  id: string | number;
  customerName: string;
  phone: string;
  partySize: number;
  dateTime: string;
  status: ReservationStatus;
  notes?: string;
  tableId?: number;
  notification_sent?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Table {
  id: number;
  name: string;
  capacity: number;
  zone: Zone;
  status: TableStatus;
  created_at?: string;
  updated_at?: string;
}

export interface Settings {
  id?: number;
  restaurantName: string;
  email: string;
  phone: string;
  address: string;
  maxBookingDays: number;
  minBookingHours: number;
  defaultBookingDuration: number;
  maxPartySize: number;
  walkInTables: number;
  maxOccupancyPercent: number;
  zones: {
    Indoors: boolean;
    Outdoors: boolean;
    Terrace: boolean;
    Private: boolean;
  };
  openingHours: {
    [day: string]: {
      isOpen: boolean;
      lunchStart?: string;
      lunchEnd?: string;
      dinnerStart?: string;
      dinnerEnd?: string;
    };
  };
  created_at?: string;
  updated_at?: string;
}

export interface OpeningHours {
  id?: number;
  dayOfWeek: string;
  isOpen: boolean;
  lunchStart?: string;
  lunchEnd?: string;
  dinnerStart?: string;
  dinnerEnd?: string;
  created_at?: string;
  updated_at?: string;
}

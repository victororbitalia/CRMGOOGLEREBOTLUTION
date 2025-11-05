// Client-side database utilities that work with mock data only
// This file replaces server-side database calls for the browser environment

import { Reservation, Table, Settings, ReservationStatus, TableStatus, Zone } from '../types';

// Mock data for client-side
const mockReservations: Reservation[] = [
  { id: '1', customerName: 'Alice Johnson', phone: '555-1234', partySize: 2, dateTime: new Date(new Date().setHours(19, 0, 0, 0)).toISOString(), status: ReservationStatus.Confirmed, tableId: 2, notes: 'Window seat preferred', notification_sent: true },
  { id: '2', customerName: 'Bob Williams', phone: '555-5678', partySize: 4, dateTime: new Date(new Date().setHours(20, 0, 0, 0)).toISOString(), status: ReservationStatus.Pending, notification_sent: false },
  { id: '3', customerName: 'Charlie Brown', phone: '555-8765', partySize: 3, dateTime: new Date(new Date().setHours(18, 30, 0, 0)).toISOString(), status: ReservationStatus.Seated, tableId: 5, notification_sent: true },
  { id: '4', customerName: 'Diana Prince', phone: '555-4321', partySize: 5, dateTime: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), status: ReservationStatus.Completed, tableId: 10, notification_sent: false },
];

const mockTables: Table[] = [
  { id: 1, name: 'T1', capacity: 2, zone: 'Indoors', status: TableStatus.Available },
  { id: 2, name: 'T2', capacity: 2, zone: 'Indoors', status: TableStatus.Reserved },
  { id: 3, name: 'T3', capacity: 4, zone: 'Indoors', status: TableStatus.Available },
  { id: 4, name: 'T4', capacity: 4, zone: 'Indoors', status: TableStatus.Available },
  { id: 5, name: 'T5', capacity: 4, zone: 'Indoors', status: TableStatus.Occupied },
  { id: 6, name: 'T6', capacity: 6, zone: 'Indoors', status: TableStatus.Available },
  { id: 7, name: 'O1', capacity: 2, zone: 'Outdoors', status: TableStatus.Available },
  { id: 8, name: 'O2', capacity: 4, zone: 'Outdoors', status: TableStatus.Available },
  { id: 9, name: 'P1', capacity: 8, zone: 'Private', status: TableStatus.Available },
  { id: 10, name: 'TR1', capacity: 4, zone: 'Terrace', status: TableStatus.Available },
];

const mockSettings: Settings = {
  id: 1,
  restaurantName: 'The Gourmet Place',
  email: 'contact@gourmetplace.com',
  phone: '555-0101',
  address: '123 Culinary Lane, Foodville',
  maxBookingDays: 30,
  minBookingHours: 2,
  defaultBookingDuration: 90,
  maxPartySize: 8,
  walkInTables: 2,
  maxOccupancyPercent: 80,
  zones: {
    Indoors: true,
    Outdoors: true,
    Terrace: true,
    Private: false,
  },
  openingHours: {
    Monday: { isOpen: true, lunchStart: '12:00', lunchEnd: '15:00', dinnerStart: '18:00', dinnerEnd: '22:00' },
    Tuesday: { isOpen: true, lunchStart: '12:00', lunchEnd: '15:00', dinnerStart: '18:00', dinnerEnd: '22:00' },
    Wednesday: { isOpen: true, lunchStart: '12:00', lunchEnd: '15:00', dinnerStart: '18:00', dinnerEnd: '22:00' },
    Thursday: { isOpen: true, lunchStart: '12:00', lunchEnd: '15:00', dinnerStart: '18:00', dinnerEnd: '22:00' },
    Friday: { isOpen: true, lunchStart: '12:00', lunchEnd: '15:00', dinnerStart: '18:00', dinnerEnd: '23:00' },
    Saturday: { isOpen: true, lunchStart: '12:00', lunchEnd: '16:00', dinnerStart: '18:00', dinnerEnd: '23:00' },
    Sunday: { isOpen: false },
  }
};

// Client-side reservation functions
export const getAllReservations = async (): Promise<Reservation[]> => {
  console.log('Using mock data for reservations');
  return mockReservations;
};

export const createReservation = async (reservation: Omit<Reservation, 'id' | 'created_at' | 'updated_at'>): Promise<Reservation | null> => {
  console.log('Creating mock reservation:', reservation);
  const newReservation = { ...reservation, id: Date.now().toString() };
  mockReservations.push(newReservation);
  return newReservation;
};

export const updateReservation = async (id: string | number, updates: Partial<Reservation>): Promise<Reservation | null> => {
  console.log('Updating mock reservation:', id, updates);
  const index = mockReservations.findIndex(r => r.id === id);
  if (index !== -1) {
    mockReservations[index] = { ...mockReservations[index], ...updates };
    return mockReservations[index];
  }
  return null;
};

export const deleteReservation = async (id: string | number): Promise<boolean> => {
  console.log('Deleting mock reservation:', id);
  const index = mockReservations.findIndex(r => r.id === id);
  if (index !== -1) {
    mockReservations.splice(index, 1);
    return true;
  }
  return false;
};

export const getTodayReservations = async (): Promise<Reservation[]> => {
  const today = new Date().toDateString();
  return mockReservations.filter(r => new Date(r.dateTime).toDateString() === today);
};

export const getUpcomingReservations = async (): Promise<Reservation[]> => {
  const now = new Date();
  return mockReservations
    .filter(r => new Date(r.dateTime) >= now)
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
};

export const updateReservationStatus = async (id: string | number, status: ReservationStatus): Promise<Reservation | null> => {
  return updateReservation(id, { status });
};

export const markNotificationSent = async (id: string | number): Promise<Reservation | null> => {
  return updateReservation(id, { notification_sent: true });
};

// Client-side table functions
export const getAllTables = async (): Promise<Table[]> => {
  console.log('Using mock data for tables');
  return mockTables;
};

export const createTable = async (table: Omit<Table, 'id' | 'created_at' | 'updated_at'>): Promise<Table | null> => {
  console.log('Creating mock table:', table);
  const newTable = { ...table, id: Date.now() };
  mockTables.push(newTable);
  return newTable;
};

export const updateTable = async (id: number, updates: Partial<Table>): Promise<Table | null> => {
  console.log('Updating mock table:', id, updates);
  const index = mockTables.findIndex(t => t.id === id);
  if (index !== -1) {
    mockTables[index] = { ...mockTables[index], ...updates };
    return mockTables[index];
  }
  return null;
};

export const deleteTable = async (id: number): Promise<boolean> => {
  console.log('Deleting mock table:', id);
  const index = mockTables.findIndex(t => t.id === id);
  if (index !== -1) {
    mockTables.splice(index, 1);
    return true;
  }
  return false;
};

export const getTablesByZone = async (zone: Zone): Promise<Table[]> => {
  return mockTables.filter(t => t.zone === zone);
};

export const getAvailableTables = async (): Promise<Table[]> => {
  return mockTables.filter(t => t.status === TableStatus.Available);
};

export const updateTableStatus = async (id: number, status: TableStatus): Promise<Table | null> => {
  return updateTable(id, { status });
};

// Client-side settings functions
export const getSettings = async (): Promise<Settings | null> => {
  console.log('Using mock data for settings');
  return mockSettings;
};

export const updateSettings = async (id: number, updates: Partial<Settings>): Promise<Settings | null> => {
  console.log('Updating mock settings:', id, updates);
  return { ...mockSettings, ...updates };
};

export const createInitialSettings = async (settings: Omit<Settings, 'id' | 'created_at' | 'updated_at'>): Promise<Settings | null> => {
  console.log('Creating mock settings:', settings);
  return { ...settings, id: 1 };
};

// Test connection function for client
export const testConnection = async (): Promise<boolean> => {
  console.log('Client-side: Always return true for mock data');
  return true;
};
import { useState } from 'react';
import { Reservation, Table, Settings, ReservationStatus, TableStatus, Zone } from '../types';

// Mock data for development when database is not available
const mockReservations: Reservation[] = [
  { id: '1', customerName: 'Alice Johnson', phone: '555-1234', partySize: 2, dateTime: new Date(new Date().setHours(19, 0, 0, 0)).toISOString(), status: ReservationStatus.Confirmed, tableId: 2, notes: 'Window seat preferred' },
  { id: '2', customerName: 'Bob Williams', phone: '555-5678', partySize: 4, dateTime: new Date(new Date().setHours(20, 0, 0, 0)).toISOString(), status: ReservationStatus.Pending },
  { id: '3', customerName: 'Charlie Brown', phone: '555-8765', partySize: 3, dateTime: new Date(new Date().setHours(18, 30, 0, 0)).toISOString(), status: ReservationStatus.Seated, tableId: 5 },
  { id: '4', customerName: 'Diana Prince', phone: '555-4321', partySize: 5, dateTime: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), status: ReservationStatus.Completed, tableId: 10 },
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

// Mock functions that simulate database operations
export const useMockData = () => {
  const [reservations, setReservations] = useState<Reservation[]>(mockReservations);
  const [tables, setTables] = useState<Table[]>(mockTables);
  const [settings, setSettings] = useState<Settings | null>(mockSettings);
  const [loading, setLoading] = useState(false);

  const refreshReservations = async () => {
    setLoading(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setReservations([...mockReservations]);
    setLoading(false);
  };

  const refreshTables = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setTables([...mockTables]);
    setLoading(false);
  };

  const refreshSettings = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setSettings({ ...mockSettings });
    setLoading(false);
  };

  return {
    reservations,
    tables,
    settings,
    loading,
    refreshReservations,
    refreshTables,
    refreshSettings,
    // Add mock CRUD operations
    addReservation: async (reservation: Omit<Reservation, 'id' | 'created_at' | 'updated_at'>) => {
      const newReservation = { ...reservation, id: Date.now().toString() };
      setReservations(prev => [...prev, newReservation]);
      return newReservation;
    },
    updateReservation: async (id: string | number, updates: Partial<Reservation>) => {
      const updatedReservation = { ...reservations.find(r => r.id === id), ...updates } as Reservation;
      setReservations(prev => prev.map(r => r.id === id ? updatedReservation : r));
      return updatedReservation;
    },
    deleteReservation: async (id: string | number) => {
      const reservation = reservations.find(r => r.id === id);
      setReservations(prev => prev.filter(r => r.id !== id));
      return reservation || null;
    },
    addTable: async (table: Omit<Table, 'id' | 'created_at' | 'updated_at'>) => {
      const newTable = { ...table, id: Date.now() };
      setTables(prev => [...prev, newTable]);
      return newTable;
    },
    updateTable: async (id: number, updates: Partial<Table>) => {
      const updatedTable = { ...tables.find(t => t.id === id), ...updates } as Table;
      setTables(prev => prev.map(t => t.id === id ? updatedTable : t));
      return updatedTable;
    },
    deleteTable: async (id: number) => {
      const table = tables.find(t => t.id === id);
      setTables(prev => prev.filter(t => t.id !== id));
      return table || null;
    },
    updateSettings: async (updates: Partial<Settings>) => {
      const updatedSettings = { ...settings, ...updates } as Settings;
      setSettings(updatedSettings);
      return updatedSettings;
    }
  };
};
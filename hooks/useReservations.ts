import { useState, useEffect, useCallback, useMemo } from 'react';
import { Reservation, ReservationStatus } from '../types';
import {
  getAllReservations,
  createReservation,
  updateReservation,
  deleteReservation,
  getTodayReservations,
  getUpcomingReservations,
  updateReservationStatus
} from '../database/services';
import { USE_MOCK_DATA, testDatabaseConnection } from '../database/config';

interface UseReservationsReturn {
  reservations: Reservation[];
  loading: boolean;
  error: string | null;
  todayReservations: Reservation[];
  upcomingReservations: Reservation[];
  filteredReservations: Reservation[];
  refreshReservations: () => Promise<void>;
  addReservation: (reservation: Omit<Reservation, 'id' | 'created_at' | 'updated_at'>) => Promise<Reservation | null>;
  updateReservationData: (id: string | number, updates: Partial<Reservation>) => Promise<Reservation | null>;
  deleteReservationData: (id: string | number) => Promise<boolean>;
  updateReservationStatusData: (id: string | number, status: ReservationStatus) => Promise<Reservation | null>;
  markNotificationSentData: (id: string | number) => Promise<Reservation | null>;
  setFilter: (filter: 'upcoming' | 'past' | 'all') => void;
  currentFilter: 'upcoming' | 'past' | 'all';
}

export const useReservations = (): UseReservationsReturn => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [useMock, setUseMock] = useState(false);

  // Cargar todas las reservas
  const refreshReservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if we should use mock data
      if (USE_MOCK_DATA || useMock) {
        // Use mock data
        const mockReservations: Reservation[] = [
          { id: '1', customerName: 'Alice Johnson', phone: '555-1234', partySize: 2, dateTime: new Date(new Date().setHours(19, 0, 0, 0)).toISOString(), status: ReservationStatus.Confirmed, tableId: 2, notes: 'Window seat preferred', notification_sent: true },
          { id: '2', customerName: 'Bob Williams', phone: '555-5678', partySize: 4, dateTime: new Date(new Date().setHours(20, 0, 0, 0)).toISOString(), status: ReservationStatus.Pending, notification_sent: false },
          { id: '3', customerName: 'Charlie Brown', phone: '555-8765', partySize: 3, dateTime: new Date(new Date().setHours(18, 30, 0, 0)).toISOString(), status: ReservationStatus.Seated, tableId: 5, notification_sent: true },
          { id: '4', customerName: 'Diana Prince', phone: '555-4321', partySize: 5, dateTime: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), status: ReservationStatus.Completed, tableId: 10, notification_sent: false },
        ];
        setReservations(mockReservations);
      } else {
        // Try to use real database
        const dbConnected = await testDatabaseConnection();
        if (dbConnected) {
          const data = await getAllReservations();
          setReservations(data);
        } else {
          // Fallback to mock data
          setUseMock(true);
          const mockReservations: Reservation[] = [
            { id: '1', customerName: 'Alice Johnson', phone: '555-1234', partySize: 2, dateTime: new Date(new Date().setHours(19, 0, 0, 0)).toISOString(), status: ReservationStatus.Confirmed, tableId: 2, notes: 'Window seat preferred', notification_sent: true },
            { id: '2', customerName: 'Bob Williams', phone: '555-5678', partySize: 4, dateTime: new Date(new Date().setHours(20, 0, 0, 0)).toISOString(), status: ReservationStatus.Pending, notification_sent: false },
            { id: '3', customerName: 'Charlie Brown', phone: '555-8765', partySize: 3, dateTime: new Date(new Date().setHours(18, 30, 0, 0)).toISOString(), status: ReservationStatus.Seated, tableId: 5, notification_sent: true },
            { id: '4', customerName: 'Diana Prince', phone: '555-4321', partySize: 5, dateTime: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), status: ReservationStatus.Completed, tableId: 10, notification_sent: false },
          ];
          setReservations(mockReservations);
        }
      }
    } catch (err) {
      setError('Error loading reservations');
      console.error('Error loading reservations:', err);
      // Fallback to mock data
      setUseMock(true);
      const mockReservations: Reservation[] = [
        { id: '1', customerName: 'Alice Johnson', phone: '555-1234', partySize: 2, dateTime: new Date(new Date().setHours(19, 0, 0, 0)).toISOString(), status: ReservationStatus.Confirmed, tableId: 2, notes: 'Window seat preferred', notification_sent: true },
        { id: '2', customerName: 'Bob Williams', phone: '555-5678', partySize: 4, dateTime: new Date(new Date().setHours(20, 0, 0, 0)).toISOString(), status: ReservationStatus.Pending, notification_sent: false },
        { id: '3', customerName: 'Charlie Brown', phone: '555-8765', partySize: 3, dateTime: new Date(new Date().setHours(18, 30, 0, 0)).toISOString(), status: ReservationStatus.Seated, tableId: 5, notification_sent: true },
        { id: '4', customerName: 'Diana Prince', phone: '555-4321', partySize: 5, dateTime: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), status: ReservationStatus.Completed, tableId: 10, notification_sent: false },
      ];
      setReservations(mockReservations);
    } finally {
      setLoading(false);
    }
  }, [useMock]);

  // Cargar reservas al montar el componente
  useEffect(() => {
    refreshReservations();
  }, [refreshReservations]);

  // Reservas de hoy
  const todayReservations = useMemo(() => {
    const today = new Date().toDateString();
    return reservations.filter(r => new Date(r.dateTime).toDateString() === today);
  }, [reservations]);

  // Próximas reservas
  const upcomingReservations = useMemo(() => {
    const now = new Date();
    return reservations
      .filter(r => new Date(r.dateTime) >= now)
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }, [reservations]);

  // Reservas filtradas según el filtro actual
  const filteredReservations = useMemo(() => {
    const now = new Date();
    switch (currentFilter) {
      case 'upcoming':
        return reservations
          .filter(r => new Date(r.dateTime) >= now)
          .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
      case 'past':
        return reservations
          .filter(r => new Date(r.dateTime) < now)
          .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
      case 'all':
      default:
        return reservations
          .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
    }
  }, [reservations, currentFilter]);

  // Añadir una nueva reserva
  const addReservation = useCallback(async (reservation: Omit<Reservation, 'id' | 'created_at' | 'updated_at'>): Promise<Reservation | null> => {
    try {
      if (USE_MOCK_DATA || useMock) {
        // Mock implementation
        const newReservation = { ...reservation, id: Date.now().toString() };
        setReservations(prev => [...prev, newReservation]);
        return newReservation;
      } else {
        // Real database implementation
        const newReservation = await createReservation(reservation);
        if (newReservation) {
          setReservations(prev => [...prev, newReservation]);
          return newReservation;
        }
        return null;
      }
    } catch (err) {
      setError('Error creating reservation');
      console.error('Error creating reservation:', err);
      // Fallback to mock implementation
      const newReservation = { ...reservation, id: Date.now().toString() };
      setReservations(prev => [...prev, newReservation]);
      return newReservation;
    }
  }, [useMock]);

  // Actualizar una reserva existente
  const updateReservationData = useCallback(async (id: string | number, updates: Partial<Reservation>): Promise<Reservation | null> => {
    try {
      if (USE_MOCK_DATA || useMock) {
        // Mock implementation
        const updatedReservation = { ...reservations.find(r => r.id === id), ...updates } as Reservation;
        setReservations(prev => prev.map(r => r.id === id ? updatedReservation : r));
        return updatedReservation;
      } else {
        // Real database implementation
        const updatedReservation = await updateReservation(id, updates);
        if (updatedReservation) {
          setReservations(prev => prev.map(r => r.id === id ? updatedReservation : r));
          return updatedReservation;
        }
        return null;
      }
    } catch (err) {
      setError('Error updating reservation');
      console.error('Error updating reservation:', err);
      // Fallback to mock implementation
      const updatedReservation = { ...reservations.find(r => r.id === id), ...updates } as Reservation;
      setReservations(prev => prev.map(r => r.id === id ? updatedReservation : r));
      return updatedReservation;
    }
  }, [reservations, useMock]);

  // Eliminar una reserva
  const deleteReservationData = useCallback(async (id: string | number): Promise<boolean> => {
    try {
      if (USE_MOCK_DATA || useMock) {
        // Mock implementation
        setReservations(prev => prev.filter(r => r.id !== id));
        return true;
      } else {
        // Real database implementation
        const deletedReservation = await deleteReservation(id);
        if (deletedReservation) {
          setReservations(prev => prev.filter(r => r.id !== id));
          return true;
        }
        return false;
      }
    } catch (err) {
      setError('Error deleting reservation');
      console.error('Error deleting reservation:', err);
      // Fallback to mock implementation
      setReservations(prev => prev.filter(r => r.id !== id));
      return true;
    }
  }, [useMock]);

  // Actualizar el estado de una reserva
  const updateReservationStatusData = useCallback(async (id: string | number, status: ReservationStatus): Promise<Reservation | null> => {
    try {
      if (USE_MOCK_DATA || useMock) {
        // Mock implementation
        const updatedReservation = { ...reservations.find(r => r.id === id), status } as Reservation;
        setReservations(prev => prev.map(r => r.id === id ? updatedReservation : r));
        return updatedReservation;
      } else {
        // Real database implementation
        const updatedReservation = await updateReservationStatus(id, status);
        if (updatedReservation) {
          setReservations(prev => prev.map(r => r.id === id ? updatedReservation : r));
          return updatedReservation;
        }
        return null;
      }
    } catch (err) {
      setError('Error updating reservation status');
      console.error('Error updating reservation status:', err);
      // Fallback to mock implementation
      const updatedReservation = { ...reservations.find(r => r.id === id), status } as Reservation;
      setReservations(prev => prev.map(r => r.id === id ? updatedReservation : r));
      return updatedReservation;
    }
  }, [reservations, useMock]);

  // Marcar notificación como enviada
  const markNotificationSentData = useCallback(async (id: string | number): Promise<Reservation | null> => {
    try {
      if (USE_MOCK_DATA || useMock) {
        // Mock implementation
        const updatedReservation = { ...reservations.find(r => r.id === id), notification_sent: true } as Reservation;
        setReservations(prev => prev.map(r => r.id === id ? updatedReservation : r));
        return updatedReservation;
      } else {
        // Real database implementation
        const updatedReservation = await updateReservation(id, { notification_sent: true });
        if (updatedReservation) {
          setReservations(prev => prev.map(r => r.id === id ? updatedReservation : r));
          return updatedReservation;
        }
        return null;
      }
    } catch (err) {
      setError('Error marking notification as sent');
      console.error('Error marking notification as sent:', err);
      // Fallback to mock implementation
      const updatedReservation = { ...reservations.find(r => r.id === id), notification_sent: true } as Reservation;
      setReservations(prev => prev.map(r => r.id === id ? updatedReservation : r));
      return updatedReservation;
    }
  }, [reservations, useMock]);

  // Función para cambiar el filtro
  const setFilter = useCallback((filter: 'upcoming' | 'past' | 'all') => {
    setCurrentFilter(filter);
  }, []);

  return {
    reservations,
    loading,
    error,
    todayReservations,
    upcomingReservations,
    filteredReservations,
    refreshReservations,
    addReservation,
    updateReservationData,
    deleteReservationData,
    updateReservationStatusData,
    markNotificationSentData,
    setFilter,
    currentFilter
  };
};
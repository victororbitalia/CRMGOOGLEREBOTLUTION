import { useState, useEffect, useCallback } from 'react';
import { Settings } from '../types';
import {
  getSettings,
  updateSettings,
  createInitialSettings,
  updateOpeningHours
} from '../database/services';
import { USE_MOCK_DATA, testDatabaseConnection } from '../database/config';

interface UseSettingsReturn {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  updateSettingsData: (updates: Partial<Settings>) => Promise<Settings | null>;
  createSettings: (settings: Omit<Settings, 'id' | 'created_at' | 'updated_at'>) => Promise<Settings | null>;
}

export const useSettings = (): UseSettingsReturn => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMock, setUseMock] = useState(false);

  // Cargar configuración
  const refreshSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if we should use mock data
      if (USE_MOCK_DATA || useMock) {
        // Use mock data
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
        setSettings(mockSettings);
      } else {
        // Try to use real database
        const dbConnected = await testDatabaseConnection();
        if (dbConnected) {
          const data = await getSettings();
          setSettings(data);
        } else {
          // Fallback to mock data
          setUseMock(true);
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
          setSettings(mockSettings);
        }
      }
    } catch (err) {
      setError('Error loading settings');
      console.error('Error loading settings:', err);
      // Fallback to mock data
      setUseMock(true);
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
      setSettings(mockSettings);
    } finally {
      setLoading(false);
    }
  }, [useMock]);

  // Cargar configuración al montar el componente
  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  // Actualizar configuración existente
  const updateSettingsData = useCallback(async (updates: Partial<Settings>): Promise<Settings | null> => {
    if (!settings) {
      setError('No settings available to update');
      return null;
    }

    try {
      if (USE_MOCK_DATA || useMock) {
        // Mock implementation
        const updatedSettings = { ...settings, ...updates } as Settings;
        setSettings(updatedSettings);
        return updatedSettings;
      } else {
        // Real database implementation
        const updatedSettings = await updateSettings(settings.id!, updates);
        if (updatedSettings) {
          // Actualizar opening hours si están incluidos en las actualizaciones
          if (updates.openingHours) {
            for (const [day, hours] of Object.entries(updates.openingHours)) {
              // Buscar el ID correspondiente para este día en la configuración actual
              const dayData = settings.openingHours[day];
              if (dayData && 'id' in dayData && dayData.id) {
                await updateOpeningHours(dayData.id, {
                  ...hours,
                  dayOfWeek: day
                });
              }
            }
          }
          
          // Recargar la configuración completa para obtener los datos actualizados
          await refreshSettings();
          return updatedSettings;
        }
        return null;
      }
    } catch (err) {
      setError('Error updating settings');
      console.error('Error updating settings:', err);
      // Fallback to mock implementation
      const updatedSettings = { ...settings, ...updates } as Settings;
      setSettings(updatedSettings);
      return updatedSettings;
    }
  }, [settings, refreshSettings, useMock]);

  // Crear configuración inicial si no existe
  const createSettings = useCallback(async (newSettings: Omit<Settings, 'id' | 'created_at' | 'updated_at'>): Promise<Settings | null> => {
    try {
      if (USE_MOCK_DATA || useMock) {
        // Mock implementation
        const createdSettings = { ...newSettings, id: 1 } as Settings;
        setSettings(createdSettings);
        return createdSettings;
      } else {
        // Real database implementation
        const createdSettings = await createInitialSettings(newSettings);
        if (createdSettings) {
          // Actualizar opening hours
          for (const [day, hours] of Object.entries(newSettings.openingHours)) {
            await updateOpeningHours(createdSettings.id, {
              ...hours,
              dayOfWeek: day
            });
          }
          
          // Recargar la configuración completa
          await refreshSettings();
          return createdSettings;
        }
        return null;
      }
    } catch (err) {
      setError('Error creating settings');
      console.error('Error creating settings:', err);
      // Fallback to mock implementation
      const createdSettings = { ...newSettings, id: 1 } as Settings;
      setSettings(createdSettings);
      return createdSettings;
    }
  }, [refreshSettings, useMock]);

  return {
    settings,
    loading,
    error,
    refreshSettings,
    updateSettingsData,
    createSettings
  };
};
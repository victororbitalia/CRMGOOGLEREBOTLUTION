import { executeQuery, getById, getAll, updateById } from '../utils';
import { Settings, OpeningHours } from '../../types';

// Get settings (there should be only one record)
export const getSettings = async (): Promise<Settings | null> => {
  const query = 'SELECT * FROM settings ORDER BY id LIMIT 1';
  const result = await executeQuery(query);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const settings = result.rows[0];
  
  // Get opening hours
  const openingHoursQuery = 'SELECT * FROM opening_hours ORDER BY id';
  const openingHoursResult = await executeQuery(openingHoursQuery);
  
  // Transform opening hours to the expected format
  const openingHours: { [day: string]: any } = {};
  openingHoursResult.rows.forEach((hour: any) => {
    openingHours[hour.day_of_week] = {
      isOpen: hour.is_open,
      lunchStart: hour.lunch_start,
      lunchEnd: hour.lunch_end,
      dinnerStart: hour.dinner_start,
      dinnerEnd: hour.dinner_end
    };
  });
  
  // Determine which zones are enabled based on existing tables
  const zonesQuery = 'SELECT DISTINCT zone FROM restaurant_tables';
  const zonesResult = await executeQuery(zonesQuery);
  const zones = zonesResult.rows.reduce((acc: any, row: any) => {
    acc[row.zone] = true;
    return acc;
  }, { Indoors: false, Outdoors: false, Terrace: false, Private: false });
  
  return {
    id: settings.id,
    restaurantName: settings.restaurant_name,
    email: settings.email,
    phone: settings.phone,
    address: settings.address,
    maxBookingDays: settings.max_booking_days,
    minBookingHours: settings.min_booking_hours,
    defaultBookingDuration: settings.default_booking_duration,
    maxPartySize: settings.max_party_size,
    walkInTables: settings.walk_in_tables,
    maxOccupancyPercent: settings.max_occupancy_percent,
    zones,
    openingHours,
    created_at: settings.created_at,
    updated_at: settings.updated_at
  };
};

// Update settings
export const updateSettings = async (id: number, updates: Partial<Settings>): Promise<Settings | null> => {
  // Transform the settings object to match database columns
  const dbUpdates: any = {};
  
  if (updates.restaurantName !== undefined) dbUpdates.restaurant_name = updates.restaurantName;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.address !== undefined) dbUpdates.address = updates.address;
  if (updates.maxBookingDays !== undefined) dbUpdates.max_booking_days = updates.maxBookingDays;
  if (updates.minBookingHours !== undefined) dbUpdates.min_booking_hours = updates.minBookingHours;
  if (updates.defaultBookingDuration !== undefined) dbUpdates.default_booking_duration = updates.defaultBookingDuration;
  if (updates.maxPartySize !== undefined) dbUpdates.max_party_size = updates.maxPartySize;
  if (updates.walkInTables !== undefined) dbUpdates.walk_in_tables = updates.walkInTables;
  if (updates.maxOccupancyPercent !== undefined) dbUpdates.max_occupancy_percent = updates.maxOccupancyPercent;
  
  return await updateById('settings', id, dbUpdates);
};

// Create initial settings if they don't exist
export const createInitialSettings = async (settings: Omit<Settings, 'id' | 'created_at' | 'updated_at'>): Promise<Settings> => {
  const query = `
    INSERT INTO settings (
      restaurant_name, email, phone, address,
      max_booking_days, min_booking_hours, default_booking_duration,
      max_party_size, walk_in_tables, max_occupancy_percent
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  
  const params = [
    settings.restaurantName,
    settings.email,
    settings.phone,
    settings.address,
    settings.maxBookingDays,
    settings.minBookingHours,
    settings.defaultBookingDuration,
    settings.maxPartySize,
    settings.walkInTables,
    settings.maxOccupancyPercent
  ];
  
  const result = await executeQuery(query, params);
  return result.rows[0];
};

// Get opening hours
export const getOpeningHours = async (): Promise<OpeningHours[]> => {
  return await getAll('opening_hours', {}, 'id ASC');
};

// Update opening hours for a specific day
export const updateOpeningHours = async (id: number, updates: Partial<OpeningHours>): Promise<OpeningHours | null> => {
  // Transform the opening hours object to match database columns
  const dbUpdates: any = {};
  
  if (updates.dayOfWeek !== undefined) dbUpdates.day_of_week = updates.dayOfWeek;
  if (updates.isOpen !== undefined) dbUpdates.is_open = updates.isOpen;
  if (updates.lunchStart !== undefined) dbUpdates.lunch_start = updates.lunchStart;
  if (updates.lunchEnd !== undefined) dbUpdates.lunch_end = updates.lunchEnd;
  if (updates.dinnerStart !== undefined) dbUpdates.dinner_start = updates.dinnerStart;
  if (updates.dinnerEnd !== undefined) dbUpdates.dinner_end = updates.dinnerEnd;
  
  return await updateById('opening_hours', id, dbUpdates);
};

// Get opening hours for a specific day
export const getOpeningHoursByDay = async (dayOfWeek: string): Promise<OpeningHours | null> => {
  const query = 'SELECT * FROM opening_hours WHERE day_of_week = $1';
  const result = await executeQuery(query, [dayOfWeek]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const hour = result.rows[0];
  return {
    id: hour.id,
    dayOfWeek: hour.day_of_week,
    isOpen: hour.is_open,
    lunchStart: hour.lunch_start,
    lunchEnd: hour.lunch_end,
    dinnerStart: hour.dinner_start,
    dinnerEnd: hour.dinner_end,
    created_at: hour.created_at,
    updated_at: hour.updated_at
  };
};

// Check if the restaurant is open at a specific time
export const isRestaurantOpen = async (dateTime: Date): Promise<boolean> => {
  const dayOfWeek = new Date(dateTime).toLocaleDateString('en-US', { weekday: 'long' });
  const time = new Date(dateTime).toTimeString().slice(0, 5); // HH:MM format
  
  const query = `
    SELECT is_open, lunch_start, lunch_end, dinner_start, dinner_end
    FROM opening_hours
    WHERE day_of_week = $1
  `;
  
  const result = await executeQuery(query, [dayOfWeek]);
  
  if (result.rows.length === 0) {
    return false;
  }
  
  const hours = result.rows[0];
  
  if (!hours.is_open) {
    return false;
  }
  
  // Check if the time is within lunch or dinner hours
  const isWithinLunch = hours.lunch_start && hours.lunch_end && 
    time >= hours.lunch_start.slice(0, 5) && time <= hours.lunch_end.slice(0, 5);
  
  const isWithinDinner = hours.dinner_start && hours.dinner_end && 
    time >= hours.dinner_start.slice(0, 5) && time <= hours.dinner_end.slice(0, 5);
  
  return isWithinLunch || isWithinDinner;
};

// Get next opening time
export const getNextOpeningTime = async (fromDateTime?: Date): Promise<Date | null> => {
  const from = fromDateTime || new Date();
  const currentDay = from.toLocaleDateString('en-US', { weekday: 'long' });
  const currentTime = from.toTimeString().slice(0, 5);
  
  // Get all opening hours from database directly
  const openingHoursQuery = 'SELECT * FROM opening_hours';
  const openingHoursResult = await executeQuery(openingHoursQuery);
  const openingHours = openingHoursResult.rows;
  
  // Check if restaurant is open now
  const isOpenNow = await isRestaurantOpen(from);
  if (isOpenNow) {
    return from;
  }
  
  // Check remaining time today
  const todayHours = openingHours.find((h: any) => h.day_of_week === currentDay);
  if (todayHours && todayHours.is_open) {
    // Check if there's still time today
    if (todayHours.lunch_start && currentTime < todayHours.lunch_start.slice(0, 5)) {
      const nextOpen = new Date(from);
      const [hours, minutes] = todayHours.lunch_start.split(':');
      nextOpen.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return nextOpen;
    }
    
    if (todayHours.dinner_start && currentTime < todayHours.dinner_start.slice(0, 5)) {
      const nextOpen = new Date(from);
      const [hours, minutes] = todayHours.dinner_start.split(':');
      nextOpen.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return nextOpen;
    }
  }
  
  // Check next days
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const currentDayIndex = daysOfWeek.indexOf(currentDay);
  
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (currentDayIndex + i) % 7;
    const nextDayName = daysOfWeek[nextDayIndex];
    const nextDayHours = openingHours.find((h: any) => h.day_of_week === nextDayName);
    
    if (nextDayHours && nextDayHours.is_open) {
      const nextOpen = new Date(from);
      nextOpen.setDate(from.getDate() + i);
      
      if (nextDayHours.lunch_start) {
        const [hours, minutes] = nextDayHours.lunch_start.split(':');
        nextOpen.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return nextOpen;
      }
    }
  }
  
  return null;
};
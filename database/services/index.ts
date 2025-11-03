// Export all services with explicit names to avoid conflicts
export {
  getReservationById,
  getAllReservations,
  createReservation,
  updateReservation,
  deleteReservation,
  getReservationsByDateRange,
  getTodayReservations,
  getUpcomingReservations,
  isTableAvailable,
  getAvailableTables as getAvailableTablesForReservation,
  updateReservationStatus,
  markNotificationSent,
  getReservationStats
} from './reservationService';

export {
  getTableById,
  getAllTables,
  createTable,
  updateTable,
  deleteTable,
  getTablesByZone,
  getTablesByCapacity,
  getAvailableTables,
  getAvailableTablesByZone,
  getAvailableTablesByCapacity,
  updateTableStatus,
  getTableStats,
  getCapacityByZone,
  getBestTableForParty,
  tableNameExists,
  getTablesForPartySize,
  getTablesWithReservations
} from './tableService';

export {
  getSettings,
  updateSettings,
  createInitialSettings,
  getOpeningHours,
  updateOpeningHours,
  getOpeningHoursByDay,
  isRestaurantOpen,
  getNextOpeningTime
} from './settingsService';

// Re-export utilities for convenience
export * from '../utils';
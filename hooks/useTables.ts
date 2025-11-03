import { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, TableStatus, Zone } from '../types';
import {
  getAllTables,
  createTable,
  updateTable,
  deleteTable,
  getTablesByZone,
  getAvailableTables,
  updateTableStatus
} from '../database/services';
import { USE_MOCK_DATA, testDatabaseConnection } from '../database/config';

interface UseTablesReturn {
  tables: Table[];
  loading: boolean;
  error: string | null;
  availableTables: Table[];
  tablesByZone: { [zone in Zone]?: Table[] };
  refreshTables: () => Promise<void>;
  addTable: (table: Omit<Table, 'id' | 'created_at' | 'updated_at'>) => Promise<Table | null>;
  updateTableData: (id: number, updates: Partial<Table>) => Promise<Table | null>;
  deleteTableData: (id: number) => Promise<boolean>;
  updateTableStatusData: (id: number, status: TableStatus) => Promise<Table | null>;
  getTablesForZone: (zone: Zone) => Table[];
}

export const useTables = (): UseTablesReturn => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMock, setUseMock] = useState(false);

  // Cargar todas las mesas
  const refreshTables = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if we should use mock data
      if (USE_MOCK_DATA || useMock) {
        // Use mock data
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
        setTables(mockTables);
      } else {
        // Try to use real database
        const dbConnected = await testDatabaseConnection();
        if (dbConnected) {
          const data = await getAllTables();
          setTables(data);
        } else {
          // Fallback to mock data
          setUseMock(true);
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
          setTables(mockTables);
        }
      }
    } catch (err) {
      setError('Error loading tables');
      console.error('Error loading tables:', err);
      // Fallback to mock data
      setUseMock(true);
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
      setTables(mockTables);
    } finally {
      setLoading(false);
    }
  }, [useMock]);

  // Cargar mesas al montar el componente
  useEffect(() => {
    refreshTables();
  }, [refreshTables]);

  // Mesas disponibles
  const availableTables = useMemo(() => {
    return tables.filter(table => table.status === TableStatus.Available);
  }, [tables]);

  // Mesas agrupadas por zona
  const tablesByZone = useMemo(() => {
    const grouped: { [zone in Zone]?: Table[] } = {};
    tables.forEach(table => {
      if (!grouped[table.zone]) {
        grouped[table.zone] = [];
      }
      grouped[table.zone]!.push(table);
    });
    return grouped;
  }, [tables]);

  // Añadir una nueva mesa
  const addTable = useCallback(async (table: Omit<Table, 'id' | 'created_at' | 'updated_at'>): Promise<Table | null> => {
    try {
      if (USE_MOCK_DATA || useMock) {
        // Mock implementation
        const newTable = { ...table, id: Date.now() };
        setTables(prev => [...prev, newTable].sort((a, b) => a.id - b.id));
        return newTable;
      } else {
        // Real database implementation
        const newTable = await createTable(table);
        if (newTable) {
          setTables(prev => [...prev, newTable].sort((a, b) => a.id - b.id));
          return newTable;
        }
        return null;
      }
    } catch (err) {
      setError('Error creating table');
      console.error('Error creating table:', err);
      // Fallback to mock implementation
      const newTable = { ...table, id: Date.now() };
      setTables(prev => [...prev, newTable].sort((a, b) => a.id - b.id));
      return newTable;
    }
  }, [useMock]);

  // Actualizar una mesa existente
  const updateTableData = useCallback(async (id: number, updates: Partial<Table>): Promise<Table | null> => {
    try {
      if (USE_MOCK_DATA || useMock) {
        // Mock implementation
        const updatedTable = { ...tables.find(t => t.id === id), ...updates } as Table;
        setTables(prev => prev.map(t => t.id === id ? updatedTable : t));
        return updatedTable;
      } else {
        // Real database implementation
        const updatedTable = await updateTable(id, updates);
        if (updatedTable) {
          setTables(prev => prev.map(t => t.id === id ? updatedTable : t));
          return updatedTable;
        }
        return null;
      }
    } catch (err) {
      setError('Error updating table');
      console.error('Error updating table:', err);
      // Fallback to mock implementation
      const updatedTable = { ...tables.find(t => t.id === id), ...updates } as Table;
      setTables(prev => prev.map(t => t.id === id ? updatedTable : t));
      return updatedTable;
    }
  }, [tables, useMock]);

  // Eliminar una mesa
  const deleteTableData = useCallback(async (id: number): Promise<boolean> => {
    try {
      if (USE_MOCK_DATA || useMock) {
        // Mock implementation
        setTables(prev => prev.filter(t => t.id !== id));
        return true;
      } else {
        // Real database implementation
        const deletedTable = await deleteTable(id);
        if (deletedTable) {
          setTables(prev => prev.filter(t => t.id !== id));
          return true;
        }
        return false;
      }
    } catch (err) {
      setError('Error deleting table');
      console.error('Error deleting table:', err);
      // Fallback to mock implementation
      setTables(prev => prev.filter(t => t.id !== id));
      return true;
    }
  }, [useMock]);

  // Actualizar el estado de una mesa
  const updateTableStatusData = useCallback(async (id: number, status: TableStatus): Promise<Table | null> => {
    try {
      if (USE_MOCK_DATA || useMock) {
        // Mock implementation
        const updatedTable = { ...tables.find(t => t.id === id), status } as Table;
        setTables(prev => prev.map(t => t.id === id ? updatedTable : t));
        return updatedTable;
      } else {
        // Real database implementation
        const updatedTable = await updateTableStatus(id, status);
        if (updatedTable) {
          setTables(prev => prev.map(t => t.id === id ? updatedTable : t));
          return updatedTable;
        }
        return null;
      }
    } catch (err) {
      setError('Error updating table status');
      console.error('Error updating table status:', err);
      // Fallback to mock implementation
      const updatedTable = { ...tables.find(t => t.id === id), status } as Table;
      setTables(prev => prev.map(t => t.id === id ? updatedTable : t));
      return updatedTable;
    }
  }, [tables, useMock]);

  // Obtener mesas para una zona específica
  const getTablesForZone = useCallback((zone: Zone): Table[] => {
    return tables.filter(table => table.zone === zone);
  }, [tables]);

  return {
    tables,
    loading,
    error,
    availableTables,
    tablesByZone,
    refreshTables,
    addTable,
    updateTableData,
    deleteTableData,
    updateTableStatusData,
    getTablesForZone
  };
};
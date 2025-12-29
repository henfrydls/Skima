import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DataContext = createContext(null);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Default empty data to avoid null checks everywhere
const defaultData = {
  categories: [],
  skills: [],
  collaborators: [],
  allowResetFromDemo: false
};

export const DataProvider = ({ children }) => {
  const [data, setData] = useState(defaultData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Reload trigger
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('Error al cargar datos');
      const payload = await response.json();
      
      // Compute derived data or just store raw? 
      // Storing raw + computed categories for now to match legacy logic if needed,
      // but for now let's just store the payload.
      setData(payload);
    } catch (err) {
      console.error('Data Load Error:', err);
      setError('No se pudo cargar la información del sistema.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  const refreshData = () => setRefreshTrigger(prev => prev + 1);

  return (
    <DataContext.Provider value={{ ...data, isLoading, error, refreshData }}>
      {children}
    </DataContext.Provider>
  );
};

import React, { createContext, useContext, useState } from 'react';

const SessionFilterContext = createContext();

export const SessionFilterProvider = ({ children }) => {
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [sessionDateFilter, setSessionDateFilter] = useState(null);

  const value = {
    clientSearchTerm,
    setClientSearchTerm,
    sessionDateFilter,
    setSessionDateFilter,
  };

  return (
    <SessionFilterContext.Provider value={value}>
      {children}
    </SessionFilterContext.Provider>
  );
};

export const useSessionFilter = () => {
  const context = useContext(SessionFilterContext);
  if (context === undefined) {
    throw new Error('useSessionFilter must be used within a SessionFilterProvider');
  }
  return context;
};
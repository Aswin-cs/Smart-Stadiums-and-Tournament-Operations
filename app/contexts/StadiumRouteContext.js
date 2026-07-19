'use client';

import { createContext, useContext } from 'react';

const StadiumRouteContext = createContext();

export function StadiumRouteProvider({ children, value }) {
  return (
    <StadiumRouteContext.Provider value={value}>
      {children}
    </StadiumRouteContext.Provider>
  );
}

export function useStadiumRoute() {
  const context = useContext(StadiumRouteContext);
  if (!context) {
    throw new Error('useStadiumRoute must be used within a StadiumRouteProvider');
  }
  return context;
}

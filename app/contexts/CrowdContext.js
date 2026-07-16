'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initialStats, initialIncidents, initialGates, incidentTemplates, initialBins } from '../lib/data/organiser-data';

const initialTransportation = [
  { id: 'Metro Line 1 (North)', type: 'Metro', status: 'ON_TIME', crowding: 'Low', availableSeats: 120, capacity: 200 },
  { id: 'Metro Line 2 (South)', type: 'Metro', status: 'DELAYED', crowding: 'High', availableSeats: 15, capacity: 200 },
  { id: 'FIFA Shuttle Bus A', type: 'Bus', status: 'ON_TIME', crowding: 'Medium', availableSeats: 35, capacity: 50 },
  { id: 'FIFA Shuttle Bus B', type: 'Bus', status: 'FULL', crowding: 'Extreme', availableSeats: 0, capacity: 50 }
];

const CrowdContext = createContext();

export function CrowdProvider({ children }) {
  const [gates, setGates] = useState(initialGates);
  const [incidents, setIncidents] = useState(initialIncidents);
  const [stats, setStats] = useState(initialStats);
  const [climate, setClimate] = useState('CLEAR');
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  const [bins, setBins] = useState(initialBins);
  const [transportation, setTransportation] = useState(initialTransportation);

  useEffect(() => {
    if (!isAutoSimulating) return;

    const interval = setInterval(() => {
      // 1. Fluctuate gate densities
      setGates(prevGates => prevGates.map(g => {
        if (g.status === 'CLOSED') return g;
        const change = Math.floor(Math.random() * 21) - 10;
        const newDensity = Math.max(10, Math.min(100, g.density + change));
        
        let status = 'OPEN';
        let flow = 'Medium';
        if (newDensity > 80) {
          status = 'CONGESTED';
          flow = 'High';
        } else if (newDensity < 35) {
          status = 'OPEN';
          flow = 'Low';
        }

        return {
          ...g,
          density: newDensity,
          status,
          flow
        };
      }));

      // 2. Fluctuate attendance & gate flow stats
      setStats(prevStats => prevStats.map(s => {
        if (s.label === 'Attendance') {
          const val = parseInt(s.value.replace(/,/g, ''));
          const change = Math.floor(Math.random() * 200) - 100;
          const newVal = Math.max(65000, Math.min(82500, val + change));
          return { ...s, value: newVal.toLocaleString() };
        }
        if (s.label === 'Gate Flow') {
          const val = parseInt(s.value);
          const change = Math.floor(Math.random() * 60) - 30;
          const newVal = Math.max(900, Math.min(1500, val + change));
          return { ...s, value: newVal.toString() };
        }
        return s;
      }));

      // 3. Dynamic Incident Fluctuations
      const roll = Math.random();
      if (roll < 0.3) {
        setIncidents(prev => {
          if (prev.length >= 6) return prev;
          const inactive = incidentTemplates.filter(temp => !prev.some(p => p.title === temp.title));
          if (inactive.length === 0) return prev;
          
          const chosenTemplate = inactive[Math.floor(Math.random() * inactive.length)];
          const newInc = {
            ...chosenTemplate,
            id: Date.now(),
            time: "Just now"
          };
          return [newInc, ...prev];
        });
      } else if (roll > 0.8) {
        setIncidents(prev => {
          if (prev.length <= 1) return prev;
          const toRemoveIdx = Math.floor(Math.random() * prev.length);
          return prev.filter((_, idx) => idx !== toRemoveIdx);
        });
      }

      // 5. Simulate Transportation
      setTransportation(prevTransport => prevTransport.map(t => {
        // Randomly change available seats
        const change = Math.floor(Math.random() * 11) - 5; // -5 to +5
        const newSeats = Math.max(0, Math.min(t.capacity, t.availableSeats + change));
        
        let crowding = 'Low';
        let status = 'ON_TIME';
        const fillPercentage = (t.capacity - newSeats) / t.capacity;
        
        if (fillPercentage > 0.95) {
          crowding = 'Extreme';
          status = 'FULL';
        } else if (fillPercentage > 0.8) {
          crowding = 'High';
          status = Math.random() > 0.5 ? 'DELAYED' : 'ON_TIME';
        } else if (fillPercentage > 0.5) {
          crowding = 'Medium';
        }

        return { ...t, availableSeats: newSeats, crowding, status };
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoSimulating]);

  // Background interval every 2.5 minutes to simulate organic updates
  useEffect(() => {
    const bgInterval = setInterval(() => {
      // 1. Random Incident
      setIncidents(prev => {
        const inactive = incidentTemplates.filter(temp => !prev.some(p => p.title === temp.title));
        if (inactive.length > 0) {
          const chosenTemplate = inactive[Math.floor(Math.random() * inactive.length)];
          const newInc = {
            ...chosenTemplate,
            id: Date.now(),
            time: "Just now"
          };
          return [newInc, ...prev.slice(0, 5)];
        }
        return prev;
      });

      // 2. Random Gate Congestion
      setGates(prevGates => {
        const randomGateIdx = Math.floor(Math.random() * prevGates.length);
        return prevGates.map((g, idx) => 
          idx === randomGateIdx 
            ? { ...g, density: Math.floor(Math.random() * 20) + 81, status: 'CONGESTED', flow: 'High' }
            : g
        );
      });
    }, 150000); // 2.5 minutes (150,000 ms)

    return () => clearInterval(bgInterval);
  }, []);

  const handleUpdateGateDensity = useCallback((id, newDensity) => {
    setGates(prevGates => prevGates.map(g => {
      if (g.id === id) {
        let status = 'OPEN';
        let flow = 'Medium';
        if (newDensity === 0) {
          status = 'CLOSED';
          flow = 'None';
        } else if (newDensity > 80) {
          status = 'CONGESTED';
          flow = 'High';
        } else if (newDensity < 35) {
          status = 'OPEN';
          flow = 'Low';
        }
        return { ...g, density: newDensity, status, flow };
      }
      return g;
    }));
  }, []);

  const handleSimulateOverflow = useCallback(() => {
    setGates(prevGates => prevGates.map(g => 
      g.id === 'Gate D' ? { ...g, status: 'CONGESTED', flow: 'Extreme', density: 100 } : g
    ));

    setIncidents(prev => [
      { id: Date.now(), title: "Severe Overflow", location: "Gate D", type: "CRITICAL", time: "Just now" },
      ...prev
    ]);

    setStats(prev => prev.map(s => {
      if (s.label === 'Gate Flow') return { ...s, value: "1,450", trend: "Surging", trendColor: "#f59e0b" };
      return s;
    }));
  }, []);

  const handleReset = useCallback(() => {
    setGates(initialGates);
    setIncidents(initialIncidents);
    setStats(initialStats);
    setClimate('CLEAR');
    setTransportation(initialTransportation);
  }, []);

  const handleSimulateClimate = useCallback((type) => {
    setClimate(type);
    if (type === 'HEATWAVE') {
      setIncidents(prev => [
        { id: Date.now(), title: "Heat Exhaustion", location: "South Stand Sec 4", type: "WARNING", time: "Just now", x: 640, y: 400, shortLabel: "! MED" },
        { id: Date.now()+1, title: "Water Station Empty", location: "Gate B", type: "WARNING", time: "Just now", x: 690, y: 100, shortLabel: "! WTR" },
        ...prev
      ]);
      setStats(prev => prev.map(s => {
        if (s.label === 'Gate Flow') return { ...s, trend: "Slowed (Heat)", trendColor: "#f59e0b" };
        if (s.label === 'Staff Deployed') return { ...s, trend: "Medics busy", trendColor: "#ef4444" };
        return s;
      }));
    } else if (type === 'STORM') {
      setIncidents(prev => [
        { id: Date.now(), title: "Lightning Alert", location: "Stadium Roof", type: "CRITICAL", time: "Just now", x: 450, y: 260, shortLabel: "! LGT" },
        { id: Date.now()+1, title: "Concourse Flooding", location: "North Stand", type: "WARNING", time: "Just now", x: 450, y: 100, shortLabel: "! FLD" },
        ...prev
      ]);
      setGates(prevGates => prevGates.map(g => 
        (g.id === 'Gate A' || g.id === 'Gate F') ? { ...g, status: 'CLOSED', flow: 'None', density: 0 } : g
      ));
      setStats(prev => prev.map(s => {
        if (s.label === 'Gate Flow') return { ...s, trend: "Paused", trendColor: "#ef4444" };
        return s;
      }));
    } else if (type === 'CLEAR') {
      handleReset();
    }
  }, [handleReset]);

  const handleEmergencyOpenAllGates = useCallback(() => {
    setGates(prevGates => prevGates.map(g => ({
      ...g,
      density: Math.min(g.density, 25),
      status: 'OPEN',
      flow: 'Rapid Egress'
    })));

    setIncidents(prev => [
      { id: Date.now(), title: "Emergency All-Gate Egress Initiated", location: "All Gates", type: "CRITICAL", time: "Just now", shortLabel: "! EVAC" },
      ...prev
    ]);
  }, []);

  const handleDeployStaffToBin = useCallback((binId) => {
    setBins(prev => prev.map(b => b.id === binId ? { ...b, fillLevel: 0 } : b));
  }, []);

  const value = React.useMemo(() => ({
    gates, setGates,
    incidents, setIncidents,
    stats, setStats,
    climate, setClimate,
    isAutoSimulating, setIsAutoSimulating,
    transportation, setTransportation,
    handleUpdateGateDensity,
    handleSimulateOverflow,
    handleReset,
    handleSimulateClimate,
    handleEmergencyOpenAllGates,
    bins, setBins, handleDeployStaffToBin
  }), [
    gates, incidents, stats, climate, isAutoSimulating, transportation, bins,
    handleUpdateGateDensity, handleSimulateOverflow, handleReset, handleSimulateClimate,
    handleEmergencyOpenAllGates, handleDeployStaffToBin
  ]);

  return <CrowdContext.Provider value={value}>{children}</CrowdContext.Provider>;
}

export function useCrowd() {
  const context = useContext(CrowdContext);
  if (!context) {
    throw new Error('useCrowd must be used within a CrowdProvider');
  }
  return context;
}

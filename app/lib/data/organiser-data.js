import {
  faDoorOpen, faExclamationTriangle, faUsers, faUserShield
} from '@fortawesome/free-solid-svg-icons';

export const initialStats = [
  { label: "Attendance", value: "68,400", sub: " / 82,500", icon: faUsers, iconColor: "#a855f7", trend: "83% Capacity", trendColor: "#4ade80" },
  { label: "Gate Flow", value: "1,240", sub: " / min", icon: faDoorOpen, iconColor: "#f59e0b", trend: "Stable flow", trendColor: "#4ade80" },
  { label: "Open Incidents", value: "3", sub: " alerts", icon: faExclamationTriangle, iconColor: "#ef4444", trend: "1 Critical", trendColor: "#ef4444" },
  { label: "Staff Deployed", value: "450", sub: " active", icon: faUserShield, iconColor: "#3b82f6", trend: "Optimal", trendColor: "#f59e0b" },
];

export const initialIncidents = [
  { id: 101, title: "High congestion", location: "Gate C", type: "CRITICAL", time: "2 min ago", x: 840, y: 260, shortLabel: "! CON" },
  { id: 102, title: "Medical assistance", location: "South Stand Sec 4", type: "WARNING", time: "5 min ago", x: 640, y: 400, shortLabel: "! MED" },
  { id: 103, title: "Spill cleanup", location: "Restroom North", type: "INFO", time: "12 min ago", x: 450, y: 150, shortLabel: "! SPL" },
  { id: 104, title: "VIP Arrival", location: "VIP Lounge", type: "INFO", time: "18 min ago", x: 240, y: 260, shortLabel: "* VIP" },
];

export const initialGates = [
  { id: 'Gate A', label: 'A', status: 'OPEN', flow: 'Low', density: 30, x: 210, y: 100 },
  { id: 'Gate B', label: 'B', status: 'OPEN', flow: 'Medium', density: 55, x: 690, y: 100 },
  { id: 'Gate C', label: 'C', status: 'CONGESTED', flow: 'High', density: 95, x: 840, y: 260 },
  { id: 'Gate D', label: 'D', status: 'OPEN', flow: 'Medium', density: 45, x: 690, y: 420 },
  { id: 'Gate E', label: 'E', status: 'CLOSED', flow: 'None', density: 0, x: 210, y: 420 },
  { id: 'Gate F', label: 'F', status: 'OPEN', flow: 'Low', density: 25, x: 60, y: 260 },
];

export const incidentTemplates = [
  { title: "Spill cleanup", location: "Restroom North", type: "INFO", x: 450, y: 150, shortLabel: "! SPL" },
  { title: "Medical assistance", location: "South Stand Sec 4", type: "WARNING", x: 640, y: 400, shortLabel: "! MED" },
  { title: "Fan altercation", location: "East Gate Lobby", type: "CRITICAL", x: 730, y: 260, shortLabel: "! ALT" },
  { title: "Scanner failure", location: "Gate F Turnstiles", type: "WARNING", x: 140, y: 260, shortLabel: "! SCN" },
  { title: "Power outage alarm", location: "Concourse Kitchen", type: "CRITICAL", x: 300, y: 190, shortLabel: "! PWR" },
  { title: "Crowd bottleneck", location: "Gate B Outer Area", type: "WARNING", x: 600, y: 140, shortLabel: "! BOT" },
  { title: "Lost property", location: "Information Desk", type: "INFO", x: 300, y: 330, shortLabel: "! LST" },
  { title: "Unruly fan removed", location: "Section 104 Row K", type: "WARNING", x: 600, y: 380, shortLabel: "! FAN" }
];

export const initialBins = [
  { id: 'Bin 1', location: 'North Stand', fillLevel: 45 },
  { id: 'Bin 2', location: 'South Stand', fillLevel: 70 },
  { id: 'Bin 3', location: 'East Wing', fillLevel: 20 },
  { id: 'Bin 4', location: 'West Wing', fillLevel: 85 },
];

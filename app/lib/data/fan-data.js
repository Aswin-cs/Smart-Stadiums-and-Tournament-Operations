import {
  faHamburger, faBeer, faHotdog, faPizzaSlice, faCookie, faMugHot,
  faRestroom, faBriefcaseMedical, faDoorOpen,
  faCalendarAlt, faLocationDot, faMobileScreen, faRobot
} from '@fortawesome/free-solid-svg-icons';

export const matches = [
  { id: 1, time: "18:00", date: "Jun 11", teamA: "USA", flagA: "🇺🇸", teamB: "MEX", flagB: "🇲🇽", stadium: "MetLife Stadium", status: "UPCOMING", group: "A" },
  { id: 2, time: "21:00", date: "Jun 12", teamA: "BRA", flagA: "🇧🇷", teamB: "ARG", flagB: "🇦🇷", stadium: "AT&T Stadium", status: "UPCOMING", group: "B" },
  { id: 3, time: "15:00", date: "Jun 13", teamA: "ENG", flagA: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", teamB: "FRA", flagB: "🇫🇷", stadium: "Rose Bowl", status: "UPCOMING", group: "C" },
  { id: 4, time: "20:00", date: "Jun 14", teamA: "GER", flagA: "🇩🇪", teamB: "ESP", flagB: "🇪🇸", stadium: "Estadio Azteca", status: "LIVE", scoreA: "1", scoreB: "1", group: "D" },
];

export const stadiums = [
  { name: "MetLife Stadium", city: "New York / New Jersey", capacity: "82,500", emoji: "🏟️", color: "#4361ee" },
  { name: "AT&T Stadium", city: "Dallas, TX", capacity: "100,000", emoji: "🏟️", color: "#c9a227" },
  { name: "Rose Bowl", city: "Los Angeles, CA", capacity: "92,542", emoji: "🏟️", color: "#c1121f" },
  { name: "Estadio Azteca", city: "Mexico City, MX", capacity: "87,523", emoji: "🏟️", color: "#1a8c2e" },
  { name: "BC Place", city: "Vancouver, CA", capacity: "54,500", emoji: "🏟️", color: "#e63946" },
  { name: "BMO Field", city: "Toronto, CA", capacity: "45,736", emoji: "🏟️", color: "#7b9cf7" },
];

export const amenitiesData = [
  { id: 'Burgers', icon: faHamburger, x: 450, y: 60, type: 'food' },
  { id: 'Beer', icon: faBeer, x: 770, y: 160, type: 'food' },
  { id: 'Hot Dogs', icon: faHotdog, x: 770, y: 360, type: 'food' },
  { id: 'Pizza', icon: faPizzaSlice, x: 450, y: 460, type: 'food' },
  { id: 'Snacks', icon: faCookie, x: 130, y: 360, type: 'food' },
  { id: 'Coffee', icon: faMugHot, x: 130, y: 160, type: 'food' },
  { id: 'Restroom North', icon: faRestroom, x: 260, y: 70, type: 'facility' },
  { id: 'Restroom South', icon: faRestroom, x: 640, y: 450, type: 'facility' },
  { id: 'First Aid', icon: faBriefcaseMedical, x: 640, y: 70, type: 'emergency' },
  { id: 'Emergency Exit', icon: faDoorOpen, x: 260, y: 450, type: 'emergency' },
];

export const sectionsData = {
  "North Stand": { x: 450, y: 95 },
  "South Stand": { x: 450, y: 425 },
  "East Wing": { x: 720, y: 260 },
  "West Wing": { x: 180, y: 260 },
  "Central Block": { x: 450, y: 130 },
  "VIP Lounge": { x: 450, y: 60 },
};

export const fanTips = [
  { icon: faLocationDot, title: "Smart Navigation", desc: "Instantly find the fastest walking route to your gate and seat." },
  { icon: faMobileScreen, title: "Interactive Stadium", desc: "Explore the venue in 2D/3D and locate nearby amenities easily." },
  { icon: faCalendarAlt, title: "Live Match Hub", desc: "Track tournament schedules, group standings, and live scores." },
  { icon: faRobot, title: "AI Assistant", desc: "Chat with our built-in AI for instant help and event information." },
];

export const TICKET_CATEGORIES = ["Standard", "Premium", "VIP", "Hospitality"];
export const GATES = ["Gate A", "Gate B", "Gate C", "Gate D", "Gate E", "Gate F"];
export const SECTIONS = ["North Stand", "South Stand", "East Wing", "West Wing", "Central Block", "VIP Lounge"];

export const defaultTicket = {
  holderName: "Fan Name",
  match: "USA 🇺🇸 vs 🇲🇽 MEX",
  matchDate: "Jun 11, 2026 — 18:00",
  stadium: "MetLife Stadium",
  gate: "Gate A",
  section: "North Stand",
  row: "12",
  seat: "34",
  category: "Standard",
  barcode: "FIFA2026-MTL-00001",
};

export function getNearestAmenity(sectionName, type) {
  const section = sectionsData[sectionName] || sectionsData["North Stand"];
  const options = amenitiesData.filter(a => a.type === type);
  if (options.length === 0) return amenitiesData[0].id;

  let closest = options[0];
  let minDistance = Infinity;
  for (const opt of options) {
    const dist = Math.hypot(opt.x - section.x, opt.y - section.y);
    if (dist < minDistance) {
      minDistance = dist;
      closest = opt;
    }
  }
  return closest.id;
}

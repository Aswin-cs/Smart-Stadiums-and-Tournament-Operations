import { useState, useEffect } from 'react';
import styles from '../organiser/organiser.module.css';

export default function OrganiserStadiumMap({ gates, incidents = [], climate = 'CLEAR' }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getDensityColor = (density) => {
    if (density > 80) return 'rgba(239, 68, 68, 0.75)'; // Red
    if (density > 50) return 'rgba(245, 158, 11, 0.75)'; // Orange
    return 'rgba(16, 185, 129, 0.55)'; // Green
  };

  return (
    <div className={styles.mapContainer}>
      <svg className={styles.stadiumSvg} viewBox="20 10 860 500">
        <ellipse cx="450" cy="260" rx="420" ry="235" fill={climate === 'HEATWAVE' ? "#1e0b04" : climate === 'STORM' ? "#050b14" : "#0a1020"} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        
        {/* Heatmap Sectors */}
        <path d="M 100 120 Q 450 30 800 120 L 660 190 Q 450 145 240 190 Z" fill={getDensityColor(40)} stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
        <text x="450" y="100" fill="white" fontSize="16" fontWeight="800" textAnchor="middle" opacity="0.9">NORTH STAND (40%)</text>
        
        <path d="M 100 400 Q 450 490 800 400 L 660 330 Q 450 375 240 330 Z" fill={getDensityColor(85)} stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
        <text x="450" y="420" fill="white" fontSize="16" fontWeight="800" textAnchor="middle" opacity="0.9">SOUTH STAND (85%)</text>
        
        <path d="M 100 120 L 100 400 L 240 330 L 240 190 Z" fill={getDensityColor(60)} stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
        <text x="170" y="260" fill="white" fontSize="16" fontWeight="800" textAnchor="middle" transform="rotate(-90 170 260)" opacity="0.9">WEST WING (60%)</text>

        <path d="M 800 120 L 800 400 L 660 330 L 660 190 Z" fill={getDensityColor(30)} stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
        <text x="730" y="260" fill="white" fontSize="16" fontWeight="800" textAnchor="middle" transform="rotate(90 730 260)" opacity="0.9">EAST WING (30%)</text>

        {/* Pitch */}
        <ellipse cx="450" cy="260" rx="193" ry="108" fill={climate === 'HEATWAVE' ? "#344d18" : climate === 'STORM' ? "#0c3b1e" : "#14532d"} stroke="rgba(255,255,255,0.2)" />
        <text x="450" y="265" fill="rgba(255,255,255,0.5)" fontSize="20" fontWeight="900" textAnchor="middle" letterSpacing="0.2em">FIELD</text>
        
        {/* Gates */}
        {gates.map(gate => (
          <g key={gate.id}>
            <circle cx={gate.x} cy={gate.y} r={isMobile ? "35" : "20"} fill={getDensityColor(gate.density)} stroke="white" strokeWidth="2.5" />
            <text x={gate.x} y={gate.y + (isMobile ? 8 : 5)} fill="white" fontSize={isMobile ? "22" : "14"} fontWeight="900" textAnchor="middle">{gate.label}</text>
            {gate.density > 80 && (
              <circle cx={gate.x} cy={gate.y} r={isMobile ? "50" : "32"} fill="none" stroke="#ef4444" strokeWidth="3" className={styles.pulseAnim} />
            )}
          </g>
        ))}

        {/* Incident Blips */}
        {incidents.map(inc => {
          let color = "#3b82f6"; // INFO
          if (inc.type === "WARNING") color = "#f59e0b";
          if (inc.type === "CRITICAL") color = "#ef4444";

          return (
            <g key={inc.id} className={styles.incidentBlip}>
              <circle cx={inc.x} cy={inc.y} r={isMobile ? "24" : "12"} fill={color} />
              <circle cx={inc.x} cy={inc.y} r={isMobile ? "40" : "24"} fill="none" stroke={color} strokeWidth="3" className={styles.pulseAnim} />
              <text x={inc.x} y={inc.y - (isMobile ? 32 : 18)} fill={color} fontSize={isMobile ? "20" : "12"} fontWeight="800" textAnchor="middle">{inc.shortLabel}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

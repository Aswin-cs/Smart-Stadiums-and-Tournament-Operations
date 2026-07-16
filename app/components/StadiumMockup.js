/* istanbul ignore file */
'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles from '../fan/fan.module.css';
import { amenitiesData, sectionsData } from '../lib/data/fan-data';
import { useCrowd } from '../contexts/CrowdContext';

export default function StadiumMockup({
  ticket,
  onSelectGate,
  routeMode,
  setRouteMode,
  selectedAmenityId,
  setSelectedAmenityId,
  amenityFilter,
  setAmenityFilter
}) {
  const [isNight, setIsNight] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { gates: realGates } = useCrowd();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const gatesData = [
    { id: 'Gate A', label: 'A', x: 210, y: 100 },
    { id: 'Gate B', label: 'B', x: 690, y: 100 },
    { id: 'Gate C', label: 'C', x: 840, y: 260 },
    { id: 'Gate D', label: 'D', x: 690, y: 420 },
    { id: 'Gate E', label: 'E', x: 210, y: 420 },
    { id: 'Gate F', label: 'F', x: 60, y: 260 },
  ];

  // Amenities and Sections data hoisted to top-level for distance calculation

  const activeGate = gatesData.find(g => g.id === ticket.gate) || gatesData[0];
  const activeSection = sectionsData[ticket.section] || sectionsData["North Stand"];

  // ── CONCOURSE-RING ROUTING ──
  // The concourse ellipse sits exactly in the middle of the expanded dark stands.
  const CONC_RX = 305;
  const CONC_RY = 170;
  const CX = 450;
  const CY = 260;

  const activeAmenity = amenitiesData.find(f => f.id === selectedAmenityId) || amenitiesData[0];

  const buildPath = (start, end) => {
    const angleStart = Math.atan2((start.y - CY) / CONC_RY, (start.x - CX) / CONC_RX);
    const angleEnd = Math.atan2((end.y - CY) / CONC_RY, (end.x - CX) / CONC_RX);

    const entryX = (CX + CONC_RX * Math.cos(angleStart)).toFixed(1);
    const entryY = (CY + CONC_RY * Math.sin(angleStart)).toFixed(1);
    const exitX = (CX + CONC_RX * Math.cos(angleEnd)).toFixed(1);
    const exitY = (CY + CONC_RY * Math.sin(angleEnd)).toFixed(1);

    let angleDiff = angleEnd - angleStart;
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    const sweepFlag = angleDiff > 0 ? 1 : 0;
    const largeArcFlag = Math.abs(angleDiff) > Math.PI ? 1 : 0;

    return `M ${start.x} ${start.y} L ${entryX} ${entryY} A ${CONC_RX} ${CONC_RY} 0 ${largeArcFlag} ${sweepFlag} ${exitX} ${exitY} L ${end.x} ${end.y}`;
  };

  let routePathD = '';
  if (routeMode === 'gate-seat') routePathD = buildPath(activeGate, activeSection);
  else if (routeMode === 'gate-amenity') routePathD = buildPath(activeGate, activeAmenity);
  else if (routeMode === 'seat-amenity') routePathD = buildPath(activeSection, activeAmenity);
  else if (routeMode === 'gate-seat-amenity') routePathD = buildPath(activeGate, activeSection) + " " + buildPath(activeSection, activeAmenity);

  return (
    <div className={`${styles.stadiumMockupWrap} ${isNight ? styles.stadiumNight : styles.stadiumDay}`} id="stadium-mockup">
      {/* Glow backdrop */}
      <div className={styles.stadiumGlow} />

      {/* Floating controls container */}
      <div className={styles.stadiumControls}>
        {/* Day/Night Toggles */}
        <div className={styles.stadiumToggle}>
          <div className={styles.stadiumControlGroup}>
            <button
              className={`${styles.toggleBtn} ${!isNight ? styles.toggleBtnActive : ''}`}
              onClick={() => setIsNight(false)}
              id="btn-stadium-day"
            >
              <span style={{ fontSize: isMobile ? '0.7rem' : 'inherit' }}>☀️</span>{isMobile ? '' : ' Day'}
            </button>
            {isMobile && <div className={styles.stadiumControlLabel}>Day</div>}
          </div>
          <div className={styles.stadiumControlGroup}>
            <button
              className={`${styles.toggleBtn} ${isNight ? styles.toggleBtnActive : ''}`}
              onClick={() => setIsNight(true)}
              id="btn-stadium-night"
            >
              <span style={{ fontSize: isMobile ? '0.9rem' : 'inherit' }}>🌙</span>{isMobile ? '' : ' Night'}
            </button>
            {isMobile && <div className={styles.stadiumControlLabel}>Night</div>}
          </div>
        </div>

        {/* Amenity Filter Dropdown */}
        <div className={styles.stadiumControlGroup}>
          <select
            className={`${styles.routeToggleBtn}`}
            value={amenityFilter}
            onChange={(e) => setAmenityFilter(e.target.value)}
            id="select-amenity-filter"
            aria-label="Filter Amenities"
            style={{ appearance: 'none', paddingRight: isMobile ? '10px' : '20px', cursor: 'pointer', textAlign: 'center', marginLeft: isMobile ? '0px' : '10px', fontSize: isMobile ? '0.9rem' : 'inherit' }}
          >
            <option value="All">⚙️{isMobile ? '' : ' All Amenities'}</option>
            <option value="food">🍔{isMobile ? '' : ' Food & Drink'}</option>
            <option value="facility">🚻{isMobile ? '' : ' Facilities'}</option>
            <option value="emergency">⚕️{isMobile ? '' : ' Emergency'}</option>
          </select>
          {isMobile && <div className={styles.stadiumControlLabel}>Settings</div>}
        </div>

        {/* Route Selection Dropdown */}
        <div className={styles.stadiumControlGroup}>
          <select
            className={`${styles.routeToggleBtn} ${routeMode !== 'hide' ? styles.routeToggleBtnActive : ''}`}
            value={routeMode}
            onChange={(e) => setRouteMode(e.target.value)}
            id="select-stadium-route"
            aria-label="Stadium Routing Mode"
            style={{ appearance: 'none', paddingRight: isMobile ? '10px' : '20px', cursor: 'pointer', textAlign: 'center', fontSize: isMobile ? '0.9rem' : 'inherit' }}
          >
            <option value="hide">📍{isMobile ? '' : ' Hide Route'}</option>
            <option value="gate-seat">📍{isMobile ? '' : ' Gate to Seat'}</option>
            <option value="gate-amenity">🎯{isMobile ? '' : ' Gate to Amenity'}</option>
            <option value="seat-amenity">🚶{isMobile ? '' : ' Seat to Amenity'}</option>
            <option value="gate-seat-amenity">🗺️{isMobile ? '' : ' Gate ➔ Seat ➔ Amenity'}</option>
          </select>
          {isMobile && <div className={styles.stadiumControlLabel}>Route Mode</div>}
        </div>
      </div>

      <svg
        className={styles.stadiumSvg}
        viewBox="20 10 860 500"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="FIFA World Cup 2026 stadium aerial mockup"
      >
        <defs>
          {/* Pitch gradient - changes depending on Day / Night */}
          <radialGradient id="pitchGrad" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor={isNight ? "#2d8a4e" : "#4ade80"} />
            <stop offset="100%" stopColor={isNight ? "#1a5c34" : "#15803d"} />
          </radialGradient>
          {/* Stripe pattern */}
          <pattern id="pitchStripes" x="0" y="0" width="60" height="1" patternUnits="userSpaceOnUse">
            <rect width="30" height="1" fill={isNight ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.06)"} />
            <rect x="30" width="30" height="1" fill="transparent" />
          </pattern>
          {/* Stand gradients */}
          <linearGradient id="standTop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isNight ? "#1a2540" : "#3b82f6"} />
            <stop offset="100%" stopColor={isNight ? "#0d1628" : "#1e40af"} />
          </linearGradient>
          <linearGradient id="standBot" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isNight ? "#0d1628" : "#1e40af"} />
            <stop offset="100%" stopColor={isNight ? "#1a2540" : "#3b82f6"} />
          </linearGradient>
          <linearGradient id="standLeft" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={isNight ? "#0d1628" : "#1e40af"} />
            <stop offset="100%" stopColor={isNight ? "#1a2540" : "#3b82f6"} />
          </linearGradient>
          <linearGradient id="standRight" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={isNight ? "#1a2540" : "#3b82f6"} />
            <stop offset="100%" stopColor={isNight ? "#0d1628" : "#1e40af"} />
          </linearGradient>
          {/* Floodlight beams (gradient) */}
          <radialGradient id="beamGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,251,230,0.25)" />
            <stop offset="100%" stopColor="rgba(255,251,230,0)" />
          </radialGradient>
          {/* Roof glow */}
          <filter id="roofGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="floodlight">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* Crowd texture */}
          <pattern id="crowd" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill={isNight ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.25)"} />
            <circle cx="6" cy="6" r="1.2" fill={isNight ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.15)"} />
            <circle cx="6" cy="2" r="0.8" fill={isNight ? "rgba(201,162,39,0.15)" : "rgba(201,162,39,0.3)"} />
            <circle cx="2" cy="6" r="0.8" fill={isNight ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.25)"} />
          </pattern>
        </defs>

        {/* ── OUTER SHELL (ellipse) ── */}
        <ellipse
          cx="450"
          cy="260"
          rx="420"
          ry="235"
          fill={isNight ? "#0a1020" : "#cbd5e1"}
          stroke={isNight ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}
          strokeWidth="1"
        />

        {/* ── STANDS ── */}
        {/* Top stand */}
        <path d="M 100 120 Q 450 30 800 120 L 660 190 Q 450 145 240 190 Z" fill="url(#standTop)" />
        <path d="M 100 120 Q 450 30 800 120 L 660 190 Q 450 145 240 190 Z" fill="url(#crowd)" opacity={isNight ? "0.7" : "0.5"} />
        {/* Bottom stand */}
        <path d="M 100 400 Q 450 490 800 400 L 660 330 Q 450 375 240 330 Z" fill="url(#standBot)" />
        <path d="M 100 400 Q 450 490 800 400 L 660 330 Q 450 375 240 330 Z" fill="url(#crowd)" opacity={isNight ? "0.7" : "0.5"} />
        {/* Left stand */}
        <path d="M 100 120 L 100 400 L 240 330 L 240 190 Z" fill="url(#standLeft)" />
        <path d="M 100 120 L 100 400 L 240 330 L 240 190 Z" fill="url(#crowd)" opacity={isNight ? "0.6" : "0.4"} />
        {/* Right stand */}
        <path d="M 800 120 L 800 400 L 660 330 L 660 190 Z" fill="url(#standRight)" />
        <path d="M 800 120 L 800 400 L 660 330 L 660 190 Z" fill="url(#crowd)" opacity={isNight ? "0.6" : "0.4"} />

        {/* Stand seat rows — top */}
        {[160, 175, 190, 205, 220, 235, 250, 265].map((y, i) => (
          <path key={`tr${i}`}
            d={`M ${130 + i * 4} ${y - 15} Q 450 ${y - 110 + i * 8} ${770 - i * 4} ${y - 15}`}
            fill="none" stroke={isNight ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.12)"} strokeWidth="1"
          />
        ))}
        {/* Stand seat rows — bottom */}
        {[255, 270, 285, 300, 315, 330, 345, 360].map((y, i) => (
          <path key={`br${i}`}
            d={`M ${130 + (7 - i) * 4} ${y + 15} Q 450 ${y + 110 - i * 8} ${770 - (7 - i) * 4} ${y + 15}`}
            fill="none" stroke={isNight ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.12)"} strokeWidth="1"
          />
        ))}

        {/* ── PITCH AND MARKINGS (Scaled to expand seating area) ── */}
        <g transform="translate(450, 260) scale(1.05) translate(-450, -260)">
          {/* ── PITCH SURFACE ── */}
          <ellipse cx="450" cy="260" rx="285" ry="160" fill="url(#pitchGrad)" />
          <ellipse cx="450" cy="260" rx="285" ry="160" fill="url(#pitchStripes)" />

          {/* ── PITCH MARKINGS ── */}
          {/* Boundary */}
          <rect x="195" y="170" width="510" height="180" rx="4"
            fill="none" stroke={isNight ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.85)"} strokeWidth="2.5" />
          {/* Centre circle */}
          <circle cx="450" cy="260" r="40"
            fill="none" stroke={isNight ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.85)"} strokeWidth="2.5" />
          {/* Centre dot */}
          <circle cx="450" cy="260" r="4" fill={isNight ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.95)"} />
          {/* Halfway line */}
          <line x1="450" y1="170" x2="450" y2="350"
            stroke={isNight ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.85)"} strokeWidth="2.5" />
          {/* Left penalty area */}
          <rect x="195" y="208" width="75" height="104" rx="2"
            fill="none" stroke={isNight ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.85)"} strokeWidth="2" />
          {/* Left goal area */}
          <rect x="195" y="232" width="28" height="56" rx="1"
            fill="none" stroke={isNight ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.85)"} strokeWidth="2" />
          {/* Left penalty arc */}
          <path d="M 270 230 Q 295 260 270 290" fill="none" stroke={isNight ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.7)"} strokeWidth="2" />
          {/* Right penalty area */}
          <rect x="630" y="208" width="75" height="104" rx="2"
            fill="none" stroke={isNight ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.85)"} strokeWidth="2" />
          {/* Right goal area */}
          <rect x="677" y="232" width="28" height="56" rx="1"
            fill="none" stroke={isNight ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.85)"} strokeWidth="2" />
          {/* Right penalty arc */}
          <path d="M 630 230 Q 605 260 630 290" fill="none" stroke={isNight ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.7)"} strokeWidth="2" />
          {/* Left goal */}
          <rect x="179" y="245" width="16" height="30" rx="1"
            fill="rgba(255,255,255,0.06)" stroke={isNight ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.9)"} strokeWidth="2" />
          {/* Right goal */}
          <rect x="705" y="245" width="16" height="30" rx="1"
            fill="rgba(255,255,255,0.06)" stroke={isNight ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.9)"} strokeWidth="2" />
          {/* Corner arcs */}
          <path d="M195 174 Q203 174 203 182" fill="none" stroke={isNight ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.7)"} strokeWidth="1.5" />
          <path d="M705 174 Q697 174 697 182" fill="none" stroke={isNight ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.7)"} strokeWidth="1.5" />
          <path d="M195 346 Q203 346 203 338" fill="none" stroke={isNight ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.7)"} strokeWidth="1.5" />
          <path d="M705 346 Q697 346 697 338" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
          {/* Penalty spots */}
          <circle cx="240" cy="260" r="3.5" fill={isNight ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.9)"} />
          <circle cx="660" cy="260" r="3.5" fill={isNight ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.9)"} />
        </g>

        {/* ── NIGHT LIGHT BEAMS (only visible in Night mode) ── */}
        {isNight && (
          <>
            <polygon points="118,118 350,260 220,380" fill="url(#beamGrad)" opacity="0.6" style={{ mixBlendMode: 'screen' }} />
            <polygon points="782,118 550,260 680,380" fill="url(#beamGrad)" opacity="0.6" style={{ mixBlendMode: 'screen' }} />
            <polygon points="118,402 350,260 220,140" fill="url(#beamGrad)" opacity="0.6" style={{ mixBlendMode: 'screen' }} />
            <polygon points="782,402 550,260 680,140" fill="url(#beamGrad)" opacity="0.6" style={{ mixBlendMode: 'screen' }} />
          </>
        )}

        {/* ── ROOF EDGE HIGHLIGHT ── */}
        <path d="M 100 120 Q 450 30 800 120" fill="none"
          stroke={isNight ? "rgba(201,162,39,0.6)" : "rgba(255,255,255,0.85)"} strokeWidth="2.5" filter={isNight ? "url(#roofGlow)" : undefined} />
        <path d="M 100 400 Q 450 490 800 400" fill="none"
          stroke={isNight ? "rgba(201,162,39,0.6)" : "rgba(255,255,255,0.85)"} strokeWidth="2.5" filter={isNight ? "url(#roofGlow)" : undefined} />
        <line x1="100" y1="120" x2="100" y2="400"
          stroke={isNight ? "rgba(201,162,39,0.5)" : "rgba(255,255,255,0.8)"} strokeWidth="2" filter={isNight ? "url(#roofGlow)" : undefined} />
        <line x1="800" y1="120" x2="800" y2="400"
          stroke={isNight ? "rgba(201,162,39,0.5)" : "rgba(255,255,255,0.8)"} strokeWidth="2" filter={isNight ? "url(#roofGlow)" : undefined} />

        {/* ── FLOODLIGHT TOWERS ── */}
        {[
          { x: 118, y: 118 }, { x: 782, y: 118 },
          { x: 118, y: 402 }, { x: 782, y: 402 },
        ].map((pos, i) => {
          const isLampActive = isNight;
          return (
            <g key={`fl${i}`} opacity={isLampActive ? 1 : 0.45}>
              {isLampActive && <circle cx={pos.x} cy={pos.y} r="22" fill="rgba(249,212,80,0.12)" filter="url(#floodlight)" />}
              <circle cx={pos.x} cy={pos.y} r="8" fill={isLampActive ? "#f9d450" : "#94a3b8"} opacity="0.9" />
              <circle cx={pos.x} cy={pos.y} r="4" fill={isLampActive ? "#fffbe6" : "#cbd5e1"} />
            </g>
          );
        })}



        {/* ── CROWD COLOUR PATCHES (fan blocks) ── */}
        {/* USA fans - top left */}
        <ellipse cx="240" cy="148" rx="55" ry="18" fill={isNight ? "rgba(67,97,238,0.35)" : "rgba(37,99,235,0.45)"} />
        {/* Brazil fans - top right */}
        <ellipse cx="660" cy="148" rx="55" ry="18" fill={isNight ? "rgba(201,162,39,0.3)" : "rgba(234,179,8,0.4)"} />
        {/* Red ultras - bottom mid */}
        <ellipse cx="450" cy="372" rx="80" ry="16" fill={isNight ? "rgba(239,68,68,0.25)" : "rgba(220,38,38,0.35)"} />

        {/* ── MOCKUP GATES (A, B, C, D, E, F) ── */}
        <g id="stadium-gates">
          {gatesData.map((gate) => {
            const isSelected = ticket.gate === gate.id;
            const realGate = realGates.find(g => g.id === gate.id);
            const isCongested = realGate && realGate.status === 'CONGESTED';

            let baseFill = isSelected ? (isNight ? "#f9d450" : "#3b82f6") : (isNight ? "#111827" : "#cbd5e1");
            let baseStroke = isSelected ? "none" : (isNight ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.3)");
            let textFill = isSelected ? (isNight ? "#060a14" : "#ffffff") : (isNight ? "#e5e7eb" : "#475569");
            let pulseStroke = isNight ? "#f9d450" : "#3b82f6";

            if (isCongested) {
              baseFill = "#ef4444";
              baseStroke = "none";
              textFill = "#ffffff";
              pulseStroke = "#ef4444";
            }

            return (
              <g
                key={gate.id}
                onClick={() => onSelectGate && onSelectGate(gate.id)}
                style={{ cursor: 'pointer' }}
                tabIndex={0}
                role="button"
                aria-label={`Select ${gate.id}`}
                className={styles.gateGroup}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelectGate && onSelectGate(gate.id);
                  }
                }}
              >
                {/* Large pulse ring when selected */}
                {isSelected && (
                  <circle
                    cx={gate.x}
                    cy={gate.y}
                    r={isMobile ? "30" : "22"}
                    fill="none"
                    stroke={pulseStroke}
                    strokeWidth="2"
                    className={styles.gatePulseRing}
                  />
                )}
                {/* Gate base circle */}
                <circle
                  cx={gate.x}
                  cy={gate.y}
                  r={isMobile ? "24" : "16"}
                  fill={baseFill}
                  stroke={baseStroke}
                  strokeWidth="1.5"
                  className={styles.gateBase}
                />
                {/* Gate letter */}
                <text
                  x={gate.x}
                  y={gate.y + (isMobile ? 6.5 : 4.5)}
                  textAnchor="middle"
                  fontSize={isMobile ? "18" : "12"}
                  fontWeight="900"
                  fontFamily="sans-serif"
                  fill={textFill}
                >
                  {gate.label}
                </text>
                {/* Tooltip / Label showing Gate name on hover */}
                <title>{isCongested ? `WARNING: High Congestion at ${gate.id}` : (isSelected ? `Active: ${gate.id}` : `Click to choose ${gate.id}`)}</title>
              </g>
            );
          })}
        </g>

        {/* ── AMENITIES ── */}
        <g id="stadium-amenities">
          {amenitiesData.filter(spot => amenityFilter === 'All' || spot.type === amenityFilter).map((spot) => {
            const isTarget = (routeMode === 'gate-amenity' || routeMode === 'seat-amenity' || routeMode === 'gate-seat-amenity') && spot.id === selectedAmenityId;
            return (
              <g 
                key={spot.id} 
                style={{ cursor: 'pointer' }} 
                onClick={() => { setSelectedAmenityId(spot.id); if (routeMode === 'hide' || routeMode === 'gate-seat') setRouteMode('seat-amenity'); }} 
                className={styles.amenityGroup}
                role="button"
                tabIndex={0}
                aria-label={`Select ${spot.id}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedAmenityId(spot.id);
                    if (routeMode === 'hide' || routeMode === 'gate-seat') setRouteMode('seat-amenity');
                  }
                }}
              >
                {isTarget && (
                  <circle cx={spot.x} cy={spot.y} r={isMobile ? "30" : "20"} fill="none" stroke="#10b981" strokeWidth="2" className={styles.targetPulseRing} />
                )}
                <circle
                  cx={spot.x}
                  cy={spot.y}
                  r={isMobile ? "22" : "14"}
                  fill={isNight ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.6)"}
                  stroke={isNight ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"}
                  strokeWidth="1"
                />
                <foreignObject x={spot.x - (isMobile ? 14 : 9)} y={spot.y - (isMobile ? 14 : 9)} width={isMobile ? "28" : "18"} height={isMobile ? "28" : "18"}>
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isNight ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)' }}>
                    <FontAwesomeIcon icon={spot.icon} style={{ width: isMobile ? '18px' : '12px', height: isMobile ? '18px' : '12px' }} />
                  </div>
                </foreignObject>
                <text
                  x={spot.x}
                  y={spot.y - (isMobile ? 28 : 18)}
                  textAnchor="middle"
                  fontSize={isMobile ? "18" : "12"}
                  fontWeight="600"
                  fill={isNight ? "#ffffff" : "#000000"}
                  className={styles.amenityLabel}
                >
                  {spot.id}
                </text>
                <title>{`${spot.id} (Click to route)`}</title>
              </g>
            )
          })}
        </g>

        {/* ── SEATING ROUTE PATH ── */}
        {routeMode !== 'hide' && (
          <g id="stadium-route" style={{ pointerEvents: 'none' }}>
            {/* Marching dots route line */}
            <path
              d={routePathD}
              fill="none"
              stroke={isNight ? "#10b981" : "#10b981"}
              strokeWidth="4"
              strokeLinecap="round"
              className={styles.routeLineShadow}
              opacity="0.35"
            />
            <path
              d={routePathD}
              fill="none"
              stroke={isNight ? "#10b981" : "#059669"}
              strokeWidth="3"
              strokeLinecap="round"
              className={styles.routeLine}
            />
            {/* Target Seat Marker Pin */}
            {(routeMode === 'gate-seat' || routeMode === 'seat-amenity' || routeMode === 'gate-seat-amenity') && (
              <g className={styles.routeTargetGroup}>
                <circle
                  cx={activeSection.x}
                  cy={activeSection.y}
                  r="18"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  className={styles.targetPulseRing}
                />
                <circle
                  cx={activeSection.x}
                  cy={activeSection.y}
                  r="8"
                  fill="#10b981"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <circle
                  cx={activeSection.x}
                  cy={activeSection.y}
                  r="3.5"
                  fill="#ffffff"
                />
                {/* Text Badge for Seat */}
                <g transform={`translate(${activeSection.x}, ${activeSection.y - 18})`}>
                  <rect
                    x="-42"
                    y="-15"
                    width="84"
                    height="18"
                    rx="4"
                    fill={isNight ? "#060a14" : "#ffffff"}
                    stroke="#10b981"
                    strokeWidth="1.2"
                    className={styles.targetBadge}
                  />
                  <text
                    x="0"
                    y="-3"
                    textAnchor="middle"
                    fontSize="8"
                    fontWeight="800"
                    fontFamily="sans-serif"
                    fill={isNight ? "#10b981" : "#059669"}
                  >
                    SEAT {ticket.row || '0'}-{ticket.seat || '0'}
                  </text>
                </g>
              </g>
            )}
          </g>
        )}
      </svg>

      {/* Overlay info cards */}

    </div>
  );
}
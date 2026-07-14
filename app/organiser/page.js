'use client';
import { useState, useRef, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import styles from './organiser.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCommentDots, faXmark, faPaperPlane, faRobot,
  faChevronRight, faChevronLeft, faDoorOpen, faExclamationTriangle,
  faUsers, faLightbulb, faCog, faUserShield, faUser
} from '@fortawesome/free-solid-svg-icons';

import { initialStats, initialIncidents, initialGates, incidentTemplates } from '../lib/data/organiser-data';
import OrganiserStadiumMap from '../components/OrganiserStadiumMap';

export default function OrganiserPage() {
  const { data: session } = useSession();
  const [gates, setGates] = useState(initialGates);
  const [incidents, setIncidents] = useState(initialIncidents);
  const [stats, setStats] = useState(initialStats);
  const [climate, setClimate] = useState('CLEAR');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeGateManage, setActiveGateManage] = useState(null);
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `Welcome to the FIFA WC 2026 Operations Center. 🛡️ I am your Operations Assistant. How can I help you manage the stadium, gates, or active incidents today?`,
      time: 'Now'
    }
  ]);

  const [notifications, setNotifications] = useState([]);
  const activeWarningsRef = useRef({
    'Gate B': true,
    'Gate C': true
  });

  // Watch gates for density transitions above 50%
  useEffect(() => {
    gates.forEach(gate => {
      const isWarning = gate.density > 50;
      const wasWarning = activeWarningsRef.current[gate.id];

      if (isWarning && !wasWarning) {
        activeWarningsRef.current[gate.id] = true;
        triggerAiWarningRecommendation(gate);
      } else if (!isWarning && wasWarning) {
        activeWarningsRef.current[gate.id] = false;
      }
    });
  }, [gates]);

  // Auto-scroll to bottom when messages change or typing state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  // Sync the incidents list with the Open Incidents stats card
  useEffect(() => {
    const criticalCount = incidents.filter(i => i.type === 'CRITICAL').length;
    setStats(prev => prev.map(s => {
      if (s.label === 'Open Incidents') {
        return { 
          ...s, 
          value: incidents.length.toString(), 
          trend: criticalCount > 0 ? `${criticalCount} Critical` : "Normal",
          trendColor: criticalCount > 0 ? "#ef4444" : "#4ade80"
        };
      }
      return s;
    }));
  }, [incidents]);

  const chipsRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const updateScrollArrows = () => {
    const el = chipsRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowLeftArrow(scrollLeft > 2);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 2);
  };

  useEffect(() => {
    if (isChatOpen) {
      const timer = setTimeout(() => {
        updateScrollArrows();
      }, 150);
      window.addEventListener('resize', updateScrollArrows);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateScrollArrows);
      };
    }
  }, [isChatOpen]);

  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftRef = useRef(0);
  const isDragging = useRef(false);

  const handleMouseDown = (e) => {
    const el = chipsRef.current;
    if (!el) return;
    isDown.current = true;
    isDragging.current = false;
    el.classList.add(styles.dragActive);
    startX.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseLeave = () => {
    if (!isDown.current) return;
    isDown.current = false;
    const el = chipsRef.current;
    if (el) {
      el.classList.remove(styles.dragActive);
    }
  };

  const handleMouseUp = () => {
    if (!isDown.current) return;
    isDown.current = false;
    const el = chipsRef.current;
    if (el) {
      el.classList.remove(styles.dragActive);
    }
    setTimeout(() => {
      isDragging.current = false;
    }, 50);
  };

  const handleMouseMove = (e) => {
    if (!isDown.current) return;
    e.preventDefault();
    const el = chipsRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    if (Math.abs(x - startX.current) > 5) {
      isDragging.current = true;
    }
    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleChipClick = (e, text) => {
    if (isDragging.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    handleSendMessage(text);
  };

  const handleSendMessage = async (textToSend) => {
    const msg = textToSend || chatInput;
    if (!msg.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!textToSend) setChatInput('');

    setIsTyping(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'organiser',
          message: msg,
          crowdDensityData: {
            gates: gates,
            incidents: incidents,
            stats: stats
          }
        }),
      });
      const data = await response.json();

      setIsTyping(false);

      if (!response.ok) {
        console.error('Chat API returned error:', data?.error, data?.detail);
        if (response.status === 429) {
          alert(data?.error || 'Your limit is over. Please try again later.');
          return;
        }
        throw new Error(data?.detail || data?.error || `HTTP ${response.status}`);
      }

      if (data.reply) {
        const cleanReply = data.reply
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/^#+\s*/gm, '')
          .trim();
        setChatMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'bot',
          text: cleanReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        throw new Error('Empty response from AI');
      }
    } catch (error) {
      setIsTyping(false);
      console.error('Chat AI Error:', error.message);
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: "Operations Alert: Having trouble reaching the AI Operations Support system. Please check your network connection.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };

  const triggerAiWarningRecommendation = async (gate) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'organiser',
          message: `Gate ${gate.id} is at warning density (${gate.density}%). Please provide a brief, direct operational recommendation or staff deployment action to resolve this congestion. Keep it under 2 sentences. 
          Return ONLY a raw JSON object with this exact structure (no markdown formatting, no backticks, just the JSON string):
          {
            "reply": "Your brief textual recommendation",
            "actions": [
              { "gateId": "Gate X", "newDensity": 20 }
            ]
          }
          The 'actions' array should contain the specific gate adjustments to execute your recommendation.`,
          crowdDensityData: {
            gates: gates,
            incidents: incidents,
            stats: stats
          }
        }),
      });
      const data = await response.json();
      if (data.reply) {
        let cleanReply = data.reply;
        let actions = [];
        
        try {
          // Attempt to parse JSON if Gemini returns structured data
          let jsonStr = data.reply.trim();
          // Strip markdown code block if present
          if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          }
          const parsed = JSON.parse(jsonStr);
          cleanReply = parsed.reply || cleanReply;
          actions = parsed.actions || [];
        } catch (e) {
          // Fallback to text cleanup if it's not valid JSON
          cleanReply = data.reply
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/^#+\s*/gm, '')
            .trim();
        }

        const newNotification = {
          id: Date.now(),
          title: `AI Recommendation: ${gate.id} Congestion Alert`,
          text: cleanReply,
          actions: actions,
          gateId: gate.id,
          density: gate.density,
          time: 'Just now'
        };

        setNotifications(prev => [...prev, newNotification]);

        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
        }, 12000);
      }
    } catch (err) {
      console.error('Failed to fetch warning recommendation:', err);
    }
  };

  const handleAcceptAction = (actions, notificationId) => {
    if (actions && actions.length > 0) {
      actions.forEach(action => {
        if (action.gateId && action.newDensity !== undefined) {
          handleUpdateGateDensity(action.gateId, action.newDensity);
        }
      });
    }
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleUpdateGateDensity = (id, newDensity) => {
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
  };

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
        // Add a random incident
        setIncidents(prev => {
          if (prev.length >= 6) return prev; // Limit maximum active incidents
          
          // Filter templates that aren't already active
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
        // Resolve / remove a random incident
        setIncidents(prev => {
          if (prev.length <= 1) return prev; // Keep at least one incident
          const toRemoveIdx = Math.floor(Math.random() * prev.length);
          return prev.filter((_, idx) => idx !== toRemoveIdx);
        });
      }
    }, 4000); // 4-second interval for readability of dynamic changes

    return () => clearInterval(interval);
  }, [isAutoSimulating]);

  const handleSimulateOverflow = () => {
    // Make Gate D congested to simulate overflow
    setGates(prevGates => prevGates.map(g => 
      g.id === 'Gate D' ? { ...g, status: 'CONGESTED', flow: 'Extreme', density: 100 } : g
    ));

    // Add a new critical incident for Gate D
    setIncidents(prev => [
      { id: Date.now(), title: "Severe Overflow", location: "Gate D", type: "CRITICAL", time: "Just now" },
      ...prev
    ]);

    // Update stats to show higher flow
    setStats(prev => prev.map(s => {
      if (s.label === 'Gate Flow') return { ...s, value: "1,450", trend: "Surging", trendColor: "#f59e0b" };
      return s;
    }));
  };

  const handleReset = () => {
    setGates(initialGates);
    setIncidents(initialIncidents);
    setStats(initialStats);
    setClimate('CLEAR');
  };

  const handleSimulateClimate = (type) => {
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
  };

  const handleEmergencyOpenAllGates = () => {
    // SOP: Open all gates to maximize unidirectional flow and relieve critical congestion
    setGates(prevGates => prevGates.map(g => ({
      ...g,
      density: Math.min(g.density, 25), // Rapidly relieve density
      status: 'OPEN',
      flow: 'Rapid Egress'
    })));

    setIncidents(prev => [
      { id: Date.now(), title: "Emergency All-Gate Egress Initiated", location: "All Gates", type: "CRITICAL", time: "Just now", shortLabel: "! EVAC" },
      ...prev
    ]);

    setNotifications(prev => [...prev, {
      id: Date.now(),
      title: "Protocol Active: Crowd Management",
      text: "Unidirectional emergency flow initiated. All gates open to relieve crush conditions.",
      time: 'Just now'
    }]);
  };

  const hasHighDensity = gates.some(g => g.density >= 80);

  return (
    <div className={styles.wrapper}>
      {/* Background */}
      <div className={styles.bg}>
        <div className={styles.bgGlow1}></div>
        <div className={styles.bgGlow2}></div>
        <div className={styles.grid}></div>
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.navLeft}>
          <div className={styles.navControlGroup}>
            <Link href="/" className={styles.navBack} id="nav-back-home" aria-label="Back to Home">
              <svg viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span className={styles.navBackText}>Back</span>
            </Link>
            <div className={styles.navHoverLabel}>Back to Home</div>
          </div>
          
          <div className={styles.navControlGroup}>
            <div className={styles.navBrand}>
              <img src="/trophy.svg" alt="Website Logo" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
              <span className={styles.navBrandText}>FIFA WC 2026</span>
            </div>
            <div className={styles.navHoverLabel}>Tournament</div>
          </div>

          <div className={styles.navBadge}>STADIUM OPS</div>
        </div>
        
        <div className={styles.navActions}>
          {session ? (
            <>
              <span className={styles.navUserName}>{session.user.name}</span>
              <div className={styles.navControlGroup}>
                <button onClick={() => signOut()} className={styles.authBtnLogout} aria-label="Logout">
                  <span className={styles.authBtnText}>Logout</span>
                </button>
                <div className={styles.navHoverLabel}>Logout</div>
              </div>
            </>
          ) : (
            <div className={styles.navControlGroup}>
              <button onClick={() => signIn('google')} className={styles.authBtnLogin} aria-label="Login or Sign Up">
                <FontAwesomeIcon icon={faUser} className={styles.mobileOnlyIcon} />
                <span className={styles.authBtnText}>Login / Sign Up</span>
              </button>
              <div className={styles.navHoverLabel}>Login</div>
            </div>
          )}
        </div>
      </nav>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerPill}>
            <span className={styles.headerDot}></span>
            LIVE OPERATIONS CENTER
          </div>
          <h1 className={styles.headerTitle}>
            CROWD & VENUE <span className={styles.headerAccent}>MANAGEMENT</span>
          </h1>
          <p className={styles.headerSub}>
            Real-time stadium overview. Monitor gate flow, crowd density, and active incidents.
          </p>
        </div>
        <div className={styles.headerActions} style={{ position: 'relative' }}>
          <button className={styles.actionBtn} onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
            <FontAwesomeIcon icon={faCog} style={{ marginRight: '8px' }} />
            Control Panel
          </button>

          {isSettingsOpen && (
            <div className={styles.settingsDropdown}>
              <div className={styles.settingsHeader}>
                <span className={styles.settingsTitle}>Stadium Control Panel</span>
                <button className={styles.settingsCloseBtn} onClick={() => setIsSettingsOpen(false)} aria-label="Close settings">
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              {/* Simulation switch section */}
              <div className={styles.settingsSection}>
                <span className={styles.settingsSectionTitle}>Simulation Settings</span>
                <div className={styles.settingsToggleRow}>
                  <span className={styles.settingsLabel}>Auto-Fluctuate Crowd Flow</span>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={isAutoSimulating}
                      onChange={(e) => setIsAutoSimulating(e.target.checked)}
                    />
                    <span className={styles.sliderRound}></span>
                  </label>
                </div>
                <div className={styles.settingsBtnRow}>
                  <button className={styles.actionBtn} onClick={handleSimulateOverflow} style={{ fontSize: '0.72rem', padding: '8px', justifyContent: 'center' }}>
                    Trigger Overflow
                  </button>
                  <button className={styles.actionBtn} onClick={handleReset} style={{ fontSize: '0.72rem', padding: '8px', justifyContent: 'center' }}>
                    Reset State
                  </button>
                </div>
              </div>

              {/* Climate Simulation section */}
              <div className={styles.settingsSection}>
                <span className={styles.settingsSectionTitle}>Climate Diversity</span>
                <div className={styles.settingsBtnRow}>
                  <button className={styles.actionBtn} onClick={() => handleSimulateClimate('HEATWAVE')} style={{ fontSize: '0.72rem', padding: '8px', justifyContent: 'center', background: climate === 'HEATWAVE' ? 'rgba(239, 68, 68, 0.2)' : '', border: climate === 'HEATWAVE' ? '1px solid rgba(239,68,68,0.5)' : '' }}>
                    🌡️ Heatwave
                  </button>
                  <button className={styles.actionBtn} onClick={() => handleSimulateClimate('STORM')} style={{ fontSize: '0.72rem', padding: '8px', justifyContent: 'center', background: climate === 'STORM' ? 'rgba(59, 130, 246, 0.2)' : '', border: climate === 'STORM' ? '1px solid rgba(59,130,246,0.5)' : '' }}>
                    ⛈️ Storm
                  </button>
                  <button className={styles.actionBtn} onClick={() => handleSimulateClimate('CLEAR')} style={{ fontSize: '0.72rem', padding: '8px', justifyContent: 'center', background: climate === 'CLEAR' ? 'rgba(16, 185, 129, 0.2)' : '', border: climate === 'CLEAR' ? '1px solid rgba(16,185,129,0.5)' : '' }}>
                    ☀️ Clear
                  </button>
                </div>
              </div>

              {/* Adjust value section */}
              <div className={styles.settingsSection}>
                <span className={styles.settingsSectionTitle}>Adjust Gate Densities</span>
                <div className={styles.settingsSlidersGrid}>
                  {gates.map((gate) => (
                    <div key={gate.id} className={styles.settingsSliderRow}>
                      <div className={styles.sliderHeader}>
                        <span className={styles.sliderLabel}>{gate.id} ({gate.status})</span>
                        <span className={styles.sliderValue}>{gate.density}%</span>
                      </div>
                      <input
                        type="range"
                        className={styles.sliderInput}
                        min="0"
                        max="100"
                        value={gate.density}
                        onChange={(e) => handleUpdateGateDensity(gate.id, parseInt(e.target.value))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {hasHighDensity ? (
            <button 
              className={`${styles.actionBtnPrimary} ${styles.btnEmergency}`} 
              onClick={handleEmergencyOpenAllGates}
            >
              <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '8px' }} />
              Open All Gates
            </button>
          ) : (
            <button className={styles.actionBtnPrimary}>
              <svg viewBox="0 0 24 24" fill="none" width="16" height="16" style={{ marginRight: '8px' }}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              Deploy Staff
            </button>
          )}
        </div>
      </header>

      <main className={styles.main}>
        {/* Stats Row */}
        <div className={styles.statsRow}>
          {stats.map((s, i) => (
            <div key={i} className={styles.statCard}>
              <div className={styles.statTop}>
                <span className={styles.statIcon}>
                  <FontAwesomeIcon icon={s.icon} style={{ color: s.iconColor }} />
                </span>
                <span className={styles.statTrend} style={{ color: s.trendColor, borderColor: s.trendColor + '44', backgroundColor: s.trendColor + '11' }}>{s.trend}</span>
              </div>
              <div className={styles.statValueRow}>
                <span className={styles.statValue}>{s.value}</span>
                <span className={styles.statSub}>{s.sub}</span>
              </div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className={styles.contentGrid}>
          {/* Left Column: Map */}
          <section className={styles.panelMap}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>
                <span className={styles.panelDot} style={{background:'#4361ee'}}></span>
                Live Crowd Heatmap
              </h2>
            </div>
            <OrganiserStadiumMap gates={gates} incidents={incidents} climate={climate} />
          </section>

          {/* Right Column: Feeds */}
          <div className={styles.rightCol}>
            {/* Live Incidents */}
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>
                  <span className={styles.panelDot} style={{background:'#ef4444'}}></span>
                  Live Incident Feed
                </h2>
                <span className={styles.panelCount}>{incidents.length} active</span>
              </div>
              <div className={styles.taskList}>
                {incidents.map((inc) => (
                  <div key={inc.id} className={styles.taskItem}>
                    <div className={styles.taskContent}>
                      <p className={styles.taskTitle}>{inc.title}</p>
                      <div className={styles.taskMeta}>
                        <span className={styles.taskCategory}>{inc.location}</span>
                        <span className={styles.taskDue}>{inc.time}</span>
                      </div>
                    </div>
                    <span className={styles.priorityBadge} data-type={inc.type}>
                      {inc.type}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Gate Status */}
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>
                  <span className={styles.panelDot} style={{background:'var(--fifa-gold)'}}></span>
                  Gate Status
                </h2>
              </div>
              <div className={styles.gateList}>
                {gates.map((g, i) => (
                  <div key={i} className={styles.gateItemWrapper}>
                    <div className={styles.gateItem}>
                      <div className={styles.gateInfo}>
                        <p className={styles.gateTitle}>{g.id}</p>
                        <p className={styles.gateFlow}>Flow: {g.flow}</p>
                      </div>
                      <div className={styles.gateActions}>
                        <span className={styles.statusBadge} data-status={g.status}>{g.status}</span>
                        <button 
                          className={styles.gateBtn}
                          onClick={() => setActiveGateManage(activeGateManage === g.id ? null : g.id)}
                        >
                          {activeGateManage === g.id ? 'Close' : 'Manage'}
                        </button>
                      </div>
                    </div>
                    {activeGateManage === g.id && (
                      <div className={styles.inlineGateManager}>
                        <div className={styles.sliderHeader}>
                          <span className={styles.sliderLabel}>Density</span>
                          <span className={styles.sliderValue}>{g.density}%</span>
                        </div>
                        <input
                          type="range"
                          className={styles.sliderInput}
                          min="0"
                          max="100"
                          value={g.density}
                          onChange={(e) => handleUpdateGateDensity(g.id, parseInt(e.target.value))}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Switch CTA */}
        <section className={styles.switchCta}>
          <div className={styles.ctaContent}>
            <p className={styles.ctaLabel}>LOOKING FOR FAN EXPERIENCE?</p>
            <h2 className={styles.ctaTitle}>Switch to Fan Mode</h2>
            <p className={styles.ctaDesc}>Explore matches, stadium guides, live scores, and fan zone info.</p>
            <Link href="/fan" className={styles.ctaBtn}>
              Go to Fan Zone →
            </Link>
          </div>
          <div className={styles.ctaIcon}>⚽</div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>FIFA World Cup 2026™ Operations Platform — Confidential</p>
        <p className={styles.footerSub}>USA · Canada · Mexico · June–July 2026</p>
      </footer>

      {/* Floating Chat Button */}
      <button
        className={`${styles.chatButton} ${isChatOpen ? styles.chatButtonActive : ''}`}
        onClick={() => setIsChatOpen(!isChatOpen)}
        aria-label="Toggle chat window"
      >
        <span className={styles.chatBtnIcon}>
          <FontAwesomeIcon icon={isChatOpen ? faXmark : faCommentDots} />
        </span>
      </button>

      {/* Chat Window */}
      {isChatOpen && (
        <div className={styles.chatWindow} id="chat-window">
          {/* Header */}
          <div className={styles.chatHeader}>
            <div className={styles.chatHeaderInfo}>
              <div className={styles.chatAvatar}>
                <FontAwesomeIcon icon={faRobot} />
                <span className={styles.avatarOnline} />
              </div>
              <div>
                <h4 className={styles.chatTitle}>Operations Assistant</h4>
                <p className={styles.chatSubtitle}>AI Support • Online</p>
              </div>
            </div>
            <button className={styles.chatCloseBtn} onClick={() => setIsChatOpen(false)} aria-label="Close chat">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          {/* Messages */}
          <div className={styles.chatMessagesContainer}>
            {chatMessages.map(msg => (
              <div key={msg.id} className={`${styles.chatMessage} ${msg.sender === 'user' ? styles.chatMessageUser : styles.chatMessageBot}`}>
                {msg.sender === 'bot' && (
                  <div className={styles.msgAvatar}>
                    <FontAwesomeIcon icon={faRobot} />
                  </div>
                )}
                <div className={styles.msgBubble}>
                  <p className={styles.msgText}>{msg.text}</p>
                  <span className={styles.msgTime}>{msg.time}</span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className={`${styles.chatMessage} ${styles.chatMessageBot}`}>
                <div className={styles.msgAvatar}>
                  <FontAwesomeIcon icon={faRobot} />
                </div>
                <div className={styles.msgBubble}>
                  <div className={styles.typingIndicator}>
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Options / Chips */}
          <div className={styles.chatQuickChipsContainer}>
            {showLeftArrow && (
              <button
                className={`${styles.chatScrollBtn} ${styles.chatScrollBtnLeft}`}
                onClick={() => {
                  const el = chipsRef.current;
                  if (el) {
                    el.scrollBy({ left: -120, behavior: 'smooth' });
                  }
                }}
                type="button"
                aria-label="Scroll left"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
            )}
            <div
              className={styles.chatQuickChips}
              id="chat-quick-chips"
              ref={chipsRef}
              onScroll={updateScrollArrows}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
            >
              <button className={styles.chipBtn} onClick={(e) => handleChipClick(e, "Check congested gates")}><span className={styles.chipIcon}><FontAwesomeIcon icon={faDoorOpen} /></span> Congested Gates</button>
              <button className={styles.chipBtn} onClick={(e) => handleChipClick(e, "Show gate flow stats")}><span className={styles.chipIcon}><FontAwesomeIcon icon={faUsers} /></span> Gate Flows</button>
              <button className={styles.chipBtn} onClick={(e) => handleChipClick(e, "Any active incidents?")}><span className={styles.chipIcon}><FontAwesomeIcon icon={faExclamationTriangle} /></span> Incidents Feed</button>
              <button className={styles.chipBtn} onClick={(e) => handleChipClick(e, "Provide crowd recommendations")}><span className={styles.chipIcon}><FontAwesomeIcon icon={faLightbulb} /></span> Recommendations</button>
            </div>
            {showRightArrow && (
              <button
                className={`${styles.chatScrollBtn} ${styles.chatScrollBtnRight}`}
                onClick={() => {
                  const el = chipsRef.current;
                  if (el) {
                    el.scrollBy({ left: 120, behavior: 'smooth' });
                  }
                }}
                type="button"
                aria-label="Scroll right"
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            )}
          </div>

          {/* Input Footer */}
          <form className={styles.chatInputArea} onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
            <input
              type="text"
              className={styles.chatInput}
              placeholder="Ask operations assistant..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
            />
            <button type="submit" className={styles.chatSendBtn} aria-label="Send message">
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </form>
        </div>
      )}

      {/* Toast Notifications */}
      <div className={styles.notificationContainer}>
        {notifications.map(n => (
          <div key={n.id} className={styles.notificationToast}>
            <div className={styles.notificationHeader}>
              <div className={styles.notificationTitleBlock}>
                <span className={styles.notificationIcon}>🚨</span>
                <h5 className={styles.notificationTitle}>{n.title}</h5>
              </div>
              <button className={styles.notificationCloseBtn} onClick={() => setNotifications(prev => prev.filter(notif => notif.id !== n.id))} aria-label="Close notification">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className={styles.notificationBody}>
              <p className={styles.notificationText}>{n.text}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <span className={styles.notificationMeta}>Current Density: {n.density}% · {n.time}</span>
                {n.actions && n.actions.length > 0 && (
                  <button 
                    onClick={() => handleAcceptAction(n.actions, n.id)}
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    Accept
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './organiser.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCommentDots, faXmark, faPaperPlane, faRobot,
  faChevronRight, faChevronLeft, faDoorOpen, faExclamationTriangle,
  faUsers, faLightbulb, faCog, faUserShield, faUser, faTemperatureHigh,
  faClipboardList, faCheck
} from '@fortawesome/free-solid-svg-icons';

import dynamic from 'next/dynamic';
import { useCrowd } from '../contexts/CrowdContext';
import { initialVolunteerTasks } from '../lib/data/organiser-data';
import { useOrganiserChat } from '../hooks/useOrganiserChat';

const OrganiserStadiumMap = dynamic(() => import('../components/OrganiserStadiumMap'), { ssr: false });
import OrganiserChatWidget from '../components/OrganiserChatWidget';

import OrganiserStatsRow from '../components/organiser/OrganiserStatsRow';
import OrganiserWasteManagement from '../components/organiser/OrganiserWasteManagement';
import OrganiserVolunteerBoard from '../components/organiser/OrganiserVolunteerBoard';
import OrganiserIncidentFeed from '../components/organiser/OrganiserIncidentFeed';
import OrganiserGateStatus from '../components/organiser/OrganiserGateStatus';
import OrganiserControlPanel from '../components/organiser/OrganiserControlPanel';
import { getCsrfToken } from '../lib/utils/csrf';

export default function OrganiserPage() {
  const { data: session } = useSession();
  const {
    gates, incidents, stats, climate,
    isAutoSimulating, setIsAutoSimulating,
    handleUpdateGateDensity,
    handleSimulateOverflow,
    handleReset,
    handleSimulateClimate,
    handleEmergencyOpenAllGates,
    bins = [], setBins, handleDeployStaffToBin
  } = useCrowd();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeGateManage, setActiveGateManage] = useState(null);
  const [isEmergencyDisabled, setIsEmergencyDisabled] = useState(false);
  const [emergencyDisableCountdown, setEmergencyDisableCountdown] = useState(0);
  const chatHook = useOrganiserChat({ gates, incidents, stats });

  const [notifications, setNotifications] = useState([]);
  const [volunteerTasks, setVolunteerTasks] = useState(initialVolunteerTasks);
  const activeWarningsRef = useRef({
    'Gate B': true,
    'Gate C': true
  });

  const triggerAiWarningRecommendation = useCallback(async (gate) => {
    try {
      let cleanReply = `Deploy additional staff to ${gate.id} immediately to resolve congestion (${gate.density}% density).`;
      
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-CSRF-Token': getCsrfToken()
          },
          body: JSON.stringify({
            from: 'organiser',
            requestType: 'notification',
            message: `Generate a short (1 sentence) urgent action recommendation for staff regarding gate congestion. Gate ${gate.id} has reached a critical density of ${gate.density}%.`,
            stream: false
          })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.reply) cleanReply = data.reply.trim().replace(/^["']|["']$/g, '');
        }
      } catch (err) {
        // AI warning fetch failed silently
      }

      const actions = [
        { gateId: gate.id, newDensity: Math.max(0, gate.density - 20) }
      ];

      const newNotification = {
        id: Date.now() + Math.random(),
        title: `Action Required: ${gate.id} Congestion Alert`,
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
    } catch (err) {
      // Failed to create warning recommendation
    }
  }, []);

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
  }, [gates, triggerAiWarningRecommendation]);

  const triggerAiBinRecommendation = useCallback(async (bin) => {
    try {
      let cleanReply = `${bin.id} at ${bin.location} is overflowing (${bin.fillLevel}% full). Please deploy cleaning staff.`;
      
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-CSRF-Token': getCsrfToken()
          },
          body: JSON.stringify({
            from: 'organiser',
            requestType: 'notification',
            message: `Generate a short (1 sentence) urgent notification. ${bin.id} at ${bin.location} is overflowing (${bin.fillLevel}% full). Tell staff to deploy cleaners to maintain zero-waste sustainability compliance.`,
            stream: false
          })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.reply) cleanReply = data.reply.trim().replace(/^["']|["']$/g, '');
        }
      } catch (err) {
        // AI bin warning fetch failed silently
      }

      const actions = [{ binId: bin.id, actionType: 'EMPTY_BIN' }];

      const newNotification = {
        id: Date.now() + Math.random(),
        title: `Waste Management Alert`,
        text: cleanReply,
        actions: actions,
        density: bin.fillLevel,
        time: 'Just now'
      };

      setNotifications(prev => [...prev, newNotification]);

      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 12000);
    } catch (err) {
      // Failed to create bin warning recommendation
    }
  }, []);

  const activeBinWarningsRef = useRef({});

  useEffect(() => {
    bins.forEach(bin => {
      const isWarning = bin.fillLevel > 80;
      const wasWarning = activeBinWarningsRef.current[bin.id];

      if (isWarning && !wasWarning) {
        activeBinWarningsRef.current[bin.id] = true;
        triggerAiBinRecommendation(bin);
      } else if (!isWarning && wasWarning) {
        activeBinWarningsRef.current[bin.id] = false;
      }
    });
  }, [bins, triggerAiBinRecommendation]);

  const criticalCount = incidents.filter(i => i.type === 'CRITICAL').length;
  const displayStats = stats.map(s => {
    if (s.label === 'Open Incidents') {
      return { 
        ...s, 
        value: incidents.length.toString(), 
        trend: criticalCount > 0 ? `${criticalCount} Critical` : "Normal",
        trendColor: criticalCount > 0 ? "#ef4444" : "#4ade80"
      };
    }
    return s;
  });

  const handleAcceptAction = (actions, notifId) => {
    if (actions && actions.length > 0) {
      actions.forEach(action => {
        if (action.gateId && action.newDensity !== undefined) {
          handleUpdateGateDensity(action.gateId, action.newDensity);
        }
        if (action.binId && action.actionType === 'EMPTY_BIN') {
          handleDeployStaffToBin(action.binId);
        }
      });
    }
    setNotifications(prev => prev.filter(n => n.id !== notifId));
  };

  const handleGenerateAiTask = async () => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken()
        },
        body: JSON.stringify({
          from: 'organiser',
          requestType: 'submission',
          message: `Generate exactly ONE urgent volunteer task based on current stadium conditions. Return ONLY a JSON object with this structure: {"task": "Short title", "zone": "Zone Name", "category": "Security|Medical|Hospitality|Waste", "shift": "Immediate", "status": "ACTIVE", "assignee": "AI Assigned"}. Crowd density: ${JSON.stringify(gates)}. Climate: ${climate}.`,
          stream: false
        })
      });

      if (!response.ok) throw new Error('Failed to generate task');

      const data = await response.json();
      let aiText = data.reply || "";
      aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

      const newTask = JSON.parse(aiText);
      newTask.id = `VT-AI-${Math.floor(Math.random() * 1000)}`;
      setVolunteerTasks(prev => [newTask, ...prev]);
    } catch (e) {
      console.error(e);
      // Fallback if parsing fails
      setVolunteerTasks(prev => [{
        id: `VT-AI-${Math.floor(Math.random() * 1000)}`,
        task: 'Emergency Crowd Control',
        zone: 'All Gates',
        category: 'Security',
        shift: 'Immediate',
        status: 'ACTIVE',
        assignee: 'All Available'
      }, ...prev]);
    }
  };

  const markTaskCompleted = (id) => {
    setVolunteerTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'COMPLETED' } : t));
  };

  const handleEmergencyOpenAllGatesClick = () => {
    if (isEmergencyDisabled) return;

    const isConfirmed = window.confirm("Safety Alert: Are you sure you want to open all gates? This will initiate the emergency crowd protocol.");
    if (!isConfirmed) return;

    handleEmergencyOpenAllGates();
    setNotifications(prev => [...prev, {
      id: Date.now() + Math.random(),
      title: "Protocol Active: Crowd Management",
      text: "Unidirectional emergency flow initiated. All gates open to relieve crush conditions.",
      time: 'Just now'
    }]);

    const maxDensity = gates && gates.length > 0 ? Math.max(...gates.map(g => g.density)) : 0;
    const disableSeconds = maxDensity >= 80 ? 180 : (maxDensity >= 50 ? 120 : 60);

    setIsEmergencyDisabled(true);
    setEmergencyDisableCountdown(disableSeconds);

    const interval = setInterval(() => {
      setEmergencyDisableCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsEmergencyDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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
              <Image priority src="/trophy.svg" alt="Website Logo" width={20} height={20} className={styles.iconMargin} />
              <span className={styles.navBrandText}>FIFA World Cup 2026™ GenAI Operations Platform</span>
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
        <div className={`${styles.headerActions} ${styles.posRelative}`}>
          <button className={styles.actionBtn} onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
            <FontAwesomeIcon icon={faCog} className={styles.iconMargin} />
            Control Panel
          </button>

          <OrganiserControlPanel
            isSettingsOpen={isSettingsOpen}
            setIsSettingsOpen={setIsSettingsOpen}
            isAutoSimulating={isAutoSimulating}
            setIsAutoSimulating={setIsAutoSimulating}
            handleSimulateOverflow={handleSimulateOverflow}
            handleReset={handleReset}
            climate={climate}
            handleSimulateClimate={handleSimulateClimate}
            gates={gates}
            handleUpdateGateDensity={handleUpdateGateDensity}
          />

          <button
            className={`${styles.emergencyBtn} ${isEmergencyDisabled ? styles.disabled : ''}`}
            onClick={handleEmergencyOpenAllGatesClick}
            disabled={isEmergencyDisabled}
          >
            <FontAwesomeIcon icon={faExclamationTriangle} className={styles.iconMargin} />
            {isEmergencyDisabled ? `Disabled (${Math.floor(emergencyDisableCountdown / 60)}:${(emergencyDisableCountdown % 60).toString().padStart(2, '0')})` : 'Open All Gates'}
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Stats Row */}
        <OrganiserStatsRow displayStats={displayStats} />

        {/* Main Grid */}
        <div className={styles.contentGrid}>
          {/* Left Column */}
          <div className={styles.flexCol}>
            
            {/* Action Panel 1: Map Insights */}
            <div className={styles.sidePanel}>
              <div className={styles.panelHeader}>
                <div className={styles.panelTitle}>
                  <span className={`${styles.panelDot} ${styles.bgBlue}`}></span>
                  GenAI Crowd Management Intelligence
                </div>
              </div>
              <OrganiserStadiumMap gates={gates} incidents={incidents} climate={climate} />
            </div>

            {/* Waste Management */}
            <OrganiserWasteManagement bins={bins} handleDeployStaffToBin={handleDeployStaffToBin} />

            {/* Volunteer Task Board */}
            <OrganiserVolunteerBoard 
              volunteerTasks={volunteerTasks} 
              handleGenerateAiTask={handleGenerateAiTask} 
              markTaskCompleted={markTaskCompleted} 
            />
          </div>

          {/* Right Column: Feeds */}
          <div className={styles.rightCol}>
            {/* Live Incidents */}
            <OrganiserIncidentFeed incidents={incidents} />

            {/* Gate Status */}
            <OrganiserGateStatus 
              gates={gates} 
              activeGateManage={activeGateManage} 
              setActiveGateManage={setActiveGateManage} 
              handleUpdateGateDensity={handleUpdateGateDensity} 
            />


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
        className={`${styles.chatButton} ${chatHook.isChatOpen ? styles.chatButtonActive : ''}`}
        onClick={() => chatHook.setIsChatOpen(!chatHook.isChatOpen)}
        aria-label="Toggle chat window"
      >
        <span className={styles.chatBtnIcon}>
          <FontAwesomeIcon icon={chatHook.isChatOpen ? faXmark : faCommentDots} />
        </span>
      </button>

      <OrganiserChatWidget chatHook={chatHook} />

      {/* Toast Notifications */}
      <div className={styles.notificationContainer}>
        {notifications.map(n => (
          <div key={n.id} className={styles.notificationToast}>
            <div className={styles.notificationHeader}>
              <div className={styles.notificationTitleBlock}>
                <span className={styles.notificationIcon}>🚨</span>
                <strong className={styles.notificationTitle}>{n.title}</strong>
              </div>
              <button className={styles.notificationCloseBtn} onClick={() => setNotifications(prev => prev.filter(notif => notif.id !== n.id))} aria-label="Close notification">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className={styles.notificationBody}>
              <p className={styles.notificationText}>{n.text}</p>
              <div className={styles.flexBetween}>
                <span className={styles.notificationMeta}>Current Density: {n.density}% · {n.time}</span>
                {n.actions && n.actions.length > 0 && (
                  <button 
                    className={styles.acceptBtn}
                    onClick={() => handleAcceptAction(n.actions, n.id)}
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

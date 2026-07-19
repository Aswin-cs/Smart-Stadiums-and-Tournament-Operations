'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import styles from './fan.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHamburger, faBeer, faHotdog, faPizzaSlice, faCookie, faMugHot,
  faRestroom, faBriefcaseMedical, faDoorOpen, faCommentDots,
  faXmark, faPaperPlane, faRobot, faUser, faChevronRight, faChevronLeft,
  faTicket, faKitMedical, faBell, faRotateLeft, faSave, faCheck, faChair,
  faCalendarAlt, faInfoCircle, faTrainSubway, faMobileScreen, faTemperatureHigh, faClock, faLocationDot, faClipboardList,
  faFutbol, faBuilding, faUsers, faEye
} from '@fortawesome/free-solid-svg-icons';

import { matches, stadiums, fanTips, defaultTicket, getNearestAmenity } from '../lib/data/fan-data';
import dynamic from 'next/dynamic';
import FanTicketManager from '../components/FanTicketManager';

const StadiumMockup = dynamic(() => import('../components/StadiumMockup'), { ssr: false });
import { useCrowd } from '../contexts/CrowdContext';
import FanChatWidget from '../components/FanChatWidget';
import toastStyles from './toast.module.css';
import { useFanChat } from '../hooks/useFanChat';
import { useDragScroll } from '../hooks/useDragScroll';
import { StadiumRouteProvider } from '../contexts/StadiumRouteContext';

export default function FanPage() {
  const { data: session } = useSession();
  const { gates, incidents, stats, transportation } = useCrowd();
  const [toastNotifications, setToastNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [highContrast, setHighContrast] = useState(false);
  const prevIncidentsRef = useRef(incidents);
  const prevGatesRef = useRef(gates);
  const originalTitleRef = useRef('');

  useEffect(() => {
    originalTitleRef.current = document.title || 'FIFA WC 2026 Fan Experience';
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setUnreadCount(0);
        document.title = originalTitleRef.current;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) New Alert! - FIFA WC`;
    }
  }, [unreadCount]);

  useEffect(() => {
    const newIncidents = incidents.filter(inc => !prevIncidentsRef.current.some(p => p.id === inc.id));
    newIncidents.forEach(inc => {
      const id = Date.now() + Math.random();
      setToastNotifications(prev => [...prev, { id, title: "Stadium Alert", text: `${inc.title} at ${inc.location}`, icon: '🚨' }]);
      if (document.hidden) setUnreadCount(prev => prev + 1);
      setTimeout(() => setToastNotifications(prev => prev.filter(n => n.id !== id)), 2000);
    });
    prevIncidentsRef.current = incidents;

    const newCongested = gates.filter(g => g.status === 'CONGESTED' && !prevGatesRef.current.some(p => p.id === g.id && p.status === 'CONGESTED'));
    newCongested.forEach(g => {
      const id = Date.now() + Math.random();
      setToastNotifications(prev => [...prev, { id, title: "High Congestion", text: `${g.id} is experiencing high traffic.`, icon: '⚠️' }]);
      if (document.hidden) setUnreadCount(prev => prev + 1);
      setTimeout(() => setToastNotifications(prev => prev.filter(n => n.id !== id)), 2000);
    });
    prevGatesRef.current = gates;
  }, [incidents, gates]);

  const [ticket, setTicket] = useState(defaultTicket);

  const [routeMode, setRouteMode] = useState('hide');
  const [selectedAmenityId, setSelectedAmenityId] = useState('Burgers');
  const [amenityFilter, setAmenityFilter] = useState('All');

  const chatHook = useFanChat({
    ticket, matches, gates, incidents, stats, transportation,
    setRouteMode, setSelectedAmenityId, setAmenityFilter
  });


  const {
    containerRef: updatesRef,
    showLeftArrow: showUpdatesLeftArrow,
    showRightArrow: showUpdatesRightArrow,
    updateScrollArrows: updateUpdatesScrollArrows,
    handleMouseDown: handleUpdatesMouseDown,
    handleMouseLeave: handleUpdatesMouseLeave,
    handleMouseUp: handleUpdatesMouseUp,
    handleMouseMove: handleUpdatesMouseMove,
    scrollBy: scrollUpdatesBy,
  } = useDragScroll({ deps: [incidents, gates] });


  const handleGetNotification = () => {
    const congestedGates = gates.filter(g => g.status === 'CONGESTED').map(g => ({
      title: "High Congestion",
      text: `${g.id} is experiencing high traffic (${g.density}%). Please use alternative gates if possible.`,
      icon: '⚠️'
    }));

    const activeIncidents = incidents.map(inc => ({
      title: inc.title,
      text: `${inc.location} • ${inc.time}`,
      icon: inc.type === 'CRITICAL' ? '🚨' : '🔔'
    }));

    const allUpdates = [...activeIncidents, ...congestedGates];
    const id = Date.now() + Math.random();

    if (allUpdates.length > 0) {
      const update = allUpdates[Math.floor(Math.random() * allUpdates.length)];
      setToastNotifications(prev => [...prev, { id, ...update }]);
    } else {
      setToastNotifications(prev => [...prev, { id, title: "All Clear", text: "No active incidents or major congestion at the moment. Enjoy the match!", icon: '✅' }]);
    }

    if (document.hidden) setUnreadCount(prev => prev + 1);
    setTimeout(() => setToastNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  return (
    <div className={`${styles.wrapper} ${highContrast ? styles.highContrast : ''}`}>
      {/* Background */}
      <div className={styles.bg}>
        <div className={styles.bgGlow1}></div>
        <div className={styles.bgGlow2}></div>
        <div className={styles.grid}></div>
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        <div className={styles.navControlGroup}>
          <Link href="/" className={styles.navBack} id="nav-back-home" aria-label="Back to Home">
            <svg viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span className={styles.navBackText}>Back</span>
          </Link>
          <div className={styles.navHoverLabel}>Back to Home</div>
        </div>
        
        <div className={styles.navControlGroup}>
          <div className={styles.navBrand}>
            <span className={styles.trophySvg}>
              <Image priority src="/trophy.svg" alt="Trophy Logo" width={36} height={36} className={styles.inlineMiddle} />
            </span>
            <span className={styles.navBrandText}>FIFA World Cup 2026™ GenAI Fan Experience</span>
          </div>
          <div className={styles.navHoverLabel}>GenAI Fan Experience</div>
        </div>

        <div className={styles.navBadge}>FAN ZONE</div>
        
        <div className={styles.navActions}>
          <div className={styles.navControlGroup}>
            <button 
              className={`${styles.iconBtn} ${highContrast ? styles.iconBtnActive : ''}`}
              onClick={() => setHighContrast(!highContrast)}
              aria-label="Toggle High Contrast"
            >
              <FontAwesomeIcon icon={faEye} />
            </button>
            <div className={styles.navHoverLabel}>High Contrast</div>
          </div>
          <div className={styles.navControlGroup}>
            <button onClick={handleGetNotification} className={styles.updateBtn} aria-label="Get Notifications">
              <FontAwesomeIcon icon={faBell} />
              <span className={styles.updateBtnText}>Get Update</span>
            </button>
            <div className={styles.navHoverLabel}>Notifications</div>
          </div>
          
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

      {/* Hero Banner */}
      <header className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <div className={styles.heroPill}>
            <span className={styles.liveDot}></span> TOURNAMENT IN PROGRESS
          </div>
          <h1 className={styles.heroTitle}>
            FAN <span className={styles.heroTitleAccent}>ZONE</span>
          </h1>
          <p className={styles.heroSub}>
            Experience the world&apos;s greatest sporting event live. Track matches, explore stadiums, and never miss a moment.
          </p>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.statBox}>
            <span className={styles.statNum}>48</span>
            <span className={styles.statLabel}>Teams</span>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.statBox}>
            <span className={styles.statNum}>104</span>
            <span className={styles.statLabel}>Matches</span>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.statBox}>
            <span className={styles.statNum}>16</span>
            <span className={styles.statLabel}>Stadiums</span>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.statBox}>
            <span className={styles.statNum}>3</span>
            <span className={styles.statLabel}>Nations</span>
          </div>
        </div>
      </header>

      <StadiumRouteProvider value={{
        ticket,
        routeMode, setRouteMode,
        selectedAmenityId, setSelectedAmenityId,
        amenityFilter, setAmenityFilter,
        accessibilityMode: chatHook.accessibilityMode,
        update: (type, val) => {
          if (type === 'gate') setTicket({ ...ticket, gate: val });
        }
      }}>
        <main className={styles.main}>

        {/* ===== MY TICKET SECTION ===== */}
        <FanTicketManager ticket={ticket} setTicket={setTicket} />

        {/* Stadium Mockup Section */}
        <section className={styles.section} id="stadium-mockup-section">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionLabel}>
              <span className={`${styles.sectionDot} ${styles.bgGold}`}></span>
              STADIUM OVERVIEW
            </div>
            <div className={styles.stadiumMockupBadge}>🏟️ MetLife Stadium · NJ</div>
          </div>
          <StadiumMockup />
        </section>

        {/* Live Stadium Updates */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionLabel}>
              <span className={`${styles.sectionDot} ${styles.bgRed}`}></span>
              LIVE STADIUM UPDATES
            </div>
          </div>
          <div className={styles.updatesScrollWrapper}>
            {showUpdatesLeftArrow && (
              <button
                className={`${styles.updatesScrollBtn} ${styles.updatesScrollBtnLeft}`}
                onClick={() => scrollUpdatesBy(-264)}
                type="button"
                aria-label="Scroll left"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
            )}
            <div 
              className={styles.updatesScrollContainer}
              ref={updatesRef}
              onScroll={updateUpdatesScrollArrows}
              onMouseDown={handleUpdatesMouseDown}
              onMouseLeave={handleUpdatesMouseLeave}
              onMouseUp={handleUpdatesMouseUp}
              onMouseMove={handleUpdatesMouseMove}
            >
              {incidents.slice(0, 2).map((inc) => (
                <div key={inc.id} className={styles.tipCard} style={{ borderColor: inc.type === 'CRITICAL' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)' }}>
                  <span className={styles.tipIcon} style={{ color: inc.type === 'CRITICAL' ? '#ef4444' : '#f59e0b' }}>
                    <FontAwesomeIcon icon={faBell} />
                  </span>
                  <h2 className={styles.tipTitle}>{inc.title}</h2>
                  <p className={styles.tipDesc}>{inc.location} • {inc.time}</p>
                </div>
              ))}
              {gates.filter(g => g.status === 'CONGESTED').map((g) => (
                <div key={g.id} className={`${styles.tipCard} ${styles.borderRed}`}>
                  <span className={`${styles.tipIcon} ${styles.textRed}`}>
                    <FontAwesomeIcon icon={faUsers} />
                  </span>
                  <h2 className={styles.tipTitle}>High Congestion</h2>
                  <p className={styles.tipDesc}>{g.id} is experiencing high traffic ({g.density}%). Please use alternative gates if possible.</p>
                </div>
              ))}
              {incidents.length === 0 && gates.filter(g => g.status === 'CONGESTED').length === 0 && (
                <div className={`${styles.tipCard} ${styles.borderGreen}`}>
                  <span className={`${styles.tipIcon} ${styles.textGreen}`}>
                    <FontAwesomeIcon icon={faCheck} />
                  </span>
                  <h2 className={styles.tipTitle}>All Clear</h2>
                  <p className={styles.tipDesc}>No active incidents or major congestion at the moment. Enjoy the match!</p>
                </div>
              )}
            </div>
            {showUpdatesRightArrow && (
              <button
                className={`${styles.updatesScrollBtn} ${styles.updatesScrollBtnRight}`}
                onClick={() => scrollUpdatesBy(264)}
                type="button"
                aria-label="Scroll right"
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            )}
          </div>
        </section>

        {/* Transportation Section */}
        <section className={styles.section} id="transportation-section">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionLabel}>
              <span className={`${styles.sectionDot} ${styles.bgBlue}`}></span>
              TRANSPORTATION
            </div>
          </div>
          <div className={styles.tipsGrid}>
            {transportation && transportation.map((t) => (
              <div key={t.id} className={styles.tipCard} style={{ borderColor: t.status === 'FULL' || t.status === 'DELAYED' ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)' }}>
                <span className={styles.tipIcon} style={{ color: t.status === 'FULL' || t.status === 'DELAYED' ? '#ef4444' : '#3b82f6' }}>
                  <FontAwesomeIcon icon={t.type === 'Metro' ? faTrainSubway : faTrainSubway} />
                </span>
                <h2 className={styles.tipTitle}>{t.id}</h2>
                <p className={styles.tipDesc}>Status: <span style={{ color: t.status === 'FULL' || t.status === 'DELAYED' ? '#ef4444' : '#4ade80' }}>{t.status}</span></p>
                <p className={styles.tipDesc}>Crowding: {t.crowding} ({t.availableSeats} seats left)</p>
              </div>
            ))}
          </div>
        </section>

        {/* Match Schedule Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionLabel}>
              <span className={styles.sectionDot}></span>
              UPCOMING MATCHES
            </div>
          </div>

          <div className={styles.matchGrid}>
            {matches.map((m) => (
              <div key={m.id} className={`${styles.matchCard} ${m.status === 'LIVE' ? styles.matchCardLive : ''}`} id={`match-card-${m.id}`}>
                {m.status === 'LIVE' && (
                  <div className={styles.liveTag}>
                    <span className={styles.livePulse}></span> LIVE
                  </div>
                )}
                <div className={styles.matchGroup}>GROUP {m.group}</div>
                <div className={styles.matchTeams}>
                  <div className={styles.matchTeam}>
                    <span className={styles.teamFlag}>{m.flagA}</span>
                    <span className={styles.teamCode}>{m.teamA}</span>
                  </div>
                  <div className={styles.matchScore}>
                    {m.status === 'LIVE' ? (
                      <span className={styles.scoreDisplay}>{m.scoreA} <span className={styles.scoreSep}>:</span> {m.scoreB}</span>
                    ) : (
                      <span className={styles.matchVs}>VS</span>
                    )}
                  </div>
                  <div className={styles.matchTeam}>
                    <span className={styles.teamFlag}>{m.flagB}</span>
                    <span className={styles.teamCode}>{m.teamB}</span>
                  </div>
                </div>
                <div className={styles.matchMeta}>
                  <span><FontAwesomeIcon icon={faCalendarAlt} className={styles.iconMargin} /> {m.date}</span>
                  <span><FontAwesomeIcon icon={faClock} className={styles.iconMargin} /> {m.time}</span>
                </div>
                <div className={styles.matchStadium}><FontAwesomeIcon icon={faLocationDot} className={styles.iconMargin} /> {m.stadium}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Fan Tips */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionLabel}>
              <span className={`${styles.sectionDot} ${styles.bgLightRed}`}></span>
              APP FEATURES
            </div>
          </div>
          <div className={styles.tipsGrid}>
            {fanTips.map((t, i) => (
              <div key={i} className={styles.tipCard} id={`tip-card-${i}`}>
                <span className={styles.tipIcon}><FontAwesomeIcon icon={t.icon} /></span>
                <h2 className={styles.tipTitle}>{t.title}</h2>
                <p className={styles.tipDesc}>{t.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Switch to Organiser CTA */}
        <section className={styles.switchCta}>
          <div className={styles.ctaContent}>
            <p className={styles.ctaLabel}>NOT A FAN?</p>
            <h2 className={styles.ctaTitle}>Switch to Organiser Mode</h2>
            <p className={styles.ctaDesc}>Manage events, venues, teams, and tournament logistics.</p>
            <Link href="/organiser" className={styles.ctaBtn} id="btn-switch-to-organiser">
              Go to Organiser →
            </Link>
          </div>
          <div className={styles.ctaIcon}><FontAwesomeIcon icon={faClipboardList} /></div>
        </section>

        </main>
      </StadiumRouteProvider>


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

      <FanChatWidget chatHook={chatHook} />

      {/* Footer */}
      <footer className={styles.footer}>
        <p>FIFA World Cup 2026™ Fan Experience Platform</p>
        <p className={styles.footerSub}>USA · Canada · Mexico · June–July 2026</p>
      </footer>

      {/* Toast Notifications */}
      <div className={toastStyles.notificationContainer}>
        {toastNotifications.map(n => (
          <div key={n.id} className={toastStyles.notificationToast}>
            <div className={toastStyles.notificationHeader}>
              <div className={toastStyles.notificationTitleBlock}>
                <span className={toastStyles.notificationIcon}>{n.icon}</span>
                <strong className={toastStyles.notificationTitle}>{n.title}</strong>
              </div>
            </div>
            <div className={toastStyles.notificationBody}>
              <p className={toastStyles.notificationText}>{n.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

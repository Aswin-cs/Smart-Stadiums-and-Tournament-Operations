/* istanbul ignore file */
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
  faFutbol, faBuilding, faUsers
} from '@fortawesome/free-solid-svg-icons';

import { matches, stadiums, fanTips, TICKET_CATEGORIES, GATES, SECTIONS, defaultTicket, getNearestAmenity } from '../lib/data/fan-data';
import dynamic from 'next/dynamic';
import TicketPreview from '../components/TicketPreview';

const StadiumMockup = dynamic(() => import('../components/StadiumMockup'), { ssr: false });
import { useCrowd } from '../contexts/CrowdContext';
import toastStyles from './toast.module.css';

export default function FanPage() {
  const { data: session } = useSession();
  const { gates, incidents, stats, transportation } = useCrowd();
  const [toastNotifications, setToastNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
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
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('seat'); // 'seat' | 'match' | 'holder'

  const [routeMode, setRouteMode] = useState('hide');
  const [selectedAmenityId, setSelectedAmenityId] = useState('Burgers');
  const [amenityFilter, setAmenityFilter] = useState('All');

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `Hi! ⚽ I'm your Stadium Assistant. I can help you navigate BMO Field, find restrooms, check emergency exits, or locate your seat. What do you need today?`,
      time: 'Now'
    }
  ]);

  // Auto-scroll to bottom when messages change or typing state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

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

    // Scroll to football stadium mockup
    const stadiumSection = document.getElementById('stadium-mockup-section');
    if (stadiumSection) {
      stadiumSection.scrollIntoView({ behavior: 'smooth' });
    }

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!textToSend) setChatInput('');

    const lower = msg.toLowerCase();

    // Determine route intents with word boundaries to prevent 'eat' matching inside 'seat'
    const hasAny = (str, words) => words.some(w => new RegExp(`\\b${w}\\b`).test(str));

    const wantsFood = hasAny(lower, ['food', 'eat', 'burger', 'burgers', 'pizza', 'beer', 'snack', 'snacks', 'coffee', 'hotdog', 'hotdogs']);
    const wantsFacility = hasAny(lower, ['toilet', 'restroom', 'washroom', 'loo', 'bathroom']);
    const wantsEmergency = hasAny(lower, ['exit', 'emergency', 'medical', 'first aid']);
    const wantsAmenity = wantsFood || wantsFacility || wantsEmergency;

    const fromGate = hasAny(lower, ['gate', 'entrance']);
    const fromSeat = hasAny(lower, ['seat', 'sit', 'row']);
    const isGenericRoute = hasAny(lower, ['route', 'path', 'ticket', 'direction', 'go to']);

    // Calculate nearest amenities dynamically based on the current ticket section
    let targetFood = 'Burgers';
    let targetFacility = 'Restroom North';
    let targetEmergency = 'First Aid';

    if (wantsAmenity) {
      targetFood = getNearestAmenity(ticket.section, 'food');
      targetFacility = getNearestAmenity(ticket.section, 'facility');
      targetEmergency = getNearestAmenity(ticket.section, 'emergency');
    }

    // Override with specific requests
    if (hasAny(lower, ['burger', 'burgers'])) targetFood = 'Burgers';
    if (hasAny(lower, ['pizza'])) targetFood = 'Pizza';
    if (hasAny(lower, ['hotdog', 'hotdogs'])) targetFood = 'Hot Dogs';
    if (hasAny(lower, ['beer'])) targetFood = 'Beer';
    if (hasAny(lower, ['snack', 'snacks'])) targetFood = 'Snacks';
    if (hasAny(lower, ['coffee'])) targetFood = 'Coffee';

    // Immediately update UI states to keep map snappy
    if (wantsFood) {
      setAmenityFilter('food');
      setSelectedAmenityId(targetFood);
    } else if (wantsFacility) {
      setAmenityFilter('facility');
      setSelectedAmenityId(targetFacility);
    } else if (wantsEmergency) {
      setAmenityFilter('emergency');
      setSelectedAmenityId(targetEmergency);
    }

    if (wantsAmenity) {
      if (fromGate && fromSeat) setRouteMode('gate-seat-amenity');
      else if (fromGate) setRouteMode('gate-amenity');
      else setRouteMode('seat-amenity');
    } else if (fromGate || fromSeat || isGenericRoute) {
      setRouteMode('gate-seat');
    }

    // Call the generative AI API instead of the timeout
    setIsTyping(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          from: 'fan', 
          message: msg, 
          ticket, 
          matches, 
          crowdDensityData: { gates, incidents, stats },
          transportationData: transportation,
          stream: true 
        }),
      });

      if (!response.ok) {
        setIsTyping(false);
        const data = await response.json();
        console.error('Chat API returned error:', data?.error, data?.detail);
        if (response.status === 429) {
          alert(data?.error || 'Your limit is over. Please try again later.');
          return;
        }
        throw new Error(data?.detail || data?.error || `HTTP ${response.status}`);
      }

      setIsTyping(false);
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: '',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botReply = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        botReply += decoder.decode(value, { stream: true });
        
        const cleanReply = botReply
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/^#+\s*/gm, '')
          .trimStart();

        setChatMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].text = cleanReply;
          return newMsgs;
        });
      }
    } catch (error) {
      setIsTyping(false);
      console.error('Chat AI Error:', error.message);
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: "I'm having trouble connecting right now, but I've updated the map for you if you asked for directions!",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };

  const update = (field, value) => {
    setTicket(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const updatesRef = useRef(null);
  const updatesIsDown = useRef(false);
  const updatesStartX = useRef(0);
  const updatesScrollLeftRef = useRef(0);
  const updatesIsDragging = useRef(false);

  const handleUpdatesMouseDown = (e) => {
    const el = updatesRef.current;
    if (!el) return;
    updatesIsDown.current = true;
    updatesIsDragging.current = false;
    updatesStartX.current = e.pageX - el.offsetLeft;
    updatesScrollLeftRef.current = el.scrollLeft;
  };
  const handleUpdatesMouseLeave = () => {
    updatesIsDown.current = false;
  };
  const handleUpdatesMouseUp = () => {
    updatesIsDown.current = false;
    setTimeout(() => { updatesIsDragging.current = false; }, 50);
  };
  const handleUpdatesMouseMove = (e) => {
    if (!updatesIsDown.current) return;
    e.preventDefault();
    const el = updatesRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - updatesStartX.current) * 1.5;
    if (Math.abs(x - updatesStartX.current) > 5) {
      updatesIsDragging.current = true;
    }
    el.scrollLeft = updatesScrollLeftRef.current - walk;
  };

  const [showUpdatesLeftArrow, setShowUpdatesLeftArrow] = useState(false);
  const [showUpdatesRightArrow, setShowUpdatesRightArrow] = useState(false);

  const updateUpdatesScrollArrows = () => {
    const el = updatesRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setShowUpdatesLeftArrow(scrollLeft > 2);
    setShowUpdatesRightArrow(scrollLeft + clientWidth < scrollWidth - 2);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      updateUpdatesScrollArrows();
    }, 150);
    window.addEventListener('resize', updateUpdatesScrollArrows);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateUpdatesScrollArrows);
    };
  }, [incidents, gates]);

  const [ticketAnimating, setTicketAnimating] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTicketAnimating(true);
    setTimeout(() => setSaved(false), 2500);
    setTimeout(() => setTicketAnimating(false), 700);
  };

  const handleReset = () => {
    setTicket(defaultTicket);
    setSaved(false);
  };

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
    <div className={styles.wrapper}>
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
              <Image priority src="/trophy.svg" alt="Trophy Logo" width={36} height={36} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
            </span>
            <span className={styles.navBrandText}>FIFA WC 2026</span>
          </div>
          <div className={styles.navHoverLabel}>Tournament</div>
        </div>

        <div className={styles.navBadge}>FAN ZONE</div>
        
        <div className={styles.navActions}>
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

      <main className={styles.main}>

        {/* ===== MY TICKET SECTION ===== */}
        <section className={styles.section} id="my-ticket-section">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionLabel}>
              <span className={styles.sectionDot} style={{ background: '#f9d450' }}></span>
              MY TICKET
            </div>
            <div className={styles.ticketActions}>
              <button className={styles.resetBtn} onClick={handleReset} id="btn-reset-ticket">
                <FontAwesomeIcon icon={faRotateLeft} style={{ marginRight: '6px' }} /> Reset
              </button>
              <button
                className={`${styles.saveBtn} ${saved ? styles.saveBtnSuccess : ''}`}
                onClick={handleSave}
                id="btn-save-ticket"
              >
                {saved ? (
                  <>
                    <FontAwesomeIcon icon={faCheck} style={{ marginRight: '6px' }} /> Saved!
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} style={{ marginRight: '6px' }} /> Save Ticket
                  </>
                )}
              </button>
            </div>
          </div>

          <div className={styles.ticketLayout}>
            {/* LEFT: Preview */}
            <div className={styles.ticketPreviewWrap}>
              <TicketPreview ticket={ticket} animating={ticketAnimating} />
              <p className={styles.ticketHint}>✦ Edit fields on the right to customise your ticket</p>
            </div>

            {/* RIGHT: Editor */}
            <div className={styles.ticketEditor}>
              {/* Tab bar */}
              <div className={styles.editorTabs}>
                {[
                  { key: 'seat', label: 'Seat Info', icon: faChair },
                  { key: 'match', label: 'Match', icon: faCalendarAlt },
                  { key: 'holder', label: 'Holder', icon: faUser },
                ].map(tab => (
                  <button
                    key={tab.key}
                    className={`${styles.editorTab} ${activeTab === tab.key ? styles.editorTabActive : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                    id={`tab-${tab.key}`}
                  >
                    <FontAwesomeIcon icon={tab.icon} style={{ marginRight: '6px' }} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className={styles.editorFields}>

                {/* ---- SEAT TAB ---- */}
                {activeTab === 'seat' && (
                  <>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>Category</label>
                      <div className={styles.categoryPicker}>
                        {TICKET_CATEGORIES.map(cat => (
                          <button
                            key={cat}
                            className={`${styles.catBtn} ${ticket.category === cat ? styles.catBtnActive : ''}`}
                            onClick={() => update('category', cat)}
                            id={`cat-${cat.toLowerCase()}`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.fieldRow}>
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel} htmlFor="field-gate">Gate</label>
                        <select
                          id="field-gate"
                          className={styles.fieldSelect}
                          value={ticket.gate}
                          onChange={e => update('gate', e.target.value)}
                        >
                          {GATES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>

                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel} htmlFor="field-section">Section</label>
                        <select
                          id="field-section"
                          className={styles.fieldSelect}
                          value={ticket.section}
                          onChange={e => update('section', e.target.value)}
                        >
                          {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className={styles.fieldRow}>
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel} htmlFor="field-row">Row</label>
                        <input
                          id="field-row"
                          type="text"
                          className={styles.fieldInput}
                          value={ticket.row}
                          onChange={e => update('row', e.target.value)}
                          placeholder="e.g. 12"
                          maxLength={4}
                        />
                      </div>

                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel} htmlFor="field-seat">Seat</label>
                        <input
                          id="field-seat"
                          type="text"
                          className={styles.fieldInput}
                          value={ticket.seat}
                          onChange={e => update('seat', e.target.value)}
                          placeholder="e.g. 34"
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* ---- MATCH TAB ---- */}
                {activeTab === 'match' && (
                  <>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel} htmlFor="field-match">Match</label>
                      <input
                        id="field-match"
                        type="text"
                        className={styles.fieldInput}
                        value={ticket.match}
                        onChange={e => update('match', e.target.value)}
                        placeholder="e.g. USA vs MEX"
                      />
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel} htmlFor="field-matchdate">Date & Time</label>
                      <input
                        id="field-matchdate"
                        type="text"
                        className={styles.fieldInput}
                        value={ticket.matchDate}
                        onChange={e => update('matchDate', e.target.value)}
                        placeholder="e.g. Jun 11, 2026 — 18:00"
                      />
                    </div>
                  </>
                )}

                {/* ---- HOLDER TAB ---- */}
                {activeTab === 'holder' && (
                  <>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel} htmlFor="field-name">Ticket Holder Name</label>
                      <input
                        id="field-name"
                        type="text"
                        className={styles.fieldInput}
                        value={ticket.holderName}
                        onChange={e => update('holderName', e.target.value)}
                        placeholder="Full name"
                        maxLength={40}
                      />
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel} htmlFor="field-barcode">Barcode / Reference</label>
                      <input
                        id="field-barcode"
                        type="text"
                        className={styles.fieldInput}
                        value={ticket.barcode}
                        onChange={e => update('barcode', e.target.value)}
                        placeholder="FIFA2026-..."
                        maxLength={32}
                      />
                    </div>

                    <div className={styles.fieldNote}>
                      <FontAwesomeIcon icon={faInfoCircle} style={{ marginRight: '6px' }} /> This is a digital display ticket. For official tickets, visit FIFA.com
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stadium Mockup Section */}
        <section className={styles.section} id="stadium-mockup-section">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionLabel}>
              <span className={styles.sectionDot} style={{ background: 'var(--fifa-gold)' }}></span>
              STADIUM OVERVIEW
            </div>
            <div className={styles.stadiumMockupBadge}>🏟️ MetLife Stadium · NJ</div>
          </div>
          <StadiumMockup
            ticket={ticket}
            onSelectGate={(gateName) => update('gate', gateName)}
            routeMode={routeMode}
            setRouteMode={setRouteMode}
            selectedAmenityId={selectedAmenityId}
            setSelectedAmenityId={setSelectedAmenityId}
            amenityFilter={amenityFilter}
            setAmenityFilter={setAmenityFilter}
          />
        </section>

        {/* Live Stadium Updates */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionLabel}>
              <span className={styles.sectionDot} style={{ background: '#ef4444' }}></span>
              LIVE STADIUM UPDATES
            </div>
          </div>
          <div className={styles.updatesScrollWrapper}>
            {showUpdatesLeftArrow && (
              <button
                className={`${styles.updatesScrollBtn} ${styles.updatesScrollBtnLeft}`}
                onClick={() => {
                  const el = updatesRef.current;
                  if (el) el.scrollBy({ left: -264, behavior: 'smooth' });
                }}
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
                <div key={g.id} className={styles.tipCard} style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
                  <span className={styles.tipIcon} style={{ color: '#ef4444' }}>
                    <FontAwesomeIcon icon={faUsers} />
                  </span>
                  <h2 className={styles.tipTitle}>High Congestion</h2>
                  <p className={styles.tipDesc}>{g.id} is experiencing high traffic ({g.density}%). Please use alternative gates if possible.</p>
                </div>
              ))}
              {incidents.length === 0 && gates.filter(g => g.status === 'CONGESTED').length === 0 && (
                <div className={styles.tipCard} style={{ borderColor: 'rgba(74,222,128,0.3)' }}>
                  <span className={styles.tipIcon} style={{ color: '#4ade80' }}>
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
                onClick={() => {
                  const el = updatesRef.current;
                  if (el) el.scrollBy({ left: 264, behavior: 'smooth' });
                }}
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
              <span className={styles.sectionDot} style={{ background: '#3b82f6' }}></span>
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
                  <span><FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: '6px' }} /> {m.date}</span>
                  <span><FontAwesomeIcon icon={faClock} style={{ marginRight: '6px' }} /> {m.time}</span>
                </div>
                <div className={styles.matchStadium}><FontAwesomeIcon icon={faLocationDot} style={{ marginRight: '6px' }} /> {m.stadium}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Fan Tips */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionLabel}>
              <span className={styles.sectionDot} style={{ background: 'var(--fifa-red-light)' }}></span>
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
                <h4 className={styles.chatTitle}>Stadium Assistant</h4>
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
              <button className={styles.chipBtn} onClick={(e) => handleChipClick(e, "Show route to my Seat")}><span className={styles.chipIcon}><FontAwesomeIcon icon={faTicket} /></span> Find Seat</button>
              <button className={styles.chipBtn} onClick={(e) => handleChipClick(e, "Where is the food?")}><span className={styles.chipIcon}><FontAwesomeIcon icon={faHamburger} /></span> Find Food</button>
              <button className={styles.chipBtn} onClick={(e) => handleChipClick(e, "Where is the restroom?")}><span className={styles.chipIcon}><FontAwesomeIcon icon={faRestroom} /></span> Restrooms</button>
              <button className={styles.chipBtn} onClick={(e) => handleChipClick(e, "Where is First Aid?")}><span className={styles.chipIcon}><FontAwesomeIcon icon={faKitMedical} /></span> First Aid</button>
              <button className={styles.chipBtn} onClick={(e) => handleChipClick(e, "How do I get home?")}><span className={styles.chipIcon}><FontAwesomeIcon icon={faTrainSubway} /></span> Transport</button>
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
              placeholder="Ask a question..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
            />
            <button type="submit" className={styles.chatSendBtn} aria-label="Send message">
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </form>
        </div>
      )}

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

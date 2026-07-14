'use client';

import Link from 'next/link';
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
  faFutbol, faBuilding
} from '@fortawesome/free-solid-svg-icons';

import { matches, stadiums, fanTips, TICKET_CATEGORIES, GATES, SECTIONS, defaultTicket } from '../lib/data/fan-data';
import StadiumMockup from '../components/StadiumMockup';
import TicketPreview from '../components/TicketPreview';

export default function FanPage() {
  const { data: session } = useSession();
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
        body: JSON.stringify({ from: 'fan', message: msg, ticket, matches }),
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
        // Strip any residual markdown asterisks/hashes as a safety net
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
        text: "I'm having trouble connecting right now, but I've updated the map for you if you asked for directions!",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };

  const update = (field, value) => {
    setTicket(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

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

  const handleGetNotification = async () => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'fan',
          message: "Give me a brief 1-sentence stadium announcement or match update.",
          requestType: 'notification',
          ticket,
          matches
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          alert(data?.error || 'Your notification limit is over. Please try again later.');
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
        alert(`🔔 Notification:\n${cleanReply}`);
      }
    } catch (error) {
      console.error('Notification API Error:', error);
      alert('Failed to fetch notification.');
    }
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
              <img src="/trophy.svg" alt="Trophy Logo" style={{ width: '36px', height: '36px', display: 'inline-block', verticalAlign: 'middle' }} />
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
    </div>
  );
}

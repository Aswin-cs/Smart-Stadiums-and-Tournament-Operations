import { useState } from 'react';
import styles from '../fan/fan.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateLeft, faCheck, faSave, faChair, faCalendarAlt, faUser, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import TicketPreview from './TicketPreview';
import { TICKET_CATEGORIES, GATES, SECTIONS, defaultTicket } from '../lib/data/fan-data';

export default function FanTicketManager({ ticket, setTicket }) {
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('seat');
  const [ticketAnimating, setTicketAnimating] = useState(false);

  const update = (field, value) => {
    setTicket(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

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

  return (
    <section className={styles.section} id="my-ticket-section">
      <div className={styles.sectionHeader}>
        <div className={styles.sectionLabel}>
          <span className={styles.sectionDot} style={{ background: '#f9d450' }}></span>
          MY TICKET
        </div>
        <div className={styles.ticketActions}>
          <button className={styles.resetBtn} onClick={handleReset} id="btn-reset-ticket">
            <FontAwesomeIcon icon={faRotateLeft} className={styles.iconMargin} /> Reset
          </button>
          <button
            className={`${styles.saveBtn} ${saved ? styles.saveBtnSuccess : ''}`}
            onClick={handleSave}
            id="btn-save-ticket"
          >
            {saved ? (
              <>
                <FontAwesomeIcon icon={faCheck} className={styles.iconMargin} /> Saved!
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} className={styles.iconMargin} /> Save Ticket
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
                <FontAwesomeIcon icon={tab.icon} className={styles.iconMargin} />
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
                  <FontAwesomeIcon icon={faInfoCircle} className={styles.iconMargin} /> This is a digital display ticket. For official tickets, visit FIFA.com
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
